# FlavorCraft — Online Recipe Sharing Platform

A comprehensive, production-ready React-based culinary web application engineered with Role-Based Access Control (RBAC), multi-user dashboards, live activity telemetry, and a lightweight embedded Java HTTP server.

Built & Engineered by Sachin Bhandari.

---

## 1. Project Overview

FlavorCraft is an academic-grade, full-featured React web application designed for sharing, discovering, reviewing, and moderating authentic recipes and heritage dishes. The platform fulfills all academic project specifications:

- **React-Based Component Architecture:** Built with React 18, utilizing declarative components, hooks (`useState`, `useEffect`, `useRef`, `useMemo`), props, and reactive state management.
- **Role-Based Access Control (RBAC):** Two distinct user roles (Admin and User) alongside open Guest browsing and recipe sharing.
- **Action Toast Notifications:** All data mutations (creating, editing, and deleting recipes, users, reviews, or settings) trigger visible confirmation toast notifications across the UI.
- **Admin Dashboard:** Comprehensive control center featuring User Management (data table, create user form, edit and delete actions), Recipe Management (data table with quick Approve/Reject/Delete moderation), System Settings configuration panel, Recipe Statistics (Chart.js visual status breakdown, rating distributions, and trend telemetry), and a real-time scrolling User Activity Monitoring feed.
- **User Dashboard:** Dedicated Chef Studio featuring My Recipes (sharing history data table with live status badges for Pending, Approved, Rejected, plus Edit and Delete actions), Discover Recipes shortcut, Ratings & Comments management section, and Profile Management (updating display name, email, password, and avatar).
- **Core Workflow & Detail View:** Accessible recipe creation form supporting title, optional ingredients, instructions, up to 10MB photo uploads, and automated online restaurant photo discovery via Wikimedia Commons. Detailed recipe view includes full ingredients, instructions, and an interactive 1-5 star rating and text comment submission system.
- **Warm Culinary Branding:** Rich Terracotta (`#ea580c`) and Sage Green (`#047857`) visual identity with responsive top navigation adapting dynamically based on user role.

---

## 2. Technology Stack

- **Frontend Framework & Libraries:**
  - React 18 (Component hierarchy, hooks, state lifecycle)
  - Tailwind CSS (Warm Terracotta, Saffron, and Sage culinary palette)
  - Typography: Google Fonts Playfair Display (Serif Headings) & Plus Jakarta Sans (Body Text)
  - Chart.js (Visual graphs for submission trends, status distribution, and rating analytics)
  - Babel Standalone (In-browser JSX compilation)
- **Backend & Persistence:**
  - **Embedded Java HTTP Server:** Lightweight Java server (`Server.java`) listening on port 8080 with static file routing, health check (`/api/health`), and multi-device state synchronization (`/api/state`).
  - **Atomic Deletion & Tombstoning:** Server-side state purging and client-side tombstone synchronization preventing deleted recipes from reappearing.
  - **Authentic Non-Copyright Photography:** Real restaurant user photography queried from Wikimedia Commons (Creative Commons / CC0 Public Domain) with intelligent typo normalization (e.g., "cold coffe" -> "cold coffee restaurant").

---

## 3. RBAC & Dashboard Specifications

### A. Role-Based Access Control (RBAC)
- **Admin Role:** Full administrative access to user accounts, recipe moderation (Approve/Reject), system-wide configurations, analytical charts, and community comments.
- **User Role:** Ability to share recipes, manage personal recipe catalog, review submission status, edit personal reviews, and update profile credentials.
- **Guest Access:** Open recipe exploration and submission by entering a chef name.

### B. Admin Dashboard Modules
1. **User Management:** Data table listing name, email, and role badge. Includes form inputs to create users and action buttons to edit or delete them.
2. **Recipe Management:** Data table displaying user-submitted recipes with quick-action buttons to "Approve", "Reject", or "Delete".
3. **System Settings:** Dedicated panel for managing platform name, guest browsing, auto-approval, content moderation, photo limits, and maintenance mode.
4. **Recipe Statistics:** Visual data displaying Chart.js doughnut and bar charts for submission trends, rating distributions, and comment summaries.
5. **User Activity Monitoring:** Real-time scrolling feed showing recent platform activities with timestamps and user avatars.

### C. User Dashboard Modules
1. **My Recipes (Sharing History):** Data table listing all recipes shared by the logged-in user, displaying approval status (Pending, Approved, Rejected) with Edit and Delete options.
2. **Discover Recipes:** Interactive search and filtering by category, prep time, and sort order.
3. **Ratings & Comments:** Dedicated section to view and manage user-submitted ratings and comments.
4. **Profile Management:** Form allowing users to update their personal details (name, email, password, avatar).

---

## 4. Quick Start & Execution

### Running Locally
1. Compile and launch the Java HTTP server:
   ```cmd
   javac Server.java
   java Server
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:8080
   ```

### Quick Demo Evaluation Credentials
The login dialog includes 1-click evaluation buttons:
- **Admin / Owner Account:** `sachin.bhandari@gmail.com` (1-click Google Sign In as Owner) or `admin@recipes.com` / `admin`
- **User Account:** `aarav@recipes.com` / `password123` or `rahul.foodie@gmail.com`

---

## 5. Directory Structure

```text
online-recipe-sharing-platform/
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── firebaseConfig.js
│   ├── imageSearch.js
│   ├── reactApp.js
│   ├── store.js
│   ├── toast.js
│   ├── data/
│   │   └── initialData.js
│   └── views/
│       ├── admin.js
│       ├── authModal.js
│       ├── discover.js
│       └── userDashboard.js
├── index.html
├── README.md
├── run.bat
├── run.ps1
├── Server.java
├── share_public.bat
└── share_public.ps1
```

---

## 6. License & Attribution

&copy; 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari.
React • Tailwind CSS • Chart.js • Java
