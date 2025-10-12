# Student Information & Resource Hub

A full-stack web application built with React.js frontend and Django backend, designed to provide students with a comprehensive platform for academic resources and information.

## 🚀 Features

- **Modern React Frontend**: Built with React.js and modern CSS
- **Django REST API Backend**: Robust API with Django REST Framework
- **CORS Configuration**: Properly configured for frontend-backend communication
- **Responsive Design**: Mobile-friendly interface
- **Real-time API Status**: Live connection status with backend
- **Modern UI/UX**: Beautiful gradient designs and smooth animations

## 📁 Project Structure

```
Student Information & Resource Hub/
├── backend/                    # Django backend
│   ├── venv/                   # Python virtual environment
│   ├── student_hub_backend/    # Django project settings
│   ├── api/                    # API app
│   ├── manage.py              # Django management script
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   └── utils/            # Utility functions
│   ├── public/               # Static files
│   └── package.json          # Node.js dependencies
└── README.md                 # This file
```

## 🛠️ Prerequisites

Before running this project, make sure you have the following installed:

- **Python 3.8+** (for Django backend)
- **Node.js 14+** (for React frontend)
- **npm** or **yarn** (package manager)

## 🚀 Quick Start

### Backend Setup (Django)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   ```bash
   # On Windows
   source venv/Scripts/activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup (React)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## 🔧 API Endpoints

The Django backend provides the following API endpoints:

- `GET /api/hello/` - Returns a hello message from the backend
- `GET /api/info/` - Returns API information and metadata

## 🎨 Frontend Components

### Header Component
- Modern navigation with gradient background
- Responsive design for mobile devices
- Smooth hover animations

### Dashboard Component
- Real-time backend connection status
- Feature cards showcasing platform capabilities
- Error handling with retry functionality
- Loading states with animated spinners

## 🔧 Configuration

### Backend Configuration

The Django backend is configured with:

- **Django REST Framework** for API development
- **CORS Headers** for cross-origin requests
- **SQLite Database** (default, can be changed to PostgreSQL/MySQL)
- **Development Settings** (DEBUG=True)

### Frontend Configuration

The React frontend includes:

- **Axios** for HTTP requests
- **Modern CSS** with gradients and animations
- **Responsive Design** for all screen sizes
- **Error Handling** for API failures

## 🚀 Development

### Running Both Servers

To run both frontend and backend simultaneously:

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   source venv/Scripts/activate  # Windows
   # source venv/bin/activate    # macOS/Linux
   python manage.py runserver
   ```

2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm start
   ```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
python manage.py collectstatic
```

## 📝 Available Scripts

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Backend Scripts
- `python manage.py runserver` - Start development server
- `python manage.py migrate` - Apply database migrations
- `python manage.py makemigrations` - Create new migrations
- `python manage.py createsuperuser` - Create admin user

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the Django server is running on port 8000
2. **Connection Refused**: Ensure both servers are running simultaneously
3. **Module Not Found**: Check if virtual environment is activated for backend
4. **Port Already in Use**: Change ports in respective configuration files

### Backend Issues
- Check if virtual environment is activated
- Ensure all dependencies are installed
- Verify database migrations are applied

### Frontend Issues
- Clear browser cache
- Check if all npm packages are installed
- Verify API base URL in services/api.js

## 🎯 Next Steps

This project provides a solid foundation for a student information system. Consider adding:

- **User Authentication** (Django Auth + JWT)
- **Database Models** for students, courses, resources
- **File Upload** functionality
- **Real-time Features** with WebSockets
- **Testing Suite** for both frontend and backend
- **Docker Configuration** for easy deployment
- **CI/CD Pipeline** for automated deployment

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Happy Coding! 🎉**
"# BCA-6th-SEM-Project" 
