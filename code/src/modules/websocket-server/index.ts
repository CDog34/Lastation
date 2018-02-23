import { WebSocketServer, WebSocketConnection } from '../../lib/websocket'

export function createWSServer (): WebSocketServer {
  const wsServer = new WebSocketServer()
  wsServer.on('connect', (socket: WebSocketConnection) => {
    socket.on('data', (data: IFrameData) => {
      socket.sendText(data.content)
    })
  })
  return wsServer
}

