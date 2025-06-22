import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './AdminChat.css';

const socket = io('https://fastlogix-backend.onrender.com');

const AdminChat = () => {
  const { orderId: paramOrderId } = useParams();
  const [orderId, setOrderId] = useState(paramOrderId || '');
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const chatBoxRef = useRef(null);

  const joinRoom = () => {
    if (orderId.trim() === '') return;
    socket.emit('joinRoom', orderId);
    setJoined(true);
  };

  useEffect(() => {
    if (paramOrderId) {
      socket.emit('joinRoom', paramOrderId);
      setJoined(true);
    }
  }, [paramOrderId]);

  const sendMessage = () => {
    if (message.trim() === '') return;

    const msg = {
      id: Date.now(),
      orderId,
      sender: 'Admin',
      message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    socket.emit('chatMessage', msg);
    setMessages((prev) => [...prev, msg]); // ✅ add immediately to UI
    setMessage('');
  };

  useEffect(() => {
    socket.on('chatHistory', (msgs) => setMessages(msgs));
    socket.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('chatHistory');
      socket.off('newMessage');
    };
  }, []);

  useEffect(() => {
    if (!joined) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const msgId = entry.target.dataset.id;
          const sender = entry.target.dataset.sender;
          if (entry.isIntersecting && sender !== 'Admin') {
            socket.emit('messageSeen', { orderId, messageId: Number(msgId) });
          }
        });
      },
      { threshold: 1.0 }
    );

    const nodes = document.querySelectorAll('.message-bubble');
    nodes.forEach((node) => observer.observe(node));

    return () => {
      nodes.forEach((node) => observer.unobserve(node));
    };
  }, [messages, joined, orderId]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="admin-chat-page"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/assets/images/graphyy.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!joined ? (
        <div className="join-room">
          <h2>Admin Join Chat</h2>
          <input
            type="text"
            placeholder="Enter Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button onClick={joinRoom}>Join</button>
        </div>
      ) : (
        <div className="admin-chat-container">
          <h2>Chat for Order: {orderId}</h2>
          <div className="chat-box" ref={chatBoxRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-id={msg.id}
                data-sender={msg.sender}
                className={`message-bubble ${
                  msg.sender === 'Admin' ? 'admin' : 'client'
                }`}
              >
                <div>{msg.message}</div>
                <div className="message-meta">
                  {new Date(msg.timestamp).toLocaleTimeString()} &nbsp;
                  {msg.status === 'seen' ? '✔✔' : '✔'}
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChat;
