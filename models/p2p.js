const mongoose = require('mongoose')

const p2p = new mongoose.Schema(
  {
    accountNo: { type: String, required: true, default: "agent" },
    bankName: { type: String, default: 0 },
    accountName: { type: String, required: true, default: "hello" },
    price: { type: String,  required: true, default: "2.0" }
  }
)
const P2p = mongoose.models.P2p || mongoose.model('P2p', p2p)
module.exports = P2p