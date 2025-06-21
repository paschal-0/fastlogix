import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Card, Form, Button, Spinner, Container, Row, Col
} from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';

const UpdateOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ SAFER default: no undefined nested keys
  const [formData, setFormData] = useState({
    sender: { name: '', email: '', address: '' },
    receiver: { name: '', email: '', address: '' },
    packageDetails: { description: '', weight: '', value: '' },
    status: '',
    location: ''
  });

  const [manualOrderId, setManualOrderId] = useState('');

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${id}`);
        const data = res.data;

        // ✅ MERGE WITH SAFE DEFAULTS
        setFormData({
          sender: data.sender || { name: '', email: '', address: '' },
          receiver: data.receiver || { name: '', email: '', address: '' },
          packageDetails: data.packageDetails || { description: '', weight: '', value: '' },
          status: data.status || '',
          location: data.location?.address || ''
        });

      } catch (error) {
        toast.error('❌ Failed to fetch order.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleInputChange = (section, field, value) => {
    if (section === 'location') {
      setFormData(prev => ({ ...prev, location: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(`/api/orders/${id}`, {
        sender: formData.sender,
        receiver: formData.receiver,
        packageDetails: formData.packageDetails,
      });
      toast.success('✅ Order details updated.');
      setTimeout(() => {
        navigate('/admin/orders');
      }, 1000);
    } catch (error) {
      toast.error('❌ Failed to update order.');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!manualOrderId) {
      toast.error('⚠️ Please enter Order ID.');
      return;
    }
    setUpdatingStatus(true);
    try {
      await axios.patch(`/api/orders/${manualOrderId}/status`, { status: formData.status });
      toast.success('✅ Status updated!');
    } catch (error) {
      toast.error('❌ Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLocationUpdate = async () => {
    if (!manualOrderId) {
      toast.error('⚠️ Please enter Order ID.');
      return;
    }
    setUpdatingLocation(true);
    try {
      await axios.patch(`/api/orders/${manualOrderId}/location`, { location: formData.location });
      toast.success('✅ Location updated!');
    } catch (error) {
      toast.error('❌ Failed to update location.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading order details...</p>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <ToastContainer position="top-right" autoClose={3000} />
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg">
            <Card.Header as="h4" className="bg-warning text-dark">
              ✏️ Update Order Details
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>

                <h5 className="mt-3">Sender Details</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.sender.name}
                        onChange={(e) => handleInputChange('sender', 'name', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.sender.email}
                        onChange={(e) => handleInputChange('sender', 'email', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.sender.address}
                    onChange={(e) => handleInputChange('sender', 'address', e.target.value)}
                  />
                </Form.Group>

                <h5 className="mt-4">Receiver Details</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.receiver.name}
                        onChange={(e) => handleInputChange('receiver', 'name', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.receiver.email}
                        onChange={(e) => handleInputChange('receiver', 'email', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.receiver.address}
                    onChange={(e) => handleInputChange('receiver', 'address', e.target.value)}
                  />
                </Form.Group>

                <h5 className="mt-4">Package Details</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.packageDetails.description}
                    onChange={(e) => handleInputChange('packageDetails', 'description', e.target.value)}
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Weight (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.packageDetails.weight}
                        onChange={(e) => handleInputChange('packageDetails', 'weight', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Value ($)</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.packageDetails.value}
                        onChange={(e) => handleInputChange('packageDetails', 'value', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="warning" type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Order Details'}
                </Button>
              </Form>

              <hr className="my-4" />

              <h5>Update Status & Location</h5>

              <Form.Group className="mb-3">
                <Form.Label>Order ID to Update</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Order ID to update status/location"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option>Pending</option>
                      <option>In Transit</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </Form.Select>
                  </Form.Group>
                  <Button
                    variant="success"
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </Button>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', null, e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    variant="info"
                    onClick={handleLocationUpdate}
                    disabled={updatingLocation}
                  >
                    {updatingLocation ? 'Updating...' : 'Update Location'}
                  </Button>
                </Col>
              </Row>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UpdateOrder;
