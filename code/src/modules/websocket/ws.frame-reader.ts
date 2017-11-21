const FRAME_HEADER = 0x8
enum Opcode {
  Continuation = 0x0,
  Text = 0x1,
  Binary = 0x2,
  Close = 0x8,
  Ping = 0x9,
  Pong = 0xA
}

/**
 * 根据 Websocket Frame 的头部信息获取一个 Websocket Frame 的长度
 * 
 * 假定传入的一定是 合法的 带有头部信息的 Websocket Frame
 * 
 * 单位 byte
 * 
 * 
 * @export
 * @param {Buffer} data 
 * @returns {number} 
 */
export function getLengthInFrame (data: Buffer): number {
  const payload = data.readUInt8(1)
  const payloadLength = getSingleWSFramePayloadLength(data)
  const isMask = (payload & 0x80) > 0
  return payloadLength + 2 + (isMask ? 4 : 0)
}

/**
 * 判断一个 Websocket Frame 是否是一个完整帧
 * 
 * 根据 Frame 头部数据来判断
 * 假定传入一定是合法 WS Frame
 * 
 * @export
 * @param {Buffer} data 
 * @returns {boolean} 
 */
export function isWSFrameFin (data: Buffer): boolean {
  return (data.readUInt8(0) & 0x80) > 0
}

export function getFrameContent (data: Array<Buffer> | Buffer): IFrameData {
  if (!data) { throw new Error('empty content') }
  if (!Array.isArray(data)) {
    data = [data]
  }
  const buffers = data.map(getSingleWSFramePayloadBuffer)
  const entireContent = Buffer.concat(buffers)
  if ((data[0].readUInt8(0) & 0x0F) === Opcode.Text) {
    return {
      type: 'text',
      rawBuffer: entireContent,
      content: entireContent.toString()
    }
  } else {
    return {
      type: 'raw',
      rawBuffer: entireContent,
      content: entireContent
    }
  }
  // switch (data.readUInt8(0) & 0x0F) {
  //   case Opcode.Continuation:
  //     logMessage('Continuation')
  //     break
  //   case Opcode.Text:
  //     logMessage('Text')
  //     handleTextFrame(data)
  //     break
  //   case Opcode.Binary:
  //     logMessage('Binary')
  //     break
  //   case Opcode.Close:
  //     logMessage('Close')
  //     break
  //   case Opcode.Ping:
  //     logMessage('Ping')
  //     break
  //   case Opcode.Pong:
  //     logMessage('Pong')
  //     break
  //   default:
  //     console.log('Unknown frame', data)
  // }
}

function handleTextFrame (data: Buffer) {
  let offsetByte = 1
  let payloadLength = data.readUInt8(offsetByte++)
  const isMask = (payloadLength & 0x80) > 0
  let maskingKey: Buffer
  payloadLength = payloadLength & 0x7F
  switch (payloadLength) {
    case 126:
      payloadLength = data.readUInt16BE(offsetByte)
      offsetByte += 2
      break
    case 127:
      payloadLength = (data.readUInt32BE(offsetByte) << 32) + data.readUInt32BE(offsetByte + 4)
      offsetByte += 8
  }
  if (isMask) {
    maskingKey = data.slice(offsetByte, offsetByte + 4)
    offsetByte += 4
  }
  const payloadDataBuffer: Buffer = data.slice(offsetByte, offsetByte + payloadLength)
  const plainPayload = umaskPayload(payloadDataBuffer, maskingKey)
  console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[32m Text Message Received: ${plainPayload.toString()}  \x1B[0m`)

}

function umaskPayload (payloadBuffer: Buffer, maskingKey: Buffer): Buffer {
  for (let i = 0; i < payloadBuffer.length; i++) {
    payloadBuffer[i] = payloadBuffer[i] ^ maskingKey[i % 4]
  }
  return payloadBuffer
}

function logMessage (messageType: string) {
  console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m Received Frame With Opcode: ${messageType}  \x1B[0m`)
}

/**
 * 获取 单个 WS Frame 的 Payload 长度
 * 
 * 假定传入的是合法 Frame 
 * 
 * @param {Buffer} data 
 * @returns {number} 
 */
function getSingleWSFramePayloadLength (data: Buffer): number {
  const payload = data.readUInt8(1)
  let payloadLength = payload & 0x7F
  switch (payloadLength) {
    case 126:
      payloadLength = data.readUInt16BE(2)
      break
    case 127:
      payloadLength = (data.readUInt32BE(2) << 32) + data.readUInt32BE(6)
  }
  return payloadLength
}

/**
 * 处理单个 WS Frame 
 * 
 * 返回 Frame 的 payload Buffer
 * 
 * @param {Buffer} data 
 * @returns {Buffer} 
 */
function getSingleWSFramePayloadBuffer (data: Buffer): Buffer {
  let offsetByte = 1
  const content = data.readUInt8(offsetByte++)
  const payloadLength = getSingleWSFramePayloadLength(data)
  const isMask = (content & 0x80) > 0
  let maskingKey: Buffer
  if (payloadLength > 125) {
    offsetByte += 2
  }
  if (payloadLength > 65535) {
    offsetByte += 6
  }
  if (isMask) {
    maskingKey = data.slice(offsetByte, offsetByte + 4)
    offsetByte += 4
  }
  const payloadDataBuffer: Buffer = data.slice(offsetByte, offsetByte + payloadLength)
  return isMask ? umaskPayload(payloadDataBuffer, maskingKey) : payloadDataBuffer
}