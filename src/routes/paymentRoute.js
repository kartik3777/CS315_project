const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Routes for payments
router.post('/', paymentController.createPayment);  // Create a payment
router.get('/:booking_id', paymentController.getPaymentDetails);  // Get payment details for a booking

module.exports = router;
