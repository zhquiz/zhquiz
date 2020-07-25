import pino from 'pino'

/**
 * https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
 */
const PinoLevelToSeverityLookup = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
}

const gcloudConf: pino.LoggerOptions = {
  messageKey: 'message',
  formatters: {
    level(label, number) {
      return {
        severity:
          PinoLevelToSeverityLookup[label] || PinoLevelToSeverityLookup.info,
        level: number,
      }
    },
    log(message) {
      return { message }
    },
  },
}

export const logger = pino(
  process.env.NODE_ENV === 'development'
    ? {
        prettyPrint: true,
        prettifier: require('pino-inspector'),
      }
    : gcloudConf
)
