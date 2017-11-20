import { EventEmitter } from 'events'

import { createLogger, Logger } from '../../modules/logger'

interface IQueueOptions {
  debugMode: boolean
}

export class Queue<T> extends EventEmitter {
  private queue: Array<T> = []
  private queueName: string = `InternalQueue-${Date.now()}`
  private debugMode: boolean = false
  private logger: Logger

  constructor (name?: string, options?: IQueueOptions) {
    super()
    this.queueName = name || this.queueName
    this.debugMode = !!options && !!options.debugMode
    this.logger = createLogger(`Queue: ${this.queueName}`)
  }

  public enQueue (c: T): void {
    try {
      this.queue.push(c)
      this.debugMode && this.logger.log(this.queue)
      this.emit('enqueue', this)
    } catch (err) {
      console.error(err)
    }
  }

  public deQueue (): T {
    try {
      return this.queue.shift()
    } catch (err) {
      console.error(err)
      return null
    }
  }

  public get header (): T {
    return this.isEmpty
      ? null
      : this.queue[0]
  }

  public get length (): number {
    return this.queue.length || 0
  }

  public get isEmpty (): boolean {
    return !this.length
  }
}