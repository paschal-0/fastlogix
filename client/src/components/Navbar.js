import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function AppNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand 
          as={Link} 
          to="/"
          className="d-flex align-items-center"
        >
          {/* ✅ Circular logo frame */}
          <img 
            src="/assets/images/logo.jpg" 
            alt="FastLogix Logo" 
            style={{ 
              width: '40px', 
              height: '40px', 
              marginRight: '10px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '2px solid white'

            }}
          />
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            FastLogix
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/track">Track Order</Nav.Link>
            <Nav.Link as={Link} to="/chat">Chat</Nav.Link>
            <Nav.Link as={Link} to="/admin/login">Admin</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
