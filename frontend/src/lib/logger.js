/**
 * Logger utility for Portfolio Digital
 *
 * Log levels: DEBUG < INFO < WARNING < ERROR
 * Console output for all levels (filtered by VITE_LOG_LEVEL)
 * Remote logging for WARNING and ERROR (future enhancement)
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
}

const LOG_COLORS = {
  DEBUG: '#9CA3AF', // gray
  INFO: '#3B82F6',  // blue
  WARNING: '#F59E0B', // amber
  ERROR: '#EF4444',  // red
}

const currentLevel = LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL] ?? LOG_LEVELS.INFO

function formatTimestamp() {
  return new Date().toISOString()
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLevel
}

function formatMessage(level, context, message) {
  return `[${formatTimestamp()}] [${level}] [${context}] ${message}`
}

/**
 * Log a debug message
 */
export function debug(context, message, data = null) {
  if (!shouldLog('DEBUG')) return

  const formatted = formatMessage('DEBUG', context, message)
  console.log(`%c${formatted}`, `color: ${LOG_COLORS.DEBUG}`, data ?? '')
}

/**
 * Log an info message
 */
export function info(context, message, data = null) {
  if (!shouldLog('INFO')) return

  const formatted = formatMessage('INFO', context, message)
  console.log(`%c${formatted}`, `color: ${LOG_COLORS.INFO}`, data ?? '')
}

/**
 * Log a warning message
 */
export function warning(context, message, data = null) {
  if (!shouldLog('WARNING')) return

  const formatted = formatMessage('WARNING', context, message)
  console.warn(`%c${formatted}`, `color: ${LOG_COLORS.WARNING}`, data ?? '')

  // Future: Send to remote logging endpoint
}

/**
 * Log an error message
 */
export function error(context, message, data = null) {
  if (!shouldLog('ERROR')) return

  const formatted = formatMessage('ERROR', context, message)
  console.error(`%c${formatted}`, `color: ${LOG_COLORS.ERROR}`, data ?? '')

  // Future: Send to remote logging endpoint
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context) {
  return {
    debug: (message, data) => debug(context, message, data),
    info: (message, data) => info(context, message, data),
    warning: (message, data) => warning(context, message, data),
    error: (message, data) => error(context, message, data),
  }
}

export default {
  debug,
  info,
  warning,
  error,
  createLogger,
}
