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
    const queueHeader = this.socketChunkQueue.header
    const lengthInHeader = getLengthInFrame(queueHeader)
    if (lengthInHeader === queueHeader.length) {
      this.webSocketFrameQueue.enQueue(this.socketChunkQueue.deQueue())
      this.socketHandlerBusy = false
      this.handleSocketChunk()
    }
    // TODO: socket 层拼接逻辑
  }

  private handleWSFrame () {
    if (this.wsFrameHandlerBusy || this.webSocketFrameQueue.isEmpty) { return }
    this.wsFrameHandlerBusy = true
    if (isWSFrameFin(this.webSocketFrameQueue.header)) {
      const content = getFrameContent(this.webSocketFrameQueue.deQueue())
      console.log(content)
      this.wsFrameHandlerBusy = false
      this.handleWSFrame()
      return
    }
    // TODO: ws frame 层拼接逻辑
  }
}