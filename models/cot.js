const mongoose = require('mongoose')

const cot = new mongoose.Schema(
  {
    cotno: { type: Number, required: true },
    status: { type: String, default:'fresh' }
  }
)
const Cot = mongoose.models.Cot || mongoose.model('Cot', cot)
module.exports = Cot