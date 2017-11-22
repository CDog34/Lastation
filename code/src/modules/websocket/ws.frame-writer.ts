import { Opcode } from './ws.frame'

const MAX_FRAME_LENGTH = 99999999

function createSingleFrame (isFin: boolean, opcode: Opcode, isMask: boolean, payload?: Buffer) {
  if (!!payload && payload.byteLength >= MAX_FRAME_LENGTH) {
    throw new Error('Frame too large')
  }
  if (isMask) {
    throw new Error('Downstream data SHOULD NOT Masked')
  }
  if (!payload) { payload = Buffer.allocUnsafe(0) }
  let headerBufferSize = 2
  // const
  let payloadLength = payload.byteLength
  let payloadLengthHigh7 = 0
  if (payloadLength < 126) {
    payloadLengthHigh7 = payloadLength
    payloadLength = 0
  } else if (payloadLength < 65537) {
    payloadLengthHigh7 = 126
    headerBufferSize += 2
  } else {
    payloadLengthHigh7 = 127
    headerBufferSize += 8
  }
  const headerBuffer = Buffer.alloc(
    headerBufferSize
  )
  headerBuffer.writeUInt8(generateHeader(isFin, opcode), 0)
  headerBuffer.writeUInt8(payloadLengthHigh7, 1)
  if (payloadLengthHigh7 === 126) {
    headerBuffer.writeUInt16BE(payloadLength, 2)
  }
  if (payloadLengthHigh7 === 127) {
    headerBuffer.writeUInt32BE(payloadLength >>> 31 >>> 1, 2)
    headerBuffer.writeUInt32BE(payloadLength, 6)
  }
  return Buffer.concat([headerBuffer, payload])
}

function generateHeader (isFin: boolean, opcode: Opcode): number {
  if (isFin) {
    return (1 << 7) | opcode
  } else {
    return opcode
  }
}

export function createTextFrame (isFin: boolean, text: string): Buffer {
  return createSingleFrame(isFin, Opcode.Text, false, Buffer.from(text))
}
export function createControlFrame (opCode: Opcode, payload?: Buffer) {
  if (!(opCode & 0x8)) {
    throw new Error('Not Valid Control Frame OPCode')
  }
  return createSingleFrame(true, opCode, false, payload)
}