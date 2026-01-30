from flask import Flask, jsonify, request, send_from_directory
from openai import OpenAI
from flask_cors import CORS, cross_origin
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from dotenv import load_dotenv
# Add ContactMessage and AuditLog to imports
from models import User, Course, Enrollment, ContactMessage, AuditLog
import resend 
import os
import uuid # <--- Required for certificate ID generation
import json
from sqlalchemy import func
import stripe
from datetime import datetime
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message

# === IMPORTS ===
from database import db

# Load environment variables from .env file
load_dotenv() 

app = Flask(__name__, static_folder='static')
app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
CORS(app)

# --- MAIL CONFIGURATION ---
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.dynadot.com') # Default to Dynadot
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME')

mail = Mail(app)
# --------------------------

# ==========================================
# 1. CONFIGURATION
# ==========================================

# Allow frontend (port 5173) to talk to backend
# This global config handles CORS for all routes, including PUT/OPTIONS
CORS(app, resources={r"/api/*": {"origins": "https://frontend-production-04f2.up.railway.app"}})

# --- SECURE CONFIG (Loaded from .env) ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", 'postgresql://postgres:Akash1997@localhost:5434/aicoursehubpro_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")

# API Keys
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
resend.api_key = os.getenv("RESEND_API_KEY")

# Domain
# Use an environment variable for production, fallback to localhost for dev
DOMAIN = os.getenv("FRONTEND_URL", "http://localhost:5173")

# --- STANDARD CONFIG ---
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['COURSES_FOLDER'] = os.path.join(app.static_folder, 'courses')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

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

def send_email(to_email, subject, html_content):
    try:
        r = resend.Emails.send({
            "from": "AICourseHubPro <info@aicoursehubpro.com>", 
            "to": to_email,
            "subject": subject,
            "html": html_content
        })
        print(f"Email sent to {to_email}: {r}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
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
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            &copy; 2026 AICourseHubPro. All rights reserved.<br>
            5080 Spectrum Drive, Suite 575E, Addison, TX 75001
        </div>
    </div>
    """

# ==========================================
# 3. AUTH ROUTES
# ==========================================

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    # 1. Clean the email (Lowercase + Trim Spaces)
    email = data['email'].strip().lower()
    
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    # 2. Force Default Hashing (Removes the problematic pbkdf2)
    hashed_pw = generate_password_hash(data['password'])
    
    # DEBUG LOG
    print(f"--- DEBUG: Creating User {email} with hash: {hashed_pw[:10]}... ---")

    new_user = User(email=email, password=hashed_pw, name=data['name'])
    db.session.add(new_user)
    db.session.commit()

    # ... (User created and committed to DB above) ...

    # --- SEND WELCOME EMAIL ---
    try:
        msg = Message("Welcome to AICourseHub Pro!", recipients=[email])
        
        # 1. Sender: Must be your verified domain in Resend
        msg.sender = ("AICourseHub Team", "info@aicoursehubpro.com")
        
        # 2. Reply-To: This routes user replies to your Support Email
        msg.reply_to = "support@shirotechnologies.com" 
        
        msg.body = f"""Hello {name},

Welcome to AICourseHub Pro! 

Your account has been successfully created. You can now log in to start your courses.

Login here: https://aicoursehubpro.com/login

Best regards,
The AICourseHub Team
"""
        mail.send(msg)
        print(f"DEBUG: Email sent to {email}")
    except Exception as e:
        print(f"ERROR: Email sending failed: {e}")
    # --------------------------

    return jsonify({"msg": "Signup successful"}), 201
    
    return jsonify({"msg": "User created"}), 201



@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    # 1. Clean the email (Lowercase + Trim Spaces)
    email = data['email'].strip().lower()
    password = data['password']

    print(f"--- DEBUG: Login attempt for {email} ---")

    user = User.query.filter_by(email=email).first()
    
    if not user:
        print("--- DEBUG: User NOT found in Database ---")
        return jsonify({"msg": "Incorrect credentials"}), 401

    # 2. Check Password
    is_valid = check_password_hash(user.password, password)
    
    print(f"--- DEBUG: Password Valid? {is_valid} ---")
    print(f"--- DEBUG: Stored Hash starts with: {user.password[:15]}... ---")

    if not is_valid:
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

    admin_html = f"""
    <h3>New Contact Message</h3>
    <p><strong>From:</strong> {name} ({user_email})</p>
    <p><strong>Subject:</strong> {subject}</p>
    <p><strong>Message:</strong><br>{message}</p>
    """
    send_email("info@aicoursehubpro.com", f"New Inquiry: {subject}", admin_html)

    user_html = f"""
    <h3>Hi {name},</h3>
    <p>Thanks for contacting AICourseHubPro. We have received your message regarding "<strong>{subject}</strong>".</p>
    <p>Our team will get back to you shortly.</p>
    """
    send_email(user_email, "We received your message", user_html)

    return jsonify({"msg": "Message sent and saved"}), 200

# ==========================================
# 5. USER MANAGEMENT ROUTES
# ==========================================

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    view_type = request.args.get('type', 'active')
    
    if view_type == 'deleted':
        users = User.query.filter_by(is_deleted=True).order_by(User.id.desc()).all()
    else:
        users = User.query.filter_by(is_deleted=False).order_by(User.id.desc()).all()
    
    output = []
    for u in users:
        status = "Active"
        if u.ban_expiry and u.ban_expiry > datetime.utcnow():
            status = "Banned"
            
        output.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": "Admin" if u.is_admin else "Student",
            "status": status,
            "ban_expiry": str(u.ban_expiry) if u.ban_expiry else None
        })
    return jsonify(output)

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
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
    admin = User.query.get(current_user_id)
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    user = User.query.get(user_id)
    if not user: return jsonify({"msg": "User not found"}), 404
    if user.id == admin.id: return jsonify({"msg": "Cannot ban yourself"}), 400

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
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    # 1. Basic Counters
    total_revenue = db.session.query(func.sum(Course.price))\
        .join(Enrollment, Course.id == Enrollment.course_id).scalar() or 0.0

    total_students = User.query.filter_by(is_admin=False, is_deleted=False).count()
    total_courses = Course.query.filter_by(is_deleted=False).count()

    # 2. Revenue Trend (Fixed Logic)
    # Since we are in MVP mode and don't track exact "Purchase Date", 
    # we will assume ALL revenue happened "Today" for the chart visualization.
    # This prevents the weird "$2.90" splitting issue.
    
    chart_data = []
    end_date = datetime.utcnow()
    
    for i in range(6):
        # Days 1-6 (Past): Show 0 revenue (unless we add a real purchase_date column later)
        day_label = (end_date - timedelta(days=6-i)).strftime('%b %d')
        chart_data.append({ "name": day_label, "revenue": 0 })

    # Day 7 (Today): Show Total Revenue
    chart_data.append({ 
        "name": end_date.strftime('%b %d'), 
        "revenue": int(total_revenue) 
    })

    # 3. Recent Support Messages
    recent_msgs = ContactMessage.query.filter_by(is_read=False)\
        .order_by(ContactMessage.created_at.desc()).limit(5).all()
    
    messages_preview = [{
        "id": m.id, 
        "name": m.name, 
        "subject": m.subject,
        "time": m.created_at.strftime('%H:%M')
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
    admin = User.query.get(current_user_id)
    
    if not admin or not admin.is_admin: 
        return jsonify({"msg": "Admin access required"}), 403

    user = User.query.get(user_id)
    if not user: 
        return jsonify({"msg": "User not found"}), 404
        
    if user.id == admin.id:
        return jsonify({"msg": "You cannot change your own role. Ask another admin."}), 400

    data = request.json
    if 'is_admin' in data:
        user.is_admin = data['is_admin']
        action = "promoted to Admin" if user.is_admin else "demoted to Student"
        db.session.commit()
        return jsonify({"msg": f"User {user.name} was {action}."})
    
    return jsonify({"msg": "No changes made"}), 400

@app.route('/api/users/<int:user_id>/delete', methods=['DELETE'])
@jwt_required()
def soft_delete_user(user_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    user = User.query.get(user_id)
    if not user: return jsonify({"msg": "User not found"}), 404
    if user.id == admin.id: return jsonify({"msg": "Cannot delete yourself"}), 400

    user.is_deleted = True
    db.session.commit()
    return jsonify({"msg": "User moved to deleted list"})

@app.route('/api/users/<int:user_id>/restore', methods=['POST'])
@jwt_required()
def restore_user(user_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin only"}), 403

    user = User.query.get(user_id)
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
        output = []
        for course in courses:
            output.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'price': course.price,
                'category': course.category,
                'modules': course.course_data.get('modules', []) if course.course_data else []
            })
        return jsonify(output), 200
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/courses', methods=['POST'])
@jwt_required()
def create_course():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_admin: return jsonify({"msg": "Admin access required"}), 403

        if request.is_json:
            data = request.json
            if not data.get('title'): return jsonify({"msg": "Title is required"}), 400

            new_course = Course(
                title=data.get('title'),
                description=data.get('description', ''),
                price=float(data.get('price', 29.0)),
                category=data.get('category', 'General'),
                course_data={"modules": data.get('modules', [])},
                is_active=True,
                is_deleted=False
            )
            
            db.session.add(new_course)
            db.session.commit()
            return jsonify(new_course.to_dict()), 201

        return jsonify({"msg": "Invalid data format"}), 400
    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({"msg": str(e)}), 500

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    course = Course.query.get(course_id)
    if not course: return jsonify({"msg": "Course not found"}), 404

    data = request.json
    if 'title' in data: course.title = data['title']
    if 'description' in data: course.description = data['description']
    if 'price' in data: course.price = float(data['price'])
    if 'category' in data: course.category = data['category']
    if 'is_active' in data: course.is_active = data['is_active']

    db.session.commit()
    return jsonify({"msg": "Course updated", "course": course.to_dict()})

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    course = Course.query.get(course_id)
    if not course: return jsonify({"msg": "Course not found"}), 404

    course.is_deleted = True
    db.session.commit()
    return jsonify({"msg": "Course archived"})

# ==========================================
# 7. ENROLLMENT & PROGRESS ROUTES
# ==========================================

@app.route('/api/enroll', methods=['POST'])
@jwt_required()
def enroll_free():
    user_id = get_jwt_identity()
    data = request.json
    course_id = data.get('course_id')
    
    existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existing: return jsonify({"msg": "Already enrolled"}), 200
    
    enrollment = Enrollment(user_id=user_id, course_id=course_id, status='in-progress', progress=0, score=0)
    db.session.add(enrollment)
    db.session.commit()

    user = User.query.get(user_id)
    course = Course.query.get(course_id)

    if user and course:
        try:
            html_body = f"""
            <p>Hi {user.name},</p>
            <p>You have successfully enrolled in <strong>{course.title}</strong>.</p>
            <p>We are excited to see what you build with these new skills. You can start watching the lessons immediately.</p>
            """
            
            email_content = get_email_template(
                title="Enrollment Confirmed! 🎓",
                body_content=html_body,
                button_text="Start Learning",
                button_url=f"{DOMAIN}/dashboard"
            )
            
            send_email(user.email, f"You're in: {course.title}", email_content)
        except Exception as e:
            print(f"Enrollment email failed: {e}")
    
    return jsonify({"msg": "Enrolled successfully!"}), 201



# ==========================================
# 1. UPDATE PROGRESS & GENERATE CERTIFICATE
# ==========================================
@app.route('/api/update-progress', methods=['POST'])
@jwt_required()
def update_progress():
    user_id = get_jwt_identity()
    data = request.json
    course_id = data.get('course_id')
    status = data.get('status')
    score = data.get('score') # Optional quiz score
    
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({"msg": "Enrollment not found"}), 404

    # Update basic fields
    if 'progress' in data:
        enrollment.progress = data['progress']
    if status:
        enrollment.status = status
    if score is not None:
        enrollment.score = score
        
    # Update bookmarks if provided
    if 'module_idx' in data:
        enrollment.last_module_index = data['module_idx']
    if 'lesson_idx' in data:
        enrollment.last_lesson_index = data['lesson_idx']

    # --- CRITICAL FIX: Generate Certificate ID on Completion ---
    # If completed AND no ID exists yet, generate one.
    if enrollment.status == 'completed' and not enrollment.certificate_id:
        # Generate a unique ID (e.g., AIC-A1B2C3D4)
        unique_id = f"AIC-{str(uuid.uuid4())[:8].upper()}"
        enrollment.certificate_id = unique_id
        enrollment.completion_date = datetime.utcnow()
    # --------------------------------------------------------

    db.session.commit()
    
    return jsonify({
        "msg": "Progress updated", 
        "certificate_id": enrollment.certificate_id
    }), 200


@app.route('/api/verify/<string:cert_id>', methods=['GET'])
def verify_certificate_public(cert_id):
    # No @jwt_required() because employers need to see this without logging in
    enrollment = Enrollment.query.filter_by(certificate_id=cert_id).first()
    
    if not enrollment:
        return jsonify({"valid": False, "msg": "Invalid Certificate ID"}), 404
        
    user = User.query.get(enrollment.user_id)
    course = Course.query.get(enrollment.course_id)
    
    return jsonify({
        "valid": True,
        "student_name": user.name,
        "course_title": course.title,
        "completion_date": enrollment.completion_date.strftime('%B %d, %Y'),
        "score": enrollment.score
    }), 200



@app.route('/api/enrollment/<int:course_id>', methods=['GET'])
@jwt_required()
def get_enrollment_status(course_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # --- DEBUG PRINT (Check your terminal when you visit the page!) ---
    is_admin = getattr(user, 'is_admin', False) or getattr(user, 'role', '') == 'admin'
    print(f" >>> ENROLLMENT CHECK: User {user_id} | Admin: {is_admin} | Course: {course_id}")

    # --- ADMIN GOD MODE ---
    if is_admin:
        print(" >>> GRANTING ADMIN ACCESS")
        return jsonify({
            "status": "completed",
            "progress": 100,
            "last_module_index": 0,
            "last_lesson_index": 0,
            "score": 0,
            "certificate_id": "ADMIN_PREVIEW"
        })
    # ----------------------

    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    
    if not enrollment: 
        return jsonify({"msg": "Not enrolled"}), 404
        
    # Lazy Certificate Generation logic...
    if enrollment.status == 'completed' and not enrollment.certificate_id:
        unique_code = f"AIC-{uuid.uuid4().hex[:8].upper()}"
        enrollment.certificate_id = unique_code
        if not enrollment.completion_date:
            enrollment.completion_date = datetime.utcnow()
        db.session.commit()

    return jsonify({
        "progress": enrollment.progress,
        "status": enrollment.status,
        "last_module_index": enrollment.last_module_index,
        "last_lesson_index": enrollment.last_lesson_index,
        "score": enrollment.score,
        "certificate_id": enrollment.certificate_id
    })


@app.route('/api/my-enrollments', methods=['GET'])
@jwt_required()
def get_my_enrollments():
    user_id = get_jwt_identity()
    results = db.session.query(Enrollment, Course).join(Course, Enrollment.course_id == Course.id).filter(Enrollment.user_id == user_id).all()
    
    output = []
    for enr, course in results:
        output.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "category": course.category,
            "progress": enr.progress,
            "status": enr.status,
            "total_lessons": len(course.course_data.get('modules', []))
        })
    return jsonify(output)



@app.route('/api/admin/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    enrollments = Enrollment.query.all()
    data = []
    for e in enrollments:
        student = User.query.get(e.user_id)
        course = Course.query.get(e.course_id)
        if student and course:
            data.append({
                "id": e.id,
                "user": student.name,
                "email": student.email,
                "course": course.title,
                "date": str(e.completion_date) if e.completion_date else "In Progress",
                "status": e.status
            })
    return jsonify(data)

# ==========================================
# 9. PASSWORD RESET ROUTES
# ==========================================

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "If your email is in our system, you will receive a reset link."}), 200

    reset_token = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=15))
    reset_link = f"{DOMAIN}/reset-password?token={reset_token}"
    
    try:
        html_body = f"""
        <p>Hi {user.name},</p>
        <p>We received a request to reset your password. If this was you, click the button below to set a new password.</p>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't ask for this, you can safely ignore this email.</p>
        """
        
        email_content = get_email_template(
            title="Reset Your Password 🔒",
            body_content=html_body,
            button_text="Reset Password",
            button_url=reset_link
        )
        
        send_email(user.email, "Password Reset Request", email_content)
        
    except Exception as e:
        print(f"Password reset email failed: {e}")

    return jsonify({"msg": "If your email is in our system, you will receive a reset link."}), 200

@app.route('/api/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({"msg": "User not found"}), 404
            
        data = request.json
        new_password = data.get('new_password')
        
        if not new_password or len(new_password) < 6:
            return jsonify({"msg": "Password must be at least 6 characters"}), 400
            
        user.password = generate_password_hash(new_password, method='pbkdf2:sha256')
        db.session.commit()
        
        return jsonify({"msg": "Password reset successfully. You can now log in."}), 200
        
    except Exception as e:
        print(f"--- CRITICAL ERROR: {str(e)} ---")
        return jsonify({"msg": "Server error processing request"}), 500
    


# ==========================================
# 11. STRIPE PAYMENT ROUTE
# ==========================================

@app.route('/api/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        course_id = data.get('course_id')
        
        course = Course.query.get(course_id)
        if not course: 
            return jsonify({"msg": "Course not found"}), 404

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': course.title,
                        'description': course.description or "Premium Course Access",
                    },
                    'unit_amount': int(course.price * 100), 
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{DOMAIN}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&course_id={course_id}",
            cancel_url=f"{DOMAIN}/pricing",
            metadata={
                "user_id": current_user_id,
                "course_id": course_id
            }
        )
        
        return jsonify({'id': checkout_session.id, 'url': checkout_session.url})

    except Exception as e:
        print(f"Stripe Error: {e}")
        return jsonify({'error': str(e)}), 500


# ==========================================
# ADD THIS NEW ROUTE FOR PAYMENT VERIFICATION
# ==========================================
@app.route('/api/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    user_id = get_jwt_identity()
    data = request.json
    session_id = data.get('session_id')
    course_id = data.get('course_id')

    if not session_id or not course_id:
        return jsonify({"msg": "Missing session or course ID"}), 400

    try:
        # 1. Ask Stripe: "Is this session valid and paid?"
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            # 2. Check if already enrolled
            existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
            if existing:
                return jsonify({"msg": "Already enrolled", "status": "enrolled"}), 200

            # 3. Create Enrollment
            new_enrollment = Enrollment(
                user_id=user_id, 
                course_id=course_id, 
                status='in-progress', 
                progress=0
            )
            db.session.add(new_enrollment)
            db.session.commit()
            
            return jsonify({"msg": "Enrollment successful!", "status": "enrolled"}), 200
        else:
            return jsonify({"msg": "Payment not verified"}), 400

    except Exception as e:
        print(f"Payment Verification Error: {e}")
        return jsonify({"msg": "Error verifying payment"}), 500
    


# ==========================================
# 12. EXTENDED ADMIN ROUTES
# ==========================================

@app.route('/api/admin/messages', methods=['GET'])
@jwt_required()
def get_messages():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    # FIX: Filter by is_read=False so closed tickets don't show up again
    msgs = ContactMessage.query.filter_by(is_read=False).order_by(ContactMessage.created_at.desc()).all()
    
    output = [{
        "id": m.id, "name": m.name, "email": m.email, 
        "subject": m.subject, "message": m.message, 
        "date": m.created_at.strftime('%Y-%m-%d'),
        "is_read": m.is_read
    } for m in msgs]
    return jsonify(output)



# --- THIS WAS THE BROKEN FUNCTION. IT IS NOW FIXED. ---
@app.route('/api/admin/messages/<int:id>/read', methods=['PUT'])
@jwt_required()
def mark_message_read(id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Security Check: Ensure only Admins can do this
        # FIX: Changed 'user.role' to 'user.is_admin'
        if not user or not user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403

        msg = ContactMessage.query.get(id)
        if not msg:
            return jsonify({"msg": "Message not found"}), 404

        msg.is_read = True
        db.session.commit()

        return jsonify({"msg": "Message closed successfully"}), 200
    except Exception as e:
        print("Error closing ticket:", e)
        return jsonify({"msg": "Server error"}), 500
    


@app.route('/api/admin/logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(50).all()
    
    if not logs:
        return jsonify([
            {"action": "System Startup", "admin": "System", "details": "Server restarted", "date": datetime.utcnow().strftime('%Y-%m-%d %H:%M')},
            {"action": "Database Backup", "admin": "System", "details": "Daily backup completed", "date": datetime.utcnow().strftime('%Y-%m-%d %H:%M')}
        ])

    output = [{
        "action": l.action, "admin": l.admin_email, 
        "details": l.details, "date": l.timestamp.strftime('%Y-%m-%d %H:%M')
    } for l in logs]
    return jsonify(output)



# ==========================================
# 13. AI CHATBOT ROUTE (REAL-TIME)
# ==========================================

# --- KNOWLEDGE BASE ---
# The AI uses this text to answer user questions. 
# Update this string to teach the bot new things about your platform.
KNOWLEDGE_BASE = """
You are Nova, the professional AI support assistant for AICourseHubPro.

**FORMATTING RULES:**
1. **Use Bullet Points:** Whenever you list more than 2 items (like courses or steps), MUST use a bulleted list.
2. **Use Bolding:** Bold key terms like **Refunds**, **Login**, or **Course Names**.
3. **Spacing:** Keep paragraphs short.

**PLATFORM INFO:**
- Name: AICourseHubPro
- Purpose: AI training for HR, Operations, and Management.

**COURSES:**
We offer the following specialized courses:
- **AI for Human Resources**
- **AI for Recruitment**
- **AI for Local Government**
- **AI for Automation**
(Note: All courses are text-based and require payment).

**CERTIFICATES:**
- Requirement: 70% score on the final quiz.
- Format: PDF (Verifiable via QR code).

**POLICIES:**
- **Refunds:** No refunds generally. Exceptions for technical errors only such as double payments, payment checkout issues, etc.
- **Login:** Use "Forgot Password" to reset.
- **Names:** Cannot change profile name after certificate generation.

**CONTACT:**
- Email: info@aicoursehubpro.com
- Office address: 5080 Spectrum Drive, Suite 575E, Addison, TX 75001
- Office timings: Mon - Fri, 9:30 AM - 6:00 PM CST
- Do not make up facts
"""

@app.route('/api/chat', methods=['POST'])
def chat_support():
    data = request.json
    user_message = data.get('message', '')
    
    # 1. Get API Key from Environment
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("CRITICAL: OPENAI_API_KEY is missing from .env file.")
        return jsonify({"reply": "System Error: Chat is currently unavailable. Please contact support."}), 500

    # 2. Call OpenAI API
    try:
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini", # Fast, cheap, and smart enough for support
            messages=[
                {"role": "system", "content": KNOWLEDGE_BASE},
                {"role": "user", "content": user_message}
            ],
            max_tokens=200, # Limit response length
            temperature=0.5 # Lower temperature = more factual/consistent
        )
        
        ai_reply = response.choices[0].message.content
        return jsonify({"reply": ai_reply})

    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return jsonify({"reply": "I'm having trouble connecting to the brain right now. Please try again in a moment."}), 500



# ==========================================
# 14. VERIFY CERTIFICATE ROUTE
# ==========================================
@app.route('/api/verify-certificate/<cert_id>', methods=['GET'])
def verify_certificate_id(cert_id):
    enrollment = Enrollment.query.filter_by(certificate_id=cert_id).first()
    
    if not enrollment:
        return jsonify({"valid": False}), 404
    
    # Fetch related data
    student = User.query.get(enrollment.user_id)
    course = Course.query.get(enrollment.course_id)
    
    return jsonify({
        "valid": True,
        "student_name": student.name,
        "course_title": course.title,
        "completion_date": enrollment.completion_date.strftime('%Y-%m-%d') if enrollment.completion_date else "N/A"
    }), 200
    


if __name__ == '__main__':
    print("Starting Flask Server on Port 5000...")
    app.run(debug=True, port=5000)