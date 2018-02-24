import { createServer, IncomingMessage, ServerResponse, Server } from 'http'
import { Server as StaticServer } from 'node-static'
import { Socket } from 'net'
import { Room } from '../websocket-server'


export function createHttpServer (): Server {
  const fileServer = new StaticServer('./public')

  return createServer((req, res) => {
    if (req.url === '/miao' && req.method.toLowerCase() === 'post' && req.headers['content-type'] === 'application/json') {
      let body: Buffer[] = []
      req
        .on('data', (chunk: Buffer) => {
          body.push(chunk);
        })
        .on('end', () => {
          const bodyStr = Buffer.concat(body).toString();
          // at this point, `body` has the entire request body stored in it as a string
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

    } else {
      req.addListener('end', function () {
        fileServer.serve(req, res, (e: any) => {
          if (!e) { return }
          res.statusCode = e.status
          res.end(e.message)
        });
      }).resume()
    }
  })
}
