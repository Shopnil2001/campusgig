# CampusGigs ✦ Student Freelance Marketplace

A student-only freelance gig marketplace created for the CSE-311 Database Management System course. Built with a modern **Next.js** frontend, native **PHP JSON API**, and fully normalized **MySQL** relational database featuring ACID transactions, stored procedures, database triggers, and views.

---

## 🌟 Key Features

- **Multi-Role User Accounts**: Test as Client (Aisha/Nadia), Freelancer (Rafi), or Admin directly from the interactive account switcher in the top right.
- **Gig Lifecycle Workflow**: `Open` ➔ `In Progress` ➔ `Submitted` ➔ `Completed` / `Disputed`.
- **ACID Transaction Bidding**: Client accepts a proposal using an atomic database transaction (`BEGIN TRANSACTION ... COMMIT`) that accepts the winning bid, updates the gig status, and automatically marks competing bids as `Rejected`.
- **Database Logic**:
  - **Triggers**: Automatically updates gig status and creates financial transaction records.
  - **Stored Procedure**: Calculates average rating for freelancers across completed gigs.
  - **View (`top_freelancers`)**: Ranks top campus freelancers based on rating and completion volume.
- **Post-Completion Trust Workflow**: Review & star-rating system, dispute resolution panel for admins.
- **Interactive Offline Demo Mode**: Full UI fallback allows testing all features even before local MySQL/Apache is configured.

---

## 🚀 Quick Start (Local Setup with XAMPP)

1. **Copy backend to XAMPP**:
   - Copy this folder into `C:\xampp\htdocs\311-peoject`.
2. **Start Apache & MySQL** in the XAMPP Control Panel.
3. **Import Database**:
   - Open `http://localhost/phpmyadmin`.
   - Click the **SQL** tab and run the contents of [database/schema.sql](file:///d:/Web%20Projects/311-peoject/database/schema.sql).
4. **Start Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🌐 100% Free Hosting Deployment (No Docker Required)

You can host both the frontend, backend, and database 100% free online without using Docker:

| Layer | Recommended Free Host | Notes |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Free Next.js hosting, free SSL & domain |
| **Backend** | **InfinityFree** / **Render** | Free native PHP hosting & API endpoint |
| **Database** | **TiDB Cloud** / **InfinityFree MySQL** | 100% MySQL compatible, free forever |

👉 **Read the full step-by-step manual deployment guide in [FREE_HOSTING_GUIDE.md](file:///d:/Web%20Projects/311-peoject/FREE_HOSTING_GUIDE.md).**

---

## 📡 API Endpoints Summary

- `GET /backend/api/index.php?action=dashboard` - Discover gigs, stats, and skill tags.
- `GET /backend/api/index.php?action=users` - Available test student & admin accounts.
- `GET /backend/api/index.php?action=my_gigs` - Gigs posted by active client.
- `GET /backend/api/index.php?action=my_bids` - Proposals submitted by active freelancer.
- `POST /backend/api/index.php?action=create_gig` - Post a new gig with required skills.
- `POST /backend/api/index.php?action=create_bid` - Submit a price proposal.
- `POST /backend/api/index.php?action=accept_bid` - Atomically accept a bid & reject competing proposals.
- `POST /backend/api/index.php?action=update_status` - Transition gig status (`Submitted`, `Completed`).
- `POST /backend/api/index.php?action=review` - Submit a post-completion review and rating.
- `POST /backend/api/index.php?action=dispute` - Submit a dispute to admin.
- `POST /backend/api/index.php?action=resolve_dispute` - Admin dispute resolution.
- `GET /backend/api/index.php?action=admin` - Admin statistics, active disputes, and top freelancers.
