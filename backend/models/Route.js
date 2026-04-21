const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Route 1A"
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  stops: [{
    stopName: String,
    lat: Number,
    lng: Number,
    sequenceOrder: Number
  }]
});

module.exports = mongoose.model('Route', routeSchema);
