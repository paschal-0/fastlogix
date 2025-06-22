import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Dropzone from 'react-dropzone';
import './ClientChat.css';

const socket = io('https://fastlogix-backend.onrender.com');

const ClientChat = () => {
  const [orderId, setOrderId] = useState('');
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const chatEndRef = useRef(null);

  const joinRoom = () => {
    if (orderId.trim() === '') return;
    socket.emit('joinRoom', orderId);
    setJoined(true);
  };

  const sendMessage = (msgContent) => {
    if (!msgContent.trim()) return;

    const newMsg = {
      id: Date.now(),
      orderId,
      sender: 'Client',
      message: msgContent,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    socket.emit('chatMessage', newMsg);
    setMessage('');
  };

  // Typing indicator
  useEffect(() => {
    if (!joined) return;
    socket.emit('typing', { orderId, typing: !!message });
  }, [message, joined, orderId]);

  useEffect(() => {
    socket.on('chatHistory', (msgs) => setMessages(msgs));
    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev.map((m) => (m.id === msg.id ? msg : m)) : [...prev, msg];
      });
      playSound();
    });

    socket.on('messageSeen', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'seen' } : m))
      );
    });

    socket.on('typing', ({ typing }) => {
      setIsAdminTyping(typing);
    });

    return () => {
      socket.off('chatHistory');
      socket.off('newMessage');
      socket.off('messageSeen');
      socket.off('typing');
    };
  }, []);

  // Seen observer
  useEffect(() => {
    if (!joined) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const msgId = entry.target.dataset.id;
          const sender = entry.target.dataset.sender;
          if (entry.isIntersecting && sender !== 'Client') {
            socket.emit('messageSeen', { orderId, messageId: Number(msgId) });
          }
        });
      },
      { threshold: 1.0 }
    );

    const nodes = document.querySelectorAll('.bubble');
    nodes.forEach((node) => observer.observe(node));

    return () => {
      nodes.forEach((node) => observer.unobserve(node));
    };
  }, [messages, joined, orderId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const playSound = () => {
    const audio = new Audio(
      'https://notificationsounds.com/storage/sounds/file-sounds-1151-pristine.mp3'
    );
    audio.play();
  };

  const handleDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newMsg = {
          id: Date.now(),
          orderId,
          sender: 'Client',
          message: `[Attachment]`,
          file: {
            name: file.name,
            type: file.type,
            data: reader.result,
          },
          timestamp: new Date().toISOString(),
          status: 'sent',
        };
        setMessages((prev) => [...prev, newMsg]);
        socket.emit('chatMessage', newMsg);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="client-chat-container">
      {!joined ? (
        <div className="join-room">
          <h2>Join Chat</h2>
          <input
            type="text"
            placeholder="Enter your Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button onClick={joinRoom}>Join</button>
        </div>
      ) : (
        <div className="chat-room">
          <h2>Chat for Order: {orderId}</h2>
          <div
            className="chat-box"
            style={{
              backgroundImage: `url('/assets/images/graphyy.jpeg')`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'Client' ? 'client' : 'admin'}`}
              >
                <div
                  className="bubble"
                  data-id={msg.id}
                  data-sender={msg.sender}
                >
                  {msg.file ? (
                    <div>
                      <strong>{msg.file.name}</strong><br />
                      {msg.file.type.startsWith('image') && (
                        <img src={msg.file.data} alt={msg.file.name} style={{ maxWidth: '150px' }} />
                      )}
                      {!msg.file.type.startsWith('image') && (
                        <a href={msg.file.data} download={msg.file.name}>Download</a>
                      )}
                    </div>
                  ) : (
                    msg.message
                  )}
                  <div className="message-meta">
                    <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>{' '}
                    {msg.sender === 'Client' && (
                      <span className="status">
                        {msg.status === 'sent' && '✔'}
                        {msg.status === 'delivered' && '✔✔'}
                        {msg.status === 'seen' && '✔✔'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isAdminTyping && <div className="typing-indicator">Admin is typing...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input">
            <Dropzone onDrop={handleDrop} multiple>
              {({ getRootProps, getInputProps }) => (
                <div className="dropzone" {...getRootProps()}>
                  <input {...getInputProps()} />
                  📎
                </div>
              )}
            </Dropzone>
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(message)}
            />
            <button onClick={() => sendMessage(message)}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientChat;
