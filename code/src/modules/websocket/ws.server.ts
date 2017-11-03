import { Server } from 'net'
import { IncomingMessage } from 'http'
import { Socket } from 'net'

import { WebSocketConnection } from './ws.connection'

export class WebSocketServer {
  connections: Array<WebSocketConnection>

  static createFromHttpServer (httpServer: Server) {
    const newInstance = new WebSocketServer()
    newInstance.attachToHttpServer(httpServer)
  }

  private attachToHttpServer (httpServer: Server) {
    httpServer.on('upgrade', this.handleIncomingUpgradeRequest.bind(this))
  }

  private handleIncomingUpgradeRequest (req: IncomingMessage, socket: Socket) {
    const newConnectionInstance = new WebSocketConnection(req, socket)
    try {
      newConnectionInstance.handShake()
    } catch (err) {

    }
    console.log(req, socket)
  }
}