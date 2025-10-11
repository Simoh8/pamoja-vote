# PamojaVote Backend

Django REST API for the PamojaVote Kenyan youth voter registration platform.

## 🚀 Features

- **Phone-based Authentication**: OTP verification via Twilio
- **User Management**: Profile and county information
- **Squad System**: Group formation with roles and progress tracking
- **Registration Centers**: Geolocation-based center management
- **Event Planning**: Scheduled registration events with RSVP
- **Invite System**: WhatsApp/SMS sharing capabilities
- **Admin Dashboard**: Full CRUD operations
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## 🛠️ Tech Stack

- **Framework**: Django 5.2 + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT with SimpleJWT
- **Communication**: Twilio API
- **Documentation**: drf-spectacular
- **Deployment**: Railway/Railway/Render

## 📦 Installation

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database migration:**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server:**
   ```bash
   python manage.py runserver
   ```

## 🔧 Configuration

### Required Environment Variables

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=pamoja_vote
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_VERIFY_SID=your-verify-sid

# Google Maps
GOOGLE_MAPS_API_KEY=your-key
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Phone login (sends OTP)
- `POST /api/auth/verify-otp/` - OTP verification
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `PATCH /api/auth/profile/` - Update user profile

### Squads
- `GET /api/squads/` - List user's squads
- `POST /api/squads/` - Create new squad
- `GET /api/squads/{id}/` - Get squad details
- `POST /api/squads/{id}/join/` - Join squad
- `POST /api/squads/{id}/leave/` - Leave squad
- `GET /api/squads/leaderboard/` - Squad leaderboard

### Centers
- `GET /api/centers/` - List centers (with filtering)
- `POST /api/centers/` - Create center (admin)
- `GET /api/centers/{id}/` - Get center details
- `GET /api/centers/nearby/` - Nearby centers
- `GET /api/centers/county/{county}/` - Centers by county

### Events
- `GET /api/events/` - List events
- `POST /api/events/` - Create event
- `GET /api/events/{id}/` - Get event details
- `POST /api/events/{id}/rsvp/` - RSVP to event
- `GET /api/events/upcoming/` - Upcoming events

### Invites
- `POST /api/invites/` - Send invite
- `POST /api/invites/whatsapp/` - WhatsApp invite
- `POST /api/invites/bulk/` - Bulk invites

## 🏗️ Project Structure

```
backend/
├── pamoja_vote/        # Django project settings
│   ├── settings.py    # Main configuration
│   ├── urls.py        # URL routing
│   └── wsgi.py        # WSGI application
├── users/             # Authentication app
│   ├── models.py      # User model
│   ├── views.py       # Auth views
│   ├── serializers.py # Auth serializers
│   └── urls.py        # Auth URLs
├── squads/            # Squad management
├── centers/           # Registration centers
├── events/            # Event planning
├── invites/           # Invitation system
└── core/              # Shared utilities
```

## 🔐 Authentication

The API uses JWT authentication with phone number + OTP verification:

1. User registers with phone number
2. Twilio sends OTP via SMS
3. User verifies OTP and receives JWT tokens
4. Subsequent requests include `Authorization: Bearer <token>` header

## 📊 Database Models

### User
- UUID primary key
- Phone number (unique)
- Name, county, profile picture
- Timestamps

### Squad
- UUID primary key
- Name, description, goal count
- County, public/private visibility
- Owner (foreign key to User)
- Member relationships

### SquadMember
- User-Squad relationship
- Role (member/leader)
- Join timestamp

### Center
- UUID primary key
- Name, county, address
- Latitude/longitude coordinates
- Opening hours (JSON)

### Event
- UUID primary key
- Associated squad and center
- Date/time, meeting point, notes
- RSVP relationships

### EventRSVP
- User-Event RSVP status
- Status (yes/no/maybe)

### Invite
- Invitation tracking
- Channel (WhatsApp/SMS)
- Status (sent/delivered/failed)

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test squads
```

## 🚢 Deployment

### Railway (Recommended)
```bash
railway login
railway link
railway up
```

### Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Manual Deployment
```bash
# Collect static files
python manage.py collectstatic

# Run with production settings
DJANGO_SETTINGS_MODULE=pamoja_vote.settings.production python manage.py runserver
```

## 📚 API Documentation

When running, visit:
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/docs/redoc/`

## 🔒 Security

- JWT tokens with expiration
- CORS protection
- Rate limiting on OTP endpoints
- Input validation and sanitization
- HTTPS enforcement in production

## 🤝 Contributing

1. Follow Django best practices
2. Write tests for new features
3. Update API documentation
4. Use meaningful commit messages

## 📄 License

MIT License - see main project README for details.
