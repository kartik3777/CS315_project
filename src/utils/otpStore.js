// utils/otpStore.js
const otpStore = new Map(); // key: email, value: { otp, userData, expiry }

module.exports = otpStore;