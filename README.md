<<<<<<< HEAD
# Furniture AI Dashboard - Project Documentation

This project is a full-stack web application for furniture sales forecasting, product management, and combo-offer recommendation.

It has two major parts:

- Frontend: React dashboard (admin UI)
- Backend: Flask API with ML-based prediction logic and SQLite persistence

## 1. Tech Stack

### Frontend
- React 18
- React Router
- Axios
- Recharts
- XLSX (Excel export)

Main frontend entry points:
- frontend/src/App.js
- frontend/src/services/api.js
- frontend/src/context/AuthContext.js

### Backend
- Flask
- Flask-CORS
- Pandas, NumPy
- scikit-learn + joblib model loading
- SQLite

Main backend entry point:
- backend/app.py

## 2. High-Level Integration Architecture

1. User interacts with React pages.
2. React pages call service functions from frontend/src/services/api.js.
3. Axios sends HTTP requests to Flask at http://localhost:5000.
4. Flask routes run business logic:
   - auth
   - product CRUD
   - prediction and combo logic
   - history and dashboard stats
5. Flask reads/writes SQLite (backend/database.db) and ML assets in recom1/.
6. JSON responses return to frontend and render in tables/charts.

## 3. Backend Assets and Data Sources

The backend loads these files at startup from recom1/:

- sales_model.pkl
- product_encoder.pkl
- category_encoder.pkl
- season_encoder.pkl
- furniture_sales_dataset_1500_rows_clean.xlsx

These are used to:

- build prediction features
- map product metadata (category, season, average price)
- seed products table when empty

## 4. Integration Flow by Feature

### 4.1 Authentication Integration

Frontend pages:
- Login page calls loginAdmin(email, password)
- Signup page calls signupAdmin(email, password)
- AuthContext calls verifyToken() on app load if token exists

Backend routes:
- POST /auth/signup
- POST /auth/login
- GET /auth/verify

Flow:
1. Successful login/signup returns token + email.
2. Frontend stores token in localStorage.
3. Axios request interceptor attaches Authorization: Bearer <token>.
4. AuthContext tracks isAuthenticated and adminEmail for route guards.

### 4.2 Product Management Integration

Frontend page:
- Products page uses getProducts, addProduct, updateProduct, deleteProduct

Backend routes:
- GET /products
- POST /products
- PUT /products/<id>
- DELETE /products/<id>
- GET /uploads/<filename>

Flow:
1. Add/Edit form builds FormData (name, category, season, price, optional image).
2. API sends multipart/form-data.
3. Flask validates fields, stores image into backend/uploads/, saves image URL.
4. Product list reloads and image URL is returned as public URL.

### 4.3 Full-Year Forecast Integration

Frontend page:
- Forecast page calls predictYear(year)

Backend route:
- POST /predict/year

Flow:
1. Frontend validates year >= current year.
2. Backend validates year again.
3. Backend predicts all products for all 12 months (aggregated yearly totals).
4. Results are saved to predictions table (history).
5. Frontend renders table and charts, and can export to Excel.

### 4.4 Product Monthly Prediction Integration

Frontend page:
- Predict page calls predictProductMonthly(product_name, year)

Backend route:
- POST /predict/product/monthly

Flow:
1. Frontend selects product, year, month.+
3. Frontend picks selected month to show focused KPI cards.
4. Frontend renders monthly visualizations and allows Excel export.

### 4.5 Combo Recommendation Integration

Frontend page:
- Combos page calls getLowSellers(year, month)

Backend routes:
- GET /combo-offers/low-sellers
- (Also available: GET /combo-offers, POST /combo-offers/generate)

Flow currently used in UI:
1. Frontend asks backend for low sellers for selected future month.
2. Backend predicts all products for that month, sorts by predicted sales, returns bottom 5.
3. Frontend lets admin choose a main product.
4. Frontend computes final combo offers locally using low-seller stats:
   - discount capped at 30%
   - minimum discount 5%
   - combo price and profit-after-discount

### 4.6 Dashboard and History Integration

Frontend pages:
- Dashboard page calls getDashboardStats and getPredictionHistory
- History page calls getPredictionHistory

Backend routes:
- GET /dashboard/stats
- GET /predictions/history

Flow:
1. Prediction actions write records into predictions table.
2. Dashboard reads aggregate counters + latest forecast snapshot.
3. History reads full prediction records ordered by created_at.

## 5. API Integration Map (Frontend to Backend)

| Frontend service function | Method + endpoint | Used by |
|---|---|---|
| loginAdmin | POST /auth/login | Login page |
| signupAdmin | POST /auth/signup | Signup page |
| verifyToken | GET /auth/verify | AuthContext |
| getProducts | GET /products | Products, Predict, Combos |
| addProduct | POST /products | Products page |
| updateProduct | PUT /products/:id | Products page |
| deleteProduct | DELETE /products/:id | Products page |
| predictYear | POST /predict/year | Forecast page |
| predictProduct | POST /predict/product | Available in API (not primary UI path) |
| predictProductMonthly | POST /predict/product/monthly | Predict page |
| getComboOffers | GET /combo-offers | Available in API |
| getLowSellers | GET /combo-offers/low-sellers | Combos page |
| generateComboOffer | POST /combo-offers/generate | Available in API |
| getPredictionHistory | GET /predictions/history | Dashboard, History |
| getDashboardStats | GET /dashboard/stats | Dashboard |

## 6. Database Tables

The backend initializes and uses these SQLite tables:

- users: admin credentials (salted + hashed)
- tokens: active auth token per user
- products: product catalog and optional image_url
- predictions: saved forecast outputs for history/dashboard

## 7. Validation and Business Rules

- Prediction endpoints reject past years (must be current year or later).
- Combo month must be between 1 and 12.
- Product image upload types allowed:
  - .png, .jpg, .jpeg, .webp, .gif
- Combo discount logic:
  - base from low-seller profit/price
  - scaled by 0.6
  - clamped to 5% minimum and 30% maximum

## 8. How the Integration Was Implemented

The integration was implemented in a layered way:

1. Central API layer in frontend/src/services/api.js
   - one axios instance
   - common base URL and headers
   - shared auth token interceptor

2. Route-level feature pages in frontend/src/pages/
   - each page owns form state + loading + error handling
   - pages call only service functions, not raw fetch calls

3. Flask route groups in backend/app.py
   - split into auth, products, predictions, combos, history, stats
   - helper methods keep prediction logic reusable

4. Persistence and traceability
   - every prediction write is stored in SQLite history
   - dashboard and history pages read from same source of truth

5. Predictive model integration
   - model and label encoders loaded once at backend startup
   - feature engineering done per month/year request
   - outputs normalized into API-friendly JSON contracts

## 9. Local Run Instructions

### Backend
1. Open terminal in backend/
2. Install dependencies:
   - pip install -r requirements.txt
3. Start server:
   - python app.py

Backend runs at: http://localhost:5000

### Frontend
1. Open terminal in frontend/
2. Install dependencies:
   - npm install
3. Start app:
   - npm start

Frontend runs at: http://localhost:3000

## 10. Current Integration Notes

- API base URL is environment-based via REACT_APP_API_BASE_URL (fallback: http://localhost:5000).
- Frontend sends auth token on all requests, but backend currently enforces token check explicitly on /auth/verify only.
- Uploaded images are served by Flask from /uploads/<filename>.

## 11. Deploying on Vercel + Render

This project is best deployed as:

- Frontend (React) on Vercel
- Backend (Flask API) on Render

### 11.1 Backend Deployment on Render

1. Push this repository to GitHub.
2. In Render, create a new git init
git add .
git commit -m "feat: initial project setup for sales forecasting system"
git branch -M main
git remote add origin https://github.com/SUJITH-NS/SALES-FORCASTING-SYSTEM.git
git push -u origin mainWeb Service and connect the repo.
3. Set Root Directory to `backend`.
4. Set Build Command to:
   - `pip install -r requirements.txt`
5. Set Start Command to:
   - `python app.py`
6. Set environment variables in Render:
   - `PORT` = `10000` (Render will also provide this automatically)
   - `FLASK_DEBUG` = `0`
   - `SECRET_KEY` = a long random string
   - `CORS_ORIGINS` = your Vercel frontend URL (for example `https://your-app.vercel.app`)

Important:

- The Flask app now reads `PORT` from environment variables, so it works on Render.
- The Flask app now supports environment-based CORS configuration using `CORS_ORIGINS`.

### 11.2 Frontend Deployment on Vercel

1. In Vercel, import the same GitHub repository.
2. Set Root Directory to `frontend`.
3. Framework preset: React (Create React App).
4. Build command:
   - `npm run build`
5. Add environment variable in Vercel:
   - `REACT_APP_API_BASE_URL` = your Render backend URL (for example `https://your-backend.onrender.com`)
6. Deploy.

Important:

- The frontend now reads `REACT_APP_API_BASE_URL` and falls back to `http://localhost:5000` for local development.

### 11.3 How to Host SQLite in Production

SQLite is a file-based database. On cloud platforms, you must store that file on persistent storage.

Option A (quick and simple): Use SQLite with a Render Disk

1. In Render, add a persistent disk to your backend service, mount path `/var/data`.
2. Set environment variables:
   - `DB_PATH` = `/var/data/database.db`
   - `UPLOAD_DIR` = `/var/data/uploads`
3. Redeploy.

Why:

- Without a persistent disk, SQLite data is lost on redeploy/restart.
- Using `/var/data` keeps both `database.db` and uploaded images persistent.

Option B (recommended for scaling): Move to PostgreSQL

1. Create a Render PostgreSQL instance.
2. Replace SQLite logic in `backend/app.py` with PostgreSQL (via `psycopg` or SQLAlchemy).
3. Use `DATABASE_URL` from Render.

Why:

- Better concurrency, reliability, backups, and scaling than SQLite.

### 11.4 Deployment Order

1. Deploy backend on Render first.
2. Copy Render URL.
3. Set `REACT_APP_API_BASE_URL` in Vercel.
4. Deploy frontend on Vercel.
5. Update `CORS_ORIGINS` in Render to the exact Vercel URL.
=======
# Sales-Forecasting-System-With-Recommendation
>>>>>>> 880addec7238ccab2c685d57cea213dc990b34be
