import { WSClient } from './module/ws-client'
import { getPlayerUrl } from './service/play-url'
import { createPlayer } from './module/player'


function initWebsocket (): WSClient {
  const ws = new WSClient(57796)

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
  return ws
}

async function initPlayer () {
  const playUrls = await getPlayerUrl()
  const url = playUrls.durl[0].url
  const ele = <HTMLVideoElement> document.getElementById('video-ctnr')
  const player = createPlayer({
    isLive: true,
    url,
    type: 'flv'
  }, ele)
  player.load()
  player.play()
}

initWebsocket()
initPlayer()