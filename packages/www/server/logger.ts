import pino from 'pino'

const SeverityLookup = {
  default: 'DEFAULT',
  silly: 'DEFAULT',
  verbose: 'DEBUG',
  debug: 'DEBUG',
  http: 'notice',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
}

const defaultPinoConfig: pino.LoggerOptions = {
  messageKey: 'message',
  formatters: {
    level(label, number) {
      return {
        severity: SeverityLookup[label as keyof typeof SeverityLookup],
        level: number,
      }
    },
  },
}

export const gCloudLogger = (pinoConfigOverrides: pino.LoggerOptions = {}) =>
  pino({
    ...defaultPinoConfig,
    ...pinoConfigOverrides,
  })
