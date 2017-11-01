import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

export function handleWSHandshake (req: IncomingMessage, socket: Socket) {
  const res = new ServerResponse(req)
  res.assignSocket(socket)
  res.statusCode = 400
  res.end()
}