import { EventEmitter } from './event-emitter'

const FAIL_COUNT_LIMIT = 5
const RETRY_TIMEOUT = 5000

/**
 * 客户端 Websocket 链接封装
 * 
 * @export
 * @class WSClient
 */
export class WSClient extends EventEmitter {
  roomId: number = 0
  ws: WebSocket = null
  isClosed: boolean = false
  heartbeatInterval: any
  retryTimer: any
  retryCount: number = 0

  constructor (roomId) {
    super()
    if (!roomId || isNaN(parseInt(roomId, 0))) {
      throw new Error('RoomId is Required.')
    }
    this.roomId = parseInt(roomId, 0)
  }

  public connect () {
    try {
      if (this.ws) {
        this.unbindEvents()
      }
      this.ws = new WebSocket('ws://localhost:2233')
      this.bindEvents()
      this.ws.addEventListener('open', () => {
        clearInterval(this.heartbeatInterval)
        clearTimeout(this.retryTimer)
        this.retryCount = 0
        this.ws.send(JSON.stringify({
          cmd: 'handshake',
          roomId: this.roomId
        }))
      })
    } catch (err) {
      this.emit('error', 'Websocket 链接出错')
      console.warn(err)
    }
  }

  private handleMessage (evt: MessageEvent) {
    try {
      var json = JSON.parse(evt.data)
      if (json.message === 'Business Handshake OK') {
        this.startHeartbeat()
        this.emit('handshake')
      } else if (json.message === 'Push') {
        this.emit('message', json.data)
      } else if (json.message === 'Heartbeat OK') {
        this.emit('heartbeat', json.data)
      }
    } catch (err) {
      console.log(err)
    }
  }

  private handleClose () {
    this.emit('info', 'Websocket 链接关闭')
    if (!this.isClosed) {
      this.retryConnect()
    }
  }

  private handleError (err) {
    this.emit('error', 'Websocket 链接发生错误', err)
  }

  private retryConnect () {
    clearInterval(this.heartbeatInterval)
    clearTimeout(this.retryTimer)
    if (this.retryCount < FAIL_COUNT_LIMIT) {
      this.retryTimer = setTimeout(() => {
        this.emit('info', '链接断开，正在重试')
        console.warn('Connection Closed, retrying...')
        this.retryCount++
        this.connect()
      }, RETRY_TIMEOUT)
    } else {
      this.emit('error', '链接建立失败')
    }
  }

  private bindEvents () {
    if (!this.ws) {
      return
    }
    this.ws.addEventListener('message', this.handleMessage.bind(this))
    this.ws.addEventListener('close', this.handleClose.bind(this))
    this.ws.addEventListener('error', this.handleError.bind(this))
  }

  private unbindEvents () {
    if (!this.ws) {
      return
    }
    this.ws.removeEventListener('message', this.handleMessage.bind(this))
    this.ws.removeEventListener('close', this.handleClose.bind(this))
    this.ws.removeEventListener('error', this.handleError.bind(this))
  }

  startHeartbeat () {
    this.heartbeatInterval = setInterval(() => {
      this.ws.send(JSON.stringify({
        cmd: 'heartbeat',
        ts: Date.now()
      }))
    }, 30 * 1000)
  }
}
