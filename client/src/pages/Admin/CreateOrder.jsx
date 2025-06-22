// client/src/pages/Admin/CreateOrder.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Card, Form, Button, Spinner, Container, Row, Col } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';

const CreateOrder = () => {
  const [formData, setFormData] = useState({
    sender: { name: '', email: '', address: '' },
    receiver: { name: '', email: '', address: '' },
    packageDetails: { description: '', weight: '', value: '' },
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('https://fastlogix-backend.onrender.com/api/orders', formData);
      toast.success('✅ Order created successfully!');

      setFormData({
        sender: { name: '', email: '', address: '' },
        receiver: { name: '', email: '', address: '' },
        packageDetails: { description: '', weight: '', value: '' },
      });
    } catch (error) {
      console.error(error);
      toast.error('❌ Failed to create order. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <ToastContainer position="top-right" autoClose={3000} />
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg">
            <Card.Header as="h4" className="bg-primary text-white">
              📦 Create New Order
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
                        required
                        placeholder="Sender's Name"
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
                        required
                        placeholder="Sender's Email"
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
                    required
                    placeholder="Sender's Address"
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
                        required
                        placeholder="Receiver's Name"
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
                        required
                        placeholder="Receiver's Email"
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
                    required
                    placeholder="Receiver's Address"
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
                    required
                    placeholder="Description of the package"
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
                        required
                        placeholder="e.g. 2.5"
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
                        required
                        placeholder="e.g. 100"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{' '}
                      Creating...
                    </>
                  ) : (
                    'Create Order'
                  )}
                </Button>

              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateOrder;
