# Dynamic RBAC System Backend

A comprehensive Role-Based Access Control (RBAC) system built with Node.js, Express, and MongoDB. This system provides dynamic permission and role management with a complete authentication and authorization framework.

## 🚀 Features

- **Dynamic RBAC**: Create and manage permissions and roles at runtime
- **JWT Authentication**: Secure token-based authentication
- **Email Integration**: User notifications and verification emails
- **Permission Middleware**: Reusable route protection based on permissions
- **User Management**: Complete user lifecycle management
- **Role Management**: Hierarchical role system with permission assignment
- **Post Management**: Sample module to demonstrate RBAC functionality
- **Audit Trail**: Track permission and role changes
- **Account Security**: Login attempt limiting and account lockout
- **Email Verification**: Secure email verification process

## 📋 Requirements

- Node.js 18+ 
- MongoDB 5+
- npm or yarn

## 🛠️ Installation

1. **Prerequisites**
   - Node.js 18+ installed
   - MongoDB installed and running (local) OR MongoDB Atlas account (cloud)
   
   **Install MongoDB locally:**
   - **Windows**: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb/brew/mongodb-community`
   - **Linux**: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database - Choose one option:
   # Option 1: Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/rbac-system
   
   # Option 2: MongoDB Atlas (Cloud)
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rbac-system
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   
   # Email Configuration (Optional - for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@rbac-system.com
   
   # SuperAdmin Credentials
   SUPERADMIN_EMAIL=admin@rbac-system.com
   SUPERADMIN_PASSWORD=SuperAdmin123!
   
   # Client URL
   CLIENT_URL=http://localhost:8080
   ```

5. **Start MongoDB (if using local installation)**
   ```bash
   # Windows
   mongod
   
   # macOS/Linux
   sudo systemctl start mongod
   # or
   brew services start mongodb-community
   ```

6. **Database Seeding**
   ```bash
   npm run seed
   ```

7. **Start the server**
   ```bash
   # Development (with auto-restart)
   npm run dev
   
   # Production
   npm start
   ```

   The server will start on `http://localhost:5000`

## 🌱 Default Credentials

After seeding, you can log in with these accounts:

### SuperAdmin
- **Email**: `admin@rbac-system.com`
- **Password**: `SuperAdmin123!`
- **Permissions**: All system permissions

### Test Users
- **Editor**: `editor@rbac-system.com` / `Editor123!`
- **Moderator**: `moderator@rbac-system.com` / `Moderator123!`
- **User**: `user@rbac-system.com` / `User123!`

⚠️ **Change default passwords after first login in production!**

## 📊 System Permissions

### User Management
- `user.create` - Create new users
- `user.read` - View user information
- `user.update` - Update user information  
- `user.delete` - Delete users

### Role Management
- `role.create` - Create new roles
- `role.read` - View roles
- `role.update` - Update roles and permissions
- `role.delete` - Delete roles

### Permission Management
- `permission.create` - Create new permissions
- `permission.read` - View permissions
- `permission.update` - Update permissions
- `permission.delete` - Delete permissions

### Post Management (Demo)
- `post.create` - Create posts
- `post.read` - View all posts including drafts
- `post.update` - Update any post
- `post.delete` - Delete any post

## 🎭 Default Roles

### SuperAdmin
- **Description**: Complete system access
- **Permissions**: All permissions
- **System Role**: Yes (cannot be deleted)

### Admin  
- **Description**: Administrative access
- **Permissions**: User and role management, post management
- **System Role**: Yes

### Editor
- **Description**: Content management
- **Permissions**: `post.create`, `post.read`, `post.update`
- **System Role**: Yes

### Moderator
- **Description**: Content moderation
- **Permissions**: `post.read`, `post.delete`
- **System Role**: Yes

### User
- **Description**: Basic user access
- **Permissions**: None (can be customized)
- **System Role**: Yes

## 🔐 API Endpoints

### Authentication
```http
POST /api/auth/register          # Register new user
POST /api/auth/login            # Login user
POST /api/auth/logout           # Logout user
GET  /api/auth/profile          # Get current user profile
PUT  /api/auth/profile          # Update profile
POST /api/auth/forgot-password   # Request password reset
POST /api/auth/reset-password    # Reset password
POST /api/auth/verify-email      # Verify email address
```

### Permission Management
```http
GET    /api/permissions         # List permissions
POST   /api/permissions         # Create permission (SuperAdmin)
GET    /api/permissions/:id     # Get permission details
PUT    /api/permissions/:id     # Update permission (SuperAdmin)
DELETE /api/permissions/:id     # Delete permission (SuperAdmin)
POST   /api/permissions/bulk    # Bulk create permissions (SuperAdmin)
GET    /api/permissions/stats   # Permission statistics
```

### Role Management
```http
GET    /api/roles               # List roles
POST   /api/roles               # Create role
GET    /api/roles/:id           # Get role details
PUT    /api/roles/:id           # Update role
DELETE /api/roles/:id           # Delete role
POST   /api/roles/:id/permissions    # Add permissions to role
DELETE /api/roles/:id/permissions    # Remove permissions from role
GET    /api/roles/stats         # Role statistics
```

### User Management
```http
GET    /api/users               # List users
POST   /api/users               # Create user
GET    /api/users/:id           # Get user details
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
PUT    /api/users/:id/role      # Assign role to user
POST   /api/users/:id/permissions/grant   # Grant custom permissions
POST   /api/users/:id/permissions/revoke  # Revoke custom permissions
DELETE /api/users/:id/permissions         # Remove custom permissions
GET    /api/users/stats         # User statistics
```

### Post Management (Demo)
```http
GET    /api/posts               # List posts (public)
POST   /api/posts               # Create post (requires post.create)
GET    /api/posts/:id           # Get post details
PUT    /api/posts/:id           # Update post (ownership or post.update)
DELETE /api/posts/:id           # Delete post (ownership or post.delete)
POST   /api/posts/:id/like      # Like/unlike post
GET    /api/posts/my/posts      # Get current user's posts
POST   /api/posts/:id/restore   # Restore deleted post
GET    /api/posts/stats         # Post statistics
```

## 🛡️ Security Features

### Authentication
- JWT token-based authentication
- Secure password hashing with bcrypt
- Token expiration and refresh
- Cookie-based token storage option

### Authorization
- Granular permission system
- Role-based access control
- Custom user permissions (grant/revoke)
- Middleware for route protection

### Account Security
- Failed login attempt tracking
- Temporary account lockout
- Password strength validation
- Email verification
- Password reset functionality

### Input Validation
- Request data sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

## 🏗️ Architecture

### Models
- **User**: Authentication and profile information
- **Role**: Permission collections
- **Permission**: Individual access rights
- **Post**: Demo content for testing RBAC

### Middleware
- **Authentication**: JWT token verification
- **Authorization**: Permission-based route protection
- **Error Handling**: Centralized error management
- **Rate Limiting**: Request throttling
- **CORS**: Cross-origin configuration

### Services
- **Email Service**: Transactional emails
- **Token Service**: JWT operations
- **Validation Service**: Input sanitization

## 🧪 Testing RBAC

### Test Scenario: Post Management

1. **Login as SuperAdmin**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@rbac-system.com",
     "password": "SuperAdmin123!"
   }
   ```

2. **Create Permissions** (if not seeded)
   ```bash
   POST /api/permissions/bulk
   {
     "permissions": [
       {"name": "post.create", "description": "Create posts"},
       {"name": "post.delete", "description": "Delete posts"}
     ]
   }
   ```

3. **Test User Permissions**
   - Editor can create posts but not delete
   - Moderator can delete posts but not create
   - Users can only view published posts

## 📧 Email Configuration

Configure SMTP settings in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Use App Password for Gmail
EMAIL_FROM=noreply@rbac-system.com
```

### Supported Email Features
- Welcome emails for new users
- Email verification
- Password reset links
- Role assignment notifications
- Account status changes

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use secure JWT secret (32+ characters)
3. Configure production database
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo:27017/rbac-production
JWT_SECRET=your-super-secure-production-secret-key
```

## 🔍 Monitoring

### Health Check
```http
GET /api/health
```

### Statistics Endpoints
- `GET /api/users/stats` - User statistics
- `GET /api/roles/stats` - Role statistics  
- `GET /api/permissions/stats` - Permission statistics
- `GET /api/posts/stats` - Post statistics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoints and examples

## 🔄 Updates

### Version 1.0.0
- Initial RBAC implementation
- JWT authentication
- Email integration
- Post management demo
- Complete API documentation
- Database seeding system

---

**Built with ❤️ for secure and scalable applications**#   A s s i g n m e n t - D y n a m i c - R B A C - S y s t e m  
 