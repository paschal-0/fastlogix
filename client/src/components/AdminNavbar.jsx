// client/src/components/AdminNavbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const AdminNavbar = () => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
    <div className="container-fluid">
      <Link className="navbar-brand" to="/admin/dashboard">Admin Panel</Link>
      <button 
        className="navbar-toggler" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target="#adminNavbarNav" 
        aria-controls="adminNavbarNav" 
        aria-expanded="false" 
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      
      <div className="collapse navbar-collapse" id="adminNavbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/admin/dashboard">Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/admin/chats">Chats</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/admin/login">Login</Link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
);

export default AdminNavbar;
