# 🌍 SmartWaste — Waste Collection & E-Waste Management System

A full-stack application for managing waste collection requests, e-waste center discovery, and optimized driver routing.

---

## 🧱 Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Backend     | FastAPI (Python 3.11+)                  |
| Database    | MongoDB Atlas (Motor async driver)      |
| Auth        | JWT (python-jose + passlib/bcrypt)      |
| Frontend    | React 18 + Vite + Tailwind CSS          |
| Maps        | Leaflet.js (via react-leaflet)          |
| File Upload | Cloudinary                              |
| SMS         | Twilio                                  |
| Routing     | OSRM (free) / OpenRouteService          |
| Clustering  | scikit-learn K-Means                    |

---

## 📁 Project Structure

```
smart-waste/
├── backend/
│   ├── main.py                  # FastAPI app + seeding
│   ├── db.py                    # MongoDB connection + indexes
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   ├── user_model.py
│   │   ├── request_model.py
│   │   └── ewaste_model.py
│   ├── routes/
│   │   ├── auth_routes.py       # /auth/register, /auth/login, /auth/admin/login
│   │   ├── user_routes.py       # /request, /my-requests, /nearest-centers
│   │   ├── admin_routes.py      # /admin/* (dashboard, optimize, assign)
│   │   ├── ewaste_routes.py     # /ewaste/centers
│   │   └── route_optimizer.py  # /route/directions (OSRM/ORS)
│   └── utils/
│       ├── auth_utils.py        # JWT + bcrypt
│       ├── dependencies.py      # FastAPI deps (current_user, current_admin)
│       ├── cloudinary_utils.py  # Image upload
│       ├── distance.py          # Haversine + Nearest Neighbor TSP
│       └── clustering.py        # K-Means + route optimization
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx               # Router + layout
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx   # Global auth state
        ├── hooks/
        │   └── useGeolocation.js # Browser Geolocation API
        ├── utils/
        │   └── api.js            # Axios + JWT interceptor
        ├── components/
        │   ├── Navbar.jsx
        │   ├── MapView.jsx       # Leaflet map (markers + routes)
        │   ├── StatusBadge.jsx   # Status + waste type badges
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── AdminLoginPage.jsx
            ├── UserDashboard.jsx
            ├── NewRequestPage.jsx
            ├── EWasteCentersPage.jsx
            ├── AdminDashboard.jsx
            ├── AdminRequestsPage.jsx
            └── AdminRoutesPage.jsx
```

---

## ⚡ Quick Start

### 1. Clone / download the project

```bash
cd smart-waste
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see below)

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at: http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

Frontend at: http://localhost:5173

---

## 🔐 Environment Variables

### Backend `.env`

```env
# MongoDB Atlas connection string
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/smart_waste

# JWT (use a long random string in production)
SECRET_KEY=your-super-secret-key-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# Cloudinary (sign up free at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Twilio (optional — SMS notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenRouteService (optional — falls back to free OSRM)
ORS_API_KEY=your_ors_api_key

# Default admin credentials (used for seeding)
ADMIN_EMAIL=admin@smartwaste.com
ADMIN_PASSWORD=Admin@123
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## 🔑 Default Credentials (after seeding)

| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@smartwaste.com      | Admin@123 |

> ⚠️ Change these in production via your `.env` file before first run.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /auth/register        | Register new user        |
| POST   | /auth/login           | User login → JWT         |
| POST   | /auth/admin/login     | Admin login → JWT        |

### User (requires JWT)
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /request              | Submit waste request     |
| GET    | /my-requests          | Get own requests         |
| GET    | /nearest-centers      | Find nearby e-waste centers |

### Admin (requires admin JWT)
| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| GET    | /admin/requests           | All requests (filterable)    |
| GET    | /admin/stats              | Dashboard statistics         |
| PUT    | /admin/update-status      | Update request status        |
| POST   | /admin/optimize-route     | K-Means + TSP optimization   |
| POST   | /admin/assign-route       | Assign cluster to driver     |
| GET    | /admin/centers            | List all e-waste centers     |
| POST   | /admin/centers            | Add new e-waste center       |

### Route
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /route/directions     | Get turn-by-turn route   |

---

## 🧠 Algorithms

### K-Means Clustering
Groups pending pickup requests by geographic proximity.
- Input: List of `(latitude, longitude)` coordinates
- Output: `n` clusters of nearby requests
- Auto-selects cluster count (~6 stops/cluster) if not specified

### Nearest Neighbor TSP
Finds a near-optimal pickup order within each cluster.
- Input: Points within a cluster
- Output: Ordered list minimizing total travel distance
- Uses Haversine formula for accurate great-circle distances

---

## 🗺️ MongoDB Collections & Indexes

```
users           → unique index on `email`
requests        → 2dsphere index on `location` (GeoJSON Point)
ewaste_centers  → 2dsphere index on `location` (GeoJSON Point)
```

All location data stored as GeoJSON `Point`: `{ type: "Point", coordinates: [longitude, latitude] }`

---

## 🚀 Production Deployment

### Backend (e.g. Railway, Render, Fly.io)
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (e.g. Vercel, Netlify)
```bash
npm run build
# Deploy the `dist/` folder
# Set VITE_API_URL to your production backend URL
```

### Update CORS in `main.py`
Add your production frontend URL to the `allow_origins` list.

---

## 📱 SMS Notifications (Twilio)

Automatic SMS sent when:
- ✅ Request created (confirmation + ID)
- 🚛 Request assigned to driver
- ▶️ Driver en route (in-progress)
- 🎉 Pickup completed

If Twilio credentials are not set, SMS is mocked to stdout (no crash).

---

## 🖼️ Features Summary

| Feature                  | Status |
|--------------------------|--------|
| JWT Auth (user + admin)  | ✅     |
| Role-based routes        | ✅     |
| Waste request + photo    | ✅     |
| Cloudinary image upload  | ✅     |
| Browser geolocation      | ✅     |
| Nearest e-waste centers  | ✅     |
| OSRM / ORS routing       | ✅     |
| Leaflet map + routes     | ✅     |
| Admin dashboard + stats  | ✅     |
| Status management        | ✅     |
| K-Means clustering       | ✅     |
| Nearest Neighbor TSP     | ✅     |
| Driver assignment        | ✅     |
| Twilio SMS notifications | ✅     |
| MongoDB geospatial index | ✅     |
| Auto-seed admin + centers| ✅     |
