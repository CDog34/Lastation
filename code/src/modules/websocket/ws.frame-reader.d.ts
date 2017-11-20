interface IFrameData {
  type: 'text' | 'raw'
  rawBuffer: Buffer
  content: any
}