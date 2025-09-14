type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelToConsole: Record<LogLevel, (...args: any[]) => void> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

export function createLogger(namespace: string) {
  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const time = new Date().toISOString();
    const payload = meta ? ` ${JSON.stringify(meta)}` : '';
    levelToConsole[level](`[${time}] [${namespace}] [${level.toUpperCase()}] ${message}${payload}`);
  };
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta)
  };
}


