import * as flvjs from 'flv.js/dist/flv.js'

interface flvSpec {
  type: string
  url: string
  isLive: boolean
}

export function createPlayer (spec: flvSpec, ele: HTMLVideoElement) {
  if (!flvjs.isSupported()) {
    return null
  }
  const { type, url, isLive } = spec
  const player = flvjs.createPlayer({
    type,
    url,
    isLive,
    cors: true
  })
  player.attachMediaElement(ele)
  return player
}