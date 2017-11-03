import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { handleWSHandshake } from './ws.handshake'
import { handleFrame } from './ws.frame-reader'

export function processWebsocket (req: IncomingMessage, socket: Socket) {
  try {
    const ws = handleWSHandshake(req, socket)
    ws.on('data', handleFrame)
    ws.on('end', () => console.log('end'))
  } catch (err) {
    console.log('\x1B[44;1m[WebSocket]\x1B[0m\x1B[33m ' + err.message + ' \x1B[0m')
  }
}