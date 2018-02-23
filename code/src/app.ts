/// <reference path="../types/index.d.ts" />

import {createHttpServer} from './modules/http-server'
import {createWSServer} from './modules/websocket-server'
import { createLogger } from './modules/logger'

const console = createLogger('HttpServer')

const httpServer = createHttpServer()
const wsServer = createWSServer()

wsServer.attachToHttpServer(httpServer)
httpServer.listen(2233, () => {
  console.log('ServerStart')
})