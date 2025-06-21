import React from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import Carousel from 'react-bootstrap/Carousel';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import './Home.css';

export default function Home() {
  return (
    <>
      {/* ✅ Hero Section */}
      <div className="hero-section">
        <video 
          autoPlay 
          muted 
          loop 
          className="hero-video"
          poster="/assets/images/hero-bg.JPG"
        >
          <source src="/assets/videos/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="hero-overlay" />

        <Container className="text-center hero-content">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Welcome to FastLogix
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Your trusted logistics and delivery partner.
          </motion.p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <Button variant="primary" size="lg" href="/track">
              Track Your Order
            </Button>
          </motion.div>
        </Container>
      </div>

      {/* ✅ Services Carousel */}
      <Container className="my-5">
        <motion.h2 
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Our Services
        </motion.h2>

        <Carousel fade>
          <Carousel.Item>
            <img
              className="d-block w-100 carousel-img"
              src="/assets/images/slide1.jpg"
              alt="First slide"
            />
            <Carousel.Caption>
              <h3>Air Freight</h3>
              <p>Experience lightning-fast, global delivery with priority handling, chartered flights, and real-time shipment tracking—perfect for urgent, high-value cargo..</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 carousel-img"
              src="/assets/images/slide2.jpg"
              alt="Second slide"
            />
            <Carousel.Caption>
              <h3>Land Transport</h3>
              <p>Benefit from end-to-end road solutions, GPS-monitored trucks, express LTL/FTL services, and flexible scheduling across regions..</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 carousel-img"
              src="/assets/images/slide3.jpg"
              alt="Third slide"
            />
            <Carousel.Caption>
              <h3>Secure Warehousing</h3>
              <p>Secure, climate-controlled warehousing with scalable space, 24/7 surveillance, inventory management, and easy pick-up/drop-off coordination.</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 carousel-img"
              src="/assets/images/slide4.jpg"
              alt="Fourth slide"
            />
            <Carousel.Caption>
              <h3>Ocean Freight</h3>
              <p>Rely on cost-efficient, scheduled sailings, full-container and less-than-container options, and robust route planning for seamless international trade.

</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </Container>

      {/* ✅ About Us */}
      <Container className="my-5">
        <Row className="align-items-center">
          <Col md={6}>
            <motion.img
              src="/assets/images/about-us.jpeg"
              alt="About Us"
              className="img-fluid rounded shadow"
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            />
          </Col>
          <Col md={6}>
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <h2>About Us</h2>
              <p>
                FastLogix is dedicated to providing top-notch logistics solutions
                with a focus on speed, safety, and customer satisfaction.
                Our team works around the clock to ensure your packages reach their destinations on time.
              </p>
            </motion.div>
          </Col>
        </Row>
      </Container>

      {/* ✅ Fun Facts / Counters */}
<Container className="my-5 text-center">
  <Row>
    {[
      { label: "Skilled Experts", end: 250 },
      { label: "Happy Clients", end: 3600 },
      { label: "Projects Completed", end: 12000 },
    ].map((stat, idx) => (
      <Col md={4} key={idx}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: idx * 0.3 }}
          className="mb-4"
        >
          <h2 style={{ fontSize: "48px", fontWeight: "bold", color: "#007bff" }}>
            <CountUp end={stat.end} duration={2} />
          </h2>
          <p>{stat.label}</p>
        </motion.div>
      </Col>
    ))}
  </Row>
</Container>


      {/* ✅ Why Choose Us */}
      <Container className="my-5 text-center">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Why Choose Us
        </motion.h2>
        <Row className="mt-4">
          {['Reliable', 'Affordable', '24/7 Support', 'Real-Time Tracking'].map((reason, idx) => (
            <Col md={3} key={idx}>
              <motion.div
                className="p-3 border rounded shadow-sm mb-3"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <h5>{reason}</h5>
                <p>We deliver on our promise of {reason.toLowerCase()} service every time.</p>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* ✅ Delivery Team */}
<Container className="my-5 text-center">
  <motion.h2
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    Meet Our Delivery Team
  </motion.h2>
  <Row className="mt-4">
    {[
      {
        name: "Richard Moore",
        role: "CEO and Founder",
        description: "Richard has 28 years of experience ensuring timely and soomth logistics.",
        image: "/assets/images/team1.jpg"
      },
      {
        name: "Emily Smith",
        role: "Express Courier",
        description: "Emily specializes in fast urban deliveries with utmost care.",
        image: "/assets/images/team2.jpg"
      },
      {
        name: "Ahmed Sabbir",
        role: "Logistics Coordinator",
        description: "Ahmed oversees delivery routes and ensures smooth operations.",
        image: "/assets/images/team3.jpg"
      }
    ].map((member, idx) => (
      <Col md={4} key={idx}>
        <motion.img
          src={member.image}
          alt={member.name}
          className="img-fluid rounded-circle mb-3 team-img"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{ width: "150px", height: "150px", objectFit: "cover" }}
        />
        <h5>{member.name}</h5>
        <p className="text-muted">{member.role}</p>
        <p>{member.description}</p>
      </Col>
    ))}
  </Row>
</Container>

      

      {/* ✅ Client Testimonials */}
<Container className="my-5 text-center">
  <motion.h2
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    What Our Clients Say
  </motion.h2>
  <Row className="mt-4">
    {[
      {
        quote: "FastLogix seamless air freight service rescued our urgent campaign launch. Their precision and speed are unmatched!",
        author: "Marcus Nguyen",
        image: "/assets/images/client1.jpg"
      },
      {
        quote: "Reliable, cost-effective and always on time. FastLogix has been our trusted delivery partner for over 3 years.",
        author: "Sarah Lloyd",
        image: "/assets/images/client2.jpg"
      },
      {
        quote: "From warehouse handling to final mile delivery, FastLogix takes care of everything. Highly recommended!",
        author: "David Shaws",
        image: "/assets/images/client3.jpg"
      }
    ].map((testimonial, idx) => (
      <Col md={4} key={idx}>
        <motion.div
          className="p-4 border rounded shadow-sm testimonial-card"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <img
            src={testimonial.image}
            alt={testimonial.author}
            className="rounded-circle mb-3"
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
          <p>"{testimonial.quote}"</p>
          <h6>- {testimonial.author}</h6>
        </motion.div>
      </Col>
    ))}
  </Row>
</Container>
    </>
  );
}
