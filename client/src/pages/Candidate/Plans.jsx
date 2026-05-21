import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Check, Zap, Crown, Rocket, Loader2, AlertCircle, CreditCard, IndianRupee, Star } from 'lucide-react';

// Load Razorpay checkout.js dynamically
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PLAN_ICONS = {
  'Free Starter': <Rocket size={28} />,
  'Pro Learner': <Zap size={28} />,
  'Elite Placement': <Crown size={28} />
};

const PLAN_COLORS = {
  slate: {
    gradient: 'from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40',
    border: 'border-slate-200 dark:border-slate-800',
    icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    badge: '',
    btn: 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
  },
  primary: {
    gradient: 'from-primary-50 to-indigo-50 dark:from-primary-950/30 dark:to-indigo-950/20',
    border: 'border-primary-300 dark:border-primary-700',
    icon: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
    badge: 'bg-primary-500 text-white',
    btn: 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-lg shadow-primary-500/25'
  },
  orange: {
    gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    border: 'border-orange-300 dark:border-orange-700',
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-500 text-white',
    btn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25'
  }
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [plansRes, historyRes] = await Promise.all([
          fetch('/api/payments/plans'),
          fetch('/api/payments/history', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (plansRes.ok) setPlans(await plansRes.json());
        if (historyRes.ok) setPaymentHistory(await historyRes.json());
      } catch (err) {
        setErrorMessage('Failed to load plans. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatINR = (paise) => {
    if (paise === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(paise / 100);
  };

  const handleSubscribe = async (plan) => {
    if (plan.price === 0) {
      setSuccessMessage('You are already on the Free plan! Upgrade to Pro or Elite for more features.');
      return;
    }

    setPaying(plan.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error('Failed to load Razorpay checkout. Check your internet connection.');
      }

      const token = localStorage.getItem('token');

      // Create order on backend
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Order creation failed');

      const { orderId, amount, currency, keyId, paymentDbId } = orderData;

      // Get user profile from localStorage/context
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'PrepAI Platform',
        description: `Subscription: ${plan.name}`,
        order_id: orderId,
        prefill: {
          name: userObj.name || '',
          email: userObj.email || '',
          contact: userObj.phone || ''
        },
        notes: { planId: plan.id, planName: plan.name },
        theme: { color: '#0ea5e9' },
        modal: {
          ondismiss: () => { setPaying(''); }
        },
        handler: async (response) => {
          // Payment success — verify on backend
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentDbId
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Verification failed');

            setSuccessMessage(`🎉 Payment successful! You are now subscribed to ${plan.name}. Payment ID: ${response.razorpay_payment_id}`);

            // Refresh payment history
            const hRes = await fetch('/api/payments/history', { headers: { 'Authorization': `Bearer ${token}` } });
            if (hRes.ok) setPaymentHistory(await hRes.json());

          } catch (err) {
            setErrorMessage(`Payment recorded but verification failed: ${err.message}. Please contact support.`);
          } finally {
            setPaying('');
          }
        }
      });

      rzp.on('payment.failed', (response) => {
        setErrorMessage(`Payment failed: ${response.error.description}`);
        setPaying('');
      });

      rzp.open();

    } catch (err) {
      setErrorMessage(err.message || 'Payment initialization failed. Please try again.');
      setPaying('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Header title="Subscription Plans" />
        <div className="flex items-center justify-center min-h-64">
          <Loader2 size={36} className="animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header title="Upgrade Your Plan" />

      {/* Hero */}
      <div className="glass-premium rounded-3xl p-8 text-center space-y-3 bg-gradient-to-tr from-primary-500/5 via-indigo-500/5 to-transparent border border-primary-500/10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-primary-500/20">
          <CreditCard size={32} />
        </div>
        <h2 className="font-extrabold text-2xl text-slate-800 dark:text-white">Choose Your PrepAI Plan</h2>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-sm max-w-lg mx-auto">
          All payments are securely processed via Razorpay in Indian Rupees (₹). Upgrade anytime to unlock more AI interviews and premium features.
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-start gap-3">
          <Check size={18} className="mt-0.5 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const colors = PLAN_COLORS[plan.badgeColor] || PLAN_COLORS.primary;
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border-2 p-8 flex flex-col justify-between bg-gradient-to-br transition-all hover:shadow-xl ${colors.gradient} ${colors.border}`}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.icon}`}>
                    {PLAN_ICONS[plan.name] || <Zap size={28} />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-800 dark:text-white">{plan.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {plan.billingInterval === 'free' ? 'Forever Free' : `per ${plan.billingInterval}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-1">
                  <span className="font-extrabold text-5xl text-slate-800 dark:text-white tracking-tight">
                    {plan.price === 0 ? '₹0' : formatINR(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-400 font-bold mb-2">/{plan.billingInterval === 'yearly' ? 'yr' : 'mo'}</span>
                  )}
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{plan.description}</p>

                <div className="space-y-3">
                  {(plan.features || []).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${colors.icon} shrink-0`}>
                        <Check size={12} />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {plan.interviewsAllowed === -1 ? 'Unlimited Interviews' : `${plan.interviewsAllowed} Interviews/Month`}
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={paying === plan.id || (plan.price === 0)}
                className={`mt-6 w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 ${
                  plan.price === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default' : colors.btn
                }`}
              >
                {paying === plan.id ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : plan.price === 0 ? (
                  'Current Free Plan'
                ) : (
                  <>Pay {formatINR(plan.price)} via Razorpay</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Razorpay Badge */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <IndianRupee size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-400">Secured by Razorpay · All transactions in INR · 256-bit SSL</span>
        </div>
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="glass-premium rounded-3xl p-6 space-y-5">
          <h3 className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <IndianRupee size={18} className="text-primary-500" />
            Your Payment History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Razorpay ID</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 font-bold text-slate-800 dark:text-white">{p.planName}</td>
                    <td className="py-3.5 font-bold text-slate-700 dark:text-slate-200">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format((p.amount || 0) / 100)}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${
                        p.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                        p.status === 'failed' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' :
                        'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs font-mono text-slate-400">{p.razorpayPaymentId || '—'}</td>
                    <td className="py-3.5 text-xs text-slate-400 font-medium">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
