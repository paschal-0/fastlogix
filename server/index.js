import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import fetch from 'node-fetch'; // ✅ For geocoding

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

mongoose.connect('mongodb+srv://paschalokafor450:NvM6LAKinAYYZ3hu@fastlogix.cacgj8m.mongodb.net/fastlogix?retryWrites=true&w=majority&appName=fastlogix', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
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

// ✅ 2️⃣ Define Order Schema (updated)
const orderSchema = new mongoose.Schema({
  sender: {
    name: String,
    email: String,
    address: String
  },
  receiver: {
    name: String,
    email: String,
    address: String
  },
  packageDetails: Object,
  status: {
    type: String,
    default: "Pending"
  },
  orderId: String,
  location: {
    address: String,
    coordinates: {
      type: [Number], // [lon, lat]
      index: '2dsphere'
    }
  }
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

// ✅ Configure Nodemailer (SendGrid)
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: 'YOUR_SENDGRID_API_KEY'
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
      from: '"FastLogix" <noreply@fastlogix.com>',
      to: sender.email,
      subject: "Order Created - FastLogix",
      html: `<p>Dear ${sender.name},</p><p>Your order has been created. You will receive your Order ID soon.</p>`
    });

    await transporter.sendMail({
      from: '"FastLogix" <noreply@fastlogix.org>',
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
        from: '"FastLogix" <noreply@fastlogix.com>',
        to: sender.email,
        subject: "Your Order ID - FastLogix",
        html: `<p>Dear ${sender.name},</p><p>Your Order ID is <b>${newOrder.orderId}</b>.</p>`
      });

      await transporter.sendMail({
        from: '"FastLogix" <noreply@fastlogix.com>',
        to: receiver.email,
        subject: "Tracking ID - FastLogix",
        html: `<p>Dear ${receiver.name},</p><p>Your package Order ID is <b>${newOrder.orderId}</b>.</p>`
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

// ✅ 7️⃣ Update location by OrderID (with geocoding)
app.patch('/api/orders/:orderId/location', async (req, res) => {
  const { orderId } = req.params;
  const { location } = req.body;

  try {
    const geo = await geocodeAddress(location);
    const order = await Order.findOneAndUpdate(
      { orderId },
      { location: { address: location, coordinates: [geo.lon, geo.lat] } },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: `Location updated for ${orderId}`, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Geocoding failed", error: err.message });
  }
});

// ✅ 8️⃣ Track order by OrderID
app.get('/api/orders/track/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ orderId });
  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json({
    orderId: order.orderId,
    status: order.status,
    location: order.location
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

// ✅ Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server with Socket.io & MongoDB running on port ${PORT}`);
});
