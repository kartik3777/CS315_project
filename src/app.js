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
const multer = require('multer');
dotenv.config(); 
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') }); // 🔥 KEY LINE

const app = express();
app.use(cors(
  {
      origin :['http://localhost:3000', 'https://cs-315-frontend.vercel.app'],
      methods:["GET", "POST", "PATCH", "DELETE"],
      credentials: true
  }
))

const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });


app.use(express.json());  // Middleware for parsing JSON bodies
app.use(cors());
const pool = require('../db/index');

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


app.post('/upload-images', upload.array('encoded_image', 5), async (req, res) => {
  const vehicleId = req.body.vehicle_id;
  const files = req.files; // Array of files

  // Validation
  if (!vehicleId) {
    return res.status(400).json({ error: 'vehicle_id is required' });
  }
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'At least one image is required' });
  }

  if (files.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 images allowed' });
  }

  try {
    await pool.query('BEGIN');
    const query = 'INSERT INTO images (vehicle_id, encoded_image) VALUES ($1, $2)';
    
    // Insert all images
    for (const file of files) {
      await pool.query(query, [vehicleId, file.buffer]);
    }
    
    await pool.query('COMMIT');
    res.json({ 
      success: true,
      message: `${files.length} image(s) uploaded for vehicle ${vehicleId}` 
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Upload error:', err);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: err.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
