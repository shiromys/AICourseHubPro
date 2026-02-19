from app import app, db
from models import User

def manage_admins():
    print("\n--- 🛡️ ADMIN MANAGER TOOL 🛡️ ---")
    
    with app.app_context():
        # 1. Promote YOU to Admin
        print("\n--- MAKE YOURSELF ADMIN ---")
        target_email = input("Enter the email address you want to promote to Admin: ").strip().lower()
        
        # Using modern SQLAlchemy syntax to avoid legacy warnings
        user = User.query.filter_by(email=target_email).first()
        
        if not user:
            print(f"\n❌ Error: User '{target_email}' not found in the database.")
            print("👉 STEP 1: Go to your website's Signup page (http://localhost:5173/register)")
            print("👉 STEP 2: Create an account with this email.")
            print("👉 STEP 3: Come back and run this script again.")
            return

        if user.is_admin and user.role == 'admin':
            print(f"\nℹ️  {user.name} is ALREADY a Super Admin.")
        else:
            # UPDATE BOTH FLAGS
            user.is_admin = True
            user.role = 'admin' 
            
            db.session.commit()
            print(f"\n🎉 SUCCESS! {user.name} ({user.email}) is now a Super Admin.")
            print("✅ You can now access the Admin Dashboard.")

if __name__ == "__main__":
    manage_admins()