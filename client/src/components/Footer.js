import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebookF, FaXTwitter, FaInstagram, FaEnvelope } from 'react-icons/fa6'; // ✅ use react-icons

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-5">
      <Container>
        <Row className="mb-4">
          <Col md={4} className="mb-3 mb-md-0">
            <h5>FastLogix</h5>
            <p>Reliable and efficient logistics solutions for businesses and individuals worldwide.</p>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-light text-decoration-none">Home</a></li>
              <li><a href="/track" className="text-light text-decoration-none">Track Order</a></li>
              <li><a href="/chat" className="text-light text-decoration-none">Chat</a></li>
              <li><a href="/admin/login" className="text-light text-decoration-none">Admin</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Contact Us</h5>
            <p>Email: info@fastlogix.com</p>
            <p>Phone: +123 456 7890</p>
            <div className="d-flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-light fs-4">
                <FaFacebookF />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-light fs-4">
                <FaXTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-light fs-4">
                <FaInstagram />
              </a>
              <a href="mailto:info@fastlogix.com" className="text-light fs-4">
                <FaEnvelope />
              </a>
            </div>
          </Col>
        </Row>
        <hr className="border-light" />
        <p className="text-center mb-0">
          &copy; {new Date().getFullYear()} FastLogix. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
