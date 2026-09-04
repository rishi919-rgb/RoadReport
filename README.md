# RoadReport 🛣️📍

A modern, civic-engagement and infrastructure reporting platform built for Indian cities. RoadReport empowers citizens to document, report, and track neighborhood issues (potholes, water leakages, broken streetlights, waste overflow) in real time while earning civic credits and municipal rewards for keeping their communities clean and safe.

---

## 🌟 Key Features

- **Civic Impact & Gamification Hub**:
  - Daily citizen duty streak tracking with a 7-day habit calendar.
  - Civic Credits (CC) wallet system (exchange reputation points for CC at a 5:1 ratio).
  - Municipal Rewards Marketplace featuring real perks: 1-Day Metro Passes, 50L Water Credits, 5L Verified Milk Booth Vouchers, and Bus Passes.
  - Scratch voucher reveal animations with instant coupon code copying.
  - Municipal Ward Leaderboards with Gold, Silver, and Bronze citizen rankings.

- **Interactive Civic Map & Geolocation**:
  - Live map displaying neighborhood issues with custom vector category pin markers.
  - Map filtering by issue categories (Potholes, Streetlights, Water, Waste, Signals).
  - Full-screen GPS location picker with reverse-geocoded street addresses.
  - Bottom preview drawer with direct route to issue details.

- **Multi-Step Reporting Flow**:
  - 3-step reporting wizard: Details & Category → Pin Location → Review & Submit.
  - Persistent form drafts so citizen data is never lost during navigation.
  - Anonymous reporting option for citizen privacy and sensitive reports.
  - Photo attachment via camera capture or photo gallery with compression.

- **Citizen Profile & Emergency Response**:
  - Citizen Karma score and level progression.
  - One-tap Emergency Helpline Directory (Police 100, Ambulance 108, Fire 101, Women Helpline 1091, Municipal Control 1916).
  - Custom emergency contact manager stored locally via AsyncStorage.
  - Ward setting and personal info editor.

- **Aesthetics & Design System**:
  - Designed in the **"Warm Stone & Amber"** palette (`#F97316` saffron highlights, `#F5F0EB` warm stone backgrounds, elevated `#FDFAF7` surfaces, and warm drop shadows).
  - High-contrast, clean typography and accessible UI for citizens of all demographics.

---

## 🛠️ Tech Stack

### Frontend / Mobile
- **Framework**: React Native + Expo SDK 54 (Expo Router with file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Maps**: `react-native-maps`
- **Networking**: Axios client with JWT interceptor
- **Storage**: AsyncStorage for persistent drafts and auth sessions

### Backend / API
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB via Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) + bcryptjs password hashing
- **Seed Data**: Pre-configured sample reports and municipal leaderboard

---

## 📁 Project Structure

```
RoadReport/
├── app/                      # Expo Router navigation routes
│   ├── (auth)/               # Citizen login & registration screens
│   ├── (tabs)/               # Bottom tab bar screens (Home, Explore, Report, My Reports, Profile)
│   ├── reports/[id].jsx      # Issue report details & timeline
│   ├── location.jsx          # Full-screen GPS map picker
│   ├── rewards.jsx           # Rewards marketplace & leaderboard
│   └── camera.jsx            # Custom camera capture modal
├── backend/                  # Express + MongoDB API server
│   ├── config/               # Database connection
│   ├── controllers/          # Business logic (Auth, Reports, Rewards)
│   ├── middleware/           # JWT authentication middleware
│   ├── models/               # Mongoose schemas (User, Report)
│   ├── routes/               # API route definitions
│   └── server.js             # API entry point
├── components/               # Reusable UI primitives (ReportCard, StatusBadge, etc.)
├── constants/                # Categories, colors, and design tokens
├── context/                  # AuthContext and ReportContext state providers
├── hooks/                    # Custom hooks (useAuth, useLocation, useCamera)
├── services/                 # API service layer
└── utils/                    # Formatting, storage, and image compression helpers
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017 (or MongoDB Atlas URI)
- Expo Go app on your physical mobile device, or an Android/iOS emulator

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The API server will launch at `http://localhost:5001`.

### 3. Frontend Setup
```bash
# In project root
npm install
npm run start
```
Scan the QR code in your terminal using the Expo Go app or press `a` for Android Emulator.

---

## 📄 License
MIT License. Built for cleaner, safer, and more connected neighborhoods.