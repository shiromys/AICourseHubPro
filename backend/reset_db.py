from app import app, db
from sqlalchemy import text

with app.app_context():
    print("WARNING: Wiping database...")
    
    # 1. Force drop everything using CASCADE (PostgreSQL specific)
    # This ignores dependencies and deletes all tables instantly
    try:
        db.session.execute(text("DROP SCHEMA public CASCADE;"))
        db.session.execute(text("CREATE SCHEMA public;"))
        db.session.commit()
        print("✅ Cleaned existing schema.")
    except Exception as e:
        print(f"⚠️ Standard drop failed, attempting manual drop: {e}")
        # Fallback if the user doesn't have schema permissions
        db.reflect()
        db.drop_all()

    # 2. Recreate tables from your models
    print("Creating new tables...")
    db.create_all()
    
    print("✅ Database reset successfully! You can now Sign Up.")