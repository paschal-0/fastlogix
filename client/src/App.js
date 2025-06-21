// client/src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ Layouts
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";

// ✅ Client Pages
import Home from "./pages/Client/Home";
import TrackOrder from "./pages/Client/TrackOrder";
import ClientChat from "./pages/Client/ClientChat";

// ✅ Admin Pages
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CreateOrder from "./pages/Admin/CreateOrder";
import UpdateOrder from "./pages/Admin/UpdateOrder";
import AdminChat from "./pages/Admin/AdminChat";
import AdminChatsList from "./pages/Admin/AdminChatsList"; // ✅ NEW
import AdminOrders from './pages/Admin/AdminOrders';

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Client Pages */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/chat" element={<ClientChat />} />
        </Route>

        {/* ✅ Admin Login — no layout */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ✅ Admin Pages */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/create-order" element={<CreateOrder />} />
          <Route path="/admin/update-order/:orderId" element={<UpdateOrder />} />
          <Route path="/admin/orders" element={<AdminOrders />} />

          {/* ✅ NEW: Chats List Page */}
          <Route path="/admin/chats" element={<AdminChatsList />} />

          {/* ✅ Chat with orderId param */}
          <Route path="/admin/chat/:orderId" element={<AdminChat />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
