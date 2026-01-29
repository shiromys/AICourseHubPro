from app import app, db
from sqlalchemy import text

print("--- Patching Database Schema ---")

with app.app_context():
    with db.engine.connect() as conn:
        try:
            # 1. Add 'is_deleted' column if it's missing
            print("Attempting to add 'is_deleted' column...")
            conn.execute(text("ALTER TABLE course ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
            
            # 2. Add 'course_data' column if it's missing (for your JSON courses)
            print("Attempting to add 'course_data' column...")
            conn.execute(text("ALTER TABLE course ADD COLUMN IF NOT EXISTS course_data JSON;"))
            
            conn.commit()
            print("✅ Success! Columns added.")
            
        except Exception as e:
            print(f"❌ Error: {e}")