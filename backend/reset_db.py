from app import app
from database import db

# This script deletes all old tables and creates new ones with the correct columns
with app.app_context():
    print("Dropping all existing tables...")
    db.drop_all()
    
    print("Creating new tables (with JSONB support)...")
    db.create_all()
    
    print("✅ Database reset successfully!")