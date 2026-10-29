
const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');

const USERNAME = process.env.TIKTOK_USER;
const PORT = Number(process.env.PORT) || 8080;

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('LiveFX TikTok Bridge is running');
});

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (socket) => {
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

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

if (!USERNAME) {
  console.error('Falta configurar TIKTOK_USER en Render');
} else {
  const live = new WebcastPushConnection(USERNAME);

  live.on('connected', () => {
    console.log('Conectado a TikTok LIVE');
  });

  for (const event of ['chat', 'gift', 'like', 'member', 'social']) {
    live.on(event, (data) => broadcast(event, data));
  }

  live.connect().catch((error) => {
    console.error('Error al conectar con TikTok LIVE:', error.message);
  });
}
