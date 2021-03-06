const FRAME_HEADER = 0x8
import { Opcode } from './ws.frame'

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
  let payloadLength = getSingleWSFramePayloadLength(data)
  const isMask = (payload & 0x80) > 0
  if (payloadLength > 125) {
    payloadLength += 2
  }
  if (payloadLength > 65535) {
    payloadLength += 6
  }
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
  const opCode = data[0].readUInt8(0) & 0x0f
  return {
    type: opCode,
    rawBuffer: entireContent,
    content: opCode === Opcode.Text ? entireContent.toString() : entireContent
  }

}

function umaskPayload (payloadBuffer: Buffer, maskingKey: Buffer): Buffer {
  for (let i = 0; i < payloadBuffer.byteLength; i++) {
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
  if (payloadLength === 0) return Buffer.alloc(0)
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

export function isControlFrame (data: Buffer) {
  //Control frames are identified by opcodes where the most significant
  // bit of the opcode is 1.
  const high8 = data.readUInt8(0)
  return (high8 & 0x08) > 0
}
