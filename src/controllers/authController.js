const nodemailer = require('nodemailer');

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Your OTP for Email Verification',
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    });

    res.status(200).json({ message: 'OTP sent successfully.', otp });

  } catch (error) {
    console.error('OTP Email Error:', error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};
