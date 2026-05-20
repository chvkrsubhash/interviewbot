import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import {
  Mic, MicOff, Video, VideoOff, Timer, Send, ShieldAlert, Sparkles, User, Loader2
} from 'lucide-react';

// SVG BrainCircuit icon (fallback)
function BrainCircuit({ className, size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v8" /><path d="M12 14v8" /><path d="M22 12H14" /><path d="M10 12H2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.5 7.5l-4.5 4.5" /><path d="M7.5 16.5l4.5-4.5" />
      <path d="M7.5 7.5l4.5 4.5" /><path d="M16.5 16.5l-4.5-4.5" />
    </svg>
  );
}

// Fallback questions if session questions cannot be loaded
const fallbackQuestions = {
  Frontend: [
    "Could you explain the difference between virtual DOM reconciliation and real DOM rendering in React?",
    "How does hoisting work in JavaScript, and how do ES6 block-scoped declarations affect it?",
    "Describe the lifecycle of a React hook like useEffect and how clean-ups prevent memory leaks.",
    "What is cross-site scripting (XSS), and how does React mitigate it?"
  ],
  Backend: [
    "How does the event loop handle asynchronous I/O multiplexing in Node.js?",
    "Explain how database indexes speed up lookups and discuss the overhead they pose on writes.",
    "What is the difference between horizontal and vertical scaling?",
    "How do transactions maintain data consistency in SQL databases under high concurrent loads?"
  ],
  'AI/ML': [
    "Explain the difference between supervised and unsupervised learning with real-world examples.",
    "How does gradient descent optimization work in neural network training?",
    "What is overfitting, and what techniques do you use to prevent it?",
    "Describe the architecture and purpose of a transformer model."
  ],
  DSA: [
    "Explain the time complexity differences between QuickSort and MergeSort.",
    "How would you detect a cycle in a linked list? Walk me through your approach.",
    "What is dynamic programming and when would you choose it over recursion?",
    "Describe the properties of a balanced binary search tree."
  ],
  HR: [
    "Tell me about a time you had a significant technical disagreement with a team member. How did you resolve it?",
    "Where do you see yourself in five years? How does this role fit your career objectives?",
    "Describe a high-stakes project where requirements shifted late. How did you adjust and deliver?",
    "What is your approach to learning new technologies quickly under pressure?"
  ],
  'System Design': [
    "How would you design a URL shortening service like bit.ly? Walk me through the architecture.",
    "Describe the tradeoffs between SQL and NoSQL databases for a social media platform.",
    "How would you ensure high availability in a distributed system?",
    "Explain the CAP theorem and how it affects database design decisions."
  ],
  Aptitude: [
    "If a train travels 60 km in 45 minutes, what is its speed in km/h?",
    "A store offers a 20% discount followed by a 10% discount. What is the net discount?",
    "In how many ways can 5 people be arranged in a row?",
    "If the ratio of boys to girls is 3:5 and there are 40 students total, how many boys are there?"
  ]
};

export default function InterviewSimulation() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({ domain: 'Frontend', experience: 'Entry', company: 'General', type: 'technical', title: '' });
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [interviewId, setInterviewId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Tab switching / Cheat detection
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showCheatAlert, setShowCheatAlert] = useState(false);

  // Audio / Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responses, setResponses] = useState([]);

  // Media devices
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load setup configurations and AI-generated questions
  useEffect(() => {
    const savedConfig = localStorage.getItem('active_interview_config');
    const savedId = localStorage.getItem('active_interview_id');
    const savedQuestions = localStorage.getItem('active_interview_questions');

    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
    }

    if (savedId) {
      setInterviewId(savedId);
    }

    if (savedQuestions) {
      try {
        const parsedQ = JSON.parse(savedQuestions);
        if (Array.isArray(parsedQ) && parsedQ.length > 0) {
          setQuestions(parsedQ);
          return;
        }
      } catch (e) { /* fall through to fallback */ }
    }

    // Fallback questions based on domain
    const dom = savedConfig ? JSON.parse(savedConfig).domain : 'Frontend';
    setQuestions(fallbackQuestions[dom] || fallbackQuestions.Frontend);
  }, []);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => (prev + ' ' + finalTranscript + interimTranscript).trim());
      };

      rec.onerror = (e) => console.error('Speech recognition error', e);
      rec.onend = () => { if (isListening) rec.start(); };

      recognitionRef.current = rec;
    }
  }, [isListening]);

  // Webcam stream activation
  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          setupAudioEqualizer(stream);
        })
        .catch(err => {
          console.warn('Camera/mic permission denied', err);
          setCameraActive(false);
          setMicActive(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cameraActive]);

  // Canvas visual audio wave equalizer
  const setupAudioEqualizer = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const draw = () => {
        if (!canvas) return;
        const width = canvas.width;
        const height = canvas.height;
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.8;
          ctx.fillStyle = `rgba(14, 165, 233, ${0.3 + barHeight / height})`;
          ctx.fillRect(x, (height - barHeight) / 2, barWidth - 2, barHeight);
          x += barWidth;
        }
      };
      draw();
    } catch (e) {
      console.warn('Equalizer failed to build:', e);
    }
  };

  // Cheat detection
  useEffect(() => {
    const handleBlur = () => {
      setTabSwitches(prev => {
        const count = prev + 1;
        setShowCheatAlert(true);
        return count;
      });
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Timer loop
  useEffect(() => {
    if (timeLeft <= 0) {
      handleNextQuestion();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please type your response manually.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const activeQuestion = questions[currentQuestionIndex] || 'Loading question...';

  const handleNextQuestion = async () => {
    const currentResponse = {
      question: activeQuestion,
      answer: transcript || 'No verbal answer recorded.'
    };

    const updatedResponses = [...responses, currentResponse];
    setResponses(updatedResponses);
    setTranscript('');
    setTimeLeft(90);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Final question – submit evaluation to backend
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setSubmitting(true);

      try {
        const token = localStorage.getItem('token');
        const targetId = interviewId;

        if (targetId) {
          const response = await fetch(`/api/interview/evaluate/${targetId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              tabSwitches,
              transcript: updatedResponses
            })
          });

          const data = await response.json();
          if (response.ok) {
            // Clean up session data
            localStorage.removeItem('active_interview_questions');
            localStorage.removeItem('active_interview_id');
            navigate(`/candidate/report/${targetId}`);
            return;
          }
        }
      } catch (err) {
        console.error('Evaluation submission failed:', err);
      }

      // Fallback if API failed or no interview ID
      const sessionId = interviewId || 'int-session-' + Date.now();
      const sessionScore = Math.max(10, Math.floor(65 + Math.random() * 25 - (tabSwitches * 10)));

      const newEvaluation = {
        id: sessionId,
        title: config.title || `${config.company} ${config.domain} Mock Round`,
        domain: config.domain,
        experience: config.experience,
        score: sessionScore,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cheated: tabSwitches > 0,
        tabSwitches,
        transcript: updatedResponses,
        feedback: {
          technicalScore: sessionScore - 5,
          communicationScore: Math.min(100, sessionScore + 8),
          grammar: 'Good subject-verb agreement. Recommended reducing filler words by 15%.',
          confidence: Math.min(100, Math.floor(70 + Math.random() * 30)),
          strengths: ['Solid conceptual understanding', 'Clear problem-solving approach'],
          weaknesses: ['Improve systems scalability descriptions'],
          suggestions: ['Review database normalization', 'Practice STAR format for HR questions']
        }
      };

      const stored = JSON.parse(localStorage.getItem('completed_interviews') || '[]');
      stored.unshift(newEvaluation);
      localStorage.setItem('completed_interviews', JSON.stringify(stored));
      navigate(`/candidate/report/${sessionId}`);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-primary-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none relative">
      <Header title={`${config.company || 'General'} Interview Round`} />

      {/* Cheating Overlay Alert */}
      {showCheatAlert && (
        <div className="fixed top-6 right-6 z-50 p-4 w-96 rounded-2xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-start gap-3 shadow-xl animate-float">
          <ShieldAlert className="shrink-0" size={24} />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm uppercase tracking-wider">Tab Switch Detected!</h4>
            <p className="text-xs font-semibold">
              Warning: Switching windows is flagged by the cheat detection engine. Total counts logged: <span className="font-extrabold underline">{tabSwitches}</span>
            </p>
            <button
              onClick={() => setShowCheatAlert(false)}
              className="mt-2 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
            >
              Acknowledge Alert
            </button>
          </div>
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="text-center space-y-4 text-white">
            <Loader2 size={48} className="animate-spin text-primary-400 mx-auto" />
            <h3 className="font-extrabold text-xl">AI Evaluation in Progress</h3>
            <p className="text-sm text-slate-300 font-semibold">Analyzing your responses and generating detailed feedback...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Avatar Panel */}
        <div className="glass-premium rounded-3xl p-6 flex flex-col justify-between h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-primary-500" size={16} />
              <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">AI Interviewer Avatar</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-500 font-extrabold text-[10px] uppercase">speaking</span>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full scale-110 animate-ping"></div>
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full scale-125 animate-pulse"></div>
              <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white border-4 border-white dark:border-dark-950 shadow-2xl relative">
                <BrainCircuit size={64} className="text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-800 dark:text-white">Interviewer Bot</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400">Evaluating: {config.domain}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-900/50 border border-slate-200/40 dark:border-slate-800/80">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 italic leading-relaxed text-center">
              "{activeQuestion}"
            </p>
          </div>
        </div>

        {/* Center: Live Camera Feed & Audio wave */}
        <div className="glass-premium rounded-3xl p-6 flex flex-col justify-between h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">Candidate Screen</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
              <Timer size={14} className="text-primary-500" />
              <span className={timeLeft <= 15 ? 'text-rose-500' : ''}>{timeLeft}s remaining</span>
            </div>
          </div>

          <div className="w-full h-64 rounded-2xl bg-slate-900 dark:bg-black relative overflow-hidden flex items-center justify-center border border-slate-200/10 shadow-inner mt-4">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl scale-x-[-1]" />
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <VideoOff size={42} className="mx-auto" />
                <span className="text-xs font-bold block uppercase tracking-wider">Camera Terminated</span>
              </div>
            )}
            <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-bold text-[10px] uppercase flex items-center gap-1">
              <User size={10} /> Candidate View
            </span>
            <span className="absolute top-3 right-3 bg-rose-500/90 px-2 py-0.5 rounded-lg text-white font-bold text-[10px] animate-pulse flex items-center gap-1">
              ● LIVE
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-center">
            <canvas ref={canvasRef} width={280} height={40} className="w-72 h-8" />
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`p-3 rounded-2xl border transition-all ${
                cameraActive
                  ? 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                  : 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/20 dark:border-rose-950/20'
              }`}
            >
              {cameraActive ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            <button
              onClick={() => setMicActive(!micActive)}
              className={`p-3 rounded-2xl border transition-all ${
                micActive
                  ? 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                  : 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/20 dark:border-rose-950/20'
              }`}
            >
              {micActive ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              onClick={toggleSpeechRecognition}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse'
                  : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:scale-[1.01]'
              }`}
            >
              <Mic size={14} />
              {isListening ? 'Stop Speaking' : 'Activate Voice Answer'}
            </button>
          </div>
        </div>

        {/* Right Side: Answer Sheet Transcription */}
        <div className="glass-premium rounded-3xl p-6 flex flex-col justify-between h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">Answer Transcript</span>
            <span className="text-[10px] font-bold text-slate-400">Q: {currentQuestionIndex + 1} of {questions.length}</span>
          </div>

          <div className="flex-1 py-4 overflow-y-auto">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your transcribed verbal response will display here. You can also edit or type manually..."
              className="w-full h-full bg-slate-50 border border-slate-200 dark:bg-dark-900/50 dark:border-slate-800/80 rounded-2xl p-4 text-slate-700 dark:text-slate-250 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-sm resize-none"
            />
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary-500/15 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {currentQuestionIndex < questions.length - 1 ? (
              <>Submit Answer <Send size={14} /></>
            ) : (
              <>Finish Interview <Send size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
