/**
 * @file seed.js
 * @description Seeds MongoDB with 20 realistic demo civic reports around Ahmedabad, Kalol, SG Highway, Science City, Chandkheda, Motera, Thaltej, and Bopal.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Report = require('./models/Report');
const User = require('./models/User');

dotenv.config();

const DEMO_REPORTS = [
  // Kalol & North Ahmedabad
  {
    title: 'Deep Pothole Crater on Kalol Railway Station Road',
    description: 'Severe 10-inch deep pothole right in front of Kalol Railway Station entry gate, causing heavy traffic slowdowns.',
    category: 'pothole',
    severity: 'high',
    status: 'reported',
    location: {
      latitude: 23.2350,
      longitude: 72.4920,
      address: 'Station Road, near Kalol Railway Station, Kalol'
    },
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 19
  },
  {
    title: 'Industrial Waste Dump at Kalol GIDC',
    description: 'Illegal dumping of plastic waste and chemical containers on Kalol GIDC Phase-2 main avenue.',
    category: 'garbage',
    severity: 'high',
    status: 'under_review',
    location: {
      latitude: 23.2510,
      longitude: 72.5100,
      address: 'Phase-2 Main Avenue, Kalol GIDC, Kalol'
    },
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 14
  },
  {
    title: 'Dark Streetlights Outage near Kalol Toll Plaza',
    description: 'A row of 8 highway streetlights non-functional near Kalol Highway entrance, causing unsafe driving conditions.',
    category: 'streetlight',
    severity: 'medium',
    status: 'assigned',
    location: {
      latitude: 23.2384,
      longitude: 72.4947,
      address: 'Kalol Highway near Toll Plaza, Kalol'
    },
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 11
  },

  // Vaishnodevi, SG Highway & Chandkheda
  {
    title: 'Major Pothole Hazard at Vaishnodevi Circle',
    description: 'Dangerous crater on the fast lane near Vaishnodevi Circle flyover ramp, creating severe accident risk.',
    category: 'pothole',
    severity: 'high',
    status: 'reported',
    location: {
      latitude: 23.1264,
      longitude: 72.5441,
      address: 'Vaishnodevi Circle, SG Highway, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 27
  },
  {
    title: 'Overflowing Municipal Bin at Chandkheda IOC Road',
    description: 'Commercial dumpster overflowing onto pedestrian walkway near IOC petrol pump, Chandkheda.',
    category: 'garbage',
    severity: 'medium',
    status: 'resolved',
    location: {
      latitude: 23.1120,
      longitude: 72.5890,
      address: 'IOC Road, Chandkheda, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 8
  },
  {
    title: 'Streetlights Failure near Motera Stadium Road',
    description: 'Entire stretch of streetlights off on Motera Stadium main avenue towards Narendra Modi Stadium.',
    category: 'streetlight',
    severity: 'high',
    status: 'in_progress',
    location: {
      latitude: 23.0910,
      longitude: 72.5970,
      address: 'Stadium Avenue, Motera, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 32
  },

  // Science City, Gota & Sola
  {
    title: 'Water Main Pipe Rupture at Science City Road',
    description: 'High-pressure clean water supply pipeline burst near Science City Circle, spilling clean water over 200m road.',
    category: 'water_leak',
    severity: 'high',
    status: 'in_progress',
    location: {
      latitude: 23.0780,
      longitude: 72.5050,
      address: 'Science City Entrance Road, Sola, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 45
  },
  {
    title: 'Dark Underpass Corridor at Gota Flyover',
    description: 'Underpass lighting dead under Gota flyover bridge on SG Highway. Extremely dark for commuters.',
    category: 'streetlight',
    severity: 'high',
    status: 'assigned',
    location: {
      latitude: 23.0970,
      longitude: 72.5330,
      address: 'Gota Flyover Underpass, SG Highway, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 16
  },
  {
    title: 'Open Storm Drain Hole near Hebatpur Road',
    description: 'Stormwater drain concrete cover slab broken in half near Hebatpur cross roads.',
    category: 'other',
    severity: 'high',
    status: 'reported',
    location: {
      latitude: 23.0610,
      longitude: 72.5120,
      address: 'Hebatpur Road, Thaltej, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 22
  },

  // Central & West Ahmedabad (Thaltej, Vastrapur, Bopal, Navrangpura)
  {
    title: 'Traffic Signal Failure at CG Road Junction',
    description: 'Traffic signals stuck on red during peak evening hours, causing 1-mile congestion.',
    category: 'traffic',
    severity: 'high',
    status: 'in_progress',
    location: {
      latitude: 23.0255,
      longitude: 72.5592,
      address: 'CG Road Junction, Navrangpura, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 38
  },
  {
    title: 'Pothole Patching Required near Vastrapur Lake',
    description: 'Road surface eroding into sharp gravel patches around Vastrapur Lake outer ring road.',
    category: 'pothole',
    severity: 'medium',
    status: 'under_review',
    location: {
      latitude: 23.0360,
      longitude: 72.5290,
      address: 'Vastrapur Lake Ring Road, Vastrapur, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 17
  },
  {
    title: 'Pipeline Leak on Bopal-Ambli Road',
    description: 'Underground drinking water line leaking onto Bopal Ambli Road near BRTS corridor.',
    category: 'water_leak',
    severity: 'medium',
    status: 'resolved',
    location: {
      latitude: 23.0300,
      longitude: 72.4680,
      address: 'Bopal Ambli Road, Bopal, Ahmedabad'
    },
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 29
  },

  // Gandhinagar & GIFT City Corridor
  {
    title: 'Open Manhole Hazard near Adalaj Stepwell',
    description: 'Dangerous manhole cover missing on Adalaj Trimandir highway road.',
    category: 'other',
    severity: 'high',
    status: 'reported',
    location: {
      latitude: 23.1667,
      longitude: 72.5800,
      address: 'Adalaj Highway Road, Gandhinagar'
    },
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 14
  },
  {
    title: 'Fallen Tree Branch near GIFT City Gate-1',
    description: 'Large banyan tree branch blocking right lane leading towards GIFT City financial hub.',
    category: 'other',
    severity: 'medium',
    status: 'resolved',
    location: {
      latitude: 23.1590,
      longitude: 72.6840,
      address: 'GIFT City Gate-1 Highway, Gandhinagar'
    },
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    upvotesCount: 10
  }
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('🌱 Connected to MongoDB for Seeding...');

    // Clear old demo reports to avoid duplicates
    await Report.deleteMany({});
    console.log('🧹 Cleaned existing database reports.');

    // Find or create default demo user
    let user = await User.findOne({ email: 'viva_demo@roadreport.com' });
    if (!user) {
      user = await User.create({
        name: 'Ahmedabad Civic Reporter',
        email: 'viva_demo@roadreport.com',
        password: 'password123'
      });
    }

    // Insert demo reports
    for (const data of DEMO_REPORTS) {
      await Report.create({
        ...data,
        user: user._id
      });
    }

    console.log(`🎉 Successfully seeded ${DEMO_REPORTS.length} demo reports across Ahmedabad, Kalol, SG Highway, Motera, Thaltej, Bopal & Gandhinagar!`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Seeding error:', e.message);
    process.exit(1);
  }
};

seedDB();
