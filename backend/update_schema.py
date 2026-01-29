# backend/update_schema.py
from app import app, db
from models import Enrollment
from sqlalchemy import text

with app.app_context():
    print("🔄 Updating Database Schema...")
    
    # 1. Drop the old 'enrollments' table
    # We use raw SQL to force the drop, or we can use SQLAlchemy metadata
    try:
        Enrollment.__table__.drop(db.engine)
        print("✅ Old 'enrollments' table deleted.")
    except Exception as e:
        print(f"⚠️ Could not drop table (might not exist): {e}")

    # 2. Re-create the table with the NEW columns
    db.create_all()
    print("✅ New 'enrollments' table created with 'certificate_id' column.")
    print("🚀 Database is ready!")