import { IncomingMessage } from 'http'
import { Socket } from 'net'

import { handleWSHandshake } from './ws.handshake'

export class WebSocketConnection {
  currentStage = 'OPENING'
  socket: Socket
  httpRequest: IncomingMessage

  constructor(req: IncomingMessage, socket: Socket) {
    this.socket = socket
    this.httpRequest = req
  }

  public handShake () {
    if (this.currentStage !== 'OPENING') return
    try {
      handleWSHandshake(this.httpRequest, this.socket)
      this.currentStage = 'OPENED'
    } catch (err) {
      this.currentStage = 'FAILED'
      throw err
    }
  }
}