const pool = require('../../db');

// Controller to fetch available vehicles
const getAvailableVehicles = async (req, res) => {
  try {
    const query = `
      SELECT 
        v.*,
        COALESCE(
          json_agg(
            json_build_object(
              'vehicle_id', i.vehicle_id,
              'encoded_image', i.encoded_image
            )
          ) FILTER (WHERE i.vehicle_id IS NOT NULL),
          '[]'
        ) AS images
      FROM vehicles v
      LEFT JOIN images i ON v.vehicle_id = i.vehicle_id
      GROUP BY v.vehicle_id
      HAVING v.avaliablity = true
    `;
    
    const result = await pool.query(query);
    
    // If you want to convert the images to base64 for easier client-side handling
    const vehiclesWithImages = result.rows.map(vehicle => {
      if (vehicle.images && vehicle.images.length > 0) {
        vehicle.images = vehicle.images.map(img => ({
          ...img,
          encoded_image: img.encoded_image.toString('base64')
        }));
      }
      return vehicle; 
    });

    res.status(200).json(vehiclesWithImages);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller to add a vehicle
const addVehicle = async (req, res) => {

  const {owner_id, model,type, registration_number, price_per_day, manufacturing_date} = req.body;
  const files = req.files;

  // Basic Validation
  if (!owner_id || !model || !price_per_day  || !registration_number || !type || !manufacturing_date) {
    return res.status(400).json({ error: 'Missing required vehicle details' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'At least one image is required' });
  }

  if (files.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 images allowed' });
  }
 
  try { 
    await pool.query('BEGIN'); 

    // Insert vehicle
    const vehicleResult = await pool.query( 
      'INSERT INTO vehicles (owner_id, model, price_per_day, availability, type, registration_number,status, manufacturing_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING vehicle_id',
      [owner_id,model, price_per_day, true, type, registration_number, 'available', manufacturing_date]
    ); 
    console.log(vehicleResult)

    // Insert associated images
    const imageQuery = 'INSERT INTO images (vehicle_id, encoded_image) VALUES ($1, $2)';
    for (const file of files) {
      await pool.query(imageQuery, [vehicleResult.rows[0].vehicle_id, file.buffer]);
    }
    await pool.query('COMMIT');
 
    res.json({
      success: true,
      message: `Vehicle added and ${files.length} image(s) uploaded successfully`
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error adding vehicle:', err);
    res.status(500).json({ error: 'Failed to add vehicle', details: err.message });
  }
}; 


const getAllVehicles = async (req, res) => {
  try {
    const query = `
  SELECT   
    v.*, 
    ud.name AS owner_name,
    ud.email AS owner_email,
    COALESCE(
      json_agg(
        json_build_object(
          'vehicle_id', i.vehicle_id,
          'encoded_image', i.encoded_image
        ) 
      ) FILTER (WHERE i.vehicle_id IS NOT NULL),
      '[]'
    ) AS images
  FROM vehicles v
  LEFT JOIN images i ON v.vehicle_id = i.vehicle_id
  LEFT JOIN userDetails ud ON v.owner_id = ud.user_id
  GROUP BY v.vehicle_id, ud.name, ud.email
`;

    
    const result = await pool.query(query);

    const vehiclesWithImages = result.rows.map(vehicle => {
      if (vehicle.images && vehicle.images.length > 0) {
        vehicle.images = vehicle.images.map(img => ({
          ...img,
          encoded_image: Buffer.from(img.encoded_image).toString('base64')
        }));
      }
      return vehicle;
    });

    res.status(200).json(vehiclesWithImages);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const getVehicleById = async (req, res) => {
  const vehicleId = req.params.id;

  try {
    // Fetch vehicle details with owner info
    const vehicleResult = await pool.query(`
      SELECT v.*, u.name AS owner_name, u.email AS owner_email
      FROM vehicles v
      JOIN userdetails u ON v.owner_id = u.user_id
      WHERE v.vehicle_id = $1
    `, [vehicleId]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const vehicle = vehicleResult.rows[0];

    // Fetch booking history with renter info
    const bookingsResult = await pool.query(`
      SELECT b.start_date, b.end_date, u.name AS user_name, u.email AS user_email
      FROM bookings b
      JOIN userdetails u ON b.user_id = u.user_id
      WHERE b.vehicle_id = $1
      ORDER BY b.start_date ASC
    `, [vehicleId]);

    res.status(200).json({
      vehicleDetails: {
        ...vehicle,
        owner: {
          name: vehicle.owner_name,
          email: vehicle.owner_email
        }
      },
      bookings: bookingsResult.rows.map(booking => ({
        start_date: booking.start_date,
        end_date: booking.end_date,
        user: {
          name: booking.user_name,
          email: booking.user_email
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching vehicle by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const deleteVehicle = async (req, res) => {
  const vehicleId = req.params.id;

  try {
    pool.query('BEGIN');
    await pool.query('DELETE FROM images WHERE vehicle_id = $1',[vehicleId]);
    const result = await pool.query('DELETE FROM vehicles WHERE vehicle_id = $1 RETURNING *', [vehicleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    await pool.query('COMMIT');
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAvailableVehicles,
  addVehicle,
  getAllVehicles,
  getVehicleById,
  deleteVehicle
};
