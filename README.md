# 🏆 THE SAIYANS - Anime Community Backend

A full-stack anime community website with user authentication, comments, quotes, and more!

## 🚀 Features

- **User Authentication**: JWT-based login/registration with refresh tokens
- **Comments System**: Post and view community comments with expiration
- **Quotes Database**: Submit and browse anime quotes with admin approval
- **Social Login**: Simulated OAuth integration (Google, Discord, GitHub)
- **Admin Panel**: Approve quotes and manage content
- **Rate Limiting**: Protection against abuse
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Live comment and quote loading

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express.js
- **SQLite** database with proper indexing
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** and **Helmet** for security
- **Rate limiting** for API protection

### Frontend

- **HTML5** with semantic structure
- **CSS3** with anime-themed styling
- **Vanilla JavaScript** with modern ES6+ features
- **Responsive design** with CSS Grid/Flexbox

## 📋 Prerequisites

- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**

```bash
# Run the setup script
.\setup.ps1
```

**Or use the batch file:**

```bash
setup.bat
```

### Option 2: Manual Setup

#### 1. Install Node.js

If you don't have Node.js installed:

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS version**
3. Install it on your system

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Initialize Database

```bash
npm run init-db
```

This creates the SQLite database with tables and sample data.

#### 4. Start the Backend Server

```bash
npm start
```

The API will be available at `http://localhost:3001/api`

#### 5. Test the Setup

```bash
npm test
```

This will verify that the backend is running correctly.

#### 6. Open the Website

Open `Association.html` in your browser or serve the static files.

## 📁 Project Structure

```
the-saiyans/
├── server.js              # Main backend server
├── init-db.js             # Database initialization
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
├── .env.example           # Environment template
├── script.js              # Frontend JavaScript
├── style.css              # Main stylesheet
├── Association.html       # Home page
├── login.html             # Login page
├── about.html             # About page
├── anime.html             # Anime page
├── board.html             # Board page
├── forms.html             # Forms page
├── quotes.html            # Quotes page
├── announcements.html     # Announcements page
├── comments.html          # Comments page
└── Images/                # Static assets
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Comments

- `GET /api/comments` - Get all comments
- `POST /api/comments` - Create new comment

### Quotes

- `GET /api/quotes` - Get approved quotes
- `POST /api/quotes` - Submit new quote
- `GET /api/quotes/pending` - Get pending quotes (admin)
- `PUT /api/quotes/:id/approve` - Approve quote (admin)
- `DELETE /api/quotes/:id` - Delete quote (admin)

### Utility

- `GET /api/health` - Health check
- `GET /api/stats` - Get site statistics

## 👤 Default Admin Account

After running `npm run init-db`, you can login with:

- **Username**: `admin`
- **Email**: `admin@saiyans.com`
- **Password**: `admin123`

⚠️ **Change this password in production!**

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with refresh tokens
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for allowed origins
- **Helmet**: Security headers
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Parameterized queries

## 🎨 Frontend Features

- **Responsive Design**: Mobile-first approach
- **Anime Theme**: Custom gradients and animations
- **Interactive UI**: Tabs, forms, and dynamic content
- **Local Storage**: Client-side data persistence
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback for actions

## 🚀 Deployment

**📚 Full Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive instructions on deploying to:

- **GitHub Pages** (Frontend) + **Heroku** (Backend)
- **Railway.app** (Full Stack)
- **Vercel** + Cloud Backend
- **Custom VPS/Server**

Quick setup for production:

1. Configure `.env` with production values (generate secure JWT secret)
2. Deploy backend to Heroku, Railway, or your server
3. Deploy frontend to GitHub Pages, Netlify, or Vercel
4. Update API URLs in frontend to point to deployed backend
5. Test all features in production

**Important**: Change default admin password and configure proper CORS origins for your domain!

## 🔧 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server (with nodemon)
npm run init-db    # Initialize/reset database
npm test           # Test backend connectivity
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
DATABASE_PATH=./saiyans.db
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the anime community
- Inspired by legendary anime series
- Thanks to all contributors and users

---

**🏆 "Power comes in response to a need, not a desire." - Goku**

Made with ❤️ for anime fans everywhere!
