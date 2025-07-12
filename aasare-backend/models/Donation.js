const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  orphanage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  itemType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  neededBy: {
    type: Date,
    required: true
  },
  fulfilled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', donationSchema);
