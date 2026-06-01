const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Database setup
const Database = require('better-sqlite3');

app.use(express.json());

const adminSessions = new Set();

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts.shift().trim();
    const value = decodeURIComponent(parts.join('='));
    list[key] = value;
  });
  return list;
}

function requireAdmin(req, res, next) {
  const cookies = parseCookies(req);
  if (cookies.admin_auth && adminSessions.has(cookies.admin_auth)) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

const db = new Database(path.join(__dirname, 'gradify.db'));
db.pragma('foreign_keys = ON');
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    design_style TEXT NOT NULL,
    color_palette TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  )
`).run();

const defaultAdminUsername = 'admin';
const defaultAdminPassword = 'admin';
const defaultAdminHash = bcrypt.hashSync(defaultAdminPassword, 10);
db.prepare(`
  INSERT OR IGNORE INTO admin_users (username, password_hash)
  VALUES (?, ?)
`).run(defaultAdminUsername, defaultAdminHash);

app.post('/api/contact', (req, res) => {
  const { name, surname, email, style, color, message } = req.body;

  if (!name || !surname || !email || !style || !color) {
    return res.status(400).json({ error: 'Completează toate câmpurile obligatorii.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (name, surname, email)
      VALUES (?, ?, ?)
    `);
    insertUser.run(name.trim(), surname.trim(), normalizedEmail);

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    const userId = user.id;

    const insertOrder = db.prepare(`
      INSERT INTO orders (user_id, design_style, color_palette, details)
      VALUES (?, ?, ?, ?)
    `);
    insertOrder.run(userId, style.trim(), color.trim(), message ? message.trim() : '');

    res.json({ success: true });
  } catch (error) {
    console.error('DB error:', error);
    res.status(500).json({ error: 'A apărut o eroare la salvarea comenzii.' });
  }
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username și parola sunt necesare.' });
  }

  const user = db.prepare('SELECT password_hash FROM admin_users WHERE username = ?').get(username.trim());
  if (!user) {
    return res.status(401).json({ error: 'Credențiale invalide.' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Credențiale invalide.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  adminSessions.add(token);
  res.cookie('admin_auth', token, { httpOnly: true, sameSite: 'strict' });
  res.json({ success: true });
});

app.post('/admin/logout', (req, res) => {
  const cookies = parseCookies(req);
  if (cookies.admin_auth) {
    adminSessions.delete(cookies.admin_auth);
  }
  res.clearCookie('admin_auth');
  res.json({ success: true });
});

app.get('/api/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, surname, email FROM users ORDER BY id DESC').all();
  res.json({ users });
});

app.get('/api/orders', requireAdmin, (req, res) => {
  const orders = db.prepare(`
    SELECT o.order_id, u.id AS user_id, u.name, u.surname, u.email,
           o.design_style, o.color_palette, o.details, o.created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.order_id DESC
  `).all();
  res.json({ orders });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ success: true });
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }
  const stmt = db.prepare('DELETE FROM orders WHERE order_id = ?');
  const result = stmt.run(orderId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json({ success: true });
});

app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin.html'));
});

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
