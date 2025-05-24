# Store Rating Platform - FullStack Coding Challenge

A comprehensive web application that allows users to submit ratings for stores registered on the platform. The system implements role-based access control with three distinct user types, each having specific functionalities and permissions.

## 🚀 Features

### 🔐 Authentication & Authorization
- Single login system for all user types
- Role-based access control (RBAC)
- Secure JWT-based authentication
- Password validation with complexity requirements

### 👥 User Roles & Functionalities

#### 🔧 System Administrator
- **User Management**: Create and manage normal users, store owners, and admin users
- **Store Management**: Add new stores and assign owners
- **Dashboard Analytics**: 
  - Total number of users
  - Total number of stores
  - Total number of submitted ratings
- **Advanced Filtering**: Filter users and stores by name, email, address, and role
- **Data Views**: Comprehensive listings with sorting capabilities

#### 👤 Normal User
- **Registration**: Self-signup with required profile information
- **Store Discovery**: Browse and search all registered stores
- **Rating System**: Submit ratings (1-5 stars) for stores
- **Rating Management**: Update previously submitted ratings
- **Search & Filter**: Find stores by name and address
- **Profile Management**: Update password and view account details

#### 🏪 Store Owner
- **Store Dashboard**: View store performance metrics
- **Rating Analytics**: See average rating and total reviews
- **Customer Insights**: View list of users who rated their store
- **Profile Management**: Update account password

## 🛠 Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing, helmet for security headers
- **CORS**: Configured for cross-origin requests

### Frontend
- **Framework**: React.js with Vite
- **Routing**: React Router DOM
- **State Management**: Context API for authentication
- **Form Handling**: React Hook Form with Yup validation
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### Development Tools
- **Environment**: Node.js
- **Package Manager**: npm
- **Development Server**: Vite (Frontend), Nodemon (Backend)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <https://github.com/gaurav-prajapat/roxiler-assessment.git>
cd store-rating-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=store_rating_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup
```bash
# Create the database
mysql -u root -p
CREATE DATABASE store_rating_db;

# Run database migrations/setup (if you have migration files)
npm run migrate
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start the Application
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend development server (from frontend directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT(400),
  role ENUM('system_admin', 'user', 'store_owner') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Stores Table
```sql
CREATE TABLE stores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  address TEXT(400) NOT NULL,
  owner_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### Ratings Table
```sql
CREATE TABLE ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  UNIQUE KEY unique_user_store_rating (user_id, store_id)
);
```

## 🔒 Validation Rules

### User Registration/Creation
- **Name**: 20-60 characters
- **Email**: Valid email format
- **Password**: 8-16 characters, must include at least one uppercase letter and one special character
- **Address**: Maximum 400 characters

### Rating Submission
- **Rating**: Integer between 1 and 5 (inclusive)
- **Uniqueness**: One rating per user per store (can be updated)

## 🛡 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for specific origins
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization and validation

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Admin Routes
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List all users with filtering
- `POST /api/admin/users` - Create new user
- `GET /api/admin/stores` - List all stores with filtering
- `POST /api/admin/stores` - Create new store

### User Routes
- `GET /api/user/stores` - Get stores with user ratings
- `POST /api/user/stores/:id/rating` - Submit store rating
- `PUT /api/user/stores/:id/rating` - Update store rating
- `PUT /api/user/password` - Update user password

### Store Owner Routes
- `GET /api/store/dashboard` - Store owner dashboard
- `GET /api/store/ratings` - Get store ratings and reviews

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Interactive Components**: Star rating system, modal dialogs
- **Loading States**: Spinners and skeleton screens
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Confirmation messages for actions
- **Sorting & Filtering**: Advanced table controls
- **Pagination**: Efficient data loading for large datasets

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set production environment variables
2. Configure production database
3. Build and deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the production bundle:
```bash
npm run build
```
2. Deploy the `dist` folder to your hosting service (Netlify, Vercel, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is created as part of a coding challenge assessment.

## 👨‍💻 Developer Notes

### Project Structure
```
store-rating-platform/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   └── public/
└── README.md
```

### Key Implementation Highlights
- **Role-based routing** with protected routes
- **Centralized error handling** for consistent user experience
- **Reusable components** for maintainable code
- **API service layer** for organized HTTP requests
- **Form validation** with real-time feedback
- **Responsive design** for all device types

## 🐛 Known Issues & Future Enhancements

### Current Limitations
- Email notifications not implemented
- File upload for store images not included
- Advanced analytics dashboard pending

### Future Enhancements
- Real-time notifications
- Store image uploads
- Advanced reporting and analytics
- Mobile app development
- API rate limiting
- Comprehensive logging system

---

**Assessment Completion**: This project fulfills all requirements specified in the FullStack Intern Coding Challenge, implementing a complete store rating platform with role-based access control, comprehensive CRUD operations, and modern web development best practices.