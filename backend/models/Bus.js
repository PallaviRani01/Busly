const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  currentRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  isActive: { type: Boolean, default: false },
  lastKnownLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  }
});

module.exports = mongoose.model('Bus', busSchema);
