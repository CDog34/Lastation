const FRAME_HEADER = 0x8
enum Opcode {
  Continuation = 0x0,
  Text = 0x1,
  Binary = 0x2,
  Close = 0x8,
  Ping = 0x9,
  Pong = 0xA
}

export function handleFrame (data: Buffer) {
  const isFin = (data.readUInt8(0) & 0x80) > 0
  console.log(isFin)
  switch (data.readUInt8(0) & 0x0F) {
    case Opcode.Continuation:
      logMessage('Continuation')
      break
    case Opcode.Text:
      logMessage('Text')
      handleTextFrame(data)
      break
    case Opcode.Binary:
      logMessage('Binary')
      break
    case Opcode.Close:
      logMessage('Close')
      break
    case Opcode.Ping:
      logMessage('Ping')
      break
    case Opcode.Pong:
      logMessage('Pong')
      break
    default:
      console.log('Unknown frame', data)
  }
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