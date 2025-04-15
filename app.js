const express = require('express');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Route imports
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));

app.get('/', (req, res) => res.send('Vehicle Rental API running'));
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
