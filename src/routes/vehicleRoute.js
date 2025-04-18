const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

// Routes for vehicles
router.get('/available', vehicleController.getAvailableVehicles);
router.post('/', vehicleController.addVehicle);
// router.get('/:id', vehicleController.getVehicleById);

module.exports = router;
 
