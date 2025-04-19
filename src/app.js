const express = require('express');
const dotenv = require('dotenv');
const vehicleRoutes = require('./routes/vehicleRoute');
const bookingRoutes = require('./routes/bookingRoute');
const paymentRoutes = require('./routes/paymentRoute');
const statusRoutes = require('./routes/statusRoute');
const methodRoutes = require('./routes/methodRoutes');
const userRoute = require('./routes/userRoute');
const authRoutes = require('./routes/authRoute');
const cors = require("cors");

dotenv.config(); 
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') }); // 🔥 KEY LINE

const app = express();
app.use(cors(
  {
      origin :['http://localhost:3000'],
      methods:["GET", "POST", "PATCH", "DELETE"],
      credentials: true
  }
))

const PORT = process.env.PORT || 5000;

app.use(express.json());  // Middleware for parsing JSON bodies
 
require('../db/index');

// Use route files
app.get("/", (req, res) => { 
  res.send({
    "status": "OK"
  })
});
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/methods', methodRoutes);
app.use('/api/users', userRoute);
app.use('/api/auth', authRoutes);
 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
