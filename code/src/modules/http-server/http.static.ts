import { IncomingMessage, ServerResponse } from "http";
import { Server as StaticServer } from 'node-static'


const fileServer = new StaticServer('./public')
export function handleStaticFile(req:IncomingMessage,res:ServerResponse){
  req.addListener('end', function () {
    fileServer.serve(req, res, (e: any) => {
      if (!e) { return }
      res.statusCode = e.status
      res.end(e.message)
    });
  }).resume()
}