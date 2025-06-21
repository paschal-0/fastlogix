// client/src/pages/Admin/AdminDashboard.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  // Example stats (later make dynamic)
  const stats = {
    total: 120,
    pending: 25,
    inTransit: 60,
    delivered: 35
  };

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>

      <div className="row my-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white mb-3">
            <div className="card-body">
              <h5 className="card-title">Total Orders</h5>
              <p className="card-text">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-dark mb-3">
            <div className="card-body">
              <h5 className="card-title">Pending</h5>
              <p className="card-text">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white mb-3">
            <div className="card-body">
              <h5 className="card-title">In Transit</h5>
              <p className="card-text">{stats.inTransit}</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white mb-3">
            <div className="card-body">
              <h5 className="card-title">Delivered</h5>
              <p className="card-text">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      <h4>Quick Actions</h4>
      <div className="btn-group">
        <Link to="/admin/create-order" className="btn btn-primary">Create Order</Link>
        <Link to="/admin/update-order/123" className="btn btn-secondary">Update Order</Link>
        <Link to="/admin/orders" className="btn btn-info">View Orders</Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
