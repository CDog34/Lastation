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
  const headerHigh4 = FRAME_HEADER << 4
  switch (data.readUIntBE(0, 1)) {
    case headerHigh4 + Opcode.Continuation:
      console.log('Continuation')
      break
    case headerHigh4 + Opcode.Text:
      handleTextFrame(data)
      console.log('Text')
      break
    case headerHigh4 + Opcode.Binary:
      console.log('Binary')
      break
    case headerHigh4 + Opcode.Close:
      console.log('Close')
      break
    case headerHigh4 + Opcode.Ping:
      console.log('Ping')
      break
    case headerHigh4 + Opcode.Pong:
      console.log('Pong')
      break
    default:
      console.log('Unknown frame', data)
  }
  // console.log((FRAME_HEADER << 4) + Opcode.Text)

  // console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m WebSocket Data Received: \x1B[0m`, data)
  // console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m WebSocket Data0 Received: ${data.readUInt32LE(0).toString(2)} \x1B[0m`)
  // console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m WebSocket Data1 Received: ${data.readUInt32LE(4).toString(2)} \x1B[0m`)
  // console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m WebSocket Data2 Received: ${data.readUInt32LE(8).toString(2)} \x1B[0m`)
  // console.log(`\x1B[44;1m[WebSocket]\x1B[0m\x1B[34m WebSocket Data4 Received: ${data.readUInt32LE(12).toString(2)} \x1B[0m`)
}

function handleTextFrame (data: Buffer) {
  let offsetByte = 1
  let payloadLength = data.readUInt8(offsetByte++)
  const isMask = (payloadLength & 0x80) > 0
  let maskingKey = 0
  payloadLength = payloadLength & 0x7F
  console.log(payloadLength)
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
    maskingKey = data.readUInt32BE(offsetByte)
    offsetByte += 4
  }
  console.log(isMask, payloadLength, offsetByte, maskingKey)
}