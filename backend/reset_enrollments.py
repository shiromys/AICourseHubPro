from app import app, db
from models import Enrollment

with app.app_context():
    db.session.query(Enrollment).delete()
    db.session.commit()
    print("✅ All enrollments wiped. Users must pay again.")