"""Seed an admin user directly into the database."""
from app.database import engine
from sqlalchemy import text
from app.services.auth import hash_password

with engine.connect() as conn:
    # Check roles
    result = conn.execute(text("SELECT id, name FROM roles"))
    roles = result.fetchall()
    print("Roles:", [(r[0], r[1]) for r in roles])

    # Ensure ADMIN role exists
    admin_role = [r for r in roles if r[1] == "ADMIN"]
    if not admin_role:
        conn.execute(text("INSERT INTO roles (name, description) VALUES ('ADMIN', 'Admin role')"))
        conn.commit()
        admin_role_id = conn.execute(text("SELECT id FROM roles WHERE name='ADMIN'")).scalar()
        print("Created ADMIN role, id=", admin_role_id)
    else:
        admin_role_id = admin_role[0][0]

    # Check if admin exists
    existing = conn.execute(text("SELECT id FROM users WHERE email='admin@bizzprofiles.com'")).scalar()
    if existing:
        print("Admin already exists, id=", existing)
    else:
        h = hash_password("Admin1234!")
        conn.execute(
            text("INSERT INTO users (full_name, email, password_hash, role_id, is_email_verified, is_active) VALUES (:name, :email, :pw, :rid, true, true)"),
            {"name": "Platform Admin", "email": "admin@bizzprofiles.com", "pw": h, "rid": admin_role_id}
        )
        conn.commit()
        print("Created admin: admin@bizzprofiles.com / Admin1234!")
