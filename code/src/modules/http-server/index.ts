import { createServer, IncomingMessage, ServerResponse, Server } from 'http'
import { Socket } from 'net'

import { handleDanmakuPost } from './http.post-danmaku'
import { handleStaticFile } from './http.static'
import { getPlayUrl } from './http.play-url'

export function createHttpServer (): Server {

  return createServer((req, res) => {
    if (req.url === '/danmaku' && req.method.toLowerCase() === 'post' && req.headers['content-type'] === 'application/json') {
      handleDanmakuPost(req, res)
    } else if (req.url === '/play-url' && req.method.toLowerCase() === 'get') {
      getPlayUrl(req, res)
    } else {
      handleStaticFile(req, res)
    }
  })
}
