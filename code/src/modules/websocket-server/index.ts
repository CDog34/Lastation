import { WebSocketServer, WebSocketConnection } from '../../lib/websocket'
import { WSSession } from './wss.session'

export function createWSServer (): WebSocketServer {
  const wsServer = new WebSocketServer()
  wsServer.on('connect', async (socket: WebSocketConnection) => {
    try {
      await WSSession.createSessionFromConnection(socket)
    } catch (err) {
      console.log(err)
    }
  })
  return wsServer
}

