import { IncomingMessage } from 'http'
import { Socket } from 'net'

import { handleWSHandshake } from './ws.handshake'
import { getLengthInFrame, isWSFrameFin, getFrameContent, isControlFrame } from './ws.frame-reader'

import { Queue } from '../../utils/queue'
import { createLogger } from '../logger'
import { Buffer } from 'buffer';


const console = createLogger('ws.connection')
export class WebSocketConnection {
  private _currentStage = 'OPENING'
  private socket: Socket
  private httpRequest: IncomingMessage
  private socketHandlerBusy: boolean = false
  private wsFrameHandlerBusy: boolean = false
  private socketChunkQueue: Queue<Buffer>
  private webSocketFrameQueue: Queue<Buffer>
  private wsFragmentCache: Array<Buffer>

  constructor (req: IncomingMessage, socket: Socket) {
    this.socket = socket
    this.httpRequest = req
  }

  private connectionEstablished () {
    this.socketChunkQueue = new Queue<Buffer>('socketChunkQueue', { debugMode: true })
    this.webSocketFrameQueue = new Queue<Buffer>('webSocketFrameQueue', { debugMode: true })
    this.wsFragmentCache = []
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
      this.connectionEstablished()
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
      console.log(`收到正常的帧: 期望的长度 ${lengthInHeader} 实际收到的长度 ${queueHeader.byteLength}`)
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
        console.log(`收到不完整的帧，拼接得到正确的帧: 期望的长度 ${lengthInHeader} 实际收到的长度 ${totalBufferLength}`)
        this.webSocketFrameQueue.enQueue(Buffer.concat(this.socketChunkQueue.deQueueMultiple(bufferAmount)))
      } else if (totalBufferLength > lengthInHeader) {
        // 需要切割的帧
        console.log(`收到不完整的帧，需要切割: 期望的长度 ${lengthInHeader} 实际收到的长度 ${totalBufferLength}`, this.socketChunkQueue.header)
        const chunkCache = this.socketChunkQueue.deQueueMultiple(bufferAmount - 1)
        const lastChunk = this.socketChunkQueue.header
        const lengthLeak = lengthInHeader - (totalBufferLength - lastChunk.byteLength)
        chunkCache.push(lastChunk.slice(0, lengthLeak))
        this.socketChunkQueue.header = lastChunk.slice(lengthLeak)
        this.webSocketFrameQueue.enQueue(Buffer.concat(chunkCache))
      } else {
        // 还未收到后续的包，继续等待。
        console.log(`收到不完整的帧，等待后续的帧: 期望的长度 ${lengthInHeader} 实际收到的长度 ${totalBufferLength}`)
        needNextTrigger = false
      }
    } else {
      // 错误的包，丢弃之
      console.log(`收到帧的长度错误 : 期望的长度 ${lengthInHeader} 实际收到的长度 ${queueHeader.byteLength}`)
      this.socketChunkQueue.deQueue()
    }
    this.socketHandlerBusy = false
    needNextTrigger && this.handleSocketChunk()
  }

  private handleWSFrame () {
    if (this.wsFrameHandlerBusy || this.webSocketFrameQueue.isEmpty) { return }
    this.wsFrameHandlerBusy = true
    if (isControlFrame(this.webSocketFrameQueue.header)) {
      this.handleControlFrame(this.webSocketFrameQueue.deQueue())
    } else {
      console.log(`收到普通帧，已加入缓存`)
      this.wsFragmentCache.push(this.webSocketFrameQueue.deQueue())
      if (isWSFrameFin(this.wsFragmentCache[this.wsFragmentCache.length - 1])) {
        console.log(`收到完整的帧序列，已进入处理`)
        const content = getFrameContent(this.wsFragmentCache.slice())
        this.wsFragmentCache = []
        console.log(content, content.content.length)
      }
    }
    this.wsFrameHandlerBusy = false
    this.handleWSFrame()
  }

  private handleControlFrame (frame: Buffer) {
    // TODO: 处理控制帧
    console.log(`收到控制帧 `)

  }
}