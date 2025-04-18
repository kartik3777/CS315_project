const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected Route****************************************************
router.get('/profile', authMiddleware, userController.getUserProfile);

module.exports = router;
