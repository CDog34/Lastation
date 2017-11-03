/// <reference path="../types/index.d.ts" />

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server as StaticServer } from 'node-static'
import { Socket } from 'net'

import { WebSocketServer } from './modules/websocket'


const fileServer = new StaticServer('./public')

const httpServer = createServer((req, res) => {

  req.addListener('end', function () {
    fileServer.serve(req, res, (e: any) => {
      if (!e) { return }
      res.statusCode = e.status
      res.end(e.message)
    });
  }).resume();
})

const wsServer = WebSocketServer.createFromHttpServer(httpServer)

httpServer.listen(2233, () => {
  console.log('ServerStart')
})