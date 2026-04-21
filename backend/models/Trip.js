const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  driverId: { type: String }, // Can be tied to a User model if driver auth is implemented
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
});

module.exports = mongoose.model('Trip', tripSchema);
