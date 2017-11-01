import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

function handleWSHandshake (req: IncomingMessage, socket: Socket) {
  const res = new ServerResponse(req)
  res.assignSocket(socket)
  res.statusCode = 400
  res.end()
}

export function processWebsocket (req: IncomingMessage, socket: Socket) {
  handleWSHandshake(req, socket)
}