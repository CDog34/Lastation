import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { EventEmitter } from 'events'

import { handleWSHandshake } from './ws.handshake'
import { getLengthInFrame, isWSFrameFin, getFrameContent, isControlFrame } from './ws.frame-reader'
import { createTextFrame, createControlFrame } from './ws.frame-writer'
import { Opcode } from './ws.frame'

import { Queue } from '../../utils/queue'
import { createLogger } from '../logger'
import { Buffer } from 'buffer';


const console = createLogger('ws.connection')
export class WebSocketConnection extends EventEmitter {
  private _currentStage: TConnectionState = 'NEW'
  private socket: Socket
  private httpRequest: IncomingMessage
  private socketHandlerBusy: boolean = false
  private wsFrameHandlerBusy: boolean = false
  private socketChunkQueue: Queue<Buffer>
  private webSocketFrameQueue: Queue<Buffer>
  private wsFragmentCache: Array<Buffer>

  constructor (req: IncomingMessage, socket: Socket) {
    super()
    this.socket = socket
    this.httpRequest = req
  }

  get currentStage (): TConnectionState {
    return this._currentStage
  }

  private connectionEstablished () {
    this.socketChunkQueue = new Queue<Buffer>('socketChunkQueue', { debugMode: true })
    this.webSocketFrameQueue = new Queue<Buffer>('webSocketFrameQueue', { debugMode: true })
    this.wsFragmentCache = []
    this.socketChunkQueue.on('enqueue', this.handleSocketChunk.bind(this))
    this.webSocketFrameQueue.on('enqueue', this.handleWSFrame.bind(this))
  }

  private write (buffer: Buffer): boolean {
    if (this.currentStage !== 'OPEN') {
      throw new Error(`Can not write to Socket in State ${this.currentStage}`)
    }
    return this.socket.write(buffer)
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
      console.log(`收到数据帧，已加入缓存`)
      this.wsFragmentCache.push(this.webSocketFrameQueue.deQueue())
      if (isWSFrameFin(this.wsFragmentCache[this.wsFragmentCache.length - 1])) {
        console.log(`收到完整的数据帧序列，已进入处理`)
        const content = getFrameContent(this.wsFragmentCache.slice())
        this.wsFragmentCache = []
        this.emit('data', content)
      }
    }
    this.wsFrameHandlerBusy = false
    this.handleWSFrame()
  }

  private handleControlFrame (frame: Buffer) {
    // TODO: 处理控制帧
    const frameObj = getFrameContent(frame)
    console.log(`收到控制帧`)
    switch (frameObj.type) {
      case Opcode.Close:
        console.log('收到客户端发来的 关闭链接 请求')
        this.handleClientCloseFrame(frameObj.rawBuffer)
        break
      case Opcode.Ping:
        console.log('收到客户端发来的 Ping 请求，请求体', frameObj.rawBuffer)
        this.handleClientPingFrame(frameObj.rawBuffer)
        break
      case Opcode.Pong:
        console.log('收到客户端发来的 Pong 请求，请求体', frameObj.rawBuffer)
        break
    }

  }

  public handShake () {
    if (this._currentStage !== 'NEW') return
    try {
      handleWSHandshake(this.httpRequest, this.socket)
      this._currentStage = 'OPEN'
      this.connectionEstablished()
      this.socket.on('data', chunk => this.socketChunkQueue.enQueue(chunk))
      this.emit('connect')
    } catch (err) {
      this._currentStage = 'CLOSED'
      throw err
    }
  }

  private handleClientCloseFrame (frameContent: Buffer) {
    if (this.currentStage === 'OPEN') {
      this.write(createControlFrame(Opcode.Close, frameContent))
      this.destroy()
    } else if (this.currentStage === "CLOSING") {
      this.destroy()
    }
  }

  private handleClientPingFrame (frameContent: Buffer) {
    this.write(createControlFrame(Opcode.Pong, frameContent))
  }

  private destroy () {
    try {
      !this.socket.destroyed && this.socket.destroy()
      this.socket = null
      this.httpRequest = null
      this._currentStage = 'CLOSED'
    } catch (err) { }
  }

  public sendText (text: string) {
    const frame = createTextFrame(true, text)
    this.write(frame)
  }

  public close (reasonStatus: number = 1000) {
    this._currentStage = "CLOSING"
    const payload = Buffer.alloc(2)
    console.log(payload)
    payload.writeUInt16LE(reasonStatus, 0)
    const closeFrame = createControlFrame(Opcode.Close, payload)
    this.write(closeFrame)
  }

}