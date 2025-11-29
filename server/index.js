// server.js (ZeptoMail via fetch; hard-coded token usage)
// NOTE: Do NOT commit this file with hard-coded credentials to a public repo.

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fetch from 'node-fetch'; // For geocoding and ZeptoMail HTTP calls
import cors from 'cors';

// ---------- Create Express
const app = express();
app.use(express.json());

// ---------- Allowed origins
const allowedOrigins = [
  'https://www.fastlogix.org',
  'http://localhost:3000'
];

// ---------- CORS for HTTP
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  credentials: true
}));

// ---------- Create HTTP server AFTER app
const server = http.createServer(app);

// ---------- Attach Socket.IO AFTER server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ---------- Environment / config (use env vars; fallbacks included)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://paschalokafor450:NvM6LAKinAYYZ3hu@fastlogix.cacgj8m.mongodb.net/fastlogix';
const SECRET_KEY = process.env.SECRET_KEY || 'mysecretkey';
const GEOCODER_USER_AGENT = process.env.GEOCODER_USER_AGENT || 'FastLogix/1.0 (support@fastlogix.org)';

// ---------- HARD-CODED ZeptoMail credentials (as you requested)
// Send Mail token (include prefix if that's how Zepto shows it)
const ZEPTO_TOKEN = 'Zoho-enczapikey wSsVR613/ELzD/wsymGsdeYxkVUHUlz2HE0pjVOgunP8TPnD8sc9whKdAQTyTqAZRGZuHWBDo7h8nE1V1WUP3t4vn14JXSiF9mqRe1U4J3x17qnvhDzOWWRVkBCIJYoPxAxvm2BoF8sl+g==';
const EMAIL_FROM = 'FastLogix <noreply@fastlogix.org>';
const ZEPTO_API_ENDPOINT = 'https://api.zeptomail.com/v1.1/email';
const TRACKING_SITE_BASE = 'https://www.fastlogix.org/track'; // used in email links

if (!process.env.MONGO_URI) console.warn('⚠️ Using fallback MONGO_URI. Set MONGO_URI in environment for production.');
if (!process.env.SECRET_KEY) console.warn('⚠️ Using fallback SECRET_KEY. Set SECRET_KEY in environment for production.');
if (!ZEPTO_TOKEN) console.warn('⚠️ ZeptoMail token missing. Emails will fail.');

// ---------- Mongo connection
mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log('✅ MongoDB connected to fastlogix DB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ---------- Helper: Robust Geocode function (Nominatim-compatible)
async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address passed to geocodeAddress');
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': GEOCODER_USER_AGENT,
      'Accept': 'application/json'
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const textBody = await res.text();

  console.error('🔎 Geocode response status:', res.status, res.statusText);
  console.error('🔎 Geocode content-type:', contentType);
  console.error('🔎 Geocode response body (first 1000 chars):', textBody.slice(0, 1000));

  if (!res.ok) {
    throw new Error(`Geocode API HTTP ${res.status}: ${res.statusText}. Body: ${textBody.slice(0, 500)}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON from geocode API but got content-type: ${contentType}. Body: ${textBody.slice(0,500)}`);
  }

  let data;
  try {
    data = JSON.parse(textBody);
  } catch (err) {
    throw new Error(`Failed to parse geocode JSON: ${err.message}. Body: ${textBody.slice(0,500)}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Geocoding returned no results for: ${address}`);
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

// ---------- Schemas
const orderSchema = new mongoose.Schema({
  sender: { name: String, email: String, address: String },
  receiver: { name: String, email: String, address: String },
  packageDetails: Object,
  status: { type: String, default: "Pending" },
  orderId: { type: String, index: true },
  location: {
    address: String,
    coordinates: { type: [Number], index: '2dsphere' } // [lon, lat]
  },
  history: [
    {
      address: String,
      coordinates: [Number],
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// ChatMessage schema
const chatMessageSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  orderId: { type: String, required: true },
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'sent' }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// ---------- Basic routes & auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'FastLogix backend is working!' });
});

// Hardcoded admin (password hashed)
const adminUser = {
  username: "admin",
  passwordHash: bcrypt.hashSync("password123", 10)
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== adminUser.username) {
    return res.status(400).json({ message: "Invalid username" });
  }
  const isPasswordValid = bcrypt.compareSync(password, adminUser.passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password" });
  }
  const token = jwt.sign({ username: adminUser.username }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

app.get('/', (req, res) => {
  res.send("Welcome to FastLogix backend!");
});

// ---------- sendEmail using direct ZeptoMail REST API (fetch)
async function sendEmail({ to, toName = "", subject, html, from }) {
  if (!ZEPTO_TOKEN) {
    throw new Error('ZeptoMail token not configured');
  }

  const fromAddr = from || EMAIL_FROM;
  const fromAddressOnly = (fromAddr.includes("<") ? fromAddr.match(/<(.*)>/)[1] : fromAddr);
  const fromName = (fromAddr.includes("<") ? fromAddr.split("<")[0].trim() : undefined);

  const payload = {
    from: {
      address: fromAddressOnly,
      name: fromName
    },
    to: [
      { email_address: { address: to, name: toName || undefined } }
    ],
    subject,
    htmlbody: html
  };

  let resp;
  let text;
  try {
    resp = await fetch(ZEPTO_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // ZeptoMail expects an Authorization header — include token exactly as provided by Zepto
        'Authorization': ZEPTO_TOKEN
      },
      body: JSON.stringify(payload)
    });

    text = await resp.text();
  } catch (err) {
    console.error('⚠️ ZeptoMail HTTP request failed:', err && err.message ? err.message : err);
    throw new Error(`ZeptoMail HTTP request failed: ${err && err.message ? err.message : String(err)}`);
  }

  // Try parse JSON body for better error messages
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  if (!resp.ok) {
    console.error('⚠️ ZeptoMail API returned non-OK:', resp.status, resp.statusText, data);
    throw new Error(`ZeptoMail API error ${resp.status}: ${JSON.stringify(data)}`);
  }

  // success
  console.log('📧 ZeptoMail send success:', data);
  return data;
}

// ---------- Test email endpoint
app.get('/api/test-email', async (req, res) => {
  const to = req.query.to || '';
  if (!to) return res.status(400).json({ message: 'Provide ?to=you@domain.com' });

  try {
    await sendEmail({
      to,
      toName: 'Test Recipient',
      subject: 'FastLogix test email',
      html: '<p>This is a test from FastLogix via ZeptoMail.</p>'
    });
    res.json({ ok: true, message: 'Test email sent' });
  } catch (err) {
    console.error('Test email error:', err && err.message ? err.message : err);
    res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});

// ---------- Create Order (with geocoding)
// Receiver now gets tracking link; initial location is pushed into history so tracking shows history.
app.post('/api/orders', async (req, res) => {
  const { sender, receiver, packageDetails } = req.body;

  if (!sender || !receiver || !packageDetails) {
    return res.status(400).json({ message: "Missing order details" });
  }

  try {
    // geocode receiver address (defensive)
    const geo = await geocodeAddress(receiver.address);

    // Generate orderId immediately so client can use it right away
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const initialLocation = {
      address: receiver.address,
      coordinates: [geo.lon, geo.lat],
      timestamp: new Date()
    };

    const newOrder = new Order({
      sender,
      receiver,
      packageDetails,
      orderId,
      location: {
        address: receiver.address,
        coordinates: [geo.lon, geo.lat]
      },
      history: [initialLocation]
    });

    await newOrder.save();

    console.log(`✅ Order created with orderId: ${newOrder.orderId} (_id=${newOrder._id})`);

    // Prepare email payloads with tracking link (both sender & receiver)
    const from = EMAIL_FROM;
    const trackLink = `${TRACKING_SITE_BASE}?orderId=${encodeURIComponent(orderId)}`;

    const senderHtml = `
      <p>Dear ${sender.name},</p>
      <p>Your order has been created. Order ID: <strong>${orderId}</strong></p>
      <p>You can track the package here: <a href="${trackLink}">${trackLink}</a></p>
    `;

    const receiverHtml = `
      <p>Dear ${receiver.name},</p>
      <p>A package has been created for you. Tracking ID: <strong>${orderId}</strong></p>
      <p>Track your package here: <a href="${trackLink}">${trackLink}</a></p>
    `;

    // Send emails asynchronously - don't block the response
    (async () => {
      try {
        await sendEmail({ from, to: sender.email, toName: sender.name, subject: "Order Created - FastLogix", html: senderHtml });
      } catch (err) {
        console.error('⚠️ Failed to send initial email to sender (zepto):', err && err.message ? err.message : err);
      }

      try {
        await sendEmail({ from, to: receiver.email, toName: receiver.name, subject: "Incoming Package - FastLogix", html: receiverHtml });
      } catch (err) {
        console.error('⚠️ Failed to send initial email to receiver (zepto):', err && err.message ? err.message : err);
      }

      // Order ID fancy email (send to both sender and receiver)
      const orderHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #1e88e5;">🚚 FastLogix Order Confirmation</h2>
          <p>Hi ${sender.name},</p>
          <p>Your <strong>Order ID</strong> is <strong>${orderId}</strong>.</p>
          <p>Track: <a href="${trackLink}">${trackLink}</a></p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} FastLogix</p>
        </div>
      `;

      try {
        await sendEmail({ from, to: sender.email, toName: sender.name, subject: `Your FastLogix Order ID: ${orderId}`, html: orderHtml });
      } catch (err) {
        console.error('⚠️ Failed to send Order ID email to sender (zepto):', err && err.message ? err.message : err);
      }

      try {
        // Send the same fancy confirmation to receiver (so they have link & ID)
        await sendEmail({ from, to: receiver.email, toName: receiver.name, subject: `FastLogix Package ID: ${orderId}`, html: orderHtml });
      } catch (err) {
        console.error('⚠️ Failed to send Order ID email to receiver (zepto):', err && err.message ? err.message : err);
      }
    })();

    // Return immediate response with orderId and DB id
    res.json({
      message: "Order created & saved to DB",
      order: {
        id: newOrder._id,
        orderId: newOrder.orderId,
        location: newOrder.location,
        history: newOrder.history || [],
        status: newOrder.status
      }
    });

  } catch (error) {
    console.error("Order creation error:", error && error.message ? error.message : error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
});

// ---------- 5️⃣ Get one order by Mongo ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error('❌ Get order by ID error:', err && err.message ? err.message : err);
    res.status(500).json({ message: "Server error", err });
  }
});

// ---------- 6️⃣ Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error('❌ Get all orders error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// ---------- Update location + push to history
app.patch('/api/orders/:orderId/location', async (req, res) => {
  const { orderId } = req.params;
  const { location } = req.body; // expected to be address string

  if (!location || typeof location !== 'string') {
    return res.status(400).json({ message: 'Invalid location payload' });
  }

  try {
    const geo = await geocodeAddress(location);
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Append previous location to history if there is a valid existing location
    if (order.location?.address && Array.isArray(order.location?.coordinates) && order.location.coordinates.length === 2) {
      order.history = order.history || [];
      order.history.push({
        address: order.location.address,
        coordinates: order.location.coordinates,
        timestamp: new Date()
      });
    }

    // Update current location
    order.location = {
      address: location,
      coordinates: [geo.lon, geo.lat]
    };

    await order.save();
    res.json({ message: `Location updated for ${orderId}`, order });

  } catch (err) {
    console.error('⚠️ Update location error:', err && err.message ? err.message : err);
    res.status(500).json({ message: "Geocoding failed", error: err.message });
  }
});

// ---------- Enhanced Track endpoint
app.get('/api/orders/track/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({
      orderId: order.orderId,
      status: order.status,
      location: order.location,
      history: order.history || [],
      packageDetails: order.packageDetails,
      sender: order.sender,
      receiver: order.receiver
    });
  } catch (err) {
    console.error('❌ Track endpoint error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch order track info' });
  }
});

// ---------- Update status by OrderID
app.patch('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findOneAndUpdate({ orderId }, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    console.log(`✅ Status updated for ${orderId}: ${order.status}`);
    res.json({ message: `Status updated for ${orderId}`, order });
  } catch (err) {
    console.error('❌ Update status error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// ---------- Real-time Chat (Socket.IO)
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('joinRoom', async (orderId) => {
    try {
      socket.join(orderId);
      console.log(`✅ ${socket.id} joined room ${orderId}`);
      const messages = await ChatMessage.find({ orderId }).sort({ timestamp: 1 });
      socket.emit('chatHistory', messages);
    } catch (err) {
      console.error('⚠️ joinRoom error:', err && err.message ? err.message : err);
    }
  });

  socket.on('chatMessage', async ({ id, orderId, sender, message, timestamp, status }) => {
    try {
      const newMsg = new ChatMessage({ id, orderId, sender, message, timestamp, status: status || 'sent' });
      await newMsg.save();
      io.to(orderId).emit('newMessage', { id, orderId, sender, message, timestamp, status: 'delivered' });
      console.log(`💬 [${orderId}] ${sender}: ${message}`);
    } catch (err) {
      console.error('⚠️ chatMessage save/send error:', err && err.message ? err.message : err);
    }
  });

  socket.on('messageSeen', async ({ orderId, messageId }) => {
    try {
      await ChatMessage.updateOne({ id: messageId }, { status: 'seen' });
      io.to(orderId).emit('messageSeen', { messageId });
      console.log(`👁 Message ${messageId} in ${orderId} marked as seen`);
    } catch (err) {
      console.error('⚠️ messageSeen error:', err && err.message ? err.message : err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

app.get('/api/chat/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const messages = await ChatMessage.find({ orderId }).sort({ timestamp: 1 });
    res.json({ messages });
  } catch (err) {
    console.error('❌ Get chat messages error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch chat messages' });
  }
});

// Get unique active chats (one per orderId)
app.get('/api/chats/active', async (req, res) => {
  try {
    // Get distinct orderIds from ChatMessages
    const orderIds = await ChatMessage.distinct('orderId');

    // Fetch Orders for each orderId to get customer name
    const orders = await Order.find({ orderId: { $in: orderIds } });

    // Merge: [{ orderId, customer }]
    const activeChats = orders.map(order => ({
      orderId: order.orderId,
      customer: (order.sender && order.sender.name) ? order.sender.name : 'Unknown'
    }));

    res.json(activeChats);
  } catch (err) {
    console.error('❌ Get active chats error:', err && err.message ? err.message : err);
    res.status(500).json({ message: 'Failed to get active chats' });
  }
});

// health/readiness endpoints for monitoring
app.get('/healthz', (req, res) => res.send('ok'));
app.get('/readyz', (req, res) => res.json({ mongo: mongoose.connection.readyState }));

// ---------- Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server with Socket.io & MongoDB running on port ${PORT}`);
});
