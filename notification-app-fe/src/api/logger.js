// Sleek, Structured Client-Side Logger Middleware

const LOG_STORAGE_KEY = 'campus_notification_logs';
const MAX_LOGS = 100; // Keep last 100 logs to prevent storage bloat

function getLogs() {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
  } catch (e) {
    // Silently catch storage full issues
  }
}

export const logger = {
  log(level, context, message, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(), // INFO, WARN, ERROR, SUCCESS
      context, // e.g. "API", "Auth", "UI"
      message,
      details
    };

    // Print to browser console with clean formatting and distinct colors
    const colorMap = {
      INFO: '#2196f3',
      SUCCESS: '#4caf50',
      WARN: '#ff9800',
      ERROR: '#f44336'
    };
    const color = colorMap[logEntry.level] || '#9e9e9e';
    console.log(
      `%c[${logEntry.level}] [${context}] ${timestamp}: ${message}`,
      `color: ${color}; font-weight: bold;`,
      details
    );

    // Save to localStorage buffer
    const logs = getLogs();
    logs.push(logEntry);
    saveLogs(logs);
  },

  info(context, message, details) {
    this.log('INFO', context, message, details);
  },

  success(context, message, details) {
    this.log('SUCCESS', context, message, details);
  },

  warn(context, message, details) {
    this.log('WARN', context, message, details);
  },

  error(context, message, details) {
    this.log('ERROR', context, message, details);
  },

  // Retrieve stored logs
  getStoredLogs() {
    return getLogs();
  },

  // Clear log history
  clearLogs() {
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
      console.log('%c[SYSTEM] Logger storage cleared', 'color: #9e9e9e; font-weight: bold;');
    } catch (e) {
      // Ignored
    }
  }
};
