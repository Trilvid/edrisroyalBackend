const mongoose = require('mongoose')

const otp = new mongoose.Schema(
  {
    otpcode: { type: Number, required: true },
    status: { type: String, default:'fresh' }
  }
)
const Otp = mongoose.models.Otp || mongoose.model('Otp', otp)
module.exports = Otp