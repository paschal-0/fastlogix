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




mongoose.connect('mongodb+srv://paschalokafor450:NvM6LAKinAYYZ3hu@fastlogix.cacgj8m.mongodb.net/fastlogix')
  .then(() => console.log('✅ MongoDB connected to fastlogix DB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// ✅ Helper: Geocode an address using OpenStreetMap
async function geocodeAddress(address) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
  const data = await res.json();
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } else {
    throw new Error(`Geocoding failed for: ${address}`);
  }
}

// ✅ Updated schema with history[]
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

// ✅ ChatMessage schema
const chatMessageSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  orderId: { type: String, required: true },
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'sent' }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// ✅ 3️⃣ Other backend logic

app.get('/api/test', (req, res) => {
  res.json({ message: 'FastLogix backend is working!' });
});

const SECRET_KEY = "mysecretkey";

// Hardcoded admin
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

// ✅ Configure Nodemailer (Zoho SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,          // secure port for Zoho
  secure: true,       // use TLS
  auth: {
    user: 'support@fastlogix.org', // e.g. 'support@fastlogix.com'
    pass: 'srKPyRC2Z1Yk'          // your app password
  }
});


// ✅ 4️⃣ Create Order (with geocoding)
app.post('/api/orders', async (req, res) => {
  const { sender, receiver, packageDetails } = req.body;

  if (!sender || !receiver || !packageDetails) {
    return res.status(400).json({ message: "Missing order details" });
  }

  try {
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

    await transporter.sendMail({
      from: '"FastLogix" <support@fastlogix.org>',
      to: sender.email,
      subject: "Order Created - FastLogix",
      html: `<p>Dear ${sender.name},</p><p>Your order has been created. You will receive your Order ID soon.</p>`
    });

    await transporter.sendMail({
      from: '"FastLogix" <support@fastlogix.org>',
      to: receiver.email,
      subject: "Incoming Package - FastLogix",
      html: `<p>Dear ${receiver.name},</p><p>A package has been created for you. Stay tuned for tracking details.</p>`
    });

    console.log(`📧 Real emails sent to Sender & Receiver.`);

    setTimeout(async () => {
      newOrder.orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;
      await newOrder.save();
      console.log(`✅ Order ID generated: ${newOrder.orderId}`);

     await transporter.sendMail({
  from: '"FastLogix" <support@fastlogix.org>',
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
      <p>If you have any questions, feel free to contact our support team at <a href="mailto:support@fastlogix.org">support@fastlogix.org</a>.</p>
      <p>Thank you for choosing FastLogix!</p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} FastLogix. All rights reserved.</p>
    </div>
  `
});


      
      await transporter.sendMail({
  from: '"FastLogix" <support@fastlogix.org>',
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
      <p>If you have questions, we’re here to help at <a href="mailto:support@fastlogix.org">support@fastlogix.org</a>.</p>
      <p>Thank you for using FastLogix!</p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} FastLogix. All rights reserved.</p>
    </div>
  `
});


      console.log(`📧 Real Order ID emails sent to Sender & Receiver.`);
    }, 30 * 1000);

    res.json({ message: "Order created & saved to DB", order: newOrder });

  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
});

// ✅ 5️⃣ Get one order by Mongo ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// ✅ 6️⃣ Get all orders
app.get('/api/orders', async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// ✅ Update location + push to history
app.patch('/api/orders/:orderId/location', async (req, res) => {
  const { orderId } = req.params;
  const { location } = req.body;

  try {
    const geo = await geocodeAddress(location);
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Append previous location to history
    if (order.location?.address && order.location?.coordinates?.length === 2) {
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
    console.error(err);
    res.status(500).json({ message: "Geocoding failed", error: err.message });
  }
});


// ✅ Enhanced Track endpoint
app.get('/api/orders/track/:orderId', async (req, res) => {
  const { orderId } = req.params;
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
});


// ✅ 9️⃣ Update status by OrderID
app.patch('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findOneAndUpdate({ orderId }, { status }, { new: true });
  if (!order) return res.status(404).json({ message: "Order not found" });

  console.log(`✅ Status updated for ${orderId}: ${order.status}`);
  res.json({ message: `Status updated for ${orderId}`, order });
});

// ✅ 10️⃣ Real-time Chat
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('joinRoom', async (orderId) => {
    socket.join(orderId);
    console.log(`✅ ${socket.id} joined room ${orderId}`);
    const messages = await ChatMessage.find({ orderId }).sort({ timestamp: 1 });
    socket.emit('chatHistory', messages);
  });

  socket.on('chatMessage', async ({ id, orderId, sender, message, timestamp, status }) => {
    const newMsg = new ChatMessage({ id, orderId, sender, message, timestamp, status: status || 'sent' });
    await newMsg.save();
    io.to(orderId).emit('newMessage', { id, orderId, sender, message, timestamp, status: 'delivered' });
    console.log(`💬 [${orderId}] ${sender}: ${message}`);
  });

  socket.on('messageSeen', async ({ orderId, messageId }) => {
    await ChatMessage.updateOne({ id: messageId }, { status: 'seen' });
    io.to(orderId).emit('messageSeen', { messageId });
    console.log(`👁 Message ${messageId} in ${orderId} marked as seen`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

app.get('/api/chat/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const messages = await ChatMessage.find({ orderId }).sort({ timestamp: 1 });
  res.json({ messages });
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
      customer: order.sender.name || 'Unknown'
    }));

    res.json(activeChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get active chats' });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server with Socket.io & MongoDB running on port ${PORT}`);
});
