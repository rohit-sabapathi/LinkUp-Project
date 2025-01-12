from django.contrib.auth import get_user_model
User = get_user_model()

# Create admin user
admin_user = User.objects.create_superuser(
    username='admin',
    email='admin@example.com',
    password='admin123',
    first_name='Admin',
    last_name='User',
    user_type='admin'
)

# Create alumni user
alumni_user = User.objects.create_user(
    username='alumni',
    email='alumni@example.com',
    password='alumni123',
    first_name='Alumni',
    last_name='User',
    user_type='alumni'
)

# Create student user
student_user = User.objects.create_user(
    username='student',
    email='student@example.com',
    password='student123',
    first_name='Student',
    last_name='User',
    user_type='student'
)

print("Test users created successfully!")
