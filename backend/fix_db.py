from app import app, db
from sqlalchemy import text

with app.app_context():
    print("Checking live database schema...")
    try:
        # Attempt to read the column
        db.session.execute(text("SELECT role FROM users LIMIT 1"))
        print("✅ Column 'role' already exists.")
    except Exception:
        # If it fails, roll back the error and add the column
        db.session.rollback()
        print("⚠️ Column 'role' missing. Adding it now safely without data loss...")
        try:
            db.session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student'"))
            db.session.commit()
            print("✅ Success! Column 'role' added to live database.")
        except Exception as e:
            print(f"❌ Failed to add column: {e}")