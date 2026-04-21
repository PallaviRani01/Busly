const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const punjabRoutes = require('./punjab_roadways.json');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/busly';

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Wipe existing
    await Route.deleteMany({});
    await Bus.deleteMany({});

    console.log('Old models cleared. Seeding Punjab Roadways data...');
    
    for (const routeData of punjabRoutes) {
      const route = await Route.create(routeData);
      
      // Assign two buses per route in opposite directions conceptually (just random IDs)
      await Bus.create({
        busNumber: `PB01-${Math.floor(1000 + Math.random() * 9000)}`,
        capacity: 50,
        currentRoute: route._id,
        isActive: true,
        lastKnownLocation: {
          lat: route.stops[0].lat,
          lng: route.stops[0].lng,
          updatedAt: new Date()
        }
      });
    }

    console.log('Punjab Roadways Seeding completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
