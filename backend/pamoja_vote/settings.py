"""
Django settings for pamoja_vote project.

Production and local-safe configuration.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

# Load environment variables from .env file (only in local/dev)
load_dotenv()

# ----------------------------------------------------------------------
# BASE DIR
# ----------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ----------------------------------------------------------------------
# SECURITY
# ----------------------------------------------------------------------
SECRET_KEY = os.getenv(
    'DJANGO_SECRET_KEY',
    'django-insecure-@e6t#^q*-25cihbbh-#kgzr%onq7f%7a8t+iooqca%*4h(07yp'
)

DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.getenv(
    'ALLOWED_HOSTS',
    '.vercel.app,localhost,127.0.0.1'
).split(',')

# ----------------------------------------------------------------------
# APPLICATIONS
# ----------------------------------------------------------------------
INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',

    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',

    # Local apps
    'core',
    'users',
    'squads',
    'centers',
    'events',
    'invites',
]

# ----------------------------------------------------------------------
# MIDDLEWARE
# ----------------------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'pamoja_vote.middleware.LogErrorsMiddleware',

    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ----------------------------------------------------------------------
# URLS / WSGI
# ----------------------------------------------------------------------
ROOT_URLCONF = 'pamoja_vote.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # optional: can serve frontend build files
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'pamoja_vote.wsgi.application'

# ----------------------------------------------------------------------
# DATABASES — robust local & production setup
# ----------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and "://" in DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    print("⚠️  No DATABASE_URL found — using local SQLite database.")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ----------------------------------------------------------------------
# AUTH / JWT
# ----------------------------------------------------------------------
AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# ----------------------------------------------------------------------
# CORS
# ----------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://pamoja-vote.vercel.app'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# ----------------------------------------------------------------------
# INTERNATIONALIZATION
# ----------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# ----------------------------------------------------------------------
# STATIC & MEDIA FILES (Vercel + Local)
# ----------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Extra: for Vercel / production builds
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ----------------------------------------------------------------------
# SECURITY HEADERS (recommended for production)
# ----------------------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 3600
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ----------------------------------------------------------------------
# THIRD-PARTY SERVICE KEYS
# ----------------------------------------------------------------------
# Twilio (legacy - keeping for backward compatibility)
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_VERIFY_SID = os.getenv('TWILIO_VERIFY_SID')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '+1234567890')  # Default for dev/testing

# Infobip SMS Service (preferred)
INFOBIP_API_KEY = os.getenv('INFOBIP_API_KEY')
INFOBIP_BASE_URL = os.getenv('INFOBIP_BASE_URL', 'https://api.infobip.com')
INFOBIP_SENDER = os.getenv('INFOBIP_SENDER', 'PamojaVote')

# ----------------------------------------------------------------------
# DEFAULT PRIMARY KEY FIELD TYPE
# ----------------------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
