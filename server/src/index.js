import { setServers } from 'node:dns/promises';
setServers(['1.1.1.1', '8.8.8.8']);
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import socketService from './services/socket.service.js';
import _import1 from './app.js';
const app = _import1;
import _import2 from './config/config.js';
const config = _import2;
import _import3 from './config/logger.js';
const logger = _import3;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

socketService.handleSocket(io);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
