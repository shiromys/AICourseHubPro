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
# 1. INITIALIZATION
# ==========================================

# Initialize Flask
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

        # --- DATABASE STEP ---
        hashed_pw = generate_password_hash(password)
        
        new_user = User(
            email=email, 
            password=hashed_pw, 
            name=name,
            is_admin=False,
            is_deleted=False
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # --- CRITICAL REFRESH ---
        db.session.refresh(new_user)
        print(f"--- DEBUG: User saved with ID: {new_user.id} ---", flush=True)

        # --- EMAIL STEP (ENABLED) ---
        try:
            msg = Message("Welcome to AICourseHub Pro!", recipients=[email])
            msg.body = f"Hello {name},\n\nWelcome to AICourseHub Pro! Your account has been created.\n\nLogin here: https://aicoursehubpro.com/login\n\nBest,\nTeam AICourseHubPro"
            
            # Using the mail extension configured with Resend SMTP
            mail.send(msg)
            print("--- DEBUG: Email sent successfully ---", flush=True)
        except Exception as e:
            # We log the error but allow the request to complete so the user can still log in.
            print(f"--- WARNING: Email failed but user created: {str(e)} ---", file=sys.stderr, flush=True)

        return jsonify({"msg": "Signup successful", "user_id": new_user.id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"--- CRITICAL ERROR: {str(e)} ---", file=sys.stderr, flush=True)
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

    # Admin Notification
    admin_html = f"""
    <h3>New Contact Message</h3>
    <p><strong>From:</strong> {name} ({user_email})</p>
    <p><strong>Subject:</strong> {subject}</p>
    <p><strong>Message:</strong><br>{message}</p>
    """
    try:
        resend.Emails.send({
            "from": "AICourseHubPro Contact <no-reply@aicoursehubpro.com>",
            "to": "info@aicoursehubpro.com",
            "subject": f"New Inquiry: {subject}",
            "reply_to": user_email, 
            "html": admin_html
        })
    except Exception as e:
        print(f"Error sending admin email: {e}")

    # User Confirmation
    try:
        user_html = f"""
        <h3>Hi {name},</h3>
        <p>Thank you for contacting AICourseHubPro. We have received your message regarding "<strong>{subject}</strong>".</p>
        <p>Our team will get back to you shortly.</p>
        """
        send_email(user_email, "We received your message", user_html)
    except Exception as e:
        print(f"Error sending user confirmation: {e}")

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

    total_revenue = db.session.query(func.sum(Course.price))\
        .join(Enrollment, Course.id == Enrollment.course_id).scalar() or 0.0

    total_students = User.query.filter_by(is_admin=False, is_deleted=False).count()
    total_courses = Course.query.filter_by(is_deleted=False).count()

    chart_data = []
    end_date = datetime.utcnow()
    for i in range(6):
        day_label = (end_date - timedelta(days=6-i)).strftime('%b %d')
        chart_data.append({ "name": day_label, "revenue": 0 })

    chart_data.append({ 
        "name": end_date.strftime('%b %d'), 
        "revenue": int(total_revenue) 
    })

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
    admin = User.query.get(current_user_id)
    if not admin or not admin.is_admin: return jsonify({"msg": "Admin access required"}), 403

    user = User.query.get(user_id)
    if not user: return jsonify({"msg": "User not found"}), 404
    if user.id == admin.id: return jsonify({"msg": "Cannot change your own role."}), 400

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

@app.route('/api/update-progress', methods=['POST'])
@jwt_required()
def update_progress():
    user_id = get_jwt_identity()
    data = request.json
    course_id = data.get('course_id')
    status = data.get('status')
    score = data.get('score')
    
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment: return jsonify({"msg": "Enrollment not found"}), 404

    if 'progress' in data: enrollment.progress = data['progress']
    if status: enrollment.status = status
    if score is not None: enrollment.score = score
        
    if 'module_idx' in data: enrollment.last_module_index = data['module_idx']
    if 'lesson_idx' in data: enrollment.last_lesson_index = data['lesson_idx']

    if enrollment.status == 'completed' and not enrollment.certificate_id:
        unique_id = f"AIC-{str(uuid.uuid4())[:8].upper()}"
        enrollment.certificate_id = unique_id
        enrollment.completion_date = datetime.utcnow()

    db.session.commit()
    return jsonify({"msg": "Progress updated", "certificate_id": enrollment.certificate_id}), 200

@app.route('/api/verify/<string:cert_id>', methods=['GET'])
def verify_certificate_public(cert_id):
    enrollment = Enrollment.query.filter_by(certificate_id=cert_id).first()
    if not enrollment: return jsonify({"valid": False, "msg": "Invalid Certificate ID"}), 404
        
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
    
    is_admin = getattr(user, 'is_admin', False) or getattr(user, 'role', '') == 'admin'

    if is_admin:
        return jsonify({
            "status": "completed",
            "progress": 100,
            "last_module_index": 0,
            "last_lesson_index": 0,
            "score": 0,
            "certificate_id": "ADMIN_PREVIEW"
        })

    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment: return jsonify({"msg": "Not enrolled"}), 404
        
    if enrollment.status == 'completed' and not enrollment.certificate_id:
        unique_code = f"AIC-{uuid.uuid4().hex[:8].upper()}"
        enrollment.certificate_id = unique_code
        if not enrollment.completion_date: enrollment.completion_date = datetime.utcnow()
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

    enrollments = Enrollment.query.order_by(Enrollment.id.desc()).all()
    data = []
    for e in enrollments:
        student = User.query.get(e.user_id)
        course = Course.query.get(e.course_id)
        if student and course:
            formatted_date = e.enrolled_at.strftime('%Y-%m-%d %H:%M') if e.enrolled_at else "N/A"
            data.append({
                "id": e.id,
                "user": student.name,
                "email": student.email,
                "course": course.title,
                "date": formatted_date,
                "status": e.status
            })
    return jsonify(data)

# ==========================================
# 9. PASSWORD RESET
# ==========================================

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user: return jsonify({"msg": "If your email is in our system, you will receive a reset link."}), 200

    reset_token = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=15))
    reset_link = f"{DOMAIN}/reset-password?token={reset_token}"
    
    try:
        html_body = f"""<p>Hi {user.name},</p><p>Click below to reset your password:</p>"""
        email_content = get_email_template("Reset Your Password", html_body, "Reset Password", reset_link)
        send_email(user.email, "Password Reset", email_content, "AICourseHub Security", "no-reply@aicoursehubpro.com")
    except Exception as e:
        print(f"Password reset failed: {e}")

    return jsonify({"msg": "If your email is in our system, you will receive a reset link."}), 200

@app.route('/api/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        if not user: return jsonify({"msg": "User not found"}), 404
            
        data = request.json
        new_password = data.get('new_password')
        if not new_password or len(new_password) < 6: return jsonify({"msg": "Password must be at least 6 characters"}), 400
            
        user.password = generate_password_hash(new_password, method='pbkdf2:sha256')
        db.session.commit()
        return jsonify({"msg": "Password reset successfully."}), 200
    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({"msg": "Server error"}), 500

# ==========================================
# 11. STRIPE
# ==========================================

@app.route('/api/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.json
        course_id = data.get('course_id')
        course = Course.query.get(course_id)
        if not course: return jsonify({'message': 'Course not found'}), 404

        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': course.title, 'description': course.description or "Premium Access"},
                    'unit_amount': int(course.price * 100), 
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&course_id={course.id}",
            cancel_url=f"{frontend_url}/courses",
            client_reference_id=str(user.id),
            metadata={"user_id": user.id, "course_id": course.id}
        )
        return jsonify({'id': checkout_session.id, 'url': checkout_session.url})
    except Exception as e:
        print(f"Stripe Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    user_id = get_jwt_identity()
    data = request.json
    session_id = data.get('session_id')
    course_id = data.get('course_id')

    if not session_id or not course_id: return jsonify({"msg": "Missing ID"}), 400

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == 'paid':
            existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
            if existing: return jsonify({"msg": "Already enrolled", "status": "enrolled"}), 200

            new_enrollment = Enrollment(user_id=user_id, course_id=course_id, status='in-progress', progress=0, enrolled_at=datetime.utcnow())
            db.session.add(new_enrollment)
            db.session.commit()

            try:
                user = User.query.get(user_id)
                course = Course.query.get(course_id)
                if user and course:
                    html_body = f"""<p>Hi {user.name},</p><p>Thank you for purchasing <strong>{course.title}</strong>.</p>"""
                    email_content = get_email_template("Payment Successful!", html_body, "Start Learning", f"{DOMAIN}/dashboard")
                    send_email(user.email, f"Welcome to {course.title}", email_content, "AICourseHub Automated", "no-reply@aicoursehubpro.com")
            except Exception as e:
                print(f"Payment email failed: {e}")
            
            return jsonify({"msg": "Enrollment successful!", "status": "enrolled"}), 200
        else:
            return jsonify({"msg": "Payment not verified"}), 400
    except Exception as e:
        print(f"Verify Error: {e}")
        return jsonify({"msg": "Error verifying payment"}), 500

# ==========================================
# 12. ADMIN MESSAGES & LOGS
# ==========================================

@app.route('/api/admin/messages', methods=['GET'])
@jwt_required()
def get_messages():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    msgs = ContactMessage.query.filter_by(is_read=False).order_by(ContactMessage.created_at.desc()).all()
    output = [{
        "id": m.id, "name": m.name, "email": m.email, 
        "subject": m.subject, "message": m.message, 
        "date": m.created_at.strftime('%Y-%m-%d'),
        "is_read": m.is_read
    } for m in msgs]
    return jsonify(output)

@app.route('/api/admin/messages/<int:id>/read', methods=['PUT'])
@jwt_required()
def mark_message_read(id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

        msg = ContactMessage.query.get(id)
        if not msg: return jsonify({"msg": "Message not found"}), 404

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
# 13. AI CHAT
# ==========================================

KNOWLEDGE_BASE = "You are Nova, the AI support assistant for AICourseHubPro."

@app.route('/api/chat', methods=['POST'])
def chat_support():
    data = request.json
    user_message = data.get('message', '')
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: return jsonify({"reply": "System Error: Chat unavailable."}), 500

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[{"role": "system", "content": KNOWLEDGE_BASE}, {"role": "user", "content": user_message}],
            max_tokens=200, temperature=0.5 
        )
        return jsonify({"reply": response.choices[0].message.content})
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return jsonify({"reply": "I'm having trouble connecting to the brain right now."}), 500

# ==========================================
# 14. VERIFY CERTIFICATE (Public)
# ==========================================
@app.route('/api/verify-certificate/<cert_id>', methods=['GET'])
def verify_certificate_id(cert_id):
    enrollment = Enrollment.query.filter_by(certificate_id=cert_id).first()
    if not enrollment: return jsonify({"valid": False}), 404
    
    student = User.query.get(enrollment.user_id)
    course = Course.query.get(enrollment.course_id)
    return jsonify({
        "valid": True,
        "student_name": student.name,
        "course_title": course.title,
        "completion_date": enrollment.completion_date.strftime('%Y-%m-%d') if enrollment.completion_date else "N/A"
    }), 200

# ==========================================
# 15. SETTINGS
# ==========================================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    maintenance = SystemSetting.query.filter_by(key='maintenance_mode').first()
    registrations = SystemSetting.query.filter_by(key='allow_registrations').first()
    return jsonify({
        "maintenance": maintenance.value == 'true' if maintenance else False,
        "registrations": registrations.value == 'true' if registrations else True
    })

@app.route('/api/settings', methods=['POST'])
@jwt_required()
def update_settings():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin: return jsonify({"msg": "Admin only"}), 403

    data = request.json
    def save_setting(key, val):
        setting = SystemSetting.query.filter_by(key=key).first()
        if not setting:
            setting = SystemSetting(key=key, value=str(val).lower())
            db.session.add(setting)
        else:
            setting.value = str(val).lower()
    
    if 'maintenance' in data: save_setting('maintenance_mode', data['maintenance'])
    if 'registrations' in data: save_setting('allow_registrations', data['registrations'])
        
    db.session.commit()
    return jsonify({"msg": "Settings updated"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)