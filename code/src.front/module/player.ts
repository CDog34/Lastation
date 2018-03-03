import flvjs from 'flv.js'

interface flvSpec {
  type: string
  url:string
  isLive:boolean
}

export function createPlayer (spec: flvSpec, ele: HTMLVideoElement) {
  if (!flvjs.isSupported()) {
    return null
  }
  const { type,url,isLive } = spec
  const player = flvjs.createPlayer({
    type,
    url,
    isLive
  })
  player.attachMediaElement(ele)
  return player
}