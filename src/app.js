const express = require('express');
const dotenv = require('dotenv');
const vehicleRoutes = require('./routes/vehicleRoute');
const bookingRoutes = require('./routes/bookingRoute');
const paymentRoutes = require('./routes/paymentRoute');
const statusRoutes = require('./routes/statusRoute');
const methodRoutes = require('./routes/methodRoutes');

dotenv.config(); 
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') }); // 🔥 KEY LINE

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());  // Middleware for parsing JSON bodies
 
require('../db/index');

// Use route files
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/methods', methodRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
