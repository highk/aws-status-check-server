import 'dotenv/config'
import Koa from 'koa';
import cors from '@koa/cors';
import http from 'http';
import bodyParser from 'koa-bodyparser';
import router from './router';
import ServerManager from './helper/ServerManager';
import LogManager from './helper/LogManager';
import { Server, Socket } from 'socket.io';

interface ExtendedSocket extends Socket {
  logList?: {id: any, host: string}[];
}

const logManager = new LogManager();
const serverManager = new ServerManager(
  (sm) => {
    sm.log();
  }, 
  logManager
);

const app = new Koa();
const server = http.createServer(app.callback());

app.use(cors());
app.use(bodyParser());

app.use(async (ctx, next) => {
  if(ctx.path === '/' || ctx.path.indexOf('/api') === 0) {
    if(ctx.request.query.keyId === process.env.API_KEY) {
      ctx.serverManager = serverManager;
      ctx.logManager = logManager;
    }
    else {
      ctx.status = 403;
      return;
    }
  }
  await next();
});

app.use(router.routes());

import serve from 'koa-static';
// import mount from 'koa-mount';
// import send from 'koa-send';
const documentRoot = __dirname + "/front/build";
app.use(serve(documentRoot)); //serve the build directory


// 
// 

let cnt = 0;

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
io.on('connection', async (socket: ExtendedSocket) => {
  socket.logList = [];
  socket.on('logSubscribe', (host) => {
    console.log("host", host);

    const logger = logManager.find(host);
    
    if(!logger) {
      socket.emit('receiveLog', {host, log: "NOT FOUND HOST"});
      return;
    }

    const id = cnt++;

    socket.logList.push({host: host, id: id});

    socket.emit('receiveLog', {host, log: logger.logs, file: logger.file});

    logManager.addLogListener(host, id, (log) => {
      socket.emit('receiveLog', {host, log});
    });
  });

  socket.on('logSubscribeCancle', (host) => {
    const idx = socket.logList.findIndex(l => l.host === host);
    if(idx < 0) return;
    logManager.removeLogListener(host, socket.logList[idx].id);
    socket.logList.splice(idx, 1);
  });

  socket.on('disconnection', () => {
    socket.logList.forEach((l) => {
      logManager.removeLogListener(l.host, l.id);
    });
  })
});



// 
server.listen(8082, () => {
  console.log('Connect at ', 8082);
});