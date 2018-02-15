// https://github.com/hunterloftis/stoppable

import * as http from "http";
import * as https from "https";

export interface StoppableHTTPServer extends http.Server {
  stop?: (callbacka: Function) => void;
  _pendingSockets?: Map<any, any>;
}

export interface StoppableHTTPSServer extends https.Server {
  stop?: (callbacka: Function) => void;
  _pendingSockets?: Map<any, any>;
}

export default function stoppable(
  server: StoppableHTTPServer | StoppableHTTPSServer,
  grace = Infinity
) {
  const reqsPerSocket = new Map();
  let stopped = false;

  server.on("connection", onConnection);
  server.on("secureConnection", onConnection);
  server.on("request", onRequest);
  server.stop = stop;
  server._pendingSockets = reqsPerSocket;
  return server;

  function onConnection(socket: any) {
    reqsPerSocket.set(socket, 0);
    socket.once("close", () => reqsPerSocket.delete(socket));
  }

  function onRequest(req: any, res: any) {
    reqsPerSocket.set(req.socket, reqsPerSocket.get(req.socket) + 1);
    res.once("finish", () => {
      const pending = reqsPerSocket.get(req.socket) - 1;
      reqsPerSocket.set(req.socket, pending);
      if (stopped && pending === 0) {
        req.socket.end();
      }
    });
  }

  function stop(callback: Function) {
    // allow request handlers to update state before we act on that state
    setImmediate(() => {
      stopped = true;
      if (grace < Infinity) {
        setTimeout(destroyAll, grace).unref();
      }
      server.close(callback);
      reqsPerSocket.forEach(endIfIdle);
    });
  }

  function endIfIdle(requests: any, socket: any) {
    if (requests === 0) socket.end();
  }

  function destroyAll() {
    reqsPerSocket.forEach((reqs, socket) => socket.end());
    setImmediate(() => {
      reqsPerSocket.forEach((reqs, socket) => socket.destroy());
    });
  }
}
