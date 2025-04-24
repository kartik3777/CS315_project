const pool = require('../../db');
const { get } = require('../utils/otpStore');

// Create a payment
const createPayment = async (req, res) => {
  const { action, vehicle_id, start_date, end_date, user_id } = req.body;
  const currentDate = new Date();
  
  try {
    const vehicleResult = await pool.query('SELECT * FROM vehicles WHERE vehicle_id = $1', [vehicle_id]);
    const vehicle = vehicleResult.rows[0];
    const ownerID = vehicle.owner_id;

    const days = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24);
    const amount = vehicle.price_per_day * days;

    if(days<0){
      return res.status(400).json({ error: 'Invalid date range.' });
    }

    if (action === "buy") {
      const currentBalance = await pool.query('SELECT amount FROM wallet WHERE user_id = $1', [user_id]);
      if (currentBalance.rows[0].amount < amount) {
        return res.status(400).json({ error: 'Insufficient balance.' });
      }

      await pool.query(`
        UPDATE wallet SET amount = amount - $1 WHERE user_id = $2;
      `, [amount, user_id]);

      await pool.query(`
        UPDATE wallet SET amount = amount + $1 WHERE user_id = $2;
      `, [amount, ownerID]);

      const transaction = await pool.query(`
        INSERT INTO transactions (from_user, to_user, amount, status, type)
        VALUES ($1, $2, $3, 'success', 'booking') RETURNING *;
      `, [user_id, ownerID, amount]);

      const transactionID = transaction.rows[0].transaction_id;

      const booking = await pool.query(`
        INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, transaction_id)
        VALUES ($1, $2, $3, $4, $5) RETURNING *;
      `, [user_id, vehicle_id, start_date, end_date, transactionID]);

      await pool.query(`
        UPDATE vehicles SET status = $1, availability = $2 WHERE vehicle_id = $3;
      `, ['RENTED', false, vehicle_id]);

      return res.status(200).json({
        message: 'Transaction successful',
        booking: booking.rows[0],
        transaction: transaction.rows[0]
      });
    }

    if (action === 'return') {
      const updatedEndDate = new Date(end_date);
      const penaltyDays = (currentDate - updatedEndDate) / (1000 * 60 * 60 * 24);

      if (penaltyDays > 0) {
        const penalty = 1.25 * amount * penaltyDays;

        await pool.query(`
          UPDATE wallet SET amount = amount - $1 WHERE user_id = $2;
        `, [penalty, user_id]);

        await pool.query(`
          UPDATE wallet SET amount = amount + $1 WHERE user_id = $2;
        `, [penalty, ownerID]);

        const transaction = await pool.query(`
          INSERT INTO transactions (from_user, to_user, amount, status, type)
          VALUES ($1, $2, $3, 'success', 'penalty') RETURNING *;
        `, [user_id, ownerID, penalty]);
      }

      await pool.query(`
        UPDATE bookings SET end_date = $1 WHERE user_id = $2 AND vehicle_id = $3 AND start_date = $4;
      `, [currentDate, user_id, vehicle_id, start_date]);

      await pool.query(`
        UPDATE vehicles SET status = $1, availability = $2 WHERE vehicle_id = $3;
      `, ['available', true, vehicle_id]);

      return res.status(200).json({ message: 'Vehicle returned successfully' });
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


// Get payment details for a booking
const getPaymentDetails = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.payment_id, p.amount, m.method_name, s.status_name, p.payment_time
      FROM payments p
      JOIN methods m ON p.method_id = m.method_id
      JOIN statuses s ON p.status_id = s.status_id
      WHERE p.booking_id = $1
    `, [booking_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Payment not found for this booking.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const getAllVehiclesByOwner = async (req, res) => {
  const { user_id } = req.params;
  try {
    const vehicles = await pool.query(`
      SELECT v.*, u.name AS owner_name, u.email AS owner_email
      FROM vehicles v
      JOIN userdetails u ON v.owner_id = u.user_id
      WHERE v.owner_id = $1
    `, [user_id]);
    if (vehicles.rowCount === 0) {
      return res.status(404).json({ error: 'No vehicles found for this owner.' });
    }
    res.status(200).json({
      status: "success",
      message: "Vehicles fetched successfully", 
      data: vehicles.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addMoney = async (req, res) => {
  const { user_id, amount } = req.body;

  try {
    // Check if the user exists
    const user = await pool.query('SELECT * FROM userdetails WHERE user_id = $1', [user_id]);
    if (user.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Add money to the user's wallet
    const updatedWallet = await pool.query(`
      UPDATE wallet
      SET amount = amount + $1
      WHERE user_id = $2 RETURNING *;
    `, [amount, user_id]);

    const addTrasaction = await pool.query(`
      INSERT INTO transactions (from_user, to_user , amount,status, type)
      VALUES ($1, $2,$3,'success', 'topup') RETURNING *;
    `, [user_id,user_id, amount]);

    res.json(updatedWallet.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding money');
  }
}
const getTransactionHistory = async (req, res) => {
  const { user_id } = req.params;
  console.log(user_id); // fixed variable name

  try {
    const transactions = await pool.query(`
      SELECT 
        T.transaction_id, 
        T.amount, 
        T.date, 
        T.status, 
        T.type, 
        U.name AS counterparty_name,
        CASE 
          WHEN T.from_user = $1 THEN 'debit' 
          ELSE 'credit' 
        END AS direction
      FROM transactions T
      JOIN userdetails U 
        ON (T.from_user = $1 AND T.to_user = U.user_id)
        OR (T.to_user = $1 AND T.from_user = U.user_id)
      WHERE T.from_user = $1 OR T.to_user = $1
      ORDER BY T.date DESC
    `, [user_id]);

    res.status(200).json({
      status: "success",
      message: "Transaction history fetched successfully",
      data: transactions.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getWallet = async (req, res) => {
  const { user_id } = req.params;

  try {
    const wallet = await pool.query('SELECT amount FROM wallet WHERE user_id = $1', [user_id]);
    if (wallet.rowCount === 0) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    res.status(200).json(wallet.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = {
  createPayment,
  getPaymentDetails,
  addMoney,
  getTransactionHistory,
  getWallet,
  getAllVehiclesByOwner
};
