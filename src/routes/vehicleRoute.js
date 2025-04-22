const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const multer = require('multer');
// configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes for vehicles
router.get('/available', vehicleController.getAllAvailableVehicles);
router.get('/currentbooked', vehicleController.getAllCurrentlyBookedVehicles);
router.post('/addVehicle', upload.array('encoded_image', 5), vehicleController.addVehicle); //post request
router.get('/', vehicleController.getAllVehicles); //get request
router.get('/:id', vehicleController.getVehicleById);
router.delete('/:id', vehicleController.deleteVehicle); //delete request

module.exports = router;
 
