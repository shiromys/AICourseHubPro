from app import app, db
from sqlalchemy import text

with app.app_context():
    print("Checking database for Stripe columns...")
    try:
        db.session.execute(text("ALTER TABLE enrollments ADD COLUMN stripe_session_id VARCHAR(255)"))
        db.session.commit()
        print("✅ Success! 'stripe_session_id' added to enrollments.")
    except Exception as e:
        db.session.rollback()
        print(f"⚠️ Column already exists or error occurred: {e}")