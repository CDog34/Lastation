import { IncomingMessage, ServerResponse } from "http";
import { Room } from '../websocket-server'

export function handleDanmakuPost (req: IncomingMessage, res: ServerResponse) {
  let body: Buffer[] = []
  req
    .on('data', (chunk: Buffer) => {
      body.push(chunk);
    })
    .on('end', () => {
      const bodyStr = Buffer.concat(body).toString();
      let roomId, cnt
      try {
        const bodyJson = JSON.parse(bodyStr)
        roomId = bodyJson.roomId
        cnt = bodyJson.cnt
        if (!roomId || !cnt) {
          throw new Error('Invalid Input')
        }
      } catch{
        res.statusCode = 400
        res.end('Invalid Input')
        return
      }
      try {
        Room.sendMessage(roomId, cnt)
        res.end('OK')
      } catch (err) {
        res.statusCode = 500
        res.end('Send Fail')
        console.log(err)
        return
      }
    })
    .on('error', (err) => {
      res.statusCode = 500
      res.end('Err')
      console.error(err)
    })
}