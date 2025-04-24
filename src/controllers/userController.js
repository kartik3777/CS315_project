const pool = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendOTPEmail = require("../utils/sendEmail");
const otpStore = require("../utils/otpStore");

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}; 

const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM userdetails WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Start a transaction
    await pool.query('BEGIN');

    // Insert into userdetails (name, email, role)
    const userResult = await pool.query(
      'INSERT INTO userdetails (name, email, role) VALUES ($1, $2, $3) RETURNING *',
      [name, email, role || 'customer']
    );

    const userId = userResult.rows[0].user_id;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into usercredentials (user_id, password)
    await pool.query(
      'INSERT INTO usercredentials (user_id, password) VALUES ($1, $2)',
      [userId, hashedPassword]
    );
    await pool.query(
      'INSERT INTO wallet (user_id, amount) VALUES ($1, $2)',
      [userId, 0]
    )

    // Commit transaction
    await pool.query('COMMIT');

    // Generate JWT token
    const token = generateToken({
      user_id: userId,
      email,
      role: role || 'customer'
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: userId,
        name,
        email,
        role: role || 'customer'
      },
      token
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Register Error:', err);
    res.status(500).send('Server error');
  }
};
 

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Step 1: Get user details by email
    const userDetailsRes = await pool.query(
      'SELECT * FROM userdetails WHERE email = $1',
      [email]
    );

    if (userDetailsRes.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDetails = userDetailsRes.rows[0];

    // Step 2: Get password hash from usercredentials using the user's user_id
    const credentialsRes = await pool.query(
      'SELECT password FROM usercredentials WHERE user_id = $1',
      [userDetails.user_id]
    );

    if (credentialsRes.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hashedPassword = credentialsRes.rows[0].password;

    // Step 3: Compare password
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Step 4: Generate token
    const token = generateToken(userDetails); // Include fields needed for token

    // Step 5: Respond
    res.json({
      message: 'Login successful',
      user: {
        user_id: userDetails.user_id,
        name: userDetails.name, 
        email: userDetails.email,
        role: userDetails.role
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }  
};


// Get logged-in user's profile
const getUserProfile = async (req, res) => {
  const { user_id } = req.user;

  try {
    const result = await pool.query('SELECT user_id, name, email, role FROM users WHERE user_id = $1', [user_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM userdetails ');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const getUser = async (req, res) => {
  const userId = req.params.id;
  try {
    // Fetch user name and email
    const user = await pool.query('SELECT name, email FROM userdetails WHERE user_id = $1', [userId]);

    if (user.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch vehicle rental history
    const vehiclesHistory = await pool.query(`
      SELECT 
        v.*, 
        b.start_date, 
        b.end_date, 
        ARRAY_AGG(i.encoded_image) AS encoded_images,
        u.name AS owner_name,
        u.email AS owner_email
      FROM 
        bookings b
      JOIN 
        vehicles v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN 
        images i ON v.vehicle_id = i.vehicle_id
      JOIN 
        userdetails u ON v.owner_id = u.user_id
      WHERE 
        b.user_id = $1
      GROUP BY 
        v.vehicle_id, b.start_date, b.end_date, u.name, u.email
    `, [userId]);

    const currentDate = new Date();
    const currentlyRentedVehicles = [];
    const vehiclesRentedHistory = [];

    vehiclesHistory.rows.forEach(vehicle => {
      const isCurrentlyRented = vehicle.availability === false ;

      const vehicleDetails = {
        ...vehicle,
        start_date: vehicle.start_date,
        end_date: vehicle.end_date,
        currently_rented: isCurrentlyRented,
        owner_name: vehicle.owner_name,
        owner_email: vehicle.owner_email,
        images: vehicle.encoded_images
      };

      delete vehicleDetails.encoded_images;

      const vehicleObj = { vehicleDetails };

      if (isCurrentlyRented) {
        currentlyRentedVehicles.push(vehicleObj);
      } else {
        vehiclesRentedHistory.push(vehicleObj);
      }
    });

    const response = {
      user: {
        name: user.rows[0].name,
        email: user.rows[0].email,
      },
      currentlyRentedVehicles,
      vehiclesRentedHistory
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};




const getOwnerDetials = async (req,res) => {
  const ownerId = req.params.id;
  try {
    const result = await pool.query('SELECT name, email FROM userdetails WHERE user_id = $1', [ownerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  getUser,
  getOwnerDetials
};
