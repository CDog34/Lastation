import { WebSocketConnection } from '../../lib/websocket'
import { EventEmitter } from 'events'


const HAND_SHAKE_TIMEOUT = 5 * 1000
const HEART_BEAT_TIME = (30 + 5) * 1000

export class WSSession extends EventEmitter {
  private connection: WebSocketConnection
  private destroyTimer: NodeJS.Timer
  public roomId: number

  static async createSessionFromConnection (wsConnection: WebSocketConnection) {
    const instance = new WSSession(wsConnection)
    await instance.waitBusinessHandshake()
    return instance
  }

  constructor (wsConnection: WebSocketConnection) {
    super()
    this.connection = wsConnection
    this.roomId = 0
    this.connection.on('end', () => this.destroy())
  }

  private waitBusinessHandshake (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.destroyTimer = setTimeout(() => {
        reject(new Error('Business Handshake Timeout'))
        this.destroy()
      }, HAND_SHAKE_TIMEOUT)
      this.connection.once('data', (content: IFrameData) => {
        try {
          clearTimeout(this.destroyTimer)
          const json = JSON.parse(content.content)
          if (json.cmd !== 'handshake' || !json.roomId) {
            throw new Error('Invalid Business Handshake: ' + content.content)
          }
          this.roomId = json.roomId
          this.connection.sendText(JSON.stringify({
            code: 0,
            message: 'Business Handshake OK'
          }))
          this.startHeartbeatListener()
          resolve()
        } catch (err) {
          reject(err)
          this.destroy()
        }
      })
    })
  }

  private startHeartbeatListener () {
    clearTimeout(this.destroyTimer)
    this.destroyTimer = setTimeout(() => this.destroy(), HEART_BEAT_TIME)

    this.connection.on('data', (data: IFrameData) => {
      try {
        const json = JSON.parse(data.content)
        if (json.cmd !== 'heartbeat' || !json.ts) {
          return
        }
        this.connection.sendText(JSON.stringify({
          code: 0,
          message: 'Heartbeat OK',
          data: {
            lag: Date.now() - json.ts
          }
        }))
        clearTimeout(this.destroyTimer)
        this.destroyTimer = setTimeout(() => this.destroy(), HEART_BEAT_TIME)
      } catch (err) {
      }
    })
  }

  private destroy () {
    clearTimeout(this.destroyTimer)
    !this.connection.isInCloseProcess && this.connection.close()
    this.emit('end')
  }

  public send (cnt: any) {
    const status = this.connection.currentStage
    if (status !== 'OPEN') {
      console.error('Cannot write to close Session')
      return
    }
    this.connection.sendText(JSON.stringify({
      code: 0,
      message: 'Push',
      data: cnt
    }))
  }
}