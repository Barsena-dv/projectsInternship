# 🔍 PostNFind - Lost & Found Recovery Platform

A professional MERN stack application designed to facilitate secure item recovery through a trust-based escrow system and verified evidence protocols.

## 🚀 Live Demo
- **Frontend**: [https://projects-internship.vercel.app/](https://projects-internship.vercel.app/)
- **Backend API**: [https://projectsinternship.onrender.com](https://projectsinternship.onrender.com)

---

## 📸 Screenshots

### 🏠 Landing Page
![Landing Page](https://via.placeholder.com/800x400?text=PostNFind+Landing+Page)

### 👨‍💻 Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x400?text=Admin+Dashboard)

### 🏠 Owner & Finder Dashboards
<p align="center">
  <img src="https://via.placeholder.com/400x250?text=Owner+Dashboard" width="45%" />
  <img src="https://via.placeholder.com/400x250?text=Finder+Dashboard" width="45%" />
</p>

---

## 🎯 Project Overview
PostNFind bridges the gap between those who lost their valuables and those who find them. Unlike common social media groups, it enforces a **"No Direct Contact"** rule until evidence is verified and uses an **Escrow Payment System** to protect both parties.

### Key Business Rules:
- **Escrow Trust**: Owners pre-pay rewards which are held securely by the platform.
- **Evidence-First**: Finders must upload photos/videos and get owner approval before chat/contact is unlocked.
- **Lifecycle Tracking**: Real-time status updates (searching, found, failed) maintain transparency.
- **Admin Oversight**: Comprehensive dashboard for dispute resolution and fraud prevention.

---

## 📂 Project Structure

```bash
MERN/
├── backend/            # Express.js Modular Backend
│   ├── src/
│   │   ├── modules/    # 16 Specialized Business Modules
│   │   ├── middleware/ # Auth, Upload, Rate-Limiting
│   │   └── config/     # DB, Cloudinary, Mailer
├── frontend/           # React 19 + Vite 7 + Tailwind 4
│   ├── src/
│   │   ├── pages/      # Role-based Dashboards (Admin, Owner, Finder)
│   │   ├── services/   # Centralized API Layer (Axios)
│   │   └── components/ # Reusable UI System
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite 7)
- **Styling**: Tailwind CSS 4
- **State/Routing**: React Router DOM 6
- **Maps**: Leaflet (React-Leaflet)
- **Forms/Validation**: React Hook Form
- **Feedback**: React Toastify & React Icons

### Backend
- **Runtime**: Node.js 22
- **Framework**: Express 5
- **Database**: MongoDB Atlas (Mongoose 9)
- **Security**: JWT (jsonwebtoken), Bcryptjs, Helmet, Rate-Limit
- **Storage**: Cloudinary (via Multer)
- **Email**: Nodemailer (SMTP)

---

## 🧱 Backend Modules & APIs

The backend is built with a **modular architecture** for high scalability.

### 1. **Authentication (`/api/auth`)**
- `POST /register`: Multi-role registration (Owner/Finder/Both).
- `POST /login`: JWT-based login with secure cookie support.
- `GET /me`: Current user session management.

### 2. **Requests (`/api/requests`)**
- `POST /create`: Post a lost item with reward and location (GeoJSON).
- `GET /available`: Finders can browse active lost items.
- `GET /my`: View history of owned or picked requests.

### 3. **Finder Assignments (`/api/assignments`)**
- `POST /accept`: Finder applies for a specific request.
- `POST /complete`: Workflow for owner to finalize the recovery.
- `POST /pause|resume`: Standardized lifecycle control for finders.

### 4. **Evidence & Verification (`/api/evidence`)**
- `POST /upload`: Secure multi-file upload for item proof.
- `POST /verify`: Owner approval/rejection logic.

### 5. **Payments & Payouts (`/api/payments`)**
- **Escrow**: Payment locking and dynamic release.
- **Refunds**: Automated partial/full refunds based on service plans.
- **Payouts**: Earnings management for verified finders.

### 6. **Other Modules**
- **Tracking**: Real-time status logs for finders.
- **Chat**: Secure messaging unlocked only after evidence verification.
- **Notifications**: Real-time email and in-app alerts.
- **Admin**: Full control over users, disputes, and system logs.

---

## 💻 Frontend Dashboards

### 👨‍💻 Admin Hub
- **User Management**: Verify finder identities and manage bans.
- **Global Overview**: Monitor disputes and system-wide transactions.

### 🏠 Owner Center
- **Request Creation**: Detailed item forms with HD imagery.
- **Evidence Review**: Cinematic interface for verifying finder proof.

### 🔍 Finder Hub
- **Intelligence Dashboard**: Metrics on earnings, ratings, and activities.
- **Task Tracking**: Manage active searches and upload location updates.

---

## ⚙️ Setup & Installation

### 1. Clone & Dependencies
```bash
git clone <repo-url>
cd MERN/backend && npm install
cd ../frontend/frontend && npm install
```

### 2. Backend Config (`backend/.env`)
```env
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
FRONTEND_URL=https://projects-internship.vercel.app
CLOUDINARY_CLOUD_NAME=...
EMAIL_USER=...
EMAIL_PASS=...
```

### 3. Frontend Config (`frontend/frontend/.env`)
```env
VITE_API_URL=https://projectsinternship.onrender.com/api
```

### 4. Run Locally
```bash
# Terminal 1 (Backend)
npm run dev

# Terminal 2 (Frontend)
npm run dev
```

---

**Production-Ready MERN Stack Application**
