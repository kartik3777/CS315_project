const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

// Routes for statuses
router.get('/', statusController.getStatuses);  // Get all statuses
router.get('/:status_id', statusController.getStatusById);  // Get status by ID

module.exports = router;
