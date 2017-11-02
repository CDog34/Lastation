/**
 * WebSocket handshake module
 * 
 * 
   1.   An HTTP/1.1 or higher GET request, including a "Request-URI"
        [RFC2616] that should be interpreted as a /resource name/
        defined in Section 3 (or an absolute HTTP/HTTPS URI containing
        the /resource name/).
   2.   A |Host| header field containing the server’s authority.
   3.   An |Upgrade| header field containing the value "websocket",
        treated as an ASCII case-insensitive value.
   4.   A |Connection| header field that includes the token "Upgrade",
        treated as an ASCII case-insensitive value.
   5.   A |Sec-WebSocket-Key| header field with a base64-encoded (see
        Section 4 of [RFC4648]) value that, when decoded, is 16 bytes in
        length.
   6.   A |Sec-WebSocket-Version| header field, with a value of 13.
   7.   Optionally, an |Origin| header field.  This header field is sent
        by all browser clients.  A connection attempt lacking this
        header field SHOULD NOT be interpreted as coming from a browser
        client.
   8.   Optionally, a |Sec-WebSocket-Protocol| header field, with a list
        of values indicating which protocols the client would like to
        speak, ordered by preference.
   9.   Optionally, a |Sec-WebSocket-Extensions| header field, with a
        list of values indicating which extensions the client would like
        to speak.  The interpretation of this header field is discussed
        in Section 9.1.

 */

import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { createHash } from 'crypto'

const SUPPORTED_WS_VERSION: Array<string> = ['13']
const WS_UUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

export function handleWSHandshake (req: IncomingMessage, socket: Socket): Socket {
  const res = new ServerResponse(req)
  res.assignSocket(socket)
  try {
    validHttpHeaders(req)
    const spec = getHandShakeSpecsFromHeader(req)
    handShakeSuccess(res, spec)
    return socket
  } catch (err) {
    handShakeFail(res, err)
    throw err
  }
}

function handShakeFail (res: ServerResponse, err: Error) {
  res.statusCode = 400
  res.setHeader('Sec-Websocket-Version', SUPPORTED_WS_VERSION.join(', '))
  res.end(err.message)
}

function handShakeSuccess (res: ServerResponse, spec: WSHandshakeHeaderSpecs) {
  res.statusCode = 101
  res.setHeader('Connection', 'upgrade')
  res.setHeader('Upgrade', 'websocket')
  res.setHeader('Sec-Websocket-Accept', spec.accept)
  res.flushHeaders()
  console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[32m WebSocket Connection Established \x1B[0m`)

}

function getHandShakeSpecsFromHeader (req: IncomingMessage): WSHandshakeHeaderSpecs {
  let {
    'sec-websocket-key': key
   } = req.headers
  key = key.toString()
  console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m Generating Accept String for: ${key} \x1B[0m`)
  const hash = createHash('sha1')
  hash.update(key + WS_UUID)
  return {
    accept: hash.digest('base64')
  }
}

function validHttpHeaders (req: IncomingMessage): boolean {
  const {
    upgrade,
    'sec-websocket-key': key,
    'sec-websocket-version': version
   } = req.headers
  console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m Validating HandShake Request: ${req.method} ${upgrade}, ${key}, ${version}  \x1B[0m`)
  if (req.method.toLowerCase() !== 'get') throw new Error('Invalid Request Header: Method')
  if (!upgrade || upgrade.toString().toLowerCase() !== 'websocket') throw new Error('Invalid Request Header: Upgrade')
  if (!key) throw new Error('Invalid Request Header: Sec-Websocket-Key')
  if (!version || SUPPORTED_WS_VERSION.indexOf(version.toString()) === -1) throw new Error('Invalid Request Header: Sec-Websocket-Version')
  return true
}