const express = require('express');
const router = express.Router();
const methodController = require('../controllers/methodController');

// Routes for methods
router.get('/', methodController.getPaymentMethods);  // Get all payment methods
router.get('/:method_id', methodController.getPaymentMethodById);  // Get method by ID

module.exports = router;
