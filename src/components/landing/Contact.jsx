import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/contact.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending message
    alert('Message sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section id="contact" className="contact-section">
      <div className="contact-container">
        
        {/* Left Side: Info & Partner Callout */}
        <div className="contact-info">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="contact-title">Get in Touch</h2>
            <p className="contact-subtitle">
              Have questions about EZPARK? Our team is ready to help you with your parking needs or answer any inquiries you might have.
            </p>
            
            <div className="contact-partner-box">
              <h3 className="contact-partner-title">Want to list your parking facility on EZPark?</h3>
              <p className="contact-partner-desc">
                Partner with us to increase your facility's visibility, manage inventory in real-time, and boost your revenue with our smart parking management system.
              </p>
              <button className="btn-primary" onClick={() => alert('Partnership inquiry initiated!')}>
                Become a Partner
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Contact Form */}
        <motion.form 
          className="contact-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="contact-input-group">
            <label className="contact-label" htmlFor="name">Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              className="contact-input" 
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="contact-input-group">
            <label className="contact-label" htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className="contact-input" 
              placeholder="Your email address"
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="contact-input-group">
            <label className="contact-label" htmlFor="subject">Subject</label>
            <input 
              type="text" 
              id="subject" 
              name="subject" 
              className="contact-input" 
              placeholder="How can we help?"
              value={formData.subject}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="contact-input-group">
            <label className="contact-label" htmlFor="message">Message</label>
            <textarea 
              id="message" 
              name="message" 
              className="contact-textarea" 
              placeholder="Write your message here..."
              value={formData.message}
              onChange={handleChange}
              required 
            ></textarea>
          </div>

          <button type="submit" className="contact-submit">
            Send Message
          </button>
        </motion.form>

      </div>
    </section>
  );
}
