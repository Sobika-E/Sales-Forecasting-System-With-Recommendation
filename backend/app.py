import os
import sqlite3
import datetime
import hashlib
import secrets
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename


# --------------------------------------------------------------------------
# App setup
# -------------------------------------------------------------------------


app = Flask(__name__)
cors_origins_raw = os.environ.get("CORS_ORIGINS", "*").strip()
if cors_origins_raw == "*":
    CORS(app)
else:
    CORS(app, origins=[origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()])
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", secrets.token_hex(32))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECOM_DIR = os.path.join(BASE_DIR, "..", "recom1")
DB_PATH = os.environ.get("DB_PATH", os.path.join(BASE_DIR, "database.db"))
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Load ML model & encoders (once at startup)
# ---------------------------------------------------------------------------
model = joblib.load(os.path.join(RECOM_DIR, "sales_model.pkl"))
le_product = joblib.load(os.path.join(RECOM_DIR, "product_encoder.pkl"))
le_category = joblib.load(os.path.join(RECOM_DIR, "category_encoder.pkl"))
le_season = joblib.load(os.path.join(RECOM_DIR, "season_encoder.pkl"))

# Load dataset to extract product metadata
_df = pd.read_excel(os.path.join(RECOM_DIR, "furniture_sales_dataset_1500_rows_clean.xlsx"))
_df.columns = _df.columns.str.strip()

month_map = {
    "Jan": 1, "January": 1, "Feb": 2, "February": 2,
    "Mar": 3, "March": 3, "Apr": 4, "April": 4,
    "May": 5, "Jun": 6, "June": 6,
    "Jul": 7, "July": 7, "Aug": 8, "August": 8,
    "Sep": 9, "September": 9, "Oct": 10, "October": 10,
    "Nov": 11, "November": 11, "Dec": 12, "December": 12,
}
_df["Month"] = _df["Month"].replace(month_map)
for col in ["Year", "Month", "Units_Sold", "Price", "Total_Sales"]:
    _df[col] = pd.to_numeric(_df[col], errors="coerce")
_df.fillna({
    "Year": _df["Year"].median(),
    "Month": _df["Month"].mode()[0],
    "Units_Sold": _df["Units_Sold"].median(),
    "Price": _df["Price"].median(),
    "Total_Sales": _df["Total_Sales"].median(),
    "Product_Name": "Unknown_Product",
    "Category": "Unknown_Category",
    "Season": "Unknown_Season",
}, inplace=True)
_df["Year"] = _df["Year"].astype(int)
_df["Month"] = _df["Month"].astype(int)

YEAR_MIN = int(_df["Year"].min())
PRODUCTS_META = {}  # name -> {category, season, price}
for name in _df["Product_Name"].unique():
    pdata = _df[_df["Product_Name"] == name]
    PRODUCTS_META[name] = {
        "category": pdata["Category"].iloc[0],
        "season": pdata["Season"].iloc[0],
        "price": float(pdata["Price"].mean()),
    }

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create tables if they don't exist and seed products from dataset."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            season TEXT NOT NULL,
            price REAL NOT NULL,
            image_url TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product TEXT NOT NULL,
            year INTEGER NOT NULL,
            predicted_units INTEGER NOT NULL,
            predicted_sales INTEGER NOT NULL,
            predicted_profit INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()

    # Add image_url column to existing databases created before image support.
    columns = [row[1] for row in cur.execute("PRAGMA table_info(products)").fetchall()]
    if "image_url" not in columns:
        cur.execute("ALTER TABLE products ADD COLUMN image_url TEXT")
        conn.commit()

    # Seed products from dataset if table is empty
    count = cur.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        for name, meta in PRODUCTS_META.items():
            cur.execute(
                "INSERT OR IGNORE INTO products (name, category, season, price) VALUES (?, ?, ?, ?)",
                (name, meta["category"], meta["season"], round(meta["price"], 2)),
            )
        conn.commit()

    conn.close()


# ---------------------------------------------------------------------------
# ML prediction helpers (ported from notebook)
# ---------------------------------------------------------------------------

def _predict_product_year(product_name, year):
    """Predict total units, sales, profit for a product over 12 months."""
    meta = PRODUCTS_META.get(product_name)
    if meta is None:
        return None

    price = meta["price"]
    category = meta["category"]
    season = meta["season"]

    total_units = 0.0
    total_sales = 0.0
    total_profit = 0.0

    year_trend = year - YEAR_MIN

    for month in range(1, 13):
        row = pd.DataFrame({
            "Year_trend": [year_trend],
            "Month": [month],
            "Month_sin": [np.sin(2 * np.pi * month / 12)],
            "Month_cos": [np.cos(2 * np.pi * month / 12)],
            "Price_log": [np.log1p(price)],
            "Product_enc": [le_product.transform([product_name])[0]],
            "Category_enc": [le_category.transform([category])[0]],
            "Season_enc": [le_season.transform([season])[0]],
        })
        pred_sales = float(model.predict(row)[0])
        total_units += pred_sales / price
        total_sales += pred_sales
        total_profit += pred_sales * 0.25

    return {
        "product": product_name,
        "predicted_units": round(total_units),
        "predicted_sales": round(total_sales),
        "predicted_profit": round(total_profit),
    }


def _predict_product_monthly(product_name, year):
    """Return month-by-month predictions for a single product."""
    meta = PRODUCTS_META.get(product_name)
    if meta is None:
        return None

    price = meta["price"]
    category = meta["category"]
    season = meta["season"]
    year_trend = year - YEAR_MIN
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly = []

    for month in range(1, 13):
        row = pd.DataFrame({
            "Year_trend": [year_trend],
            "Month": [month],
            "Month_sin": [np.sin(2 * np.pi * month / 12)],
            "Month_cos": [np.cos(2 * np.pi * month / 12)],
            "Price_log": [np.log1p(price)],
            "Product_enc": [le_product.transform([product_name])[0]],
            "Category_enc": [le_category.transform([category])[0]],
            "Season_enc": [le_season.transform([season])[0]],
        })
        pred_sales = float(model.predict(row)[0])
        units = pred_sales / price
        profit = pred_sales * 0.25
        monthly.append({
            "month": month_names[month - 1],
            "units": round(units),
            "sales": round(pred_sales),
            "profit": round(profit),
        })

    return {"product": product_name, "year": year, "monthly": monthly}


def _predict_all_products_month(year, month):
    """Predict sales for every product for a specific year+month."""
    results = []
    year_trend = year - YEAR_MIN
    for name, meta in PRODUCTS_META.items():
        row = pd.DataFrame({
            "Year_trend": [year_trend],
            "Month": [month],
            "Month_sin": [np.sin(2 * np.pi * month / 12)],
            "Month_cos": [np.cos(2 * np.pi * month / 12)],
            "Price_log": [np.log1p(meta["price"])],
            "Product_enc": [le_product.transform([name])[0]],
            "Category_enc": [le_category.transform([meta["category"]])[0]],
            "Season_enc": [le_season.transform([meta["season"]])[0]],
        })
        pred_sales = float(model.predict(row)[0])
        price = meta["price"]
        units = pred_sales / price
        profit = pred_sales * 0.25
        results.append({
            "product": name,
            "category": meta["category"],
            "season": meta["season"],
            "price": round(price, 2),
            "predicted_sales": round(pred_sales),
            "predicted_units": round(units),
            "predicted_profit": round(profit),
        })
    return results


def _combo_offers(year, month):
    """Generate combo offers pairing top sellers with bottom sellers."""
    predictions = []
    for name, meta in PRODUCTS_META.items():
        year_trend = year - YEAR_MIN
        row = pd.DataFrame({
            "Year_trend": [year_trend],
            "Month": [month],
            "Month_sin": [np.sin(2 * np.pi * month / 12)],
            "Month_cos": [np.cos(2 * np.pi * month / 12)],
            "Price_log": [np.log1p(meta["price"])],
            "Product_enc": [le_product.transform([name])[0]],
            "Category_enc": [le_category.transform([meta["category"]])[0]],
            "Season_enc": [le_season.transform([meta["season"]])[0]],
        })
        pred_sales = float(model.predict(row)[0])
        predictions.append({"product": name, "predicted_sales": pred_sales})

    pred_df = pd.DataFrame(predictions)
    high = pred_df.sort_values("predicted_sales", ascending=False).head(5)
    low = pred_df.sort_values("predicted_sales").head(5)

    combos = []
    for h, l in zip(high["product"], low["product"]):
        offer = int(np.random.randint(15, 30))
        combos.append({
            "main_product": h,
            "combo_product": l,
            "offer": f"{offer}%",
        })
    return combos


def _parse_prediction_year(raw_year):
    """Parse year input and reject past years for prediction endpoints."""
    try:
        year = int(raw_year)
    except (TypeError, ValueError):
        return None, "Invalid year"

    current_year = datetime.datetime.utcnow().year
    if year < current_year:
        return None, f"Predictions are only available for {current_year} and later"

    return year, None


def _request_payload():
    """Read JSON or multipart form data into a plain dict."""
    if request.is_json:
        return request.get_json(silent=True) or {}
    return request.form.to_dict()


def _build_public_image_url(image_url):
    if not image_url:
        return None
    image_url = image_url.strip()
    if not image_url:
        return None
    if image_url.startswith("http://") or image_url.startswith("https://"):
        return image_url
    if image_url.startswith("/"):
        return request.host_url.rstrip("/") + image_url
    return image_url


def _save_uploaded_image(image_file):
    if image_file is None or not image_file.filename:
        return None, None

    filename = secure_filename(image_file.filename)
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return None, "Unsupported image format. Use PNG, JPG, JPEG, WEBP, or GIF"

    unique_name = f"{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(8)}{ext}"
    save_path = os.path.join(UPLOAD_DIR, unique_name)
    image_file.save(save_path)
    return f"/uploads/{unique_name}", None


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def _hash_password(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()


def _generate_token(user_id, email):
    """Simple token: hex(user_id:email:random)."""
    raw = f"{user_id}:{email}:{secrets.token_hex(16)}"
    token = hashlib.sha256(raw.encode()).hexdigest()
    # Store token in DB for verification
    db = get_db()
    db.execute("DELETE FROM tokens WHERE user_id=?", (user_id,))
    db.execute("INSERT INTO tokens (user_id, email, token) VALUES (?, ?, ?)",
               (user_id, email, token))
    db.commit()
    return token


# ---------------------------------------------------------------------------
# Routes: Auth
# ---------------------------------------------------------------------------

@app.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    now = datetime.datetime.utcnow().isoformat()

    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
            (email, password_hash, salt, now),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered"}), 409

    user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    token = _generate_token(user["id"], email)
    return jsonify({"token": token, "email": email}), 201


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    password_hash = _hash_password(password, user["salt"])
    if password_hash != user["password_hash"]:
        return jsonify({"error": "Invalid email or password"}), 401

    token = _generate_token(user["id"], email)
    return jsonify({"token": token, "email": email})


@app.route("/auth/verify", methods=["GET"])
def verify_token_route():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
    if not token:
        return jsonify({"error": "No token provided"}), 401

    db = get_db()
    row = db.execute("SELECT * FROM tokens WHERE token=?", (token,)).fetchone()
    if not row:
        return jsonify({"error": "Invalid token"}), 401

    return jsonify({"email": row["email"]})


# ---------------------------------------------------------------------------
# Routes: Products CRUD
# ---------------------------------------------------------------------------

@app.route("/products", methods=["GET"])
def list_products():
    db = get_db()
    rows = db.execute("SELECT * FROM products ORDER BY name").fetchall()
    return jsonify([
        {"_id": r["id"], "name": r["name"], "category": r["category"],
         "season": r["season"], "price": r["price"], "image_url": _build_public_image_url(r["image_url"])}
        for r in rows
    ])


@app.route("/products", methods=["POST"])
def add_product():
    data = _request_payload()
    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip()
    season = (data.get("season") or "").strip()
    price = data.get("price")
    image_url = (data.get("image_url") or "").strip()

    uploaded_path, image_error = _save_uploaded_image(request.files.get("image"))
    if image_error:
        return jsonify({"error": image_error}), 400

    if uploaded_path:
        image_url = uploaded_path

    if not name or not category or not season or price is None:
        return jsonify({"error": "All fields are required"}), 400

    try:
        price = float(price)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid price"}), 400

    db = get_db()
    try:
        db.execute(
            "INSERT INTO products (name, category, season, price, image_url) VALUES (?, ?, ?, ?, ?)",
            (name, category, season, price, image_url or None),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Product already exists"}), 409

    return jsonify({"message": "Product added"}), 201


@app.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    data = _request_payload()
    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip()
    season = (data.get("season") or "").strip()
    price = data.get("price")
    image_url_input = data.get("image_url")

    uploaded_path, image_error = _save_uploaded_image(request.files.get("image"))
    if image_error:
        return jsonify({"error": image_error}), 400

    if not name or not category or not season or price is None:
        return jsonify({"error": "All fields are required"}), 400

    try:
        price = float(price)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid price"}), 400

    db = get_db()
    current = db.execute("SELECT image_url FROM products WHERE id=?", (product_id,)).fetchone()
    if current is None:
        return jsonify({"error": "Product not found"}), 404

    if uploaded_path:
        final_image_url = uploaded_path
    elif image_url_input is not None:
        final_image_url = (image_url_input or "").strip() or None
    else:
        final_image_url = current["image_url"]

    db.execute(
        "UPDATE products SET name=?, category=?, season=?, price=?, image_url=? WHERE id=?",
        (name, category, season, price, final_image_url, product_id),
    )
    db.commit()
    return jsonify({"message": "Product updated"})


@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    db = get_db()
    db.execute("DELETE FROM products WHERE id=?", (product_id,))
    db.commit()
    return jsonify({"message": "Product deleted"})


# ---------------------------------------------------------------------------
# Routes: Predictions
# ---------------------------------------------------------------------------

@app.route("/predict/year", methods=["POST"])
def predict_year():
    data = request.get_json()
    year = data.get("year")
    if year is None:
        return jsonify({"error": "Year is required"}), 400

    year, year_error = _parse_prediction_year(year)
    if year_error:
        return jsonify({"error": year_error}), 400

    results = []
    db = get_db()
    now = datetime.datetime.utcnow().isoformat()

    for name in PRODUCTS_META:
        pred = _predict_product_year(name, year)
        if pred:
            results.append(pred)
            # Save to history
            db.execute(
                "INSERT INTO predictions (product, year, predicted_units, predicted_sales, predicted_profit, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (pred["product"], year, pred["predicted_units"],
                 pred["predicted_sales"], pred["predicted_profit"], now),
            )
    db.commit()
    return jsonify(results)


@app.route("/predict/product", methods=["POST"])
def predict_product():
    data = request.get_json()
    product_name = (data.get("product_name") or "").strip()
    year = data.get("year")

    if not product_name or year is None:
        return jsonify({"error": "product_name and year are required"}), 400

    year, year_error = _parse_prediction_year(year)
    if year_error:
        return jsonify({"error": year_error}), 400

    pred = _predict_product_year(product_name, year)
    if pred is None:
        return jsonify({"error": f"Product '{product_name}' not found in model"}), 404

    # Save to history
    db = get_db()
    now = datetime.datetime.utcnow().isoformat()
    db.execute(
        "INSERT INTO predictions (product, year, predicted_units, predicted_sales, predicted_profit, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (pred["product"], year, pred["predicted_units"],
         pred["predicted_sales"], pred["predicted_profit"], now),
    )
    db.commit()
    return jsonify(pred)


@app.route("/predict/product/monthly", methods=["POST"])
def predict_product_monthly():
    data = request.get_json()
    product_name = (data.get("product_name") or "").strip()
    year = data.get("year")

    if not product_name or year is None:
        return jsonify({"error": "product_name and year are required"}), 400

    year, year_error = _parse_prediction_year(year)
    if year_error:
        return jsonify({"error": year_error}), 400

    result = _predict_product_monthly(product_name, year)
    if result is None:
        return jsonify({"error": f"Product '{product_name}' not found in model"}), 404

    return jsonify(result)


# ---------------------------------------------------------------------------
# Routes: Combo Offers
# ---------------------------------------------------------------------------

@app.route("/combo-offers", methods=["GET"])
def combo_offers():
    now = datetime.datetime.utcnow()
    year, year_error = _parse_prediction_year(request.args.get("year", now.year))
    if year_error:
        return jsonify({"error": year_error}), 400

    try:
        month = int(request.args.get("month", now.month))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid month"}), 400

    if month < 1 or month > 12:
        return jsonify({"error": "Month must be between 1 and 12"}), 400

    combos = _combo_offers(year, month)
    return jsonify(combos)


@app.route("/combo-offers/low-sellers", methods=["GET"])
def low_sellers():
    now = datetime.datetime.utcnow()
    year, year_error = _parse_prediction_year(request.args.get("year", now.year))
    if year_error:
        return jsonify({"error": year_error}), 400

    try:
        month = int(request.args.get("month", now.month))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid month"}), 400

    if month < 1 or month > 12:
        return jsonify({"error": "Month must be between 1 and 12"}), 400

    all_preds = _predict_all_products_month(year, month)
    sorted_preds = sorted(all_preds, key=lambda x: x["predicted_sales"])
    low = sorted_preds[:5]
    return jsonify(low)


@app.route("/combo-offers/generate", methods=["POST"])
def generate_combo():
    data = request.get_json()
    year = data.get("year")
    month = data.get("month")
    main_product = (data.get("main_product") or "").strip()

    if not main_product or year is None or month is None:
        return jsonify({"error": "year, month, and main_product are required"}), 400

    year, year_error = _parse_prediction_year(year)
    if year_error:
        return jsonify({"error": year_error}), 400

    try:
        month = int(month)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid month"}), 400
    if month < 1 or month > 12:
        return jsonify({"error": "Month must be between 1 and 12"}), 400

    if main_product not in PRODUCTS_META:
        return jsonify({"error": f"Product '{main_product}' not found"}), 404

    all_preds = _predict_all_products_month(year, month)

    candidates = [p for p in all_preds if p["product"] != main_product]
    if not candidates:
        return jsonify({"error": "No other products available for combo pairing"}), 400

    lowest = min(candidates, key=lambda x: x["predicted_sales"])

    low_profit = lowest["predicted_profit"]
    low_price = lowest["price"]

    if low_price > 0 and low_profit > 0:
        discount_pct = min((low_profit / low_price) * 100 * 0.6, 30)
        discount_pct = max(round(discount_pct), 5)
    else:
        discount_pct = 5

    main_pred = next(p for p in all_preds if p["product"] == main_product)

    discount_amount = round(low_price * discount_pct / 100, 2)
    combo_price = round(main_pred["price"] + low_price - discount_amount, 2)
    profit_after_discount = round(low_profit - discount_amount)

    return jsonify({
        "main_product": {
            "name": main_product,
            "price": main_pred["price"],
            "predicted_sales": main_pred["predicted_sales"],
            "predicted_profit": main_pred["predicted_profit"],
        },
        "combo_product": {
            "name": lowest["product"],
            "category": lowest["category"],
            "price": lowest["price"],
            "predicted_sales": lowest["predicted_sales"],
            "predicted_profit": lowest["predicted_profit"],
        },
        "discount_pct": discount_pct,
        "discount_amount": discount_amount,
        "combo_price": combo_price,
        "profit_after_discount": profit_after_discount,
    })


# ---------------------------------------------------------------------------
# Routes: History & Dashboard
# ---------------------------------------------------------------------------

@app.route("/predictions/history", methods=["GET"])
def prediction_history():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM predictions ORDER BY created_at DESC"
    ).fetchall()
    return jsonify([
        {
            "_id": r["id"],
            "product": r["product"],
            "year": r["year"],
            "predicted_units": r["predicted_units"],
            "predicted_sales": r["predicted_sales"],
            "predicted_profit": r["predicted_profit"],
            "created_at": r["created_at"],
        }
        for r in rows
    ])


@app.route("/dashboard/stats", methods=["GET"])
def dashboard_stats():
    db = get_db()
    total_products = db.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    total_predictions = db.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]

    latest = db.execute(
        "SELECT * FROM predictions ORDER BY created_at DESC LIMIT 1"
    ).fetchone()

    latest_forecast = None
    if latest:
        latest_forecast = {
            "product": latest["product"],
            "year": latest["year"],
            "predicted_sales": latest["predicted_sales"],
        }

    return jsonify({
        "total_products": total_products,
        "total_predictions": total_predictions,
        "latest_forecast": latest_forecast,
    })


# ---------------------------------------------------------------------------
# Start
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "5000"))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Flask server starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
