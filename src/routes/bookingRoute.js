const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Routes for bookings
router.post('/', bookingController.createBooking);  // Create a booking
router.get('/:user_id', bookingController.getBookingsByUser);  // Get all bookings by user

module.exports = router;
 