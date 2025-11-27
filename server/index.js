import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import fetch from 'node-fetch'; // ✅ For geocoding
import cors from 'cors';

// ✅ Create Express
const app = express();
app.use(express.json());

// ✅ Allowed origins
const allowedOrigins = [
  'https://www.fastlogix.org',
  'http://localhost:3000'
];

// ✅ CORS for HTTP
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  credentials: true
}));

// ✅ Create HTTP server AFTER app
const server = http.createServer(app);

// ✅ Attach Socket.IO AFTER server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ---------- Environment / config (use env vars; fallbacks included)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://paschalokafor450:NvM6LAKinAYYZ3hu@fastlogix.cacgj8m.mongodb.net/fastlogix';
const SMTP_USER = process.env.SMTP_USER || 'support@fastlogix.org';
const SMTP_PASS = process.env.SMTP_PASS || 'srKPyRC2Z1Yk';
const SECRET_KEY = process.env.SECRET_KEY || 'mysecretkey';
const GEOCODER_USER_AGENT = process.env.GEOCODER_USER_AGENT || 'FastLogix/1.0 (support@fastlogix.org)';

// Warn if using fallback values (helpful for Render logs)
if (!process.env.MONGO_URI) console.warn('⚠️ Using fallback MONGO_URI. Set MONGO_URI in environment for production.');
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) console.warn('⚠️ Using fallback SMTP credentials. Set SMTP_USER and SMTP_PASS in environment.');
if (!process.env.SECRET_KEY) console.warn('⚠️ Using fallback SECRET_KEY. Set SECRET_KEY in environment for production.');

// ---------- Mongo connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected to fastlogix DB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ---------- Helper: Robust Geocode function (Nominatim-compatible, defensive)
async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address passed to geocodeAddress');
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      // Nominatim requires a valid User-Agent with contact info
      'User-Agent': GEOCODER_USER_AGENT,
      'Accept': 'application/json'
    },
    // you may set redirect: 'manual' if you want to detect redirects
  });

  const contentType = res.headers.get('content-type') || '';
  const textBody = await res.text();

  // Helpful debugging logs (Render logs)
  console.error('🔎 Geocode response status:', res.status, res.statusText);
  console.error('🔎 Geocode content-type:', contentType);
  // Log a limited snippet to avoid massive logs
  console.error('🔎 Geocode response body (first 1000 chars):', textBody.slice(0, 1000));

  if (!res.ok) {
    // Include a short snippet of the body so the cause (HTML error page, Cloudflare block, etc.) is visible in logs
    throw new Error(`Geocode API HTTP ${res.status}: ${res.statusText}. Body: ${textBody.slice(0, 500)}`);
  }

  if (!contentType.includes('application/json')) {
    // Defensive: do not attempt to JSON.parse HTML
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
  orderId: String,
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

// ---------- Configure Nodemailer (Zoho SMTP) using env vars
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,          // secure port for Zoho
  secure: true,       // use TLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// verify transporter at startup (non-blocking)
transporter.verify().then(() => {
  console.log('✅ SMTP transporter verified');
}).catch(err => {
  console.error('⚠️ SMTP transporter verification failed:', err && err.message ? err.message : err);
});

// ---------- 4️⃣ Create Order (with geocoding) - improved error handling
app.post('/api/orders', async (req, res) => {
  const { sender, receiver, packageDetails } = req.body;

  if (!sender || !receiver || !packageDetails) {
    return res.status(400).json({ message: "Missing order details" });
  }

  try {
    // geocode receiver address (defensive)
    const geo = await geocodeAddress(receiver.address);

    const newOrder = new Order({
      sender,
      receiver,
      packageDetails,
      location: {
        address: receiver.address,
        coordinates: [geo.lon, geo.lat]
      }
    });

    await newOrder.save();

    // send initial emails; wrap sends to avoid crashes if SMTP fails
    try {
      await transporter.sendMail({
        from: `"FastLogix" <${SMTP_USER}>`,
        to: sender.email,
        subject: "Order Created - FastLogix",
        html: `<p>Dear ${sender.name},</p><p>Your order has been created. You will receive your Order ID soon.</p>`
      });
    } catch (err) {
      console.error('⚠️ Failed to send initial email to sender:', err && err.message ? err.message : err);
    }

    try {
      await transporter.sendMail({
        from: `"FastLogix" <${SMTP_USER}>`,
        to: receiver.email,
        subject: "Incoming Package - FastLogix",
        html: `<p>Dear ${receiver.name},</p><p>A package has been created for you. Stay tuned for tracking details.</p>`
      });
    } catch (err) {
      console.error('⚠️ Failed to send initial email to receiver:', err && err.message ? err.message : err);
    }

    console.log(`📧 Initial emails attempted to Sender & Receiver.`);

    // generate orderId after a delay and notify (wrapped in try/catch)
    setTimeout(async () => {
      try {
        newOrder.orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;
        await newOrder.save();
        console.log(`✅ Order ID generated: ${newOrder.orderId}`);

        try {
          await transporter.sendMail({
            from: `"FastLogix" <${SMTP_USER}>`,
            to: sender.email,
            subject: `Your FastLogix Order ID: ${newOrder.orderId}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #1e88e5;">🚚 FastLogix Order Confirmation</h2>
                <p>Hi ${sender.name},</p>
                <p>We’re excited to inform you that your order has been successfully created and your <strong>Order ID</strong> is:</p>
                <h3 style="color: #1e88e5;">${newOrder.orderId}</h3>
                <p>You can track your order status anytime using the link below:</p>
                <p style="text-align: center; margin: 20px 0;">
                  <a href="https://www.fastlogix.org/track" style="background: #1e88e5; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Track My Order</a>
                </p>
                <p>If you have any questions, feel free to contact our support team at <a href="mailto:${SMTP_USER}">${SMTP_USER}</a>.</p>
                <p>Thank you for choosing FastLogix!</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} FastLogix. All rights reserved.</p>
              </div>
            `
          });
        } catch (err) {
          console.error('⚠️ Failed to send Order ID email to sender:', err && err.message ? err.message : err);
        }

        try {
          await transporter.sendMail({
            from: `"FastLogix" <${SMTP_USER}>`,
            to: receiver.email,
            subject: `Your FastLogix Package ID: ${newOrder.orderId}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #1e88e5;">📦 FastLogix Package Update</h2>
                <p>Hi ${receiver.name},</p>
                <p>A new package is on its way to you! Your <strong>Tracking ID</strong> is:</p>
                <h3 style="color: #1e88e5;">${newOrder.orderId}</h3>
                <p>You can check the delivery status anytime:</p>
                <p style="text-align: center; margin: 20px 0;">
                  <a href="https://www.fastlogix.org/track" style="background: #1e88e5; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Track My Package</a>
                </p>
                <p>If you have questions, we’re here to help at <a href="mailto:${SMTP_USER}">${SMTP_USER}</a>.</p>
                <p>Thank you for using FastLogix!</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} FastLogix. All rights reserved.</p>
              </div>
            `
          });
        } catch (err) {
          console.error('⚠️ Failed to send Order ID email to receiver:', err && err.message ? err.message : err);
        }

        console.log(`📧 Order ID emails attempted to Sender & Receiver.`);
      } catch (err) {
        console.error('⚠️ Failed during delayed Order ID generation / email sending:', err && err.message ? err.message : err);
      }
    }, 30 * 1000);

    // Return lightweight order (avoid sending Mongoose internals)
    res.json({ message: "Order created & saved to DB", order: { id: newOrder._id, location: newOrder.location, status: newOrder.status } });

  } catch (error) {
    // This will now include helpful geocode failure info (status/content-type/body snippet)
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

    // Append previous location to history
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

// ---------- Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server with Socket.io & MongoDB running on port ${PORT}`);
});
