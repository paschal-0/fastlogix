import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api'; // 👈 uses your axios helper
import './AdminChatsList.css';

const AdminChatsList = () => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
  const fetchActiveChats = async () => {
    try {
      const res = await fetch('https://fastlogix-backend.onrender.com/api/chats/active');
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error('Failed to fetch active chats:', err);
    }
  };

  fetchActiveChats();
}, []);


  return (
    <div className="admin-chats-list-page">
      <div className="admin-chats-list-container">
        <h2>Active Chats</h2>
        {chats.length === 0 ? (
          <p>No active chats.</p>
        ) : (
          <div className="chats-grid">
            {chats.map(chat => (
              <div key={chat.orderId} className="chat-card">
                <h3>Order #{chat.orderId}</h3>
                <p><strong>Customer:</strong> {chat.customer}</p>
                <Link to={`/admin/chat/${chat.orderId}`}>
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
