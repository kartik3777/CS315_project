const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Routes for payments
router.get('/transHistory/:user_id',paymentController.getTransactionHistory); // Get transaction history
router.post('/addmoney', paymentController.addMoney);  // Add money to wallet
router.post('/', paymentController.createPayment);  // Create a payment
router.get('/:booking_id', paymentController.getPaymentDetails);  // Get payment details for a booking
router.get('/wallet/:user_id',paymentController.getWallet);  // Get wallet details
router.get('/ownervehicle/:user_id',paymentController.getAllVehiclesByOwner);  // Get all vehicles by owner
module.exports = router;
