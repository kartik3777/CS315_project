const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Routes for payments
router.get('/transHistory',paymentController.getTransactionHistory); // Get transaction history
router.post('/addmoney', paymentController.addMoney);  // Add money to wallet
router.post('/', paymentController.createPayment);  // Create a payment
router.get('/:booking_id', paymentController.getPaymentDetails);  // Get payment details for a booking

module.exports = router;
