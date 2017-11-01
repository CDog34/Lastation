import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { handleWSHandshake } from './ws.handshake'

export function processWebsocket (req: IncomingMessage, socket: Socket) {
  try {
    handleWSHandshake(req, socket)
  } catch (err) {
    console.log('\x1B[44;1m[WebSocket]\x1B[0m\x1B[33m ' + err.message + ' \x1B[0m')
  }
}