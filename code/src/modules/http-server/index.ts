import { createServer, IncomingMessage, ServerResponse, Server } from 'http'
import { Socket } from 'net'

import { handleDanmakuPost } from './http.post-danmaku'
import { handleStaticFile } from './http.static'

export function createHttpServer (): Server {

  return createServer((req, res) => {
    if (req.url === '/danmaku' && req.method.toLowerCase() === 'post' && req.headers['content-type'] === 'application/json') {
      handleDanmakuPost(req, res)
    } else {
      handleStaticFile(req, res)
    }
  })
}
