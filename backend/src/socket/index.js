const { Server } = require('socket.io');
const logger = require('../utils/logger');

let ioInstance = null;

function initSocket(server) {
  const clientOrigin =
    process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';

  ioInstance = new Server(server, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket) => {
    socket.on('subscribe:tracking', (trackingNumber) => {
      if (trackingNumber) {
        socket.join(`tracking:${trackingNumber}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  logger.info('Socket.IO initialized');
  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocket, getIO };
