import { createServer, IncomingMessage, ServerResponse, Server } from 'http'
import { Server as StaticServer } from 'node-static'
import { Socket } from 'net'


export function createHttpServer():Server{
  const fileServer = new StaticServer('./public')
  
  return createServer((req, res) => {
    req.addListener('end', function () {
      fileServer.serve(req, res, (e: any) => {
        if (!e) { return }
        res.statusCode = e.status
        res.end(e.message)
      });
    }).resume();
  })
}
