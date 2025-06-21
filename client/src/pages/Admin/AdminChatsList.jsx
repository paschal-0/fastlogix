import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminChatsList.css'; // ✅ We'll write this next!

const AdminChatsList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // TODO: Replace with real backend call
    setOrders([
      { _id: '123456', customer: 'John Doe' },
      { _id: '789012', customer: 'Jane Smith' },
      { _id: '345678', customer: 'Michael Johnson' },
    ]);
  }, []);

  return (
    <div className="admin-chats-list-page">
      <div className="admin-chats-list-container">
        <h2>Active Chats</h2>
        {orders.length === 0 ? (
          <p>No active chats.</p>
        ) : (
          <div className="chats-grid">
            {orders.map(order => (
              <div key={order._id} className="chat-card">
                <h3>Order #{order._id}</h3>
                <p><strong>Customer:</strong> {order.customer}</p>
                <Link to={`/admin/chat/${order._id}`}>
                  <button>Open Chat</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatsList;
