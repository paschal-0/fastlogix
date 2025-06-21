// client/src/pages/Admin/AdminOrders.jsx

import React, { useEffect, useState } from 'react';
import './AdminOrders.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch orders:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-container">
        <h2>All Orders</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <h3>Order ID: {order.orderId || '(Pending ID)'}</h3>
                <p><strong>Status:</strong> <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></p>
                <p><strong>Sender:</strong> {order.sender.name} <br /> {order.sender.address}</p>
                <p><strong>Receiver:</strong> {order.receiver.name} <br /> {order.receiver.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
