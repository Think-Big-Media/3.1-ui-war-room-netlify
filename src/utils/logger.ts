export const createLogger = (component: string) => ({
  info: (message: string, data?: any) => console.log(`[${component}] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[${component}] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[${component}] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[${component}] ${message}`, data),
});
