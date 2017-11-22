/// <reference path="./ws.handshake.d.ts" />
/// <reference path="./ws.frame.d.ts" />


interface IFrameData {
  type: number
  rawBuffer: Buffer
  content: any
}
type TConnectionState = 'OPEN' | 'CLOSED' | 'TIME_WAIT' | 'NEW' | 'CLOSING'

interface IWSFrame {
  type: 'text' | 'binary',
  contentBuffer: Buffer
}
