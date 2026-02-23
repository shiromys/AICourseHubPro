from flask import Flask, jsonify, request, send_from_directory
from openai import OpenAI
from datetime import datetime, timedelta
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from dotenv import load_dotenv
from models import User, Course, Enrollment, ContactMessage, AuditLog, SystemSetting
from database import db
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
import resend 
import os
import uuid
import stripe
import sys

# Load environment variables
load_dotenv() 

# ==========================================
# 1. INITIALIZATION & CONFIGURATION
# ==========================================

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")

# --- CORS CONFIGURATION ---
CORS(app, resources={r"/api/*": {"origins": "*"}})

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
db_url = os.getenv("DATABASE_URL", 'postgresql://postgres:Akash1997@localhost:5434/aicoursehubpro_db')
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# --- API KEYS ---
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
resend.api_key = os.getenv("RESEND_API_KEY")

# --- DOMAIN ---
DOMAIN = os.getenv("FRONTEND_URL", "http://localhost:5173")

# --- FILE PATHS ---
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['COURSES_FOLDER'] = os.path.join(app.static_folder, 'courses')

# Initialize Extensions
db.init_app(app)
jwt = JWTManager(app)

# Create Folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['COURSES_FOLDER'], exist_ok=True)

# Create Database Tables
with app.app_context():
    db.create_all()

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================

def send_email(to_email, subject, html_content, sender_name="AICourseHubPro", sender_email="info@aicoursehubpro.com"):
    try:
        r = resend.Emails.send({
            "from": f"{sender_name} <{sender_email}>", 
            "to": to_email,
            "subject": subject,
            "html": html_content
        })
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
            role='student' # Explicitly set role
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

    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password, password):
        return jsonify({"msg": "Incorrect credentials"}), 401

    if user.is_deleted:
        return jsonify({"msg": "Account deactivated"}), 403

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
    send_email("info@aicoursehubpro.com", f"New Inquiry: {subject}", admin_html, "Contact Form", "no-reply@aicoursehubpro.com")
    
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
        "ban_expiry": str(u.ban_expiry) if u.ban_expiry else None
    } for u in users])

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
        
    db.session.commit()
    return jsonify({"msg": "Profile updated successfully", "name": user.name})

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
    for i in range(6):
        day = (end_date - timedelta(days=6-i)).strftime('%b %d')
        chart_data.append({ "name": day, "revenue": 0 })
    chart_data.append({ "name": end_date.strftime('%b %d'), "revenue": int(total_revenue) })

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

    data = request.json
    if 'title' in data: course.title = data['title']
    if 'description' in data: course.description = data['description']
    if 'price' in data: course.price = float(data['price'])
    if 'category' in data: course.category = data['category']
    if 'modules' in data: course.course_data = {"modules": data['modules']}

    db.session.commit()
    return jsonify({"msg": "Updated", "course": course.to_dict()})

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
# 7. ENROLLMENT & STRIPE ROUTES
# ==========================================

@app.route('/api/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    user_id = get_jwt_identity()
    data = request.json
    course = db.session.get(Course, data.get('course_id')) # FIXED
    if not course: return jsonify({'message': 'Course not found'}), 404

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': course.title},
                    'unit_amount': int(course.price * 100), 
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{DOMAIN}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&course_id={course.id}",
            cancel_url=f"{DOMAIN}/courses",
            client_reference_id=str(user_id),
            metadata={"user_id": user_id, "course_id": course.id}
        )
        return jsonify({'id': checkout_session.id, 'url': checkout_session.url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    user_id = get_jwt_identity()
    data = request.json
    session_id = data.get('session_id')
    course_id = data.get('course_id')

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == 'paid':
            existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
            if not existing:
                # NEW: We now save the real session_id from Stripe directly into the database
                new_enrollment = Enrollment(
                    user_id=user_id, 
                    course_id=course_id, 
                    status='in-progress', 
                    progress=0, 
                    enrolled_at=datetime.utcnow(),
                    stripe_session_id=session_id  # <--- SAVING STRIPE ID HERE
                )
                db.session.add(new_enrollment)
                db.session.commit()
                
                # Send Welcome Email
                user = db.session.get(User, user_id)
                course = db.session.get(Course, course_id)
                email_content = get_email_template("Course Unlocked! 🎓", f"You have successfully enrolled in {course.title}.", "Start Learning", f"{DOMAIN}/dashboard")
                send_email(user.email, f"Welcome to {course.title}", email_content)

            return jsonify({"msg": "Enrolled", "status": "enrolled"}), 200
    except Exception as e:
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

    if 'progress' in data: enr.progress = data['progress']
    if 'status' in data: enr.status = data['status']
    if 'score' in data: enr.score = data['score']
    if 'module_idx' in data: enr.last_module_index = data['module_idx']
    if 'lesson_idx' in data: enr.last_lesson_index = data['lesson_idx']

    if enr.status == 'completed' and not enr.certificate_id:
        enr.certificate_id = f"AIC-{str(uuid.uuid4())[:8].upper()}"
        enr.completion_date = datetime.utcnow()

    db.session.commit()
    return jsonify({"msg": "Updated", "certificate_id": enr.certificate_id}), 200

@app.route('/api/my-enrollments', methods=['GET'])
@jwt_required()
def get_my_enrollments():
    user_id = get_jwt_identity()
    results = db.session.query(Enrollment, Course).join(Course, Enrollment.course_id == Course.id).filter(Enrollment.user_id == user_id).all()
    return jsonify([{
        "id": c.id, "title": c.title, "description": c.description,
        "progress": e.progress, "status": e.status
    } for e, c in results])



@app.route('/api/my-payments', methods=['GET'])
@jwt_required()
def get_my_payments():
    user_id = get_jwt_identity()
    # Join Enrollments and Courses to get the price and title
    results = db.session.query(Enrollment, Course).join(Course, Enrollment.course_id == Course.id).filter(Enrollment.user_id == user_id).order_by(Enrollment.enrolled_at.desc()).all()
    
    payments = []
    for e, c in results:
        # NEW: Try to use the real Stripe ID. If they bypassed payment (free enrollment as Admin), fallback to a generated ID.
        real_receipt = e.stripe_session_id if e.stripe_session_id else f"REC-FREE-{e.id}{user_id}"
        
        payments.append({
            "id": e.id,
            "course": c.title,
            "amount": c.price,
            "date": e.enrolled_at.strftime('%b %d, %Y') if e.enrolled_at else "N/A",
            "status": "Paid",
            "receipt": real_receipt # <--- SENDING REAL STRIPE ID HERE
        })
        
    return jsonify(payments), 200




@app.route('/api/enrollment/<int:course_id>', methods=['GET'])
@jwt_required()
def get_enrollment_status(course_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id) # FIXED
    if user.is_admin:
        return jsonify({"status": "completed", "progress": 100, "certificate_id": "ADMIN_PREVIEW"})
        
    enr = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enr: return jsonify({"msg": "Not enrolled"}), 404
    
    return jsonify({
        "progress": enr.progress, "status": enr.status, 
        "last_module_index": enr.last_module_index,
        "last_lesson_index": enr.last_lesson_index,
        "certificate_id": enr.certificate_id
    })

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
    If a user asks about refunds of any sort, politely make them understand that we do not provide refunds of any sort. Payments once made toward AICourseHUbPro as non-refundable and final.
    If a user asks about our course offerings, list the courses we offer, namely - AI for Human Resources / Talent / People Ops via Prompts, Prompt-Based Tools for Education & Learning, Prompt-Based Analytics and Reports for Business, Prompting for Automation and Workflow Efficiency, Prompt Engineering for Non-Profits and Social Impact, Prompt-Based AI for Local Government and Public Services. Highlight the courses (bold) and list them one by one.
    If a user asks about topics completely unrelated to AI, the courses, or the platform, politely decline to answer and guide them back to our offerings.
    Users can contact our email address - info@aicoursehubpro.com for more information on any queries.
    If the users want, you can navigate them to the contact page of our application, that is present at the navbar.
    """
    
    try:
        client = OpenAI(api_key=api_key)
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": nova_context}, 
                {"role": "user", "content": msg}
            ],
            temperature=0.7
        )
        return jsonify({"reply": res.choices[0].message.content})
    except Exception as e:
        print(f"Chatbot Error: {e}")
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
        "student_name": u.name, 
        "course_title": c.title, 
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
            sender_name="AICourseHub Security",
            sender_email="no-reply@aicoursehubpro.com"
        )
        
    return jsonify({"msg": "If account exists, email sent."})



@app.route('/api/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    user = db.session.get(User, get_jwt_identity()) # FIXED
    user.password = generate_password_hash(request.json.get('new_password'))
    db.session.commit()
    return jsonify({"msg": "Password updated"})

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
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o", # Use GPT-4o or gpt-3.5-turbo for speed
            messages=conversation,
            temperature=0.7 
        )
        ai_reply = response.choices[0].message.content
        return jsonify({"role": "assistant", "content": ai_reply})
    except Exception as e:
        print(f"Roleplay Error: {e}")
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

    client = OpenAI(api_key=api_key)

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
    except Exception as e:
        print(f"Feedback Error: {e}")
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"--- Starting Server on Port {port} ---") 
    app.run(host='0.0.0.0', port=port)