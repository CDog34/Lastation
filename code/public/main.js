// var ws = new WebSocket('ws://localhost:2233');

// var heartbeatsInterval = null

// ws.onopen = function (evt) {
//   console.log('Connection open ...');
//   ws.send(JSON.stringify({
//     cmd: 'handshake',
//     roomId: 57796
//   }));
// };

// ws.onmessage = function (evt) {
//   console.log('Received Message: ' + evt.data);
//   try {
//     var json = JSON.parse(evt.data)
//     if (json.message === 'Business Handshake OK') {
//       heartbeatsInterval = setInterval(() => {
//         ws.send(JSON.stringify({
//           cmd: 'heartbeat',
//           ts: Date.now()
//         }))
//       }, 30 * 1000)
//     }
//   } catch (err) {

//   }
//   // ws.close();
// };

// ws.onclose = function (evt) {
//   console.log('Connection closed.');
// };

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