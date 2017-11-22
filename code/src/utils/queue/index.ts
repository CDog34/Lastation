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

  private doDeQueue (amount: number = 1): any {
    if (amount <= 0) { throw new Error('Amount Too Small') }
    if (amount > this.queue.length) { throw new Error('Amount Too Big') }
    if (amount === 1) { return this.queue.shift() }
    const res = []
    for (let i = 0; i < amount; i++) {
      res.push(this.queue.shift())
    }
    return res
  }

  public deQueueMultiple (amount: number): Array<T> {
    return this.doDeQueue(amount)
  }

  public deQueue (): T {
    return this.doDeQueue(1)
  }

  public get header (): T {
    return this.isEmpty
      ? null
      : this.queue[0]
  }

  public set header (item: T) {
    if (!!this.queue[0]) {
      this.queue[0] = item
    }
  }

  public get length (): number {
    return this.queue.length || 0
  }

  public get isEmpty (): boolean {
    return !this.length
  }

  public getMemberAt (index: number): T {
    return this.queue[index] || null
  }
}