import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './TrackOrder.css';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
      const res = await axios.get(`http://localhost:5000/api/orders/track/${orderId}`);
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
          {loading ? (
            <>
              <Spinner animation="border" size="sm" /> Tracking...
            </>
          ) : (
            'Track Order'
          )}
        </Button>
      </Form>

      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      {result && (
        <Card className="mt-4">
          <Card.Body>
            <h2>Tracking Details</h2>
            <p><strong>Order ID:</strong> {result.orderId}</p>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Current Location:</strong> {result.location?.address || 'N/A'}</p>

            {result.location?.coordinates && result.location.coordinates.length === 2 ? (
              <>
                <h5>Location Map</h5>
                <MapContainer
                  center={[
                    result.location.coordinates[1], // latitude
                    result.location.coordinates[0]  // longitude
                  ]}
                  zoom={13}
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[
                    result.location.coordinates[1],
                    result.location.coordinates[0]
                  ]}>
                    <Popup>
                      {result.location.address}
                    </Popup>
                  </Marker>
                </MapContainer>
              </>
            ) : (
              <p className="text-muted">No coordinates available for this location.</p>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TrackOrder;
