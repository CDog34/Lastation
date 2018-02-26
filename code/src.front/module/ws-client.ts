import { EventEmitter } from './event-emitter'
/**
 * 客户端 Websocket 链接封装
 * 
 * @export
 * @class WSClient
 */
export class WSClient extends EventEmitter {
  roomId: number
  ws: WebSocket
  isClosed: boolean
  heartbeatInterval: any

  constructor (roomId) {
    super()
    if (!roomId || isNaN(parseInt(roomId, 0))) {
      throw new Error('RoomId is Required.')
    }
    this.roomId = parseInt(roomId, 0)
    this.ws = null
    this.isClosed = false
    this.heartbeatInterval = null
  }

  connect () {
    this.ws = new WebSocket('ws://localhost:2233')
    this.ws.addEventListener('open', () => {
      clearInterval(this.heartbeatInterval)
      this.ws.send(JSON.stringify({
        cmd: 'handshake',
        roomId: this.roomId
      }))
    })

    this.ws.addEventListener('message', evt => {
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
    })

    this.ws.addEventListener('close', () => {
      clearInterval(this.heartbeatInterval);
      !this.isClosed && this.connect()
    })

    this.ws.addEventListener('error', () => {
      clearInterval(this.heartbeatInterval);
      !this.isClosed && this.connect()
    })
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
