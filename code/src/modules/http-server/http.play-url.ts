import { IncomingMessage, ServerResponse, request as httpRequest } from "http"

export function getPlayUrl (req: IncomingMessage, res: ServerResponse) {
  proxying(req, res)
}

function proxying (req: IncomingMessage, res: ServerResponse): void {
  const options = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36',
      'referer':'http://live.bilibili.com/3'
    },
    host: 'api.live.bilibili.com',
    method: 'GET',
    path: '/room/v1/Room/playUrl?cid=23058&quality=0&platform=web'
  }

  const proxyRequest = httpRequest(options, (response) => {
    response.pause()
    res.writeHead(response.statusCode, response.headers)
    response.pipe(res, { end: true })
    response.resume()

    response.on('end', () => {
      console.log(`Proxy ${req.url}`)
    })

    response.on('error', (error) => {
      responseToClient(
        res,
        500,
        'Error occurred when receiving proxy response: ' + error.message
      )
    })
  })

  proxyRequest.on('error', (error) => {
    responseToClient(
      res,
      500,
      'Error occurred when sending proxy request: ' + error.message
    )
  })

  req.pipe(proxyRequest, {
    end: true
  })
}

/**
 * Send response to client.
 *
 * @param {"http".ServerResponse} res
 * @param {number} statusCode
 * @param {string} content
 */
function responseToClient (res: ServerResponse, statusCode = 500, content: string) {
  res.statusCode = statusCode
  res.end(content)
}