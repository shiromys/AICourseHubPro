from flask import Flask, jsonify, request, send_from_directory, redirect
from openai import OpenAI, APIError, APIConnectionError, RateLimitError, AuthenticationError
import sys
import re
import traceback
from datetime import datetime, timedelta
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from dotenv import load_dotenv
from flask_migrate import Migrate
from models import User, Course, Enrollment, ContactMessage, AuditLog, SystemSetting, FlaggedPayment, UserActivity, NewsletterSubscriber, NewsletterIssue
from database import db
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
import threading
import resend 
import os
import uuid
import stripe
import time
import psutil
from collections import defaultdict

# --- LOGIN RATE LIMITER ---
# Tracks failed login attempts per IP: {ip: [timestamp, ...]}
_login_attempts = defaultdict(list)
LOGIN_MAX_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 1800  # 30 minute lockout window

# --- GENERIC SLIDING-WINDOW THROTTLE ---
# In-memory, per-process (same trade-off as the login limiter above): good enough
# to stop casual abuse of public endpoints (email-ownership probing, newsletter
# spam, access-link mail-bombing) without adding Redis.
_throttle_hits = defaultdict(list)

def throttled(bucket, key, max_hits, window_seconds):
    """Records a hit and returns True if `key` has exceeded `max_hits` in `window_seconds`."""
    now = time.time()
    k = f"{bucket}:{key}"
    hits = [t for t in _throttle_hits[k] if now - t < window_seconds]
    if len(hits) >= max_hits:
        _throttle_hits[k] = hits
        return True
    hits.append(now)
    _throttle_hits[k] = hits
    return False

def client_ip():
    fwd = request.headers.get('X-Forwarded-For', '')
    return (fwd.split(',')[0].strip() if fwd else request.remote_addr) or 'unknown'

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

# Load environment variables
load_dotenv() 

# ==========================================
# 1. INITIALIZATION & CONFIGURATION
# ==========================================

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")

# --- CORS CONFIGURATION ---
# after_request handler below applies headers explicitly per-response.
# Flask-CORS handles preflight (OPTIONS) auto-responses.
# --- CORS CONFIGURATION ---
# after_request handler below applies headers explicitly per-response.
# Flask-CORS handles preflight (OPTIONS) auto-responses.
# ALLOWED_ORIGINS env var (comma-separated) lets staging/preview add its own
# frontend URL without ever needing another code change here. If unset,
# defaults to production only - safe, unchanged behavior.
_default_origins = ["https://aicoursehubpro.com", "https://www.aicoursehubpro.com"]
_extra_origins = [o.strip() for o in os.environ.get("EXTRA_CORS_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = _default_origins + _extra_origins

CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

# --- MAIL CONFIGURATION ---
app.config['MAIL_SERVER'] = 'smtp.resend.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'resend'
app.config['MAIL_PASSWORD'] = os.environ.get('RESEND_API_KEY') 
app.config['MAIL_DEFAULT_SENDER'] = ("AICourseHubPro", "info@aicoursehubpro.com")

mail = Mail(app)

# --- DATABASE CONFIGURATION ---
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL environment variable is not set.")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'pool_timeout': 10,
    'connect_args': {'connect_timeout': 10}
}
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# --- API KEYS ---
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
resend.api_key = os.getenv("RESEND_API_KEY")

# --- DOMAIN ---
DOMAIN = os.getenv("FRONTEND_URL", "http://localhost:5173")

# --- STRIPE PRICE IDs ---
# Stable Price IDs per course for GTM conversion tracking.
STRIPE_COURSE_PRICE_IDS = {
    "AI for Human Resources / Talent / People Ops via Prompts": "price_1TYrRQLs3W3AEhCNuV7RiObK",
    "Prompt-Based Tools for Education & Learning":              "price_1TYrSfLs3W3AEhCN2a836gZE",
    "Prompting for Automation and Workflow Efficiency":         "price_1TYrUdLs3W3AEhCNA5UvTrOX",
    "Prompt-Based Analytics and Reports for Business":          "price_1TYrUuLs3W3AEhCNN8I0FmJu",
    "Prompt Engineering for Non-Profits and Social Impact":     "price_1TYrV9Ls3W3AEhCNZip5Qp33",
    "Prompt-Based AI for Local Government and Public Services": "price_1TYrVPLs3W3AEhCNwxVxOzmU",
}
# Stable Product ID for Pro Bundle - dynamic price preserves discount logic
STRIPE_BUNDLE_PRODUCT_ID = "prod_UXxT1JUivTu9Qt"

# --- FILE PATHS ---
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['COURSES_FOLDER'] = os.path.join(app.static_folder, 'courses')

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# Create Folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['COURSES_FOLDER'], exist_ok=True)

# Create Database Tables
# with app.app_context():
#     db.create_all()


@app.route('/api/health')
def health():
    return jsonify({"status": "awake"}), 200

@app.route('/api/admin/system-health', methods=['GET'])
@jwt_required()
def get_system_health():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    # Database check + response time
    db_start = time.time()
    db_ok = False
    try:
        db.session.execute(db.text('SELECT 1'))
        db_ok = True
    except Exception:
        db_ok = False
    db_ms = round((time.time() - db_start) * 1000, 1)

    # API response time (self-measured from this request start)
    api_ms = round((time.time() - db_start) * 1000 + db_ms, 1)

    # System metrics
    try:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        memory_pct = mem.percent
        disk_pct = disk.percent
    except Exception:
        cpu = 0
        memory_pct = 0
        disk_pct = 0

    # Total users and enrollments
    total_users = User.query.filter_by(is_deleted=False).count()
    total_enrollments = Enrollment.query.count()

    # Stripe check - just verify key is set
    stripe_ok = bool(os.getenv('STRIPE_SECRET_KEY'))

    return jsonify({
        "db_connected": db_ok,
        "db_response_ms": db_ms,
        "api_response_ms": api_ms,
        "cpu_percent": cpu,
        "memory_percent": memory_pct,
        "disk_percent": disk_pct,
        "stripe_active": stripe_ok,
        "total_users": total_users,
        "total_enrollments": total_enrollments,
        "timestamp": datetime.utcnow().isoformat()
    })
    try:
        pat = os.getenv('HASHNODE_PAT', '').strip()
        response = http_requests.post(
            'https://gql.hashnode.com',
            json={'query': query},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {pat}' if pat else ''
            },
            timeout=10,
            allow_redirects=False
        )
        if not response.text or not response.text.strip():
            return jsonify({'error': 'Empty response from Hashnode', 'http_status': response.status_code, 'posts': []}), 500
        data = response.json()
        edges = data.get('data', {}).get('publication', {}).get('posts', {}).get('edges', [])
        posts = [edge['node'] for edge in edges]
        return jsonify({'posts': posts}), 200
    except Exception as e:
        raw = response.text[:300] if 'response' in locals() else 'no response object'
        return jsonify({'error': str(e), 'http_status': response.status_code if 'response' in locals() else 0, 'raw_response': raw, 'posts': []}), 500



@app.before_request
def enforce_https():
    # OPTIONS preflight must pass through to Flask-CORS completely untouched
    if request.method == 'OPTIONS':
        return None  # Let Flask-CORS handle it fully

    if request.headers.get('X-Forwarded-Proto') == 'http':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

@app.after_request
def add_cors_headers(response):
    # Belt-and-suspenders: ensure CORS headers are always present on every response
    origin = request.headers.get('Origin', '')
    allowed_origins = ALLOWED_ORIGINS
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================

def send_email(to_email, subject, html_content, sender_name="AICourseHubPro", sender_email="info@aicoursehubpro.com", headers=None):
    try:
        params = {
            "from": f"{sender_name} <{sender_email}>", 
            "to": to_email,
            "subject": subject,
            "html": html_content
        }
        if headers:
            params["headers"] = headers  # e.g. List-Unsubscribe for newsletters
        r = resend.Emails.send(params)
        print(f"--- EMAIL SUCCESS: Sent to {to_email} ---", flush=True)
        return True
    except Exception as e:
        print(f"--- EMAIL ERROR: Failed to send to {to_email}: {e} ---", file=sys.stderr, flush=True)
        return False

def get_email_template(title, body_content, button_text=None, button_url=None):
    button_html = ""
    if button_text and button_url:
        button_html = f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{button_url}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-family: sans-serif;">
                {button_text}
            </a>
        </div>
        """
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000000; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">AICourseHubPro</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            <h2 style="color: #dc2626; margin-top: 0;">{title}</h2>
            {body_content}
            {button_html}
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Happy Learning,<br>
                <strong>Team AICourseHubPro</strong>
            </p>
        </div>
    </div>
    """

# ==========================================
# 3. AUTH ROUTES
# ==========================================

@app.route('/api/signup', methods=['POST'])
def signup():
    print("--- DEBUG: Signup Request Started ---", flush=True)
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password')
        name = data.get('name')

        if not email or not password or not name:
            return jsonify({"msg": "All fields are required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"msg": "User already exists"}), 400

        hashed_pw = generate_password_hash(password)
        new_user = User(
            email=email, 
            password=hashed_pw, 
            name=name,
            is_admin=False,
            is_deleted=False,
            role='student', # Explicitly set role
            account_setup_complete=True, # Normal signup = full account immediately
            signup_source='signup'
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        try:
            db.session.refresh(new_user)
            user_id = new_user.id
        except Exception as e:
            print(f"--- WARNING: Refresh failed: {e} ---")
            user_id = None

        print(f"--- DEBUG: User saved. ID: {user_id} ---", flush=True)

        try:
            html_body = f"""<p>Hello {name},</p><p>Welcome to AICourseHubPro! Your account has been created successfully.</p>"""
            email_content = get_email_template("Welcome! 🚀", html_body, "Login Now", f"{DOMAIN}/login")
            send_email(email, "Welcome to AICourseHubPro!", email_content)
        except Exception as e:
            print(f"--- EMAIL WARNING: {e} ---")

        log_activity(user_id, 'signup', detail='Created an account (email signup)')
        return jsonify({"msg": "Signup successful", "user_id": user_id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"--- CRITICAL SIGNUP ERROR: {str(e)} ---", file=sys.stderr, flush=True)
        return jsonify({"msg": "Signup failed on server", "error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data['email'].strip().lower()
    password = data['password']

    # --- RATE LIMITING ---
    ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
    now = time.time()
    attempts = _login_attempts[ip]

    # If already at max attempts, check if lockout window has passed from FIRST attempt
    if len(attempts) >= LOGIN_MAX_ATTEMPTS:
        lockout_started = attempts[0]
        if now - lockout_started < LOGIN_WINDOW_SECONDS:
            remaining_secs = int(LOGIN_WINDOW_SECONDS - (now - lockout_started))
            remaining_mins = max(1, remaining_secs // 60)
            return jsonify({"msg": f"Account temporarily locked. Please try again in {remaining_mins} minute(s)."}), 429
        else:
            # Lockout window has fully expired — reset
            _login_attempts[ip] = []

    user = User.query.filter_by(email=email).first()
    
    # 1. Credential Check
    if not user or not check_password_hash(user.password, password):
        if user:
            log_activity(user.id, 'login_failed', detail='Failed login attempt (wrong password)')
        _login_attempts[ip].append(now)  # Record failed attempt
        attempts_left = LOGIN_MAX_ATTEMPTS - len(_login_attempts[ip])
        if attempts_left > 0:
            return jsonify({"msg": f"Incorrect credentials. {attempts_left} attempt(s) remaining."}), 401
        return jsonify({"msg": "Account temporarily locked. Please try again in 30 minutes."}), 429

    # Successful login — clear failed attempts for this IP
    _login_attempts[ip] = []

    # 2. Status Check
    if user.is_deleted:
        return jsonify({"msg": "Account deactivated"}), 403

    if user.ban_expiry and user.ban_expiry > datetime.utcnow():
        return jsonify({"msg": "Your account has been temporarily suspended. Please contact support."}), 403

    # --- 3. ANALYTICS UPDATE ---
    try:
        user.last_login = datetime.utcnow()
        user.login_count = (user.login_count or 0) + 1
        db.session.commit()
    except Exception as e:
        print(f"Analytics update failed: {e}")
        db.session.rollback()

    log_activity(user.id, 'login', detail='Logged in')

    # 4. Token Generation
    token = create_access_token(identity=str(user.id))
    role = "admin" if user.is_admin else "student"
    
    return jsonify({
        "token": token, 
        "name": user.name, 
        "user_role": role,
        "is_admin": user.is_admin
    })

# ==========================================
# 4. CONTACT & UTILITY ROUTES
# ==========================================

@app.route('/api/contact', methods=['POST'])
def contact_form():
    data = request.json
    name = data.get('firstName', 'User')
    user_email = data.get('email')
    subject = data.get('subject', 'General Inquiry')
    message = data.get('message')

    new_msg = ContactMessage(name=name, email=user_email, subject=subject, message=message)
    db.session.add(new_msg)
    db.session.commit()

    admin_html = f"<h3>From: {name} ({user_email})</h3><p>{message}</p>"
    # FIXED: Send directly to the real inbox to bypass Dynadot forwarder spam blocks
    send_email("support@shirotechnologies.com", f"New Inquiry: {subject}", admin_html, "Contact Form", "no-reply@aicoursehubpro.com")
    
    user_html = f"<p>Hi {name}, we received your message regarding '{subject}'. We will get back to you shortly.</p>"
    send_email(user_email, "We received your message", get_email_template("Message Received", user_html))

    return jsonify({"msg": "Message sent"}), 200

# ==========================================
# 5. USER MANAGEMENT ROUTES
# ==========================================

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id) # FIXED: Modern syntax
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    users = User.query.filter_by(is_deleted=(request.args.get('type') == 'deleted')).order_by(User.id.desc()).all()
    
    return jsonify([{
        "id": u.id, "name": u.name, "email": u.email,
        "role": "Admin" if u.is_admin else "Student",
        "status": "Banned" if u.ban_expiry and u.ban_expiry > datetime.utcnow() else "Active",
        "ban_expiry": str(u.ban_expiry) if u.ban_expiry else None,
        "account_setup_complete": bool(u.account_setup_complete),
        "signup_source": u.signup_source
    } for u in users])

@app.route('/api/users/<int:user_id>/grant-course', methods=['POST'])
@jwt_required()
def admin_grant_course(user_id):
    """Support tool: manually create an enrollment when a customer paid but
    never got unlocked (e.g. both the browser call and the webhook somehow
    failed for the same payment - rare, but this is the manual fallback)."""
    admin_id = get_jwt_identity()
    admin = db.session.get(User, admin_id)
    if not admin or not admin.is_admin:
        return jsonify({"msg": "Admin only"}), 403

    data = request.json or {}
    course_id = data.get('course_id')
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({"msg": "User not found"}), 404

    if Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first():
        return jsonify({"msg": f"{target_user.name} already has access to {course.title}"}), 200

    db.session.add(Enrollment(
        user_id=user_id, course_id=course_id,
        status='in-progress', progress=0,
        enrolled_at=datetime.utcnow()
    ))
    db.session.commit()
    log_activity(user_id, 'course_granted', detail=f"Admin {admin.email} granted access to {course.title}", course_id=course.id)

    return jsonify({"msg": f"Access to {course.title} granted to {target_user.name}"}), 200

@app.route('/api/users/<int:user_id>/send-reset', methods=['POST'])
@jwt_required()
def admin_send_reset(user_id):
    """Support tool: trigger the same password-reset email as the self-service
    Forgot Password form, on a customer's behalf - for 'I can't log in' support
    requests, works for guest accounts and full accounts alike."""
    admin_id = get_jwt_identity()
    admin = db.session.get(User, admin_id)
    if not admin or not admin.is_admin:
        return jsonify({"msg": "Admin only"}), 403

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({"msg": "User not found"}), 404

    token = create_access_token(identity=str(target_user.id), expires_delta=timedelta(minutes=15))
    link = f"{DOMAIN}/reset-password?token={token}"
    body_content = f"""
    <p>Hi {target_user.name},</p>
    <p>Our support team has triggered a password reset for your account. Click below to set a new password.</p>
    <p>This link expires in 15 minutes.</p>
    """
    html_content = get_email_template(
        title="Reset Your Password 🔓",
        body_content=body_content,
        button_text="Reset Password",
        button_url=link
    )
    send_email(
        to_email=target_user.email,
        subject="Reset Your Password",
        html_content=html_content,
        sender_name="AICourseHubPro Security",
        sender_email="no-reply@aicoursehubpro.com"
    )

    return jsonify({"msg": f"Password reset email sent to {target_user.email}"}), 200

@app.route('/api/flagged-payments', methods=['GET'])
@jwt_required()
def get_flagged_payments():
    """Admin queue of 'paid for a course already owned' incidents needing manual
    refund review - populated by resolve_guest_checkout, never auto-refunded."""
    admin_id = get_jwt_identity()
    admin = db.session.get(User, admin_id)
    if not admin or not admin.is_admin:
        return jsonify({"msg": "Admin only"}), 403

    show_resolved = request.args.get('resolved') == 'true'
    flags = FlaggedPayment.query.filter_by(resolved=show_resolved).order_by(FlaggedPayment.created_at.desc()).all()

    output = []
    for f in flags:
        user = db.session.get(User, f.user_id)
        course = db.session.get(Course, f.course_id)
        output.append({
            "id": f.id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "course_title": course.title if course else f"course_id={f.course_id}",
            "stripe_session_id": f.stripe_session_id,
            "payment_intent_id": f.payment_intent_id,
            "created_at": str(f.created_at) if f.created_at else None,
            "resolved": f.resolved,
            "resolved_at": str(f.resolved_at) if f.resolved_at else None
        })
    return jsonify(output), 200

@app.route('/api/flagged-payments/<int:flag_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_flagged_payment(flag_id):
    """Admin marks a flagged duplicate-payment as handled, after refunding it
    manually in Stripe Dashboard. Doesn't touch Stripe itself - just tracking."""
    admin_id = get_jwt_identity()
    admin = db.session.get(User, admin_id)
    if not admin or not admin.is_admin:
        return jsonify({"msg": "Admin only"}), 403

    flag = db.session.get(FlaggedPayment, flag_id)
    if not flag:
        return jsonify({"msg": "Flagged payment not found"}), 404

    flag.resolved = True
    flag.resolved_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"msg": "Marked as resolved"}), 200

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id) # FIXED
    if not user: return jsonify({"msg": "User not found"}), 404
        
    data = request.json
    if 'name' in data and data['name']: user.name = data['name']
    if 'password' in data and data['password']:
        if len(data['password']) < 6: return jsonify({"msg": "Password too short"}), 400
        user.password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        # Same fix as reset_password: however they set a real password - dedicated
        # Account Setup page, Forgot Password, or here - it should count.
        if not user.account_setup_complete:
            user.account_setup_complete = True

    db.session.commit()
    changed = [k for k in ('name', 'password') if data.get(k)]
    if changed:
        log_activity(user.id, 'profile_update', detail='Updated: ' + ', '.join(changed))
    return jsonify({"msg": "Profile updated successfully", "name": user.name, "account_setup_complete": bool(user.account_setup_complete)})

@app.route('/api/users/<int:user_id>/ban', methods=['POST'])
@jwt_required()
def ban_user(user_id):
    current_user_id = get_jwt_identity()
    admin = db.session.get(User, current_user_id) # FIXED
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    user = db.session.get(User, user_id) # FIXED
    if not user: return jsonify({"msg": "User not found"}), 404
    
    days = request.json.get('days')
    if days:
        user.ban_expiry = datetime.utcnow() + timedelta(days=int(days))
        msg = f"User banned for {days} days"
    else:
        user.ban_expiry = None
        msg = "User unbanned"
        
    db.session.commit()
    log_activity(user_id, 'ban_change', detail=f"{msg} (by {admin.email})")
    return jsonify({"msg": msg})

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id) # FIXED
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    total_revenue = db.session.query(func.sum(Course.price))\
        .join(Enrollment, Course.id == Enrollment.course_id).scalar() or 0.0

    total_students = User.query.filter_by(is_admin=False, is_deleted=False).count()
    total_courses = Course.query.filter_by(is_deleted=False).count()

    chart_data = []
    end_date = datetime.utcnow()
    for i in range(6, -1, -1):
        day = end_date - timedelta(days=i)
        day_revenue = db.session.query(func.sum(Course.price))\
            .join(Enrollment, Course.id == Enrollment.course_id)\
            .filter(func.date(Enrollment.enrolled_at) == day.date())\
            .scalar() or 0
        chart_data.append({ "name": day.strftime('%b %d'), "revenue": float(day_revenue) })

    recent_msgs = ContactMessage.query.filter_by(is_read=False)\
        .order_by(ContactMessage.created_at.desc()).limit(5).all()
    
    messages_preview = [{
        "id": m.id, "name": m.name, "subject": m.subject, "time": m.created_at.strftime('%H:%M')
    } for m in recent_msgs]

    return jsonify({
        "revenue": total_revenue,
        "students": total_students,
        "courses": total_courses,
        "uptime": "99.9%",
        "chart_data": chart_data,       
        "recent_messages": messages_preview 
    })

@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def get_admin_analytics():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    # --- CONVERSION FUNNEL ---
    total_registered = User.query.filter_by(is_admin=False, is_deleted=False).count()
    enrolled_user_ids = db.session.query(Enrollment.user_id).distinct().all()
    total_paid = len(enrolled_user_ids)
    # Count users enrolled in all 6 courses (bundle equivalent)
    total_courses = Course.query.filter_by(is_deleted=False).count()
    bundle_buyers = db.session.query(Enrollment.user_id)\
        .group_by(Enrollment.user_id)\
        .having(func.count(Enrollment.course_id) >= total_courses).count()

    conversion_rate = round((total_paid / total_registered * 100), 1) if total_registered > 0 else 0
    bundle_rate = round((bundle_buyers / total_paid * 100), 1) if total_paid > 0 else 0

    funnel = [
        { "stage": "Registered", "count": total_registered, "pct": 100 },
        { "stage": "Purchased", "count": total_paid, "pct": round(total_paid / total_registered * 100, 1) if total_registered > 0 else 0 },
        { "stage": "Bundle Buyers", "count": bundle_buyers, "pct": round(bundle_buyers / total_registered * 100, 1) if total_registered > 0 else 0 },
    ]

    # --- USER GROWTH (last 30 days) ---
    growth = []
    for i in range(29, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        count = User.query.filter(
            User.is_admin == False,
            User.is_deleted == False,
            func.date(User.created_at) == day.date()
        ).count()
        growth.append({ "date": day.strftime('%b %d'), "users": count })

    # --- REVENUE CHART (last 30 days, real data) ---
    revenue_chart = []
    for i in range(29, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_revenue = db.session.query(func.sum(Course.price))\
            .join(Enrollment, Course.id == Enrollment.course_id)\
            .filter(func.date(Enrollment.enrolled_at) == day.date())\
            .scalar() or 0
        revenue_chart.append({ "date": day.strftime('%b %d'), "revenue": float(day_revenue) })

    # --- COURSE PERFORMANCE ---
    courses = Course.query.filter_by(is_deleted=False).all()
    course_performance = []
    for c in courses:
        enrollments = Enrollment.query.filter_by(course_id=c.id).all()
        total_enr = len(enrollments)
        completed = len([e for e in enrollments if e.status == 'completed'])
        completion_rate = round(completed / total_enr * 100, 1) if total_enr > 0 else 0
        revenue = total_enr * c.price
        course_performance.append({
            "title": c.title,
            "enrolled": total_enr,
            "completed": completed,
            "completion_rate": completion_rate,
            "revenue": revenue
        })
    course_performance.sort(key=lambda x: x['enrolled'], reverse=True)

    # --- KEY METRICS ---
    never_purchased = total_registered - total_paid
    purchased_never_started = db.session.query(Enrollment.user_id).filter(Enrollment.progress == 0).distinct().count()
    started_never_completed = db.session.query(Enrollment.user_id).filter(
        Enrollment.progress > 0, Enrollment.status != 'completed'
    ).distinct().count()

    total_revenue = db.session.query(func.sum(Course.price))\
        .join(Enrollment, Course.id == Enrollment.course_id).scalar() or 0

    return jsonify({
        "funnel": funnel,
        "conversion_rate": conversion_rate,
        "bundle_rate": bundle_rate,
        "growth": growth,
        "revenue_chart": revenue_chart,
        "course_performance": course_performance,
        "key_metrics": {
            "never_purchased": never_purchased,
            "purchased_never_started": purchased_never_started,
            "started_never_completed": started_never_completed,
            "total_revenue": float(total_revenue),
            "avg_revenue_per_user": round(float(total_revenue) / total_paid, 2) if total_paid > 0 else 0
        }
    })

@app.route('/api/admin/reset-test-data', methods=['DELETE'])
@jwt_required()
def reset_test_data():
    """Delete all enrollments and non-admin users created before a given cutoff date."""
    current_user_id = get_jwt_identity()
    admin = db.session.get(User, current_user_id)
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    cutoff_str = request.json.get('cutoff_date')
    if not cutoff_str:
        return jsonify({"msg": "cutoff_date required"}), 400

    try:
        cutoff = datetime.strptime(cutoff_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({"msg": "Invalid date format. Use YYYY-MM-DD"}), 400

    try:
        # Step 1: Find users to delete
        users_to_delete = User.query.filter(
            User.created_at < cutoff,
            User.is_admin == False,
            User.id != int(current_user_id)
        ).all()
        user_ids = [u.id for u in users_to_delete]

        # Step 2: Delete ALL enrollments before cutoff date
        deleted_enrollments = Enrollment.query.filter(
            Enrollment.enrolled_at < cutoff
        ).delete(synchronize_session='fetch')

        # Step 3: Delete any remaining enrollments for those users
        if user_ids:
            Enrollment.query.filter(
                Enrollment.user_id.in_(user_ids)
            ).delete(synchronize_session='fetch')

        db.session.flush()

        # Step 4: Now safe to delete users
        deleted_users = len(users_to_delete)
        for u in users_to_delete:
            db.session.delete(u)

        db.session.commit()
        log_action(admin.email, "RESET_TEST_DATA", f"Deleted {deleted_enrollments} enrollments and {deleted_users} users before {cutoff_str}")

        return jsonify({
            "msg": "Test data cleared",
            "deleted_enrollments": deleted_enrollments,
            "deleted_users": deleted_users
        })
    except Exception as e:
        db.session.rollback()
        print(f"[RESET ERROR] {str(e)}")
        return jsonify({"msg": f"Failed: {str(e)}"}), 500

@app.route('/api/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    current_user_id = get_jwt_identity()
    admin = db.session.get(User, current_user_id) # FIXED
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    user = db.session.get(User, user_id) # FIXED
    if not user: return jsonify({"msg": "User not found"}), 404
    
    data = request.json
    if 'is_admin' in data:
        user.is_admin = data['is_admin']
        db.session.commit()
        return jsonify({"msg": "Role updated"})
    return jsonify({"msg": "No changes"}), 400

@app.route('/api/users/<int:user_id>/delete', methods=['DELETE'])
@jwt_required()
def soft_delete_user(user_id):
    current_user_id = get_jwt_identity()
    admin = db.session.get(User, current_user_id) # FIXED
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    user = db.session.get(User, user_id) # FIXED
    if not user: return jsonify({"msg": "User not found"}), 404
    
    user.is_deleted = True
    db.session.commit()
    return jsonify({"msg": "User deleted"})

@app.route('/api/users/<int:user_id>/restore', methods=['POST'])
@jwt_required()
def restore_user(user_id):
    current_user_id = get_jwt_identity()
    admin = db.session.get(User, current_user_id) # FIXED
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    user = db.session.get(User, user_id) # FIXED
    if user:
        user.is_deleted = False
        db.session.commit()
    return jsonify({"msg": "User restored"})

# ==========================================
# 6. COURSE ROUTES
# ==========================================

@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        courses = Course.query.filter((Course.is_deleted == False) | (Course.is_deleted == None)).all()
        output = [{
            'id': c.id, 'title': c.title, 'description': c.description,
            'price': c.price, 'category': c.category,
            'modules': c.course_data.get('modules', []) if c.course_data else []
        } for c in courses]
        return jsonify(output), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/courses', methods=['POST'])
@jwt_required()
def create_course():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id) # FIXED
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    data = request.json
    if not data.get('title'): return jsonify({"msg": "Title required"}), 400

    new_course = Course(
        title=data.get('title'),
        description=data.get('description', ''),
        price=float(data.get('price', 29.0)),
        category=data.get('category', 'General'),
        course_data={"modules": data.get('modules', [])},
        is_active=True, is_deleted=False
    )
    db.session.add(new_course)
    db.session.commit()
    return jsonify(new_course.to_dict()), 201

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id) # FIXED
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    course = db.session.get(Course, course_id) # FIXED
    if not course: return jsonify({"msg": "Course not found"}), 404

    data = request.json or {}

    # --- Replacing the curriculum needs care: learners are mid-course against the OLD layout ---
    structure_warnings = []
    learner_report = None
    if 'modules' in data:
        modules = data['modules']
        old_modules = (course.course_data or {}).get('modules', [])
        # Block only problems this edit would ADD, so a legacy course with a quirk can still be
        # saved for a title/price change; but a bad upload can't blank out or break a live course.
        known = set(validate_course_modules(old_modules)) if old_modules else set()
        problems = [p for p in validate_course_modules(modules) if p not in known]
        if problems:
            return jsonify({"msg": "The course structure is invalid: " + "; ".join(problems[:5])}), 400
        last_lesson = modules[-1]['lessons'][-1]
        if modules != old_modules and (last_lesson.get('type') != 'quiz' or not last_lesson.get('questions')):
            structure_warnings.append("The final lesson is not a quiz with questions. Certificates are issued when a learner finishes the final lesson, so it should be the quiz.")
        mode = data.get('learner_progress', 'clamp')
        if mode not in ('clamp', 'reset'):
            return jsonify({"msg": "learner_progress must be 'clamp' or 'reset'"}), 400
        shape = lambda mods: [len(m.get('lessons', [])) for m in mods]
        if modules != old_modules:
            # Only a change in layout (module/lesson counts) can strand learners; a pure text edit can't.
            if shape(modules) != shape(old_modules):
                learner_report = remap_learner_progress(course, modules, mode)
                detail_tail = (f"{learner_report['in_progress']} in-progress learners "
                               f"{'reset to the start' if mode == 'reset' else 'kept in place (clamped)'}, "
                               f"{learner_report['completed']} completed learners untouched")
            else:
                detail_tail = "layout unchanged, learner progress untouched"
            db.session.add(AuditLog(
                admin_email=user.email, action="Course Content Replaced",
                details=f"{course.title} (id {course.id}): {len(modules)} modules; {detail_tail}",
                timestamp=datetime.utcnow()))
        course.course_data = {"modules": modules}

    if 'title' in data: course.title = data['title']
    if 'description' in data: course.description = data['description']
    if 'price' in data: course.price = float(data['price'])
    if 'category' in data: course.category = data['category']

    db.session.commit()
    resp = {"msg": "Updated", "course": course.to_dict()}
    if learner_report: resp["learners"] = learner_report
    if structure_warnings: resp["warnings"] = structure_warnings
    return jsonify(resp)


def validate_course_modules(modules):
    """Structural sanity check so a bad upload can't blank out a live course."""
    if not isinstance(modules, list) or not modules:
        return ["modules must be a non-empty list"]
    problems = []
    for mi, m in enumerate(modules):
        if not isinstance(m, dict) or not str(m.get('title', '')).strip():
            problems.append(f"module {mi + 1} has no title"); continue
        lessons = m.get('lessons')
        if not isinstance(lessons, list) or not lessons:
            problems.append(f"module {mi + 1} has no lessons"); continue
        for li, l in enumerate(lessons):
            if not isinstance(l, dict) or not str(l.get('title', '')).strip():
                problems.append(f"module {mi + 1}, lesson {li + 1} has no title")
            elif l.get('type') == 'quiz':
                for qi, q in enumerate(l.get('questions') or []):
                    if not isinstance(q, dict) or q.get('correct_answer') not in (q.get('options') or {}):
                        problems.append(f"quiz in module {mi + 1}: question {qi + 1} has a correct_answer that is not one of its options")
    return problems


def remap_learner_progress(course, new_modules, mode):
    """Keeps in-progress learners inside the new layout. 'clamp' keeps their saved position when it
    still exists and otherwise moves them to the nearest valid lesson; 'reset' sends them back to the
    start. Learners who already COMPLETED the course are never touched: they keep their certificate."""
    report = {"in_progress": 0, "completed": 0, "moved": 0}
    total_modules = len(new_modules)
    for e in Enrollment.query.filter_by(course_id=course.id).all():
        if e.status == 'completed':
            report["completed"] += 1
            continue
        report["in_progress"] += 1
        old_m, old_l = e.last_module_index or 0, e.last_lesson_index or 0
        if mode == 'reset':
            m, l = 0, 0
            e.score = 0
        else:
            m = min(max(old_m, 0), total_modules - 1)
            lessons = new_modules[m]['lessons']
            l = min(max(old_l if m == old_m else 0, 0), len(lessons) - 1)
        if (m, l) != (old_m, old_l):
            report["moved"] += 1
        e.last_module_index, e.last_lesson_index = m, l
        # same formula the player uses when it saves progress
        e.progress = 0 if (mode == 'reset' or (m, l) == (0, 0)) else min(90, round(((m + 1) / total_modules) * 100))
    return report


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id) # FIXED
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    course = db.session.get(Course, course_id) # FIXED
    if not course: return jsonify({"msg": "Course not found"}), 404

    course.is_deleted = True
    db.session.commit()
    return jsonify({"msg": "Archived"})

# ==========================================
# 6b. SHARED HELPERS: ACTIVITY LOG + DUPLICATE-PAYMENT FLAGGING
# ==========================================

def log_activity(user_id, event_type, detail=None, path=None, course_id=None):
    """Appends one row to the user's digital footprint. Never raises - tracking must
    not be able to break login, payment or learning. Call it AFTER your own commit
    (a failure here rolls the session back)."""
    try:
        if not user_id:
            return
        ip = ua = None
        try:
            ip = client_ip()
            ua = (request.headers.get('User-Agent') or '')[:300]
        except RuntimeError:
            pass  # outside a request (e.g. background thread)
        db.session.add(UserActivity(
            user_id=int(user_id), event_type=event_type, path=(path or None) and path[:255],
            course_id=course_id, detail=(detail or None) and detail[:1000],
            ip_address=ip, user_agent=ua, created_at=datetime.utcnow()
        ))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"log_activity failed ({event_type}): {e}", flush=True)


def flag_duplicate_payment(user, course_id, session_id, payment_intent_id=None, payer_email=None):
    """Records a payment that arrived for a course the user ALREADY owns, so a human
    can refund it. This is the backstop behind the pre-checkout ownership check
    (create_checkout_session) - it only fires for races (two tabs/devices paying at
    once, an old Stripe link opened later) and never moves money automatically.

    Idempotent on stripe_session_id (unique in the DB): the browser's verify-payment
    call and Stripe's webhook can both land on the same session, and only the first
    creates the row / sends the alert + customer email.

    Returns (flag, created). `created` is False when this session was already flagged."""
    existing = FlaggedPayment.query.filter_by(stripe_session_id=session_id).first() if session_id else None
    if existing:
        return existing, False

    flag = FlaggedPayment(
        user_id=user.id, course_id=course_id, stripe_session_id=session_id,
        payment_intent_id=payment_intent_id, created_at=datetime.utcnow(), resolved=False
    )
    db.session.add(flag)
    try:
        db.session.commit()
    except IntegrityError:
        # Lost the race to the other path - it already flagged this session.
        db.session.rollback()
        return FlaggedPayment.query.filter_by(stripe_session_id=session_id).first(), False

    course = db.session.get(Course, course_id)
    course_title = course.title if course else f"course_id={course_id}"
    email = payer_email or user.email

    internal_alert_html = (
        f"<h3>Duplicate purchase detected — needs manual refund review</h3>"
        f"<p><strong>Customer:</strong> {user.name} ({email})</p>"
        f"<p><strong>Course already owned:</strong> {course_title}</p>"
        f"<p><strong>Stripe session ID:</strong> {session_id}</p>"
        f"<p><strong>Stripe payment intent:</strong> {payment_intent_id or 'unavailable'}</p>"
        f"<p>The pre-checkout ownership check should normally stop this, so this is a race "
        f"(two payments in flight) or an old checkout link. No refund has been issued "
        f"automatically — review it in the admin panel's Flagged Payments tab, or in the "
        f"Stripe Dashboard directly, and refund if appropriate.</p>"
    )
    threading.Thread(
        target=send_email,
        args=("support@shirotechnologies.com", f"Duplicate Purchase — Review Needed ({course_title})", internal_alert_html, "AICourseHubPro Alerts", "no-reply@aicoursehubpro.com"),
        daemon=True
    ).start()

    if user.account_setup_complete:
        body = (f"Our records show you already have access to <strong>{course_title}</strong>. "
                f"We've flagged this payment for our team to review, and we'll be in touch shortly "
                f"about your refund. In the meantime, please log in to access your course.")
        btn_text, btn_url = "Log In", f"{DOMAIN}/login"
    else:
        # Still-incomplete guest: no working password, so "log in" is a dead end.
        token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=30))
        body = (f"Our records show you already have access to <strong>{course_title}</strong>. "
                f"We've flagged this payment for our team to review, and we'll be in touch shortly about your refund. "
                f"Here's a link straight back to your course in the meantime.")
        btn_text, btn_url = "Go To Course", f"{DOMAIN}/resume?token={token}&course_id={course_id}"
    html = get_email_template("You Already Own This Course", body, btn_text, btn_url)
    threading.Thread(target=send_email, args=(email, "We're Reviewing Your Payment", html), daemon=True).start()

    print(f"Duplicate payment flagged: user_id={user.id} course_id={course_id} session={session_id} pi={payment_intent_id}", flush=True)
    log_activity(user.id, 'duplicate_payment_flagged', detail=f"Paid again for already-owned course: {course_title}", course_id=course_id)
    return flag, True


# ==========================================
# 7. ENROLLMENT & STRIPE ROUTES
# ==========================================

def send_access_link_email(user, course_id=None):
    """Emails a way back into the account. Guests who never set a password get a
    30-day magic link; real accounts get a login link. Sent in the background."""
    try:
        if user.account_setup_complete:
            html = get_email_template(
                "Your Course Is Waiting",
                "You already have an AICourseHubPro account with access to this course. Log in to pick up where you left off.",
                "Log In", f"{DOMAIN}/login")
        else:
            token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=30))
            link = f"{DOMAIN}/resume?token={token}" + (f"&course_id={course_id}" if course_id else "")
            html = get_email_template(
                "Your Course Is Waiting",
                "Here's your link back into your course. It signs you straight in - no password needed.",
                "Go To My Course", link)
        threading.Thread(target=send_email, args=(user.email, "Your link back into AICourseHubPro", html), daemon=True).start()
    except Exception as e:
        print(f"send_access_link_email failed: {e}", flush=True)


@app.route('/api/request-access-link', methods=['POST'])
def request_access_link():
    """Public 'I already bought this - email me back in' endpoint. Always answers the
    same generic message so it can't be used to discover which emails have accounts."""
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    generic = jsonify({'msg': 'If that email has an account, a link to get back in is on its way.'}), 200
    if not email or not EMAIL_RE.match(email):
        return jsonify({'msg': 'Please enter a valid email address.'}), 400
    if throttled('access_link_ip', client_ip(), 10, 3600) or throttled('access_link_email', email, 3, 3600):
        return generic
    user = User.query.filter_by(email=email).first()
    if user and not user.is_deleted:
        course_id = data.get('course_id')
        owned = Enrollment.query.filter_by(user_id=user.id, course_id=course_id).first() if course_id else None
        send_access_link_email(user, course_id if owned else None)
    return generic


@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    # Auth is OPTIONAL here: logged-in users check out as themselves;
    # anyone else checks out as a guest (Stripe collects their email on the hosted page).
    verify_jwt_in_request(optional=True)
    user_id = get_jwt_identity()  # None for guests

    data = request.json or {}
    course = db.session.get(Course, data.get('course_id')) # FIXED
    if not course or course.is_deleted: return jsonify({'message': 'Course not found'}), 404

    # --- OWNERSHIP CHECK (the actual fix for duplicate payments) ---
    # Nobody gets sent to Stripe for a course they already own.
    guest_email = None
    if user_id:
        if Enrollment.query.filter_by(user_id=user_id, course_id=course.id).first():
            return jsonify({
                'code': 'already_owned',
                'message': 'You already own this course. Open it from your dashboard.',
            }), 409
    else:
        # Guests must tell us their email BEFORE paying, so ownership can be checked
        # up front. The same email is then locked into Stripe (customer_email below),
        # so they can't pay under a different one to dodge the check.
        guest_email = (data.get('email') or '').strip().lower()
        if not guest_email or not EMAIL_RE.match(guest_email) or len(guest_email) > 120:
            return jsonify({'code': 'email_required', 'message': 'Please enter a valid email address to continue.'}), 400

        # Ownership lookups reveal whether an email has bought something, so cap them per IP.
        if throttled('checkout_email', client_ip(), 20, 600):
            return jsonify({'code': 'rate_limited', 'message': 'Too many attempts. Please wait a few minutes and try again.'}), 429

        existing_user = User.query.filter_by(email=guest_email).first()
        if existing_user and not existing_user.is_deleted:
            if Enrollment.query.filter_by(user_id=existing_user.id, course_id=course.id).first():
                # Email them a way back in rather than just refusing.
                send_access_link_email(existing_user, course.id)
                return jsonify({
                    'code': 'already_owned',
                    'message': "This email already has access to this course, so you don't need to pay again. "
                               "We've just emailed you a link to get back in.",
                    'emailed': True,
                }), 409

    try:
        session_kwargs = dict(
            line_items=[{
                # Use stable Stripe Price ID if available for this course (enables GTM tracking).
                # Falls back to dynamic price_data if course title not in the map.
                **(
                    {'price': STRIPE_COURSE_PRICE_IDS[course.title], 'quantity': 1}
                    if course.title in STRIPE_COURSE_PRICE_IDS
                    else {
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {'name': course.title},
                            'unit_amount': int(course.price * 100),
                        },
                        'quantity': 1,
                    }
                ),
            }],
            mode='payment',
            success_url=f"{DOMAIN}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&course_id={course.id}&amount={course.price}&price_id={STRIPE_COURSE_PRICE_IDS.get(course.title, '')}&guest={'false' if user_id else 'true'}",
            cancel_url=f"{DOMAIN}/courses",
            metadata={"course_id": str(course.id)},
        )

        if user_id:
            session_kwargs['client_reference_id'] = str(user_id)
            session_kwargs['metadata']['user_id'] = str(user_id)
        else:
            session_kwargs['metadata']['guest'] = 'true'
            # Locks the email on Stripe's page (prefilled, not editable), so the
            # account that gets the course is the one we just ownership-checked.
            session_kwargs['customer_email'] = guest_email

        checkout_session = stripe.checkout.Session.create(**session_kwargs)
        return jsonify({'id': checkout_session.id, 'url': checkout_session.url})
    except Exception as e:
        import traceback
        print(f"CHECKOUT ERROR: {type(e).__name__}: {e}", flush=True)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    


@app.route('/api/create-bundle-checkout', methods=['POST'])
@jwt_required()
def create_bundle_checkout():
    user_id = get_jwt_identity()
    
    # 1. Calculate how many distinct courses they own
    owned_enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    owned_course_ids = set([e.course_id for e in owned_enrollments])
    owned_count = len(owned_course_ids)
    
    # 2. Total courses in system
    total_courses = Course.query.filter((Course.is_deleted == False) | (Course.is_deleted == None)).count()
    
    if owned_count >= total_courses:
        return jsonify({'error': 'You already own all available courses!'}), 400

    # 3. Calculate dynamic price (159 - (owned * 29))
    base_bundle_price = 159.0
    discount = owned_count * 29.0
    final_price = max(base_bundle_price - discount, 0.0)

    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    # Use stable Product ID so GTM can track bundle conversions.
                    # Dynamic unit_amount preserves the per-user discount logic.
                    'product': STRIPE_BUNDLE_PRODUCT_ID,
                    'unit_amount': int(final_price * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{DOMAIN}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&bundle=true&amount={final_price}&price_id={STRIPE_BUNDLE_PRODUCT_ID}",
            cancel_url=f"{DOMAIN}/pricing",
            client_reference_id=str(user_id),
            # NEW: Tag this as a bundle purchase!
            metadata={"user_id": str(user_id), "is_bundle": "true"}
        )
        return jsonify({'id': checkout_session.id, 'url': checkout_session.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    



def resolve_guest_checkout(course_id, session_id, guest_email, guest_name, payment_intent_id=None):
    """Shared by /api/verify-payment (browser) and the Stripe webhook (server-side
    safety net) so a guest's payment is never lost even if their browser tab
    closes before verify-payment runs - Stripe fires the webhook regardless.

    Idempotent on stripe_session_id: whichever path (browser or webhook) reaches
    a given session FIRST does the real work (create/find account, create
    enrollment, send exactly one email). The other path, arriving moments
    later for the same normal successful payment, sees the enrollment already
    tied to this session_id and skips straight to returning the current state
    - no duplicate account, no duplicate enrollment, no duplicate email.

    Returns a dict: {"status": "existing_account" | "guest_enrolled", "user": User}
    """
    guest_email = (guest_email or "").strip().lower()
    if not guest_email:
        return None

    # Already processed by whichever path got here first (browser or webhook)?
    already_processed = Enrollment.query.filter_by(stripe_session_id=session_id).first()
    if already_processed:
        user = db.session.get(User, already_processed.user_id)
        status = 'guest_enrolled' if not user.account_setup_complete else 'existing_account'
        print(f"resolve_guest_checkout: session {session_id} already processed earlier (idempotent replay, no duplicate email sent)", flush=True)
        # If they've since completed account setup between the two calls, that's
        # still fine to report as-is - the browser path mints its own fresh token.
        return {"status": status, "user": user}

    existing_user = User.query.filter_by(email=guest_email).first()

    if existing_user:
        # Applies regardless of account_setup_complete - a still-incomplete guest
        # re-paying for a course they already have needs this exact same check,
        # not just fully-set-up accounts.
        already_owns_this_course = Enrollment.query.filter_by(user_id=existing_user.id, course_id=course_id).first()

        if already_owns_this_course:
            # Backstop only: create_checkout_session now refuses guests whose email
            # already owns the course, so we only get here on a race (two payments in
            # flight) or an old checkout link. Never move money automatically - flag it
            # (idempotent per Stripe session) so a human can refund it.
            flag_duplicate_payment(existing_user, course_id, session_id,
                                   payment_intent_id=payment_intent_id, payer_email=guest_email)

            if existing_user.account_setup_complete:
                return {"status": "already_owned_flagged", "user": existing_user}

            # Still-incomplete guest: hand the browser a fresh token straight back
            # into the course they already own.
            resume_token = create_access_token(identity=str(existing_user.id), expires_delta=timedelta(days=30))
            return {"status": "already_owned_flagged_guest", "user": existing_user, "token": resume_token}

    if existing_user and existing_user.account_setup_complete:
        # Real, already-set-up account, genuinely new course. Don't auto-login -
        # attach enrollment, ask them to log in.
        if not Enrollment.query.filter_by(user_id=existing_user.id, course_id=course_id).first():
            db.session.add(Enrollment(
                user_id=existing_user.id, course_id=course_id,
                status='in-progress', progress=0,
                enrolled_at=datetime.utcnow(), stripe_session_id=session_id
            ))
            db.session.commit()

        course = db.session.get(Course, course_id)
        email_content = get_email_template(
            "Course Unlocked! 🎓",
            f"You have successfully enrolled in {course.title if course else 'your course'}. "
            f"This email address already has an AICourseHubPro account — please log in to access it.",
            "Log In", f"{DOMAIN}/login"
        )
        threading.Thread(target=send_email, args=(guest_email, "Course Unlocked — Log In to Access", email_content), daemon=True).start()
        log_activity(existing_user.id, 'payment', detail=f"Purchased {course.title if course else course_id} (guest checkout, existing account)", course_id=course_id)
        return {"status": "existing_account", "user": existing_user}

    # Brand-new guest, OR the same still-incomplete guest buying another course.
    is_first_purchase = existing_user is None
    if existing_user:
        guest_user = existing_user
    else:
        placeholder_password = generate_password_hash(uuid.uuid4().hex)
        guest_user = User(
            email=guest_email,
            password=placeholder_password,
            name=guest_name or "Student",
            is_admin=False,
            is_deleted=False,
            role='student',
            account_setup_complete=False,
            signup_source='guest_checkout'
        )
        db.session.add(guest_user)
        db.session.commit()
        db.session.refresh(guest_user)

    if not Enrollment.query.filter_by(user_id=guest_user.id, course_id=course_id).first():
        db.session.add(Enrollment(
            user_id=guest_user.id, course_id=course_id,
            status='in-progress', progress=0,
            enrolled_at=datetime.utcnow(), stripe_session_id=session_id
        ))
        db.session.commit()

    resume_token = create_access_token(identity=str(guest_user.id), expires_delta=timedelta(days=30))
    resume_link = f"{DOMAIN}/resume?token={resume_token}&course_id={course_id}"

    course = db.session.get(Course, course_id)
    if is_first_purchase:
        email_subject_line = "Welcome to AICourseHubPro — Your Course is Ready!"
        email_content = get_email_template(
            "Welcome to AICourseHubPro! 🎉",
            f"Hi {guest_user.name}, welcome aboard! Your payment went through and "
            f"you're already enrolled in <strong>{course.title if course else 'your course'}</strong> — "
            f"no account setup needed to get started, just click below and dive right in. "
            f"If you ever close this tab before finishing, use the same button to pick up "
            f"exactly where you left off. To download your certificate later, you'll just need to set a password first.",
            "Start Learning Now", resume_link
        )
    else:
        email_subject_line = "New Course Unlocked!"
        email_content = get_email_template(
            "New Course Unlocked! 🎓",
            f"Hi {guest_user.name}, your payment went through and you're already enrolled in "
            f"<strong>{course.title if course else 'your course'}</strong> — no extra steps needed, just click "
            f"below and dive right in. If you ever close this tab before finishing, use the same button to "
            f"pick up exactly where you left off. To download your certificate later, you'll just need to set a password first.",
            "Start Learning Now", resume_link
        )
    threading.Thread(target=send_email, args=(guest_email, email_subject_line, email_content), daemon=True).start()

    if is_first_purchase:
        log_activity(guest_user.id, 'signup', detail='Account auto-created at guest checkout')
    log_activity(guest_user.id, 'payment', detail=f"Purchased {course.title if course else course_id} (guest checkout)", course_id=course_id)
    return {"status": "guest_enrolled", "user": guest_user}


@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    # Auth is OPTIONAL: logged-in users verify as themselves (unchanged flow below).
    # Guests are identified by the email Stripe collected during checkout.
    verify_jwt_in_request(optional=True)
    user_id = get_jwt_identity()  # None for guests

    data = request.json
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({"msg": "Missing session_id"}), 400

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status != 'paid':
            return jsonify({"msg": "Payment failed"}), 400

        # --- CHANGED: trust what Stripe recorded for this payment, not what the browser sends ---
        # (The same values the webhook already uses. Note: Stripe metadata has no .get(), use `in`.)
        meta = session.metadata
        session_user_id = meta["user_id"] if "user_id" in meta else None
        course_id = int(meta["course_id"]) if "course_id" in meta and meta["course_id"] else None
        is_bundle = ("is_bundle" in meta and meta["is_bundle"] == "true")

        if session_user_id:
            # This payment was made by a logged-in account. Only that account may claim it.
            if not user_id:
                return jsonify({"msg": "Please log in to access your purchase."}), 401
            if str(session_user_id) != str(user_id):
                return jsonify({"msg": "This payment belongs to a different account"}), 403
        else:
            # Guest checkout: ignore any login that happens to be sitting in this browser,
            # so the course goes to the person who actually paid (resolved by Stripe email).
            user_id = None

        if not is_bundle and not course_id:
            return jsonify({"msg": "Could not determine purchased course from Stripe session"}), 400

        # --- GUEST CHECKOUT: no logged-in user, resolve/create account by Stripe email ---
        if not user_id:
            guest_email = session.customer_details.email if session.customer_details else None
            guest_name = session.customer_details.name if session.customer_details else None
            if not guest_email:
                return jsonify({"msg": "Could not determine payer email from Stripe session"}), 400

            result = resolve_guest_checkout(course_id, session_id, guest_email, guest_name, payment_intent_id=session.payment_intent)
            if not result:
                return jsonify({"msg": "Could not determine payer email from Stripe session"}), 400

            if result["status"] == "already_owned_flagged":
                return jsonify({
                    "msg": "You already own this course. Our team has been notified and will follow up about a refund.",
                    "status": "already_owned_flagged",
                }), 200

            if result["status"] == "already_owned_flagged_guest":
                return jsonify({
                    "msg": "You already own this course. Our team has been notified and will follow up about a refund.",
                    "status": "already_owned_flagged_guest",
                    "token": result["token"],
                    "name": result["user"].name,
                    "account_setup_complete": False
                }), 200

            if result["status"] == "existing_account":
                return jsonify({
                    "msg": "Course linked to your existing account. Please log in.",
                    "status": "existing_account",
                }), 200

            # guest_enrolled: mint a fresh token for THIS browser session regardless of
            # whether the account/enrollment was just created here or already existed
            # (e.g. the webhook got there first) - tokens are stateless and cheap to reissue.
            guest_user = result["user"]
            resume_token = create_access_token(identity=str(guest_user.id), expires_delta=timedelta(days=30))
            return jsonify({
                "msg": "Enrolled",
                "status": "guest_enrolled",
                "token": resume_token,
                "name": guest_user.name,
                "account_setup_complete": False
            }), 200

        # --- LOGGED-IN USER FLOW (unchanged) ---
        if True:
            # --- BUNDLE LOGIC ---
            if is_bundle:
                # CHANGED: a bundle payment can only be redeemed once. Without this, replaying an
                # old bundle session_id later would unlock any courses added since.
                if Enrollment.query.filter_by(stripe_session_id=session_id).first():
                    return jsonify({"msg": "Bundle Enrolled", "status": "enrolled", "courses_added": 0}), 200

                all_courses = Course.query.filter((Course.is_deleted == False) | (Course.is_deleted == None)).all()
                owned = [e.course_id for e in Enrollment.query.filter_by(user_id=user_id).all()]

                enrolled_count = 0
                for course in all_courses:
                    if course.id not in owned:
                        new_enr = Enrollment(
                            user_id=user_id, course_id=course.id,
                            status='in-progress', progress=0,
                            enrolled_at=datetime.utcnow(), stripe_session_id=session_id
                        )
                        db.session.add(new_enr)
                        enrolled_count += 1

                db.session.commit()

                user = db.session.get(User, user_id)
                email_content = get_email_template("All-Access Pass Unlocked! 🚀", f"You have successfully unlocked all {enrolled_count} remaining courses.", "Go to Dashboard", f"{DOMAIN}/dashboard")
                send_email(user.email, "Welcome to the All-Access Pass", email_content)

                return jsonify({"msg": "Bundle Enrolled", "status": "enrolled", "courses_added": enrolled_count}), 200

            # --- SINGLE COURSE LOGIC ---
            else:
                existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
                if existing and existing.stripe_session_id != session_id:
                    # Paid, but the course was already owned from a DIFFERENT payment/grant.
                    # (Replaying the same session_id is harmless and falls through below.)
                    user = db.session.get(User, user_id)
                    flag_duplicate_payment(user, course_id, session_id, payment_intent_id=session.payment_intent)
                    return jsonify({
                        "msg": "You already own this course. Our team has been notified and will follow up about a refund.",
                        "status": "already_owned_flagged",
                    }), 200

                if not existing:
                    new_enrollment = Enrollment(
                        user_id=user_id, course_id=course_id,
                        status='in-progress', progress=0,
                        enrolled_at=datetime.utcnow(), stripe_session_id=session_id
                    )
                    db.session.add(new_enrollment)
                    db.session.commit()

                    user = db.session.get(User, user_id)
                    course = db.session.get(Course, course_id)
                    log_activity(user_id, 'payment', detail=f"Purchased {course.title if course else course_id}", course_id=course_id)
                    email_content = get_email_template("Course Unlocked! 🎓", f"You have successfully enrolled in {course.title}.", "Start Learning", f"{DOMAIN}/dashboard")
                    send_email(user.email, f"Welcome to {course.title}", email_content)

                return jsonify({"msg": "Enrolled", "status": "enrolled"}), 200

    except Exception as e:
        print(f"Payment Verification Error: {e}", flush=True)
        return jsonify({"msg": str(e)}), 500

    return jsonify({"msg": "Payment failed"}), 400




@app.route('/api/enroll', methods=['POST'])
@jwt_required()
def enroll_free():
    user_id = get_jwt_identity()
    course_id = request.json.get('course_id')
    
    if not Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first():
        enr = Enrollment(user_id=user_id, course_id=course_id, status='in-progress', progress=0, score=0)
        db.session.add(enr)
        db.session.commit()
    return jsonify({"msg": "Enrolled"}), 201

@app.route('/api/update-progress', methods=['POST'])
@jwt_required()
def update_progress():
    user_id = get_jwt_identity()
    data = request.json
    enr = Enrollment.query.filter_by(user_id=user_id, course_id=data.get('course_id')).first()
    if not enr: return jsonify({"msg": "Not found"}), 404

    requested_status = data.get('status')
    module_idx = data.get('module_idx')
    lesson_idx = data.get('lesson_idx')

    if 'progress' in data: enr.progress = data['progress']
    if 'score' in data: enr.score = data['score']
    if module_idx is not None: enr.last_module_index = module_idx
    if lesson_idx is not None: enr.last_lesson_index = lesson_idx

    if requested_status == 'completed':
        # INTEGRITY CHECK: a course can contain several scored lessons
        # (mid-course roleplay simulations, knowledge checks, etc.) in
        # addition to a final assessment. Passing ANY one of them must not
        # complete the whole course or mint a certificate - only reaching
        # 'completed' on the course's actual final lesson may do that.
        course = db.session.get(Course, data.get('course_id'))
        modules = (course.course_data or {}).get('modules', []) if course else []
        is_final_lesson = False
        if modules and module_idx is not None and lesson_idx is not None:
            last_module_idx = len(modules) - 1
            last_module_lessons = modules[last_module_idx].get('lessons', [])
            last_lesson_idx = len(last_module_lessons) - 1
            is_final_lesson = (module_idx == last_module_idx and lesson_idx == last_lesson_idx)

        if is_final_lesson:
            enr.status = 'completed'
        else:
            # Real progress on an intermediate assessment - keep it moving,
            # but do not complete the course or unlock a certificate yet.
            enr.status = 'in-progress'
    elif requested_status is not None:
        enr.status = requested_status

    newly_certified = False
    if enr.status == 'completed' and not enr.certificate_id:
        enr.certificate_id = f"AIC-{str(uuid.uuid4())[:8].upper()}"
        enr.completion_date = datetime.utcnow()
        # Freeze what the certificate says, so the admin copy stays accurate even if the
        # learner renames themselves or the course is later retitled.
        cert_user = db.session.get(User, user_id)
        cert_course = db.session.get(Course, enr.course_id)
        enr.certificate_name = cert_user.name if cert_user else None
        enr.certificate_course_title = cert_course.title if cert_course else None
        newly_certified = True

    db.session.commit()

    if newly_certified:
        log_activity(user_id, 'certificate_issued', detail=f"Certificate {enr.certificate_id} issued", course_id=enr.course_id)
    elif module_idx is not None and lesson_idx is not None:
        log_activity(user_id, 'lesson_progress', detail=f"Reached module {int(module_idx)+1}, lesson {int(lesson_idx)+1} ({enr.progress or 0}%)", course_id=enr.course_id)
    return jsonify({"msg": "Updated", "certificate_id": enr.certificate_id, "status": enr.status}), 200

@app.route('/api/my-enrollments', methods=['GET'])
@jwt_required()
def get_my_enrollments():
    user_id = get_jwt_identity()
    results = db.session.query(Enrollment, Course).join(Course, Enrollment.course_id == Course.id).filter(Enrollment.user_id == user_id).all()
    
    # FIXED: Added cert_id to the JSON response so the Dashboard knows you passed!
    return jsonify([{
        "id": c.id, 
        "title": c.title, 
        "description": c.description,
        "progress": e.progress, 
        "status": e.status,
        "cert_id": e.certificate_id
    } for e, c in results])



@app.route('/api/my-payments', methods=['GET'])
@jwt_required()
def get_my_payments():
    user_id = get_jwt_identity()
    # Join Enrollments and Courses to get the price and title
    results = db.session.query(Enrollment, Course).join(Course, Enrollment.course_id == Course.id).filter(Enrollment.user_id == user_id).order_by(Enrollment.enrolled_at.desc()).all()
    
    grouped = {}
    free_count = 0
    
    # 1. Group enrollments by their Stripe Receipt ID
    for e, c in results:
        key = e.stripe_session_id
        if not key:
            free_count += 1
            key = f"free_{free_count}"
            
        if key not in grouped:
            grouped[key] = {
                "id": e.id,
                "date_obj": e.enrolled_at or datetime.min,
                "date": e.enrolled_at.strftime('%b %d, %Y') if e.enrolled_at else "N/A",
                "status": "Paid",
                "receipt": e.stripe_session_id if e.stripe_session_id else f"REC-FREE-{e.id}{user_id}",
                "courses": []
            }
        grouped[key]["courses"].append(c)
        
    total_courses_in_db = Course.query.filter((Course.is_deleted == False) | (Course.is_deleted == None)).count()
    
    payments = []
    for key, data in grouped.items():
        if len(data["courses"]) > 1:
            # 2. BUNDLE LOGIC: If one receipt unlocked multiple courses, show it as a bundle
            prior_owned = total_courses_in_db - len(data["courses"])
            paid_amount = max(159.0 - (prior_owned * 29.0), 0.0)
            
            payments.append({
                "id": data["id"],
                "course": f"All-Access Pro Bundle ({len(data['courses'])} courses)",
                "amount": paid_amount,
                "date_obj": data["date_obj"],
                "date": data["date"],
                "status": "Paid",
                "receipt": data["receipt"]
            })
        else:
            # 3. SINGLE COURSE LOGIC
            payments.append({
                "id": data["id"],
                "course": data["courses"][0].title,
                "amount": data["courses"][0].price,
                "date_obj": data["date_obj"],
                "date": data["date"],
                "status": "Paid",
                "receipt": data["receipt"]
            })
    
    # Sort by date (newest first) and clean up before sending to frontend
    payments.sort(key=lambda x: x["date_obj"], reverse=True)
    for p in payments:
        del p["date_obj"]
        
    return jsonify(payments), 200



@app.route('/api/enrollment/<int:course_id>', methods=['GET'])
@jwt_required()
def get_enrollment_status(course_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id) 
    
    if user.is_admin:
        return jsonify({"status": "completed", "progress": 100, "certificate_id": "ADMIN_PREVIEW"})
        
    # THE FIX: Order by progress descending so the backend ALWAYS grabs your highest score, ignoring bad duplicates!
    enr = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).order_by(Enrollment.progress.desc()).first()
    
    if not enr: return jsonify({"msg": "Not enrolled"}), 404
    
    return jsonify({
        "progress": enr.progress, "status": enr.status, 
        "last_module_index": enr.last_module_index,
        "last_lesson_index": enr.last_lesson_index,
        "certificate_id": enr.certificate_id,
        "completion_date": enr.completion_date.strftime('%B %d, %Y') if enr.completion_date else None
    })


@app.route('/api/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    # SECURITY FIX: Strictly fetch from environment variables. No hardcoded secrets!
    endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

    if not endpoint_secret:
        print("Webhook Error: STRIPE_WEBHOOK_SECRET is not set!", flush=True)
        return jsonify({'error': 'Webhook secret not configured'}), 500

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        # Invalid payload
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return jsonify({'error': 'Invalid signature'}), 400

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Extract the data we passed in the checkout session
        # Stripe SDK v5+ returns StripeObject, not dict — use attribute access not .get()
        session_id = session['id']
        metadata = session['metadata']
        user_id = metadata['user_id'] if 'user_id' in metadata else None
        is_bundle = (metadata['is_bundle'] if 'is_bundle' in metadata else '') == 'true'
        course_id = int(metadata['course_id']) if 'course_id' in metadata and metadata['course_id'] else None
        
        if not user_id:
            # Guest checkout (bundle checkout stays login-required, so this only
            # applies to single-course purchases). This is the safety net: if the
            # browser's own /api/verify-payment call already handled it, the shared
            # helper below is idempotent on session_id and just no-ops here.
            if is_bundle or not course_id:
                print("Webhook: No user_id in metadata (bundle or missing course_id) — skipping", flush=True)
                return jsonify({'status': 'success'}), 200

            print(f"Webhook: guest checkout detected for session {session_id}, course_id={course_id} — resolving...", flush=True)
            guest_email = session.customer_details.email if session.customer_details else None
            guest_name = session.customer_details.name if session.customer_details else None
            result = resolve_guest_checkout(course_id, session_id, guest_email, guest_name, payment_intent_id=session.payment_intent)
            if not result:
                print(f"Webhook: guest checkout for session {session_id} had no payer email — skipping", flush=True)
            else:
                print(f"Webhook: session {session_id} resolved as '{result['status']}' for user_id={result['user'].id} ({result['user'].email})", flush=True)
            return jsonify({'status': 'success'}), 200

        # --- BUNDLE UNLOCK LOGIC ---
        if is_bundle:
            all_courses = Course.query.filter((Course.is_deleted == False) | (Course.is_deleted == None)).all()
            owned = [e.course_id for e in Enrollment.query.filter_by(user_id=user_id).all()]
            
            enrolled_count = 0
            for course in all_courses:
                if course.id not in owned:
                    # Double check to prevent race conditions with the frontend verify route
                    existing = Enrollment.query.filter_by(user_id=user_id, course_id=course.id).first()
                    if not existing:
                        new_enr = Enrollment(
                            user_id=user_id, course_id=course.id, 
                            status='in-progress', progress=0, 
                            enrolled_at=datetime.utcnow(), stripe_session_id=session_id
                        )
                        db.session.add(new_enr)
                        enrolled_count += 1
            
            db.session.commit()
            
            # Send welcome email silently in the background
            user = db.session.get(User, user_id)
            if user and enrolled_count > 0:
                email_content = get_email_template("All-Access Pass Unlocked! 🚀", f"You have successfully unlocked all {enrolled_count} remaining courses.", "Go to Dashboard", f"{DOMAIN}/dashboard")
                send_email(user.email, "Welcome to the All-Access Pass", email_content)
            
        # --- SINGLE COURSE UNLOCK LOGIC ---
        elif course_id:
            existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
            if existing and existing.stripe_session_id != session_id:
                # Paid for a course already owned from a different payment/grant: flag for refund review.
                dup_user = db.session.get(User, user_id)
                if dup_user:
                    flag_duplicate_payment(dup_user, course_id, session_id, payment_intent_id=session.payment_intent)
            if not existing:
                new_enrollment = Enrollment(
                    user_id=user_id, course_id=course_id, 
                    status='in-progress', progress=0, 
                    enrolled_at=datetime.utcnow(), stripe_session_id=session_id
                )
                db.session.add(new_enrollment)
                db.session.commit()
                log_activity(user_id, 'payment', detail=f"Purchased course_id={course_id} (webhook)", course_id=course_id)
                
                user = db.session.get(User, user_id)
                course = db.session.get(Course, course_id)
                if user and course:
                    email_content = get_email_template("Course Unlocked! 🎓", f"You have successfully enrolled in {course.title}.", "Start Learning", f"{DOMAIN}/dashboard")
                    send_email(user.email, f"Welcome to {course.title}", email_content)

    return jsonify({'status': 'success'}), 200


# ==========================================
# 7b. DIGITAL FOOTPRINT + CERTIFICATE REGISTRY (ADMIN)
# ==========================================

def _require_admin():
    """Returns (admin_user, None) or (None, error_response)."""
    admin = db.session.get(User, get_jwt_identity())
    if not admin or not admin.is_admin:
        return None, (jsonify({"msg": "Admin only"}), 403)
    return admin, None


def summarize_user_agent(ua):
    """Tiny, dependency-free 'Chrome on Windows' summary for the footprint view."""
    if not ua:
        return None
    u = ua.lower()
    browser = ('Edge' if 'edg/' in u else 'Opera' if 'opr/' in u or 'opera' in u else
               'Chrome' if 'chrome' in u or 'crios' in u else 'Firefox' if 'firefox' in u or 'fxios' in u else
               'Safari' if 'safari' in u else 'Other browser')
    os_name = ('Windows' if 'windows' in u else 'iOS' if 'iphone' in u or 'ipad' in u else
               'Android' if 'android' in u else 'macOS' if 'mac os' in u or 'macintosh' in u else
               'Linux' if 'linux' in u else 'Unknown OS')
    device = 'Mobile' if ('mobile' in u or 'iphone' in u or 'android' in u) else 'Desktop'
    return f"{browser} on {os_name} ({device})"


@app.route('/api/track', methods=['POST'])
@jwt_required()
def track_page_view():
    """Records a page view for the logged-in user's footprint. Query strings are
    dropped on purpose: URLs like /resume?token=... carry login tokens."""
    user_id = get_jwt_identity()
    data = request.json or {}
    path = str(data.get('path') or '').split('?')[0].split('#')[0][:255]
    if not path.startswith('/') or path.startswith('/admin'):
        return jsonify({"ok": True}), 200
    if throttled('track', str(user_id), 90, 60):
        return jsonify({"ok": True}), 200
    log_activity(user_id, 'page_view', path=path, detail=(str(data.get('title') or '')[:200] or None))
    return jsonify({"ok": True}), 200


@app.route('/api/admin/users/<int:user_id>/footprint', methods=['GET'])
@jwt_required()
def admin_user_footprint(user_id):
    """Everything we know about one user, newest first: tracked events plus
    events reconstructed from existing records so older users aren't blank."""
    admin, err = _require_admin()
    if err: return err

    u = db.session.get(User, user_id)
    if not u:
        return jsonify({"msg": "User not found"}), 404

    limit = min(int(request.args.get('limit', 300)), 1000)
    rows = UserActivity.query.filter_by(user_id=user_id).order_by(UserActivity.created_at.desc(), UserActivity.id.desc()).limit(limit).all()

    course_cache = {}
    def course_title(cid):
        if cid is None: return None
        if cid not in course_cache:
            c = db.session.get(Course, cid)
            course_cache[cid] = c.title if c else f"course #{cid}"
        return course_cache[cid]

    events = [{
        "id": f"a{r.id}", "type": r.event_type, "detail": r.detail, "path": r.path,
        "course": course_title(r.course_id), "ip": r.ip_address,
        "device": summarize_user_agent(r.user_agent),
        "at": r.created_at.isoformat() + "Z" if r.created_at else None, "historical": False
    } for r in rows]

    real_types = {r.event_type for r in rows}
    def hist(key, etype, at, detail, course_id=None):
        if at:
            events.append({"id": key, "type": etype, "detail": detail, "path": None,
                           "course": course_title(course_id), "ip": None, "device": None,
                           "at": at.isoformat() + "Z", "historical": True})

    enrollments = Enrollment.query.filter_by(user_id=user_id).order_by(Enrollment.enrolled_at.desc()).all()
    if 'signup' not in real_types:
        hist("h-signup", "signup", u.created_at, f"Account created ({u.signup_source or 'signup'})")
    if 'login' not in real_types:
        hist("h-lastlogin", "login", u.last_login, f"Last recorded login ({u.login_count or 0} logins in total)")
    enr_out = []
    for e in enrollments:
        paid_via = 'Stripe payment' if e.stripe_session_id else 'Admin grant / free'
        enr_out.append({
            "course_id": e.course_id, "course": course_title(e.course_id), "status": e.status,
            "progress": e.progress or 0, "enrolled_at": e.enrolled_at.isoformat() + "Z" if e.enrolled_at else None,
            "completion_date": e.completion_date.isoformat() + "Z" if e.completion_date else None,
            "certificate_id": e.certificate_id, "access": paid_via, "stripe_session_id": e.stripe_session_id,
        })
        if not any(r.event_type in ('payment', 'course_granted') and r.course_id == e.course_id for r in rows):
            hist(f"h-enr{e.id}", "payment" if e.stripe_session_id else "course_granted", e.enrolled_at,
                 f"Enrolled via {paid_via}", e.course_id)
        if e.certificate_id and not any(r.event_type == 'certificate_issued' and r.course_id == e.course_id for r in rows):
            hist(f"h-cert{e.id}", "certificate_issued", e.completion_date, f"Certificate {e.certificate_id} issued", e.course_id)

    flags = FlaggedPayment.query.filter_by(user_id=user_id).order_by(FlaggedPayment.created_at.desc()).all()
    flags_out = [{
        "id": f.id, "course": course_title(f.course_id), "stripe_session_id": f.stripe_session_id,
        "payment_intent_id": f.payment_intent_id, "resolved": f.resolved,
        "created_at": f.created_at.isoformat() + "Z" if f.created_at else None
    } for f in flags]

    events.sort(key=lambda ev: ev["at"] or "", reverse=True)

    ips = {r.ip_address for r in rows if r.ip_address}
    sub = NewsletterSubscriber.query.filter_by(email=u.email).first()
    return jsonify({
        "user": {
            "id": u.id, "name": u.name, "email": u.email, "role": "Admin" if u.is_admin else "Student",
            "signup_source": u.signup_source, "account_setup_complete": bool(u.account_setup_complete),
            "is_deleted": bool(u.is_deleted),
            "banned": bool(u.ban_expiry and u.ban_expiry > datetime.utcnow()),
            "created_at": u.created_at.isoformat() + "Z" if u.created_at else None,
            "last_login": u.last_login.isoformat() + "Z" if u.last_login else None,
            "login_count": u.login_count or 0,
        },
        "stats": {
            "page_views": sum(1 for r in rows if r.event_type == 'page_view'),
            "tracked_events": len(rows),
            "distinct_ips": len(ips),
            "last_seen": rows[0].created_at.isoformat() + "Z" if rows else None,
            "tracking_since": "Page-level tracking started when this feature was deployed; older history is rebuilt from account records.",
        },
        "enrollments": enr_out,
        "flagged_payments": flags_out,
        "newsletter": sub.status if sub else None,
        "events": events[:limit],
    }), 200


@app.route('/api/admin/certificates', methods=['GET'])
@jwt_required()
def admin_list_certificates():
    """Registry of every certificate ever issued, with enough data for the admin
    panel to re-render an exact copy. Uses the snapshot taken at issuance, falling
    back to the live name/title for certificates issued before snapshots existed."""
    admin, err = _require_admin()
    if err: return err

    q = (request.args.get('q') or '').strip().lower()
    page = max(int(request.args.get('page', 1)), 1)
    per_page = min(max(int(request.args.get('per_page', 25)), 1), 100)

    query = db.session.query(Enrollment, User, Course)\
        .join(User, Enrollment.user_id == User.id)\
        .join(Course, Enrollment.course_id == Course.id)\
        .filter(Enrollment.certificate_id.isnot(None))
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(
            func.lower(Enrollment.certificate_id).like(like), func.lower(User.email).like(like),
            func.lower(User.name).like(like), func.lower(Course.title).like(like),
            func.lower(func.coalesce(Enrollment.certificate_name, '')).like(like)))

    total = query.count()
    rows = query.order_by(Enrollment.completion_date.desc().nullslast(), Enrollment.id.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for e, u, c in rows:
        items.append({
            "certificate_id": e.certificate_id,
            "name": e.certificate_name or u.name,
            "course_title": e.certificate_course_title or c.title,
            "completion_date": e.completion_date.strftime('%B %d, %Y') if e.completion_date else None,
            "score": e.score or 100,
            "user_id": u.id, "user_email": u.email, "user_name_now": u.name,
            "course_id": c.id, "snapshot": bool(e.certificate_name),
        })
    return jsonify({"items": items, "total": total, "page": page, "per_page": per_page}), 200


# ==========================================
# 7c. NEWSLETTER (weekly digest)
# ==========================================

def _api_base():
    base = request.url_root.rstrip('/')
    if base.startswith('http://') and 'localhost' not in base and '127.0.0.1' not in base:
        base = 'https://' + base[len('http://'):]
    return base


def _send_newsletter_confirmation(sub):
    link = f"{DOMAIN}/newsletter?confirm={sub.confirm_token}"
    html = get_email_template(
        "Confirm your subscription",
        "Thanks for signing up for the AICourseHubPro weekly digest - one short email a week with a ready-to-use "
        "AI prompt, a practical tip and what's new on the platform. Please confirm your email address to start receiving it. "
        "If you didn't sign up, just ignore this message and nothing will happen.",
        "Confirm my subscription", link)
    threading.Thread(target=send_email, args=(sub.email, "Confirm your AICourseHubPro weekly digest", html), daemon=True).start()


@app.route('/api/newsletter/subscribe', methods=['POST'])
def newsletter_subscribe():
    """Public. Double opt-in: creates/refreshes a *pending* subscriber and emails a confirm link.
    Always returns the same message so it can't be used to probe who is subscribed."""
    data = request.json or {}
    generic = jsonify({"msg": "Almost there! Check your inbox and click the confirmation link to start receiving the weekly digest."}), 200

    if (data.get('website') or '').strip():      # honeypot - real users never fill this hidden field
        return generic
    email = (data.get('email') or '').strip().lower()
    if not email or not EMAIL_RE.match(email) or len(email) > 120:
        return jsonify({"msg": "Please enter a valid email address."}), 400
    if throttled('nl_ip', client_ip(), 6, 3600) or throttled('nl_email', email, 3, 3600):
        return generic

    sub = NewsletterSubscriber.query.filter_by(email=email).first()
    if sub and sub.status == 'active':
        return generic                           # already subscribed - nothing to send
    if not sub:
        u = User.query.filter_by(email=email).first()
        sub = NewsletterSubscriber(email=email, user_id=u.id if u else None, status='pending',
                                   unsubscribe_token=uuid.uuid4().hex, source=str(data.get('source') or 'home')[:30])
        db.session.add(sub)
    else:
        sub.status = 'pending'                   # pending resend, or re-subscribing after an unsubscribe
        sub.unsubscribe_token = sub.unsubscribe_token or uuid.uuid4().hex
    sub.confirm_token = uuid.uuid4().hex
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return generic
    _send_newsletter_confirmation(sub)
    return generic


@app.route('/api/newsletter/confirm', methods=['POST'])
def newsletter_confirm():
    token = ((request.json or {}).get('token') or '').strip()
    sub = NewsletterSubscriber.query.filter_by(confirm_token=token).first() if token else None
    if not sub:
        return jsonify({"msg": "This confirmation link is invalid or has already been used."}), 404
    sub.status = 'active'
    sub.confirmed_at = datetime.utcnow()
    sub.unsubscribed_at = None
    sub.confirm_token = None
    db.session.commit()
    if sub.user_id:
        log_activity(sub.user_id, 'newsletter', detail='Subscribed to the weekly digest')
    return jsonify({"msg": "You're subscribed! Your first digest will arrive soon."}), 200


@app.route('/api/newsletter/unsubscribe', methods=['POST'])
def newsletter_unsubscribe():
    """POST on purpose: mail scanners pre-fetch GET links and would unsubscribe people by accident.
    Accepts the token in JSON (our page) or the query string (the one-click List-Unsubscribe header)."""
    token = (((request.json or {}) if request.is_json else {}).get('token') or request.args.get('token') or '').strip()
    sub = NewsletterSubscriber.query.filter_by(unsubscribe_token=token).first() if token else None
    if not sub:
        return jsonify({"msg": "This unsubscribe link is invalid."}), 404
    if sub.status != 'unsubscribed':
        sub.status = 'unsubscribed'
        sub.unsubscribed_at = datetime.utcnow()
        sub.confirm_token = None
        db.session.commit()
        if sub.user_id:
            log_activity(sub.user_id, 'newsletter', detail='Unsubscribed from the weekly digest')
    return jsonify({"msg": "You've been unsubscribed. You won't receive any more digests."}), 200


def render_newsletter_html(issue, sub=None, preview=False, api_base=''):
    """Wraps the admin-written body in the branded shell + a per-recipient unsubscribe footer."""
    if sub:
        unsub_url = f"{DOMAIN}/newsletter?unsubscribe={sub.unsubscribe_token}"
    else:
        unsub_url = f"{DOMAIN}/newsletter?unsubscribe=preview"
    pre = (f'<div style="display:none;max-height:0;overflow:hidden;opacity:0">{issue.preheader}</div>' if issue.preheader else '')
    body = (issue.body_html or '').replace('{{unsubscribe_url}}', unsub_url)
    return f"""{pre}
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000000; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">AICourseHubPro</h1>
            <p style="color:#fca5a5;margin:4px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;">The Weekly Digest</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            {body}
        </div>
        <div style="padding:18px 30px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
            You're receiving this because you subscribed at aicoursehubpro.com.<br>
            <a href="{unsub_url}" style="color:#6b7280;">Unsubscribe</a> &middot; Shiro Technologies
        </div>
    </div>"""


def _send_issue_worker(issue_id, api_base):
    """Background send. Throttled to stay inside Resend's per-second limit."""
    with app.app_context():
        issue = db.session.get(NewsletterIssue, issue_id)
        if not issue:
            return
        sent = 0
        for sub in NewsletterSubscriber.query.filter_by(status='active').all():
            headers = {
                "List-Unsubscribe": f"<{api_base}/api/newsletter/unsubscribe?token={sub.unsubscribe_token}>, <{DOMAIN}/newsletter?unsubscribe={sub.unsubscribe_token}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            }
            if send_email(sub.email, issue.subject, render_newsletter_html(issue, sub), "AICourseHubPro Weekly", "info@aicoursehubpro.com", headers=headers):
                sub.last_sent_at = datetime.utcnow()
                sent += 1
                db.session.commit()
            time.sleep(0.6)
        issue.status = 'sent'
        issue.sent_at = datetime.utcnow()
        issue.recipient_count = sent
        db.session.commit()
        print(f"Newsletter issue {issue_id} sent to {sent} subscribers", flush=True)


def _claim_and_send(issue):
    """Atomically move draft/queued -> sending so a double click (or cron + click) can't send twice."""
    claimed = NewsletterIssue.query.filter(NewsletterIssue.id == issue.id, NewsletterIssue.status.in_(['draft', 'queued']))\
        .update({'status': 'sending'}, synchronize_session=False)
    db.session.commit()
    if not claimed:
        return False
    threading.Thread(target=_send_issue_worker, args=(issue.id, _api_base()), daemon=True).start()
    return True


def _issue_dict(i, full=False):
    d = {"id": i.id, "subject": i.subject, "preheader": i.preheader, "status": i.status,
         "created_at": i.created_at.isoformat() + "Z" if i.created_at else None,
         "sent_at": i.sent_at.isoformat() + "Z" if i.sent_at else None,
         "recipient_count": i.recipient_count or 0}
    if full:
        d["body_html"] = i.body_html
    return d


# A small built-in library so the weekly "Prompt of the Week" is never a blank page.
PROMPT_LIBRARY = [
    ("HR", "Turn a messy job description into a clear, bias-aware job ad",
     "Act as an experienced recruiter. Rewrite the job description below into a clear, inclusive job ad under 250 words. Keep must-have requirements separate from nice-to-haves, remove jargon and any wording that could discourage qualified applicants. End with a 3-line 'What we offer' section. JOB DESCRIPTION: [paste here]"),
    ("Education", "Build a 20-minute lesson starter that hooks the class",
     "You are a curriculum designer. Create a 5-minute lesson opener for [grade/level] students on [topic]: one surprising question, one quick activity needing no materials, and one sentence linking it to the day's objective. Keep language at a [grade] reading level."),
    ("Automation", "Triage a pile of requests without losing the edge cases",
     "Classify each request below as URGENT, ROUTINE or NEEDS A HUMAN. Use these rules: [your rules]. Output a table with columns: request, category, one-line reason. If a request does not clearly fit a rule, choose NEEDS A HUMAN. REQUESTS: [paste here]"),
    ("Business", "Turn a data table into a decision-ready summary",
     "Here is a table of [what the data is]. First, state in one sentence what question this data can and cannot answer. Then give the 3 most important patterns, each with the exact numbers that support it, and flag anything that looks like a data-quality issue. Do not speculate about causes. DATA: [paste here]"),
    ("Non-Profit", "Draft a donor thank-you that sounds like a person wrote it",
     "Write a warm 120-word thank-you email to a donor who gave [amount] to [programme]. Mention one concrete thing their gift made possible, avoid clichés like 'making a difference', and close with one specific way they can stay involved. Voice sample to match: [paste 2-3 sentences of your writing]"),
    ("Public Services", "Explain a policy in plain language residents can act on",
     "Rewrite the official notice below for residents at an 8th-grade reading level. Structure: what is changing, who it affects, what to do and by when, where to get help. Do not add any facts that are not in the original; if something is unclear, list it under 'Questions for staff'. NOTICE: [paste here]"),
    ("Everyday", "Make the AI show its work before you trust it",
     "Answer the question below. Then list every factual claim you made, label each as 'certain', 'probably right' or 'needs checking', and tell me exactly what I should verify and where. QUESTION: [your question]"),
    ("Everyday", "Get a better second draft instead of starting over",
     "Here is your last answer. Keep what works, and revise it with these changes only: (1) shorter - under [N] words, (2) lead with the main point, (3) replace anything vague with a specific example. Show the revised version only."),
]

TIP_LIBRARY = [
    "Paste your own writing sample into the prompt and add 'match this voice'. It is the fastest fix for text that sounds generic.",
    "Ask for the output format you actually need (a table, a numbered list, an email under 120 words) - vague requests produce vague answers.",
    "Never paste personal or confidential data into a public AI tool. Use placeholders like [CANDIDATE A] and re-insert details yourself.",
    "When an answer is almost right, reply with a numbered list of exact changes instead of 'make it better'.",
    "Add 'If you are not sure, say so instead of guessing' to any prompt where accuracy matters.",
    "Run the same prompt twice. If the answers disagree on a fact, that fact needs checking.",
]


@app.route('/api/admin/newsletter/stats', methods=['GET'])
@jwt_required()
def admin_newsletter_stats():
    admin, err = _require_admin()
    if err: return err
    counts = dict(db.session.query(NewsletterSubscriber.status, func.count(NewsletterSubscriber.id)).group_by(NewsletterSubscriber.status).all())
    last = NewsletterIssue.query.filter_by(status='sent').order_by(NewsletterIssue.sent_at.desc()).first()
    return jsonify({"active": counts.get('active', 0), "pending": counts.get('pending', 0),
                    "unsubscribed": counts.get('unsubscribed', 0),
                    "last_sent": last.sent_at.isoformat() + "Z" if last and last.sent_at else None}), 200


@app.route('/api/admin/newsletter/subscribers', methods=['GET'])
@jwt_required()
def admin_newsletter_subscribers():
    admin, err = _require_admin()
    if err: return err
    status = request.args.get('status')
    q = (request.args.get('q') or '').strip().lower()
    page = max(int(request.args.get('page', 1)), 1)
    per_page = min(max(int(request.args.get('per_page', 50)), 1), 200)
    query = NewsletterSubscriber.query
    if status in ('active', 'pending', 'unsubscribed'):
        query = query.filter_by(status=status)
    if q:
        query = query.filter(func.lower(NewsletterSubscriber.email).like(f"%{q}%"))
    total = query.count()
    rows = query.order_by(NewsletterSubscriber.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({"total": total, "page": page, "per_page": per_page, "items": [{
        "id": r.id, "email": r.email, "status": r.status, "source": r.source, "has_account": bool(r.user_id),
        "created_at": r.created_at.isoformat() + "Z" if r.created_at else None,
        "confirmed_at": r.confirmed_at.isoformat() + "Z" if r.confirmed_at else None,
        "last_sent_at": r.last_sent_at.isoformat() + "Z" if r.last_sent_at else None,
    } for r in rows]}), 200


@app.route('/api/admin/newsletter/subscribers.csv', methods=['GET'])
@jwt_required()
def admin_newsletter_export():
    admin, err = _require_admin()
    if err: return err
    import csv, io
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(['email', 'status', 'source', 'subscribed_at', 'confirmed_at', 'unsubscribed_at'])
    for r in NewsletterSubscriber.query.order_by(NewsletterSubscriber.created_at.desc()).all():
        # Prefix risky leading characters so a spreadsheet never treats an email cell as a formula
        em = r.email if r.email[:1] not in ('=', '+', '-', '@') else "'" + r.email
        w.writerow([em, r.status, r.source, r.created_at or '', r.confirmed_at or '', r.unsubscribed_at or ''])
    from flask import Response
    return Response(buf.getvalue(), mimetype='text/csv', headers={"Content-Disposition": "attachment; filename=newsletter_subscribers.csv"})


@app.route('/api/admin/newsletter/issues', methods=['GET'])
@jwt_required()
def admin_newsletter_issues():
    admin, err = _require_admin()
    if err: return err
    return jsonify([_issue_dict(i) for i in NewsletterIssue.query.order_by(NewsletterIssue.created_at.desc()).limit(100).all()]), 200


@app.route('/api/admin/newsletter/issues/<int:issue_id>', methods=['GET'])
@jwt_required()
def admin_newsletter_issue_get(issue_id):
    admin, err = _require_admin()
    if err: return err
    i = db.session.get(NewsletterIssue, issue_id)
    if not i: return jsonify({"msg": "Issue not found"}), 404
    return jsonify(_issue_dict(i, full=True)), 200


@app.route('/api/admin/newsletter/issues', methods=['POST'])
@app.route('/api/admin/newsletter/issues/<int:issue_id>', methods=['PUT'])
@jwt_required()
def admin_newsletter_issue_save(issue_id=None):
    admin, err = _require_admin()
    if err: return err
    data = request.json or {}
    subject = (data.get('subject') or '').strip()
    body = data.get('body_html') or ''
    if not subject or not body.strip():
        return jsonify({"msg": "A subject and a body are required."}), 400
    if issue_id:
        i = db.session.get(NewsletterIssue, issue_id)
        if not i: return jsonify({"msg": "Issue not found"}), 404
        if i.status in ('sending', 'sent'):
            return jsonify({"msg": "This issue has already been sent and can't be edited."}), 400
    else:
        i = NewsletterIssue(created_by=admin.email)
        db.session.add(i)
    i.subject = subject[:200]
    i.preheader = (data.get('preheader') or '')[:200] or None
    i.body_html = body
    if data.get('status') in ('draft', 'queued'):
        i.status = data['status']
    db.session.commit()
    return jsonify(_issue_dict(i, full=True)), 200


@app.route('/api/admin/newsletter/issues/<int:issue_id>', methods=['DELETE'])
@jwt_required()
def admin_newsletter_issue_delete(issue_id):
    admin, err = _require_admin()
    if err: return err
    i = db.session.get(NewsletterIssue, issue_id)
    if not i: return jsonify({"msg": "Issue not found"}), 404
    if i.status != 'draft' and i.status != 'queued':
        return jsonify({"msg": "Only unsent drafts can be deleted."}), 400
    db.session.delete(i)
    db.session.commit()
    return jsonify({"msg": "Deleted"}), 200


@app.route('/api/admin/newsletter/preview', methods=['POST'])
@jwt_required()
def admin_newsletter_preview():
    admin, err = _require_admin()
    if err: return err
    data = request.json or {}
    fake = NewsletterIssue(subject=data.get('subject') or '', preheader=data.get('preheader'), body_html=data.get('body_html') or '')
    return jsonify({"html": render_newsletter_html(fake)}), 200


@app.route('/api/admin/newsletter/send-test', methods=['POST'])
@jwt_required()
def admin_newsletter_send_test():
    admin, err = _require_admin()
    if err: return err
    data = request.json or {}
    to = (data.get('email') or admin.email).strip().lower()
    if not EMAIL_RE.match(to):
        return jsonify({"msg": "Enter a valid email address."}), 400
    fake = NewsletterIssue(subject=data.get('subject') or '(no subject)', preheader=data.get('preheader'), body_html=data.get('body_html') or '')
    ok = send_email(to, f"[TEST] {fake.subject}", render_newsletter_html(fake), "AICourseHubPro Weekly", "info@aicoursehubpro.com")
    return (jsonify({"msg": f"Test sent to {to}"}), 200) if ok else (jsonify({"msg": "Sending failed - check the Resend configuration."}), 502)


@app.route('/api/admin/newsletter/issues/<int:issue_id>/send', methods=['POST'])
@jwt_required()
def admin_newsletter_send(issue_id):
    admin, err = _require_admin()
    if err: return err
    i = db.session.get(NewsletterIssue, issue_id)
    if not i: return jsonify({"msg": "Issue not found"}), 404
    active = NewsletterSubscriber.query.filter_by(status='active').count()
    if active == 0:
        return jsonify({"msg": "There are no confirmed subscribers yet."}), 400
    if not _claim_and_send(i):
        return jsonify({"msg": "This issue has already been sent (or is sending)."}), 409
    db.session.add(AuditLog(admin_email=admin.email, action="Newsletter Sent", details=f"'{i.subject}' to {active} subscribers", timestamp=datetime.utcnow()))
    db.session.commit()
    return jsonify({"msg": f"Sending to {active} subscribers in the background."}), 202


@app.route('/api/admin/newsletter/suggest', methods=['GET'])
@jwt_required()
def admin_newsletter_suggest():
    """Builds a ready-to-edit starter digest: a rotating Prompt of the Week, a tip, a
    course spotlight pulled from the live catalogue, and a 'what's new' slot."""
    admin, err = _require_admin()
    if err: return err
    week = datetime.utcnow().isocalendar()[1]
    cat, title, prompt = PROMPT_LIBRARY[week % len(PROMPT_LIBRARY)]
    tip = TIP_LIBRARY[week % len(TIP_LIBRARY)]
    courses = Course.query.filter((Course.is_deleted == False) | (Course.is_deleted == None)).order_by(Course.id).all()
    spot = courses[week % len(courses)] if courses else None
    esc = lambda t: (t or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    spotlight = ''
    if spot:
        desc = esc((spot.description or '')[:220]).rstrip() + ('…' if spot.description and len(spot.description) > 220 else '')
        spotlight = (f'<h3 style="color:#111;margin:28px 0 6px;">Course spotlight</h3>'
                     f'<p style="margin:0 0 6px;"><strong>{esc(spot.title)}</strong></p><p style="margin:0 0 12px;color:#555;">{desc}</p>'
                     f'<p style="margin:0;"><a href="{DOMAIN}/courses/{spot.id}" style="color:#dc2626;font-weight:bold;">See the course &rarr;</a></p>')
    body = (f'<h2 style="color:#dc2626;margin-top:0;">Your prompt for this week</h2>'
            f'<p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">{esc(cat)}</p>'
            f'<p style="margin:0 0 10px;"><strong>{esc(title)}</strong></p>'
            f'<div style="background:#f9fafb;border-left:4px solid #dc2626;padding:14px 16px;border-radius:4px;font-family:Consolas,monospace;font-size:13px;color:#222;">{esc(prompt)}</div>'
            f'<p style="margin:10px 0 0;color:#555;font-size:14px;">Copy it, replace the [brackets] and run it in your favourite AI tool. Always read the result before you use it.</p>'
            f'<h3 style="color:#111;margin:28px 0 6px;">One tip</h3><p style="margin:0;">{esc(tip)}</p>'
            f'{spotlight}'
            f'<h3 style="color:#111;margin:28px 0 6px;">What\'s new</h3><p style="margin:0;">[Write one or two lines about what changed on AICourseHubPro this week - delete this block if nothing did.]</p>')
    return jsonify({"subject": f"This week's AI prompt: {title}", "preheader": "A ready-to-use prompt, one practical tip and what's new.", "body_html": body}), 200


@app.route('/api/newsletter/cron/weekly', methods=['POST'])
def newsletter_cron_weekly():
    """For a scheduler (e.g. a Railway cron job curl-ing this weekly): releases the OLDEST *queued*
    issue. Drafts are never sent automatically. Protected by the CRON_SECRET env var."""
    secret = os.environ.get('CRON_SECRET')
    if not secret or request.headers.get('X-Cron-Secret') != secret:
        return jsonify({"msg": "Forbidden"}), 403
    issue = NewsletterIssue.query.filter_by(status='queued').order_by(NewsletterIssue.created_at.asc()).first()
    if not issue:
        return jsonify({"msg": "No queued issue - nothing sent."}), 200
    if NewsletterSubscriber.query.filter_by(status='active').count() == 0:
        return jsonify({"msg": "No confirmed subscribers - nothing sent."}), 200
    if not _claim_and_send(issue):
        return jsonify({"msg": "Issue was already claimed."}), 200
    return jsonify({"msg": f"Sending issue {issue.id}."}), 202


# ==========================================
# 8. ADMIN & MISC ROUTES
# ==========================================

@app.route('/api/admin/messages', methods=['GET'])
@jwt_required()
def get_messages():
    user = db.session.get(User, get_jwt_identity()) # FIXED
    if not user.is_admin: return jsonify({"msg": "Admin only"}), 403
    msgs = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([{"id": m.id, "name": m.name, "subject": m.subject, "message": m.message, "is_read": m.is_read, "date": m.created_at.strftime('%Y-%m-%d')} for m in msgs])

@app.route('/api/admin/messages/<int:id>/read', methods=['PUT'])
@jwt_required()
def mark_message_read(id):
    if not db.session.get(User, get_jwt_identity()).is_admin: return jsonify({"msg": "Admin only"}), 403 # FIXED
    msg = db.session.get(ContactMessage, id) # FIXED
    if msg: 
        msg.is_read = True
        db.session.commit()
    return jsonify({"msg": "Marked read"})

@app.route('/api/admin/logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    if not db.session.get(User, get_jwt_identity()).is_admin: return jsonify({"msg": "Admin only"}), 403 # FIXED
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(50).all()
    return jsonify([{"action": l.action, "admin": l.admin_email, "details": l.details, "date": l.timestamp.strftime('%Y-%m-%d %H:%M')} for l in logs])

@app.route('/api/admin/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    if not db.session.get(User, get_jwt_identity()).is_admin: return jsonify({"msg": "Admin only"}), 403 # FIXED
    enrollments = Enrollment.query.order_by(Enrollment.id.desc()).all()
    data = []
    for e in enrollments:
        u = db.session.get(User, e.user_id) # FIXED
        c = db.session.get(Course, e.course_id) # FIXED
        if u and c:
            data.append({"id": e.id, "user": u.name, "email": u.email, "course": c.title, "date": e.enrolled_at.strftime('%Y-%m-%d') if e.enrolled_at else "N/A", "status": "Paid"})
    return jsonify(data)

@app.route('/api/chat', methods=['POST'])
def chat_support():
    msg = request.json.get('message', '')
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: 
        return jsonify({"reply": "Chat unavailable."}), 500
        
    # --- FIXED NOVA CONTEXT PROMPT ---
    nova_context = """
    You are Nova, the official AI support assistant for AICourseHubPro.
    AICourseHubPro is an elite online learning platform that professionals use to learn AI in their daily workflows.
    Our course categories include HR, Operations, Development, Business, and Marketing.
    All courses are priced at $29 per course. We also provide the option of buying the "All Course Bundle" which is priced at $159. 
    Your tone must be helpful, professional, polite, and encouraging.
    Limit your answers to 2-3 short, highly readable paragraphs. 
    If a user asks about technical bugs, or specific account issues, politely ask them to contact info@aicoursehubpro.com email address.
    If a user asks about refunds of any sort, politely make them understand that we do not provide refunds of any sort. Payments once made toward AICourseHUbPro are non-refundable and final.
    If a user asks about our course offerings, list the courses we offer, namely - AI for Human Resources / Talent / People Ops via Prompts, Prompt-Based Tools for Education & Learning, Prompt-Based Analytics and Reports for Business, Prompting for Automation and Workflow Efficiency, Prompt Engineering for Non-Profits and Social Impact, Prompt-Based AI for Local Government and Public Services. Highlight the courses (bold) and list them one by one.
    If a user asks about topics completely unrelated to AI, the courses, or the platform, politely decline to answer and guide them back to our offerings.
    Users can contact our email address - info@aicoursehubpro.com for more information on any queries.
    If the users want, you can navigate them to the contact page of our application, that is present at the navbar.
    If the user asks about the certificate of completion, tell them that users get a verifiable certificate of course completion which can be downloaded in PDF format. But to receive the certificate, users must complete the course and appear for an assessment and pass it with minimum score of 70%.
    """
    
    try:
        client = OpenAI(api_key=api_key, timeout=30.0, max_retries=2)
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": nova_context}, 
                {"role": "user", "content": msg}
            ],
            temperature=0.7
        )
        return jsonify({"reply": res.choices[0].message.content})
    except AuthenticationError as e:
        print(f"[Nova] OpenAI AUTH ERROR - check OPENAI_API_KEY on Railway: {e}")
        return jsonify({"reply": "I'm having trouble connecting right now."}), 500
    except RateLimitError as e:
        print(f"[Nova] OpenAI RATE LIMIT / QUOTA ERROR - check billing: {e}")
        return jsonify({"reply": "I'm having trouble connecting right now."}), 500
    except (APIConnectionError, APIError) as e:
        print(f"[Nova] OpenAI API ERROR: {e}")
        return jsonify({"reply": "I'm having trouble connecting right now."}), 500
    except Exception as e:
        print(f"[Nova] Chatbot Error: {e}\n{traceback.format_exc()}")
        return jsonify({"reply": "I'm having trouble connecting right now."}), 500

@app.route('/api/settings', methods=['GET', 'POST'])
@jwt_required(optional=True) 
def settings():
    if request.method == 'GET':
        m = SystemSetting.query.filter_by(key='maintenance_mode').first()
        r = SystemSetting.query.filter_by(key='allow_registrations').first()
        return jsonify({
            "maintenance": m.value == 'true' if m else False,
            "registrations": r.value == 'true' if r else True
        })
    
    # POST
    user = db.session.get(User, get_jwt_identity()) # FIXED
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403
    
    data = request.json
    for key, val in [('maintenance_mode', data.get('maintenance')), ('allow_registrations', data.get('registrations'))]:
        if val is not None:
            setting = SystemSetting.query.filter_by(key=key).first()
            if not setting: 
                setting = SystemSetting(key=key, value=str(val).lower())
                db.session.add(setting)
            else: 
                setting.value = str(val).lower()
    db.session.commit()
    return jsonify({"msg": "Settings updated"})

@app.route('/api/verify-certificate/<cert_id>', methods=['GET'])
def verify_cert(cert_id):
    enr = Enrollment.query.filter_by(certificate_id=cert_id).first()
    if not enr: return jsonify({"valid": False}), 404
    u = db.session.get(User, enr.user_id) # FIXED
    c = db.session.get(Course, enr.course_id) # FIXED
    return jsonify({
        "valid": True, 
        "student_name": enr.certificate_name or u.name, 
        "course_title": enr.certificate_course_title or c.title, 
        "completion_date": enr.completion_date.strftime('%Y-%m-%d')
    })

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    email = request.json.get('email')
    user = User.query.filter_by(email=email).first()
    if user:
        token = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=15))
        link = f"{DOMAIN}/reset-password?token={token}"
        
        # 1. Create the nice body content matching your screenshot
        body_content = f"""
        <p>Hi {user.name},</p>
        <p>We received a request to reset your password. If this was you, click the button below to set a new password.</p>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't ask for this, you can safely ignore this email.</p>
        """
        
        # 2. Generate the HTML WITH the button
        html_content = get_email_template(
            title="Reset Your Password 🔓", 
            body_content=body_content, 
            button_text="Reset Password", 
            button_url=link
        )
        
        # 3. Send using the specific 'no-reply' email and custom name
        send_email(
            to_email=email, 
            subject="Reset Your Password", 
            html_content=html_content,
            sender_name="AICourseHubPro Security",
            sender_email="no-reply@aicoursehubpro.com"
        )
        
    return jsonify({"msg": "If account exists, email sent."})



@app.route('/api/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    try:
        # 1. Get the identity and force it to an integer
        user_id = int(get_jwt_identity()) 
        
        # 2. Use the modern session.get syntax
        user = db.session.get(User, user_id) 
        
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # 3. Get the new password from the request
        data = request.json
        new_password = data.get('new_password')
        
        if not new_password or len(new_password) < 6:
            return jsonify({"msg": "Password too short"}), 400

        # 4. Update and commit
        user.password = generate_password_hash(new_password)
        # However they got here - the dedicated Account Setup page, or the
        # normal Forgot Password flow - setting a real password means the
        # certificate should now be unlockable. Previously only the dedicated
        # /api/complete-account-setup route flipped this flag, leaving guests
        # who used Forgot Password instead stuck with a real password but
        # still locked out.
        if not user.account_setup_complete:
            user.account_setup_complete = True
        db.session.commit()
        log_activity(user.id, 'password_reset', detail='Password changed via reset link')
        
        return jsonify({"msg": "Password updated"}), 200

    except Exception as e:
        print(f"Reset Password Error: {e}")
        return jsonify({"msg": "Internal server error"}), 500

# ==========================================
#  GUEST CHECKOUT: ACCOUNT SETUP ROUTES
# ==========================================

@app.route('/api/account-status', methods=['GET'])
@jwt_required()
def account_status():
    """Used by the frontend to decide whether to show the certificate,
    or redirect to account setup first (guests must set a password)."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({
        "account_setup_complete": bool(user.account_setup_complete),
        "email": user.email,
        "name": user.name
    }), 200

@app.route('/api/complete-account-setup', methods=['POST'])
@jwt_required()
def complete_account_setup():
    """Guest-checkout users call this to set a real password. Required before
    they can access their certificate; also promotes their session to a
    normal, persistent login going forward."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.json or {}
    new_password = data.get('password')
    if not new_password or len(new_password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters"}), 400

    new_name = (data.get('name') or '').strip()
    if new_name:
        user.name = new_name  # printed on the certificate, so let them correct/confirm it here

    user.password = generate_password_hash(new_password)
    user.account_setup_complete = True
    db.session.commit()
    log_activity(user.id, 'account_setup', detail='Set a password and completed account setup')

    # Issue a fresh, standard-expiry token now that this is a full account.
    token = create_access_token(identity=str(user.id))
    return jsonify({
        "msg": "Account setup complete",
        "token": token,
        "name": user.name,
        "user_role": "admin" if user.is_admin else "student"
    }), 200

# ==========================================
#  AI ROLEPLAY ROUTES (NEW)
# ==========================================

@app.route('/api/roleplay/chat', methods=['POST'])
@jwt_required()
def roleplay_chat():
    """
    Handles the conversation for a simulation lesson.
    """
    data = request.json
    messages = data.get('messages', [])
    persona = data.get('persona', 'You are a helpful assistant.')
    
    # Construct conversation: System Instruction + Chat History
    conversation = [{"role": "system", "content": persona}] + messages

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: 
        return jsonify({"role": "assistant", "content": "AI Service Unavailable (Check Server Key)"}), 500

    try:
        client = OpenAI(api_key=api_key, timeout=30.0, max_retries=2)
        response = client.chat.completions.create(
            model="gpt-4o", # Use GPT-4o or gpt-3.5-turbo for speed
            messages=conversation,
            temperature=0.7 
        )
        ai_reply = response.choices[0].message.content
        return jsonify({"role": "assistant", "content": ai_reply})
    except AuthenticationError as e:
        print(f"[Roleplay Chat] OpenAI AUTH ERROR - check OPENAI_API_KEY on Railway: {e}")
        return jsonify({"role": "assistant", "content": "I'm having trouble connecting. Please try again."}), 500
    except RateLimitError as e:
        print(f"[Roleplay Chat] OpenAI RATE LIMIT / QUOTA ERROR - check billing: {e}")
        return jsonify({"role": "assistant", "content": "I'm having trouble connecting. Please try again."}), 500
    except (APIConnectionError, APIError) as e:
        print(f"[Roleplay Chat] OpenAI API ERROR: {e}")
        return jsonify({"role": "assistant", "content": "I'm having trouble connecting. Please try again."}), 500
    except Exception as e:
        print(f"[Roleplay Chat] Error: {e}\n{traceback.format_exc()}")
        return jsonify({"role": "assistant", "content": "I'm having trouble connecting. Please try again."}), 500



@app.route('/api/roleplay/feedback', methods=['POST'])
@jwt_required()
def roleplay_feedback():
    """
    Analyzes the transcript and generates structured feedback + score.
    Personalized with the user's real name.
    """
    # 1. Get the current logged-in user's ID from the token
    current_user_id = get_jwt_identity()
    
    # 2. Query the Database to find the User - FIXED LEGACY WARNING
    user = db.session.get(User, int(current_user_id)) 
    
    # 3. Create the 'student_name' variable dynamically
    # If the user exists, use their name. Otherwise, fallback to "The Student".
    student_name = user.name if user else "The Student"

    # 4. Get Request Data
    data = request.json
    messages = data.get('messages', [])
    learning_objectives = data.get('objectives', 'Professional communication')
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"error": "Server missing API Key"}), 500

    client = OpenAI(api_key=api_key, timeout=30.0, max_retries=2)

    # 5. Enhanced System Prompt with the Name
    analysis_prompt = f"""
    You are an expert instructor grading a roleplay simulation.
    
    **The Participants:**
    - **Student:** {student_name} (Referred to as 'user' in the transcript).
    - **Scenario Character:** The AI (Referred to as 'assistant' in the transcript).
    
    **Your Task:**
    Analyze the transcript below based on these objectives: {learning_objectives}.
    
    **Output Guidelines:**
    1. **Speak directly to {student_name}.** (e.g., "Great job, {student_name}!" or "{student_name} could have been firmer.").
    2. **NEVER use the word 'Assistant' or 'User'.** Instead, refer to the AI character by their role (e.g., "The Manager", "The Client") and the student by their real name.
    3. Be encouraging but honest.
    
    **Return strictly valid JSON:**
    {{
        "score": (integer 0-100),
        "strengths": ["point 1", "point 2", "point 3"],
        "improvements": ["point 1", "point 2", "point 3"],
        "summary": "A short, personalized paragraph summary addressing {student_name}."
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a personalized roleplay grader. Output JSON only."},
                {"role": "user", "content": f"{analysis_prompt}\n\nTRANSCRIPT:\n{str(messages)}"}
            ],
            response_format={ "type": "json_object" }
        )
        feedback = response.choices[0].message.content
        return jsonify(feedback)
    except AuthenticationError as e:
        print(f"[Roleplay Feedback] OpenAI AUTH ERROR - check OPENAI_API_KEY on Railway: {e}")
        return jsonify({"error": "AI grading temporarily unavailable"}), 500
    except RateLimitError as e:
        print(f"[Roleplay Feedback] OpenAI RATE LIMIT / QUOTA ERROR - check billing: {e}")
        return jsonify({"error": "AI grading temporarily unavailable"}), 500
    except (APIConnectionError, APIError) as e:
        print(f"[Roleplay Feedback] OpenAI API ERROR: {e}")
        return jsonify({"error": "AI grading temporarily unavailable"}), 500
    except Exception as e:
        print(f"[Roleplay Feedback] Error: {e}\n{traceback.format_exc()}")
        return jsonify({"error": "AI grading temporarily unavailable"}), 500
    

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"--- Starting Server on Port {port} ---") 
    app.run(host='0.0.0.0', port=port)



# triggering fresh deployment