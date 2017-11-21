import { IncomingMessage } from 'http'
import { Socket } from 'net'

import { handleWSHandshake } from './ws.handshake'
import { getLengthInFrame, isWSFrameFin, getFrameContent } from './ws.frame-reader'

import { Queue } from '../../utils/queue'


export class WebSocketConnection {
  private _currentStage = 'OPENING'
  private socket: Socket
  private httpRequest: IncomingMessage
  private socketHandlerBusy: boolean = false
  private wsFrameHandlerBusy: boolean = false
  private socketChunkQueue: Queue<Buffer>
  private webSocketFrameQueue: Queue<Buffer>

  constructor (req: IncomingMessage, socket: Socket) {
    this.socket = socket
    this.httpRequest = req
    this.socketChunkQueue = new Queue<Buffer>('socketChunkQueue', { debugMode: true })
    this.webSocketFrameQueue = new Queue<Buffer>('webSocketFrameQueue', { debugMode: true })
    this.socketChunkQueue.on('enqueue', this.handleSocketChunk.bind(this))
    this.webSocketFrameQueue.on('enqueue', this.handleWSFrame.bind(this))
  }

  get currentStage (): string {
    return this._currentStage
  }

  public handShake () {
    if (this._currentStage !== 'OPENING') return
    try {
      handleWSHandshake(this.httpRequest, this.socket)
      this._currentStage = 'OPENED'
      this.socket.on('data', chunk => this.socketChunkQueue.enQueue(chunk))
    } catch (err) {
      this._currentStage = 'FAILED'
      throw err
    }
  }

  public destroy () {
    try {
      this.socket.destroyed && this.socket.destroy()
      this.socket = null
      this.httpRequest = null
      this._currentStage = 'DESTROYED'
    } catch (err) { }
  }

  private handleSocketChunk () {
    if (this.socketHandlerBusy || this.socketChunkQueue.isEmpty) { return }
    this.socketHandlerBusy = true
    let needNextTrigger = true
    const queueHeader = this.socketChunkQueue.header
    const lengthInHeader = getLengthInFrame(queueHeader)
    if (queueHeader.byteLength === lengthInHeader) {
      // 包长度吻合，是正常的包
      this.webSocketFrameQueue.enQueue(this.socketChunkQueue.deQueue())
    } else if (lengthInHeader > queueHeader.byteLength) {
      // 头部包的大小大于当前收到的包的大小，说明接下来还有包是是属于当前 Frame 的
      let bufferAmount = 1
      let totalBufferLength = queueHeader.byteLength
      while (totalBufferLength < lengthInHeader && !!this.socketChunkQueue.getMemberAt(bufferAmount)) {
        totalBufferLength += this.socketChunkQueue.getMemberAt(bufferAmount++).byteLength
      }
      if (totalBufferLength === lengthInHeader) {
        // 已得到正确的 Buffer
        this.webSocketFrameQueue.enQueue(Buffer.concat(this.socketChunkQueue.deQueueMultiple(bufferAmount)))
      } else if (totalBufferLength > lengthInHeader) {
        // 错误的包，丢弃之
        this.socketChunkQueue.deQueue()
      } else {
        // 还未收到后续的包，继续等待。
        needNextTrigger = false
      }
    } else {
      // 错误的包，丢弃之
      this.socketChunkQueue.deQueue()
    }
    this.socketHandlerBusy = false
    needNextTrigger && this.handleSocketChunk()
  }

  private handleWSFrame () {
    if (this.wsFrameHandlerBusy || this.webSocketFrameQueue.isEmpty) { return }
    this.wsFrameHandlerBusy = true
    if (isWSFrameFin(this.webSocketFrameQueue.header)) {
      const content = getFrameContent(this.webSocketFrameQueue.deQueue())
      this.wsFrameHandlerBusy = false
      this.handleWSFrame()
      return
    }
    // TODO: ws frame 层拼接逻辑
  }
}