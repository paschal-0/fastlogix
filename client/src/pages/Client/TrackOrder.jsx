import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Alert, Card, Spinner, Row, Col, ListGroup } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './TrackOrder.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!orderId) {
      setError('Please enter an Order ID.');
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`https://fastlogix-backend.onrender.com/api/orders/track/${orderId}`);
      setResult(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Order not found or server error.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">Track Your Order</h1>
      <Form className="text-center mb-4">
        <Form.Control
          type="text"
          placeholder="Enter Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="mb-3"
        />
        <Button variant="primary" onClick={handleTrack} disabled={loading}>
          {loading ? <><Spinner animation="border" size="sm" /> Tracking...</> : 'Track Order'}
        </Button>
      </Form>

      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      {result && (
        <Card className="mt-4">
          <Card.Body>
            <h2 className="mb-3">Tracking Details</h2>
            <p><strong>Order ID:</strong> {result.orderId}</p>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Current Location:</strong> {result.location?.address || 'N/A'}</p>

            <Row className="mt-4">
              <Col md={6}>
                <h5>📦 Package Details</h5>
                {result.packageDetails ? (
                  <ListGroup variant="flush">
                    {Object.entries(result.packageDetails).map(([key, value]) => (
                      <ListGroup.Item key={key}><strong>{key}:</strong> {value}</ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p>No package details available.</p>
                )}
              </Col>
              <Col md={6}>
                <h5>👤 Sender Info</h5>
                <p><strong>Name:</strong> {result.sender?.name}</p>
                <p><strong>Email:</strong> {result.sender?.email}</p>
                <p><strong>Address:</strong> {result.sender?.address}</p>
                <h5 className="mt-4">📍 Receiver Info</h5>
                <p><strong>Name:</strong> {result.receiver?.name}</p>
                <p><strong>Email:</strong> {result.receiver?.email}</p>
                <p><strong>Address:</strong> {result.receiver?.address}</p>
              </Col>
            </Row>

            {(result.history?.length > 0) ? (
              <>
                <h5 className="mt-4">📍 Package Journey</h5>
                <MapContainer
                  center={[
                    result.location.coordinates[1],
                    result.location.coordinates[0]
                  ]}
                  zoom={3}
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {result.history.map((loc, i) => (
                    <Marker key={i} position={[loc.coordinates[1], loc.coordinates[0]]}>
                      <Popup>
                        {loc.address}<br />
                        {new Date(loc.timestamp).toLocaleString()}
                      </Popup>
                    </Marker>
                  ))}
                  <Marker position={[
                    result.location.coordinates[1],
                    result.location.coordinates[0]
                  ]}>
                    <Popup><strong>Current:</strong> {result.location.address}</Popup>
                  </Marker>
                  <Polyline
                    positions={[
                      ...result.history.map(loc => [loc.coordinates[1], loc.coordinates[0]]),
                      [result.location.coordinates[1], result.location.coordinates[0]]
                    ]}
                    pathOptions={{ color: 'red', weight: 3 }}
                  />
                </MapContainer>

                <div className="mt-4">
                  <h5>📢 Movement History</h5>
                  <ul>
                    {result.history.map((loc, idx) => (
                      <li key={idx}>
                        {idx === 0 ? `Package departed from` : `Then arrived at`} {loc.address}
                        {' '}({new Date(loc.timestamp).toLocaleString()})
                      </li>
                    ))}
                    <li><strong>Currently:</strong> {result.location.address}</li>
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-muted mt-3">No location history available.</p>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TrackOrder;
