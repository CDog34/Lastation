import { WSClient } from './module/ws-client'
import { getPlayerUrl } from './service/play-url'
import { createPlayer } from './module/player'
import { Logger } from './module/logger'
import { handleInput } from './module/input-handler'

let player

function initWebsocket (logger?: Logger): WSClient {
  const ws = new WSClient(57796)

  const console = logger || window.console

  ws.on('message', function (data) {
    console.log('Message Received:', data)
  })
  ws.on('handshake', function () {
    console.log('Connection Established.')
  })
  ws.on('heartbeat', function (data) {
    console.log('Heartbeat Finish:', data)
  })
  ws.on('info', (data) => console.log('Info:', data))
  ws.on('error', (data) => console.log('Error:', data))
  ws.connect()
  return ws
}

async function initPlayer () {
  const playUrls = await getPlayerUrl()
  const url = playUrls.durl[0].url
  const ele = <HTMLVideoElement> document.getElementById('video-ctnr')
  player = createPlayer({
    isLive: true,
    url,
    type: 'flv'
  }, ele)
  player.load()
  player.play()
}

function initLogger (): Logger {
  const ele = document.getElementById('log-ctnr')
  return new Logger(ele)
}

const logger = initLogger()
initPlayer()
initWebsocket(logger)
document.getElementById('danmaku-send-btn').addEventListener('click', async () => {
  const nickInputEle = <HTMLInputElement> document.getElementById('nick-name')
  const cntInputEle = <HTMLInputElement> document.getElementById('danmaku-content')
  const nickValue = nickInputEle.value
  const cntValue = cntInputEle.value
  if (!nickValue || !cntValue) { return }
  await handleInput(nickValue, cntValue)
  nickInputEle.value = ''
  cntInputEle.value = ''
})

document.getElementById('mute').addEventListener('click', () => {
  player.muted = !player.muted
})