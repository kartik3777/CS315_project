const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

// Routes for vehicles
router.get('/available', vehicleController.getAvailableVehicles);
router.post('/', vehicleController.addVehicle); //post request
router.get('/', vehicleController.getAllVehicles); //get request
router.get('/:id', vehicleController.getVehicleById);
router.delete('/:id', vehicleController.deleteVehicle); //delete request

module.exports = router;
 
