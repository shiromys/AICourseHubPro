from app import app, db
from models import User

def manage_admins():
    print("\n--- 🛡️ ADMIN MANAGER TOOL 🛡️ ---")
    
    with app.app_context():
        # 1. Clean up the old insecure admin
        old_admin = User.query.filter_by(email="admin@aicoursehub.com").first()
        if old_admin:
            print(f"\n⚠️  Found insecure default admin ({old_admin.email}).")
            confirm = input("   Do you want to DELETE this user? (y/n): ").strip().lower()
            if confirm == 'y':
                db.session.delete(old_admin)
                db.session.commit()
                print("   ✅ Old admin deleted successfully.")
            else:
                print("   Skipped deletion.")
        else:
            print("\n✅ No insecure default admin found.")

        # 2. Promote YOU to Admin
        print("\n--- MAKE YOURSELF ADMIN ---")
        target_email = input("Enter the email address you want to promote to Admin: ").strip()
        
        user = User.query.filter_by(email=target_email).first()
        
        if not user:
            print(f"❌ Error: User '{target_email}' not found in database.")
            print("   Please Go to your Signup page and register this email first!")
            return

        if user.is_admin:
            print(f"ℹ️  {user.name} is ALREADY an Admin.")
        else:
            user.is_admin = True
            db.session.commit()
            print(f"🎉 SUCCESS! {user.name} ({user.email}) is now a Super Admin.")

if __name__ == "__main__":
    manage_admins()