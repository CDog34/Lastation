import { WebSocketServer, WebSocketConnection } from '../../lib/websocket'
import { WSSession } from './wss.session'
import { Room } from './wss.room'

export function createWSServer (): WebSocketServer {
  const wsServer = new WebSocketServer()
  wsServer.on('connect', async (socket: WebSocketConnection) => {
    try {
      const wsSession = await WSSession.createSessionFromConnection(socket)
      Room.addSessionToRoom(wsSession.roomId, wsSession)
    } catch (err) {
      console.log(err)
    }
  })
  return wsServer
}

export {
  Room
}

