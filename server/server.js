const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, '../client')));

// Catch-all: serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// WebSocket Chat Server 

const botName = 'Gradify Team';

// Simple auto-reply bot responses
const botReplies = [
  "Hey! 🎓 We'd love to help you design your perfect grad cap!",
  "We work with florals, portraits, abstract art, quotes, and more — the cap is your canvas!",
  "Turnaround is typically 3–5 business days. Rush orders available!",
  "Send us a reference photo or describe your vision and we'll make it happen ✨",
  "Our prices start at 50 RON for a basic design. You can also DM us on Instagram or here by using the Contact form!",
  "We're based in Cluj-Napoca 📍 but we ship anywhere in Romania!",
];

let botReplyIndex = 0;

wss.on('connection', (ws) => {
  console.log('New client connected to chat');

  // Send welcome message on connect
  ws.send(JSON.stringify({
    user: botName,
    msg: "Hi there! 👋 Welcome to Gradify. We customize grad caps with your unique vision — flowers, portraits, quotes, glitter, music you name it! How can we help you today?",
    type: 'bot',
    time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      console.log(`Message from ${parsed.user}: ${parsed.msg}`);

      // Broadcast the client message to ALL connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            user: parsed.user,
            msg: parsed.msg,
            type: 'client',
            time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
          }));
        }
      });

      // Auto-reply from bot after 1.2 seconds
      setTimeout(() => {
        const reply = botReplies[botReplyIndex % botReplies.length];
        botReplyIndex++;
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              user: botName,
              msg: reply,
              type: 'bot',
              time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
            }));
          }
        });
      }, 1200);

    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from chat');
  });
});

//Start Server

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎓 Gradify server running at http://localhost:${PORT}`);
  console.log(`💬 WebSocket chat live on ws://localhost:${PORT}\n`);
});
