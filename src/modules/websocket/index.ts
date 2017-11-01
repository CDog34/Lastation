import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { handleWSHandshake } from './ws.handshake'

export function processWebsocket (req: IncomingMessage, socket: Socket) {
  handleWSHandshake(req, socket)
}