// Shared in-memory maintenance mode state
// Extracted to its own module to avoid circular require between server.js and routes/admin.js

const maintenanceMode = {
  enabled: false,
  message: 'PrepAI is currently undergoing scheduled maintenance. We will be back shortly.',
  estimatedTime: ''
};

module.exports = maintenanceMode;
