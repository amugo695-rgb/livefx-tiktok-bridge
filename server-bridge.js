const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');

const USERNAME = process.env.TIKTOK_USER;
const PORT = Number(process.env.PORT) || 8080;

if (!USERNAME) {
  throw new Error('Falta configurar la variable TIKTOK_USER en Render');
}

const server = new WebSocket.Server({ port: PORT });

console.log(`Servidor WebSocket iniciado en el puerto ${PORT}`);

server.on('connection', (socket) => {
  socket.send(JSON.stringify({
    type: 'status',
    message: 'Conectado al servidor LiveFX'
  }));
});

function broadcast(event, data = {}) {
  const message = JSON.stringify({
    type: event,
    uniqueId: data.uniqueId,
    nickname: data.nickname,
    giftName: data.giftName,
    giftId: data.giftId,
    repeatCount: data.repeatCount,
    comment: data.comment,
    timestamp: Date.now()
  });

  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

async function start() {
  const live = new WebcastPushConnection(USERNAME);

  live.on('connected', () => {
    console.log('Conectado a TikTok LIVE');
  });

  live.on('chat', (data) => {
    broadcast('chat', data);
  });

  live.on('gift', (data) => {
    broadcast('gift', data);
  });

  live.on('like', (data) => {
    broadcast('like', data);
  });

  live.on('member', (data) => {
    broadcast('member', data);
  });

  live.on('social', (data) => {
    broadcast('social', data);
  });

  try {
    await live.connect();
    console.log(`Conexión iniciada para ${USERNAME}`);
  } catch (error) {
    console.error('Error al conectar con TikTok LIVE:', error.message);
  }
}

start().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
});
