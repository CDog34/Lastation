/// <reference path="./ws.handshake.d.ts" />
/// <reference path="./ws.frame.d.ts" />

interface IFrameData {
  type: 'text' | 'raw'
  rawBuffer: Buffer
  content: any
}