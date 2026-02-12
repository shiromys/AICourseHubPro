from database import db
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

# 1. USER MODEL
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False) # In prod, use hashed passwords!
    name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    
    # --- NEW COLUMNS ---
    ban_expiry = db.Column(db.DateTime, nullable=True) # If set, user is banned until this date
    is_deleted = db.Column(db.Boolean, default=False)  # Soft Delete flag
    # -------------------

    # Relationships
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)

# 2. COURSE MODEL (Updated with JSONB)
class Course(db.Model):
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, default=29.0)
    category = db.Column(db.String(100), default='General')
    
    # JSONB Column for storing Modules & Lessons
    course_data = db.Column(JSONB, nullable=True, default={})
    
    # Legacy fields (Optional, kept so code doesn't break)
    folder_name = db.Column(db.String(255), nullable=True) 
    launch_file = db.Column(db.String(255), nullable=True)
    
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # --- ADD THIS HELPER METHOD ---
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'status': self.status,
            'progress': self.progress,
            'score': self.score,
            # This maps the database column 'enrolled_at' to the frontend key 'date'
            'date': self.enrolled_at.isoformat() if self.enrolled_at else None,
            'enrolled_at': self.enrolled_at.isoformat() if self.enrolled_at else None
        }

# models.py


class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    
    status = db.Column(db.String(50), default='incomplete') # 'incomplete', 'passed'
    progress = db.Column(db.Integer, default=0) # Store % completion

    # --- BOOKMARK COLUMNS ---
    last_module_index = db.Column(db.Integer, default=0)
    last_lesson_index = db.Column(db.Integer, default=0)

    # --- NEW: VERIFICATION COLUMN ---
    # This stores the unique code (e.g. "AIC-8X92...") used for QR verification
    certificate_id = db.Column(db.String(50), unique=True, nullable=True) 
    
    score = db.Column(db.Float, nullable=True)
    completion_date = db.Column(db.DateTime, nullable=True)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)



# 4. TRANSACTION MODEL (Optional)
class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)


# ... (Keep User, Course, Enrollment classes as they are) ...

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_email = db.Column(db.String(100))
    action = db.Column(db.String(200)) # e.g., "Deleted User", "Created Course"
    details = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False) # e.g., 'maintenance_mode'
    value = db.Column(db.String(50), nullable=False) # e.g., 'true' or 'false'