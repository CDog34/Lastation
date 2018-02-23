/**
 * 日志模块
 * 
 * 本质上是对 console.log 的封装
 * 
 * @class Logger
 */
export class Logger {
  moduleName: string

  constructor(moduleName: string) {
    this.moduleName = moduleName
  }

  /**
   * 打印普通日志（ info ）
   * 
   * @param {...Array<any>} logContent 需要输出的内容
   * @memberof Logger
   */
  public log (...logContent: Array<any>): void {
    console.log(`\x1B[105;37;1m[${this.moduleName}]\x1B[0m\x1B[34m Info:`, ...logContent, '\x1B[0m')
  }

  /**
   * 打印警告日志（ Warning ）
   * 
   * @param {...Array<any>} logContent 
   * @memberof Logger
   */
  public warn (...logContent: Array<any>): void {
    console.warn(`\x1B[105;37;1m[${this.moduleName}]\x1B[0m\x1B[33m Warning:`, ...logContent, '\x1B[0m')
  }
  /**
   * 打印错误信息
   * 
   * @param {...Array<any>} logContent 
   * @memberof Logger
   */
  public error (...logContent: Array<any>): void {
    console.warn(`\x1B[105;37;1m[${this.moduleName}]\x1B[0m\x1B[31m Error:`, ...logContent, '\x1B[0m')
  }
}

export function createLogger (moduleName: string): Logger {
  return new Logger(moduleName)
}