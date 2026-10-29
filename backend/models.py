from database import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON

# 1. USER MODEL
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    login_count = db.Column(db.Integer, default=0)
    
    # Auth & Permissions
    is_admin = db.Column(db.Boolean, default=False)
    role = db.Column(db.String(20), default='student') # Added for compatibility
    
    # Status
    ban_expiry = db.Column(db.DateTime, nullable=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Guest Checkout: True for normal signups. False for accounts auto-created
    # at guest checkout until the user sets their own password.
    account_setup_complete = db.Column(db.Boolean, default=True, nullable=False)

    # Permanent record of how this account originated, for admin/analytics
    # visibility - survives even after a guest completes account setup.
    # Values: 'signup' (normal registration), 'guest_checkout' (paid before
    # creating an account). Open to more values later (e.g. 'referral').
    signup_source = db.Column(db.String(30), default='signup', nullable=False)

    # Relationships
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)

# 2. COURSE MODEL
class Course(db.Model):
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, default=29.0)
    category = db.Column(db.String(100), default='General')
    
    # Stores the Curriculum (Modules & Lessons)
    course_data = db.Column(JSON, nullable=True, default={}) 
    
    # Legacy fields (Optional)
    folder_name = db.Column(db.String(255), nullable=True) 
    launch_file = db.Column(db.String(255), nullable=True)
    
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # --- FIXED HELPER METHOD ---
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'modules': self.course_data.get('modules', []) if self.course_data else [],
            'is_active': self.is_active
        }

# 3. ENROLLMENT MODEL
class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'course_id', name='uq_enrollment_user_course'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    
    status = db.Column(db.String(50), default='in-progress') # 'in-progress', 'completed'
    progress = db.Column(db.Integer, default=0)
    score = db.Column(db.Float, default=0)
    
    # Bookmarking
    last_module_index = db.Column(db.Integer, default=0)
    last_lesson_index = db.Column(db.Integer, default=0)

    # Certification & Payment (NEW COLUMN ADDED HERE)
    certificate_id = db.Column(db.String(50), unique=True, nullable=True) 
    stripe_session_id = db.Column(db.String(255), nullable=True) # <-- NEW
    
    completion_date = db.Column(db.DateTime, nullable=True)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)

    # What this enrollment actually brought in (cents). Bundles are split across their
    # courses so the parts add up to the amount Stripe charged. payment_source:
    #   stripe | stripe_bundle | admin_grant | free | unverified (older rows with no receipt)
    amount_paid_cents = db.Column(db.Integer, nullable=True)
    currency = db.Column(db.String(10), nullable=True)
    payment_source = db.Column(db.String(20), nullable=True)
    amount_estimated = db.Column(db.Boolean, default=False, nullable=False, server_default=db.text('false'))

    # Certificate snapshot, frozen at the moment the certificate is issued so the
    # admin copy (and /verify) keeps showing what was actually awarded even if the
    # learner later renames their profile or the course is retitled/restructured.
    certificate_name = db.Column(db.String(150), nullable=True)
    certificate_course_title = db.Column(db.String(255), nullable=True)
    

# 4. CONTACT MESSAGE MODEL
class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 5. AUDIT LOG MODEL
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    admin_email = db.Column(db.String(100))
    action = db.Column(db.String(200))
    details = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# 6. SYSTEM SETTINGS MODEL
class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(200), nullable=False)

# 7. FLAGGED PAYMENT MODEL
# Tracks "paid for a course they already own" incidents surfaced during guest
# checkout, since guest identity is only known AFTER Stripe charges the card.
# No refund happens automatically - this gives the admin panel a queue to
# review and mark resolved once handled manually in Stripe Dashboard.
class FlaggedPayment(db.Model):
    __tablename__ = 'flagged_payments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    # unique: one Stripe session can only ever be flagged once (browser verify-payment
    # and the webhook can race on the same session). NULLs are allowed to repeat.
    stripe_session_id = db.Column(db.String(255), nullable=True, unique=True)
    payment_intent_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved = db.Column(db.Boolean, default=False, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)
    # Review trail: what was paid, who paid it, and how management decided.
    amount_cents = db.Column(db.Integer, nullable=True)
    currency = db.Column(db.String(10), nullable=True)
    customer_email = db.Column(db.String(255), nullable=True)
    outcome = db.Column(db.String(30), nullable=True)      # refunded | credit_given | declined
    resolution_note = db.Column(db.Text, nullable=True)
    resolved_by = db.Column(db.String(255), nullable=True)  # admin email


# 8. USER ACTIVITY MODEL (the "digital footprint")
# Append-only event log per user: signups, logins, page views, checkout steps,
# payments, lesson progress, certificates, account changes. Read by the admin
# panel's Footprint view. Deliberately stores no passwords/tokens/card data.
class UserActivity(db.Model):
    __tablename__ = 'user_activity'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    event_type = db.Column(db.String(40), nullable=False)   # e.g. 'login', 'page_view', 'payment'
    path = db.Column(db.String(255), nullable=True)         # page path for page_view events
    course_id = db.Column(db.Integer, nullable=True)
    detail = db.Column(db.Text, nullable=True)              # short human-readable description
    ip_address = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# 9. NEWSLETTER SUBSCRIBER MODEL
# Double opt-in: status goes pending -> active when the emailed link is clicked,
# and active -> unsubscribed via the one-click link in every email.
class NewsletterSubscriber(db.Model):
    __tablename__ = 'newsletter_subscribers'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending | active | unsubscribed
    confirm_token = db.Column(db.String(64), unique=True, nullable=True)
    unsubscribe_token = db.Column(db.String(64), unique=True, nullable=False)
    source = db.Column(db.String(30), default='home')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    unsubscribed_at = db.Column(db.DateTime, nullable=True)
    last_sent_at = db.Column(db.DateTime, nullable=True)

# 10. NEWSLETTER ISSUE MODEL (one weekly digest)
class NewsletterIssue(db.Model):
    __tablename__ = 'newsletter_issues'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(200), nullable=False)
    preheader = db.Column(db.String(200), nullable=True)
    body_html = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='draft', nullable=False)  # draft | sent
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime, nullable=True)
    recipient_count = db.Column(db.Integer, default=0)
    created_by = db.Column(db.String(120), nullable=True)
