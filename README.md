# PamojaVote - Kenyan Youth Voter Registration Platform

PamojaVote is a full-stack web application that helps Kenyan youth form groups ("squads"), discover nearby IEBC registration centers, plan group registration events, and track progress together.

## 🇰🇪 Mission

To mobilize Kenyan youth to register as voters and participate in the democratic process through collaborative, community-driven squads.

## 🚀 Features

### Backend (Django REST API)
- **Authentication**: Phone-based OTP login via Twilio
- **User Management**: Profile management with county information
- **Squad System**: Create/join squads with member roles and progress tracking
- **Registration Centers**: Geolocation-based center discovery with Google Maps integration
- **Event Planning**: Schedule registration events with RSVP functionality
- **Invite System**: WhatsApp and SMS sharing for squad recruitment
- **Progress Tracking**: Real-time squad progress and county leaderboards
- **Admin Dashboard**: Full CRUD operations for all entities

### Frontend (React SPA)
- **Mobile-First Design**: Optimized for Kenyan youth with low-data usage
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Real-time Updates**: React Query for efficient data fetching and caching
- **Interactive Maps**: Google Maps integration for center discovery
- **Social Sharing**: WhatsApp integration for squad invitations
- **Progress Visualization**: Charts and progress bars for engagement

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 5.2 + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT with SimpleJWT
- **Communication**: Twilio (OTP & SMS)
- **Mapping**: Google Maps API
- **Documentation**: drf-spectacular (OpenAPI/Swagger)

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v7
- **State Management**: React Query + Context API
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## 📁 Project Structure

```
pamoja_vote/
├── backend/                 # Django REST API
│   ├── pamoja_vote/        # Django project settings
│   ├── users/              # User authentication & profiles
│   ├── squads/             # Squad management
│   ├── centers/            # Registration centers
│   ├── events/             # Event planning
│   ├── invites/            # Invitation system
│   ├── core/               # Shared settings & utilities
│   └── requirements.txt    # Python dependencies
└── frontend/               # React SPA
    ├── src/
    │   ├── pages/          # Route components
    │   ├── components/     # Reusable UI components
    │   ├── context/        # React contexts
    │   ├── hooks/          # Custom hooks
    │   ├── api/           # API client configuration
    │   └── styles/        # Global styles
    ├── package.json       # Node.js dependencies
    └── tailwind.config.js # Tailwind configuration
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Twilio Account (for OTP)
- Google Maps API Key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database credentials
   ```

5. **Database setup:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run development server:**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your API base URL and Google Maps key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Backend Environment Variables

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=pamoja_vote
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Twilio (for OTP and SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VERIFY_SID=your-twilio-verify-service-sid

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Frontend Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/docs/redoc/`

## 🗄️ Database Models

### User
- Phone-based authentication
- County and profile information
- Squad memberships

### Squad
- Group formation for voter registration
- Member roles (member/leader)
- Progress tracking and goals

### Registration Center
- IEBC center locations
- Geocoding with Google Maps
- Opening hours and contact info

### Event
- Scheduled registration events
- RSVP system
- Meeting points and notes

### Invite
- WhatsApp/SMS invitation tracking
- Shareable squad links

## 🎨 Design System

### Colors
- **Primary**: Kenyan flag colors (Green #006400, Yellow #FFC107, Red #DC143C)
- **Secondary**: Modern blue palette
- **Typography**: Inter/Poppins fonts

### Components
- **Cards**: Rounded corners (2xl) with shadows
- **Buttons**: Primary/secondary variants with hover states
- **Forms**: Consistent styling with validation states
- **Navigation**: Mobile-first bottom navigation

## 🔐 Authentication Flow

1. **Phone Login**: User enters phone number
2. **OTP Verification**: Twilio sends SMS OTP
3. **JWT Tokens**: Access/refresh tokens issued
4. **Protected Routes**: Frontend validates tokens
5. **Auto-refresh**: Silent token refresh on expiry

## 📱 Mobile Optimization

- **Responsive Design**: Works on all screen sizes
- **Touch-Friendly**: Large tap targets
- **Low Data Usage**: Optimized images and lazy loading
- **Offline Support**: Service worker for basic caching
- **Progressive Enhancement**: Core features work without JS

## 🚢 Deployment

### Backend (Recommended: Railway/Railway)
```bash
# Build and deploy to Railway
railway up
```

### Frontend (Recommended: Vercel)
```bash
# Deploy to Vercel
vercel --prod
```

### Alternative Hosting
- **Backend**: DigitalOcean App Platform, Heroku, Render
- **Frontend**: Netlify, Firebase Hosting, AWS Amplify
- **Database**: Supabase, Neon, AWS RDS

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the Kenyan youth to increase voter participation
- Inspired by community-driven civic engagement initiatives
- Special thanks to the Django and React communities

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our community discussions
- Reach out to the development team

---

**Let's make democracy accessible to every Kenyan youth! 🇰🇪**
