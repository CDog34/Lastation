import { IncomingMessage } from 'http'
import { Socket } from 'net'

import { handleWSHandshake } from './ws.handshake'

export class WebSocketConnection {
  private _currentStage = 'OPENING'
  private socket: Socket
  private httpRequest: IncomingMessage

  constructor(req: IncomingMessage, socket: Socket) {
    this.socket = socket
    this.httpRequest = req
  }

  get currentStage (): string {
    return this._currentStage
  }

  public handShake () {
    if (this._currentStage !== 'OPENING') return
    try {
      handleWSHandshake(this.httpRequest, this.socket)
      this._currentStage = 'OPENED'
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
    } catch (err) {

    }
  }
}