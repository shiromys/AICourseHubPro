"""
One-time migration script to add unique constraint on (user_id, course_id)
to the enrollments table, and clean up any existing duplicates first.

Run once from the backend/ directory:
    python add_enrollment_constraint.py
"""

from app import app, db
from sqlalchemy import text

with app.app_context():
    print("Step 1: Checking for duplicate enrollments...")
    dupes = db.session.execute(text("""
        SELECT user_id, course_id, COUNT(*) as cnt
        FROM enrollments
        GROUP BY user_id, course_id
        HAVING COUNT(*) > 1
    """)).fetchall()

    if dupes:
        print(f"Found {len(dupes)} duplicate enrollment(s). Cleaning up...")
        for user_id, course_id, cnt in dupes:
            # Keep the row with highest progress, delete the rest
            db.session.execute(text("""
                DELETE FROM enrollments
                WHERE id NOT IN (
                    SELECT id FROM enrollments
                    WHERE user_id = :uid AND course_id = :cid
                    ORDER BY progress DESC, enrolled_at DESC
                    LIMIT 1
                )
                AND user_id = :uid AND course_id = :cid
            """), {"uid": user_id, "cid": course_id})
        db.session.commit()
        print("Duplicates removed.")
    else:
        print("No duplicates found.")

    print("Step 2: Adding unique constraint...")
    try:
        db.session.execute(text("""
            ALTER TABLE enrollments
            ADD CONSTRAINT uq_enrollment_user_course
            UNIQUE (user_id, course_id)
        """))
        db.session.commit()
        print("Constraint added successfully.")
    except Exception as e:
        db.session.rollback()
        if "already exists" in str(e):
            print("Constraint already exists — skipping.")
        else:
            print(f"Error: {e}")

    print("Done.")