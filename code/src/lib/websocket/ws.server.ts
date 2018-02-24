import { Server } from 'net'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { EventEmitter } from 'events'

import { WebSocketConnection } from './ws.connection'
import { createLogger } from '../logger'

const console = createLogger('Websocket')

export class WebSocketServer extends EventEmitter {

  static createFromHttpServer (httpServer: Server) {
    const newInstance = new WebSocketServer()
    newInstance.attachToHttpServer(httpServer)
    return newInstance
  }

  public attachToHttpServer (httpServer: Server) {
    httpServer.on('upgrade', this.handleIncomingUpgradeRequest.bind(this))
  }

  private handleIncomingUpgradeRequest (req: IncomingMessage, socket: Socket) {
    const newConnectionInstance = new WebSocketConnection(req, socket)
    try {
      newConnectionInstance.once('connect', () => this.emit('connect', newConnectionInstance))
      newConnectionInstance.handShake()
      console.log('Connection Established!')
    } catch (err) {
      console.warn('HandShake Fail', err)
    }
  }
}