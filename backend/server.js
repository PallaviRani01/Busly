const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Load Punjab Roadways Synthetic Data (In-Memory Database for SIH Hackathon)
const punjabRoutes = require('./seeders/punjab_roadways.json');

// Basic Socket.IO Setup
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Driver joining to stream location
  socket.on('driver-join', (busId) => {
    socket.join(`bus-${busId}`);
    console.log(`Driver for bus ${busId} joined.`);
  });

  // Client joining to listen to a specific bus
  socket.on('client-join', (busId) => {
    socket.join(`bus-${busId}`);
    console.log(`Client joined bus tracking for ${busId}.`);
  });

  // Driver sending location update
  socket.on('location-update', (data) => {
    // Broadcast to everyone tracking this bus
    io.to(`bus-${data.busId}`).emit('bus-location', data);
    // Broadcast to admins!
    io.to('admin-dashboard').emit('bus-location', data);
  });

  // SOS tracking
  socket.on('sos-alert', (data) => {
    io.to('admin-dashboard').emit('emergency-alert', data);
    console.log('SOS Triggered:', data);
  });

  // Admin joining
  socket.on('admin-join', () => {
    socket.join('admin-dashboard');
    console.log('Admin dashboard connected.');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Basic Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Busly tracking server is live.' });
});

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 🚦 Smart Route & Travel Assistance Module
app.get('/api/journey', (req, res) => {
  const { source, destination } = req.query;
  if (!source || !destination) {
    return res.status(400).json({ error: 'Source and destination required.' });
  }

  // Iterate over Punjab Roadways graph to find direct route
  let foundRoute = null;
  let allStops = [];
  
  for (let r of punjabRoutes) {
    const sIndex = r.stops.findIndex(s => s.stopName.toLowerCase().includes(source.toLowerCase()));
    const dIndex = r.stops.findIndex(s => s.stopName.toLowerCase().includes(destination.toLowerCase()));
    
    if (sIndex !== -1 && dIndex !== -1 && sIndex < dIndex) {
      foundRoute = r;
      allStops = r.stops.slice(sIndex, dIndex + 1);
      break;
    }
  }

  if (foundRoute) {
    const startNode = allStops[0];
    const endNode = allStops[allStops.length - 1];
    const distance = calculateDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng);
    const etaMinutes = Math.round((distance / 40) * 60); // Avg speed 40km/h
    
    return res.json({
      success: true,
      routeId: foundRoute.name,
      origin: startNode.stopName,
      destination: endNode.stopName,
      stops: allStops,
      totalDistanceKm: distance.toFixed(1),
      estimatedTimeMinutes: etaMinutes
    });
  } else {
    return res.json({
      success: false,
      message: "No direct buses currently scheduled matching this criteria. Interchanges required."
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
