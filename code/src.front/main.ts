import { WSClient } from './lib'
var ws = new WSClient(57796)

ws.on('message', function (data) {
  console.log(data)
})
ws.on('handshake', function () {
  console.log('Connection Established.')
})
ws.on('heartbeat', function (data) {
  console.log('Heartbeat Finish:', data)
})
ws.connect()