<div align="center">

# 🛡️ Dynamic RBAC System Backend

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5+-green.svg)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Secure-orange.svg)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*A comprehensive Role-Based Access Control (RBAC) system built with Node.js, Express, and MongoDB*

**🔐 Secure • 🚀 Dynamic • 📈 Scalable • 🎯 Production-Ready**

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 **Security & Authentication**
- 🎫 **JWT Authentication** - Secure token-based auth
- 🛡️ **Dynamic RBAC** - Runtime permission management
- 🔒 **Account Security** - Login limiting & lockout
- ✅ **Email Verification** - Secure verification process

</td>
<td width="50%">

### 🎯 **Management Systems**
- 👥 **User Management** - Complete lifecycle management
- 🎭 **Role Management** - Hierarchical role system
- 📝 **Post Management** - Demo RBAC functionality
- 📊 **Audit Trail** - Track all changes

</td>
</tr>
<tr>
<td width="50%">

### 🔧 **Developer Experience**
- 🛠️ **Permission Middleware** - Reusable route protection
- 📧 **Email Integration** - Notifications & verification
- 🎨 **RESTful API** - Clean and intuitive endpoints
- 📈 **Statistics** - Real-time system insights

</td>
<td width="50%">

### 🚀 **Production Ready**
- 🐳 **Docker Support** - Easy deployment
- 🔍 **Health Monitoring** - System status checks  
- 📋 **Comprehensive Logging** - Debug and monitoring
- ⚡ **High Performance** - Optimized for scale

</td>
</tr>
</table>

## 📋 Requirements

<div align="center">

| Technology | Version | Purpose |
|------------|---------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) | 18+ | Runtime Environment |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white) | 5+ | Database |
| ![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white) | Latest | Package Manager |

</div>

## � Quick Start

> 💡 **New to RBAC?** This system allows you to create users, assign them roles, and control what they can do with granular permissions!

### 📥 **Step 1: Prerequisites**

<details>
<summary><b>🖥️ Install Node.js</b></summary>

- Download from [nodejs.org](https://nodejs.org/) (v18 or higher)
- Verify: `node --version`
</details>

<details>
<summary><b>🍃 Install MongoDB</b></summary>

**Local Installation:**
```bash
# Windows
# Download from: https://www.mongodb.com/try/download/community

# macOS
brew install mongodb/brew/mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install -y mongodb
```

**Or use MongoDB Atlas (Cloud):**
- Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Get connection string
</details>

### 🔧 **Step 2: Installation**

```bash
# 1. Clone the repository
git clone <repository-url>
cd Backend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your settings (see configuration below)
```

### ⚙️ **Step 3: Configuration**

<details>
<summary><b>📝 Environment Variables (.env)</b></summary>

```bash
# 🗄️ Database Configuration
MONGODB_URI=mongodb://localhost:27017/rbac-system
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/rbac-system

# 🔐 JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 📧 Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 👑 SuperAdmin Credentials
SUPERADMIN_EMAIL=admin@rbac-system.com
SUPERADMIN_PASSWORD=SuperAdmin123!

# 🌐 Client URL
CLIENT_URL=http://localhost:8080
```
</details>

### 🎯 **Step 4: Launch**

```bash
# 1. Start MongoDB (if local)
# Windows: mongod
# macOS/Linux: sudo systemctl start mongod

# 2. Seed the database with sample data
npm run seed

# 3. Start the server
npm run dev  # Development mode
# OR
npm start   # Production mode
```

<div align="center">

🎉 **Success!** Your RBAC system is now running at `http://localhost:5000`

</div>

## 🔑 Default Credentials

<div align="center">

> ⚠️ **Security Note:** Change all default passwords after first login in production!

</div>

<table>
<tr>
<th>👑 SuperAdmin</th>
<th>📝 Test Users</th>
</tr>
<tr>
<td>

```bash
📧 Email: admin@rbac-system.com
🔒 Password: SuperAdmin123!
🎯 Access: All Permissions
```

</td>
<td>

```bash
✍️  Editor: editor@rbac-system.com / Editor123!
🛡️  Moderator: moderator@rbac-system.com / Moderator123!
👤 User: user@rbac-system.com / User123!
```

</td>
</tr>
</table>

## 🎯 System Permissions

<div align="center">

*Fine-grained access control with atomic permissions*

</div>

<details>
<summary><b>👥 User Management</b></summary>

| Permission | Description | Icon |
|------------|-------------|------|
| `user.create` | Create new users | ➕ |
| `user.read` | View user information | 👀 |  
| `user.update` | Update user information | ✏️ |
| `user.delete` | Delete users | 🗑️ |

</details>

<details>
<summary><b>🎭 Role Management</b></summary>

| Permission | Description | Icon |
|------------|-------------|------|
| `role.create` | Create new roles | 🎭 |
| `role.read` | View roles | 👀 |
| `role.update` | Update roles and permissions | ✏️ |
| `role.delete` | Delete roles | 🗑️ |

</details>

<details>
<summary><b>🔐 Permission Management</b></summary>

| Permission | Description | Icon |
|------------|-------------|------|
| `permission.create` | Create new permissions | 🔐 |
| `permission.read` | View permissions | 👀 |
| `permission.update` | Update permissions | ✏️ |
| `permission.delete` | Delete permissions | 🗑️ |

</details>

<details>
<summary><b>📝 Post Management (Demo)</b></summary>

| Permission | Description | Icon |
|------------|-------------|------|
| `post.create` | Create posts | ➕ |
| `post.read` | View all posts including drafts | 👀 |
| `post.update` | Update any post | ✏️ |
| `post.delete` | Delete any post | 🗑️ |

</details>

## 🎭 Default Roles

<div align="center">

*Hierarchical role system with predefined access levels*

</div>

<table>
<tr>
<td width="20%">

### 👑 **SuperAdmin**
```
🔓 All Permissions
🛡️ System Role
❌ Cannot Delete
```

</td>
<td width="20%">

### 🔧 **Admin**
```
👥 User Management
🎭 Role Management  
📝 Post Management
🛡️ System Role
```

</td>
<td width="20%">

### ✍️ **Editor**
```
➕ post.create
👀 post.read
✏️ post.update
🛡️ System Role
```

</td>
<td width="20%">

### 🛡️ **Moderator**
```
👀 post.read
🗑️ post.delete
🛡️ System Role
```

</td>
<td width="20%">

### 👤 **User**
```
🎯 Basic Access
⚙️ Customizable
🛡️ System Role
```

</td>
</tr>
</table>

## � API Endpoints

<div align="center">

*RESTful API with comprehensive RBAC functionality*

</div>

<details>
<summary><b>🔐 Authentication Endpoints</b></summary>

```http
POST   /api/auth/register          # 📝 Register new user
POST   /api/auth/login            # 🔑 Login user  
POST   /api/auth/logout           # 🚪 Logout user
GET    /api/auth/profile          # 👤 Get current user profile
PUT    /api/auth/profile          # ✏️ Update profile
POST   /api/auth/forgot-password   # 🔄 Request password reset
POST   /api/auth/reset-password    # 🔒 Reset password
POST   /api/auth/verify-email      # ✅ Verify email address
```

</details>

<details>
<summary><b>🔐 Permission Management</b></summary>

```http
GET    /api/permissions         # 📋 List permissions
POST   /api/permissions         # ➕ Create permission (SuperAdmin)
GET    /api/permissions/:id     # 👀 Get permission details
PUT    /api/permissions/:id     # ✏️ Update permission (SuperAdmin)
DELETE /api/permissions/:id     # 🗑️ Delete permission (SuperAdmin)
POST   /api/permissions/bulk    # 📦 Bulk create permissions (SuperAdmin)
GET    /api/permissions/stats   # 📊 Permission statistics
```

</details>

<details>
<summary><b>🎭 Role Management</b></summary>

```http
GET    /api/roles               # 📋 List roles
POST   /api/roles               # ➕ Create role
GET    /api/roles/:id           # 👀 Get role details  
PUT    /api/roles/:id           # ✏️ Update role
DELETE /api/roles/:id           # 🗑️ Delete role
POST   /api/roles/:id/permissions    # 🔗 Add permissions to role
DELETE /api/roles/:id/permissions    # ➖ Remove permissions from role
GET    /api/roles/stats         # 📊 Role statistics
```

</details>

<details>
<summary><b>👥 User Management</b></summary>

```http
GET    /api/users               # 📋 List users
POST   /api/users               # ➕ Create user
GET    /api/users/:id           # 👀 Get user details
PUT    /api/users/:id           # ✏️ Update user
DELETE /api/users/:id           # 🗑️ Delete user
PUT    /api/users/:id/role      # 🎭 Assign role to user
POST   /api/users/:id/permissions/grant   # ✅ Grant custom permissions
POST   /api/users/:id/permissions/revoke  # ❌ Revoke custom permissions  
DELETE /api/users/:id/permissions         # 🧹 Remove custom permissions
GET    /api/users/stats         # 📊 User statistics
```

</details>

<details>
<summary><b>📝 Post Management (Demo)</b></summary>

```http
GET    /api/posts               # 📋 List posts (public)
POST   /api/posts               # ➕ Create post (requires post.create)
GET    /api/posts/:id           # 👀 Get post details
PUT    /api/posts/:id           # ✏️ Update post (ownership or post.update)
DELETE /api/posts/:id           # 🗑️ Delete post (ownership or post.delete)
POST   /api/posts/:id/like      # ❤️ Like/unlike post
GET    /api/posts/my/posts      # 📝 Get current user's posts
POST   /api/posts/:id/restore   # ♻️ Restore deleted post
GET    /api/posts/stats         # 📊 Post statistics
```

</details>

## 🛡️ Security Features

<div align="center">

*Enterprise-grade security with multiple layers of protection*

</div>

<table>
<tr>
<td width="50%">

### 🔐 **Authentication & Authorization**
- 🎫 **JWT Tokens** - Stateless authentication
- 🧂 **Bcrypt Hashing** - Secure password storage
- 🔄 **Token Refresh** - Automatic renewal
- 🍪 **Cookie Storage** - Secure token handling
- 🎯 **Granular Permissions** - Fine-grained control
- 🎭 **Role-Based Access** - Hierarchical security
- ⚡ **Custom Permissions** - User-specific rights

</td>
<td width="50%">

### 🛡️ **Account Security**
- 🚫 **Login Attempts** - Failed attempt tracking
- 🔒 **Account Lockout** - Temporary protection
- 💪 **Password Strength** - Validation rules
- ✅ **Email Verification** - Identity confirmation
- 🔄 **Password Reset** - Secure recovery
- 📧 **Notification System** - Security alerts

</td>
</tr>
<tr>
<td width="50%">

### 🛠️ **Input Protection**
- 🧹 **Data Sanitization** - Clean input processing
- 💉 **SQL Injection** - Prevention mechanisms  
- 🚫 **XSS Protection** - Cross-site scripting defense
- ⏱️ **Rate Limiting** - Request throttling
- 🔍 **Input Validation** - Schema-based checks

</td>
<td width="50%">

### 🔧 **Infrastructure Security**
- 🌐 **CORS Configuration** - Cross-origin control
- 🔐 **HTTPS/TLS** - Encrypted communication
- 📝 **Audit Logging** - Security event tracking
- 🏥 **Health Checks** - System monitoring
- 🔄 **Auto Updates** - Security patch management

</td>
</tr>
</table>

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

<div align="center">

*Interactive tutorial to test the permission system*

</div>

### 🎯 **Scenario: Post Management Demo**

<details>
<summary><b>Step 1: 👑 Login as SuperAdmin</b></summary>

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rbac-system.com",
    "password": "SuperAdmin123!"
  }'
```

</details>

<details>
<summary><b>Step 2: 🔐 Create Custom Permissions</b></summary>

```bash
curl -X POST http://localhost:5000/api/permissions/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      {"name": "post.create", "description": "Create posts"},
      {"name": "post.delete", "description": "Delete posts"}
    ]
  }'
```

</details>

<details>
<summary><b>Step 3: 🧪 Test Role Permissions</b></summary>

| Role | Can Create Posts | Can Delete Posts | Can View Posts |
|------|-----------------|------------------|----------------|
| ✍️ Editor | ✅ Yes | ❌ No | ✅ Yes |
| 🛡️ Moderator | ❌ No | ✅ Yes | ✅ Yes |
| 👤 User | ❌ No | ❌ No | ✅ Public Only |

</details>

<details>
<summary><b>Step 4: 🎮 Interactive Testing</b></summary>

```bash
# Create a post as Editor
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer EDITOR_TOKEN" \
  -d '{"title": "My First Post", "content": "Hello World!"}'

# Try to delete as Editor (should fail)  
curl -X DELETE http://localhost:5000/api/posts/POST_ID \
  -H "Authorization: Bearer EDITOR_TOKEN"

# Delete as Moderator (should succeed)
curl -X DELETE http://localhost:5000/api/posts/POST_ID \
  -H "Authorization: Bearer MODERATOR_TOKEN"
```

</details>

## 📧 Email Integration

<div align="center">

*Professional email notifications and user communications*

</div>

### ⚙️ **SMTP Configuration**

<details>
<summary><b>🔧 Environment Setup</b></summary>

```env
# Gmail Configuration (Recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # ⚠️ Use App Password for Gmail
EMAIL_FROM=noreply@rbac-system.com

# Other Providers
# Outlook: smtp-mail.outlook.com
# Yahoo: smtp.mail.yahoo.com
# Custom SMTP: your-smtp-server.com
```

</details>

### 📮 **Email Features**

<table>
<tr>
<td width="50%">

### 🎉 **User Lifecycle**
- 👋 Welcome emails for new users
- ✅ Email verification links
- 🔄 Password reset notifications
- 🎭 Role assignment alerts

</td>
<td width="50%">

### 🔔 **Security Notifications**
- 🚨 Account lockout warnings
- 🔐 Suspicious login attempts  
- 🛡️ Permission changes
- 📊 Security summaries

</td>
</tr>
</table>

<details>
<summary><b>📧 Sample Email Templates</b></summary>

**Welcome Email:**
```
🎉 Welcome to RBAC System!

Hi [Name],
Your account has been created successfully.
Role: [Role Name]
Login: http://localhost:5000/login

Best regards,
RBAC Team
```

</details>

## 🚀 Deployment Guide

<div align="center">

*Production-ready deployment with Docker and best practices*

</div>

### 🔧 **Environment Setup**

<details>
<summary><b>🏭 Production Configuration</b></summary>

```bash
# Core Settings
NODE_ENV=production
PORT=5000

# Database  
MONGODB_URI=mongodb://your-production-db:27017/rbac-production

# Security
JWT_SECRET=your-super-secure-64-character-production-secret-key-here
BCRYPT_ROUNDS=12

# Email
EMAIL_HOST=smtp.your-provider.com
EMAIL_USER=production@yourdomain.com
EMAIL_PASS=your-secure-password
```

</details>

### 🐳 **Docker Deployment**

<details>
<summary><b>📦 Dockerfile</b></summary>

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S rbac -u 1001

# Change ownership and switch to non-root user  
RUN chown -R rbac:nodejs /app
USER rbac

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

</details>

<details>
<summary><b>🔧 Docker Compose</b></summary>

```yaml
version: '3.8'
services:
  rbac-backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/rbac-production
    depends_on:
      - mongo
    restart: unless-stopped
    
  mongo:
    image: mongo:5
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: rbac-production
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - rbac-backend
    restart: unless-stopped

volumes:
  mongo_data:
```

</details>

### 🌐 **Production Checklist**

- [ ] 🔐 Change all default passwords
- [ ] 🔑 Generate secure JWT secret (64+ characters)
- [ ] 🍃 Setup production MongoDB
- [ ] 📧 Configure production email service
- [ ] 🔒 Setup SSL/TLS certificates
- [ ] 🌐 Configure reverse proxy (nginx)
- [ ] 📊 Setup logging and monitoring
- [ ] 🚨 Configure error tracking
- [ ] 🔄 Setup automated backups
- [ ] 📈 Performance optimization

## 🔍 Monitoring & Analytics

<div align="center">

*Real-time insights and system health monitoring*

</div>

### 🏥 **Health Monitoring**

<details>
<summary><b>📊 System Health Check</b></summary>

```bash
# Basic Health Check
GET /api/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-09-22T10:30:00Z",
  "uptime": "2d 14h 32m",
  "version": "1.0.0",
  "database": "connected",
  "memory": {
    "used": "128 MB",
    "free": "384 MB"
  }
}
```

</details>

### 📈 **Analytics Endpoints**

<table>
<tr>
<td width="50%">

**📊 User Analytics**
```bash
GET /api/users/stats
```
```json
{
  "totalUsers": 150,
  "activeUsers": 89,
  "newUsersToday": 5,
  "usersByRole": {
    "Admin": 3,
    "Editor": 25,
    "User": 122
  }
}
```

</td>
<td width="50%">

**🎭 Role Analytics**  
```bash
GET /api/roles/stats
```
```json
{
  "totalRoles": 8,
  "systemRoles": 5,
  "customRoles": 3,
  "mostUsedRole": "User",
  "roleDistribution": {...}
}
```

</td>
</tr>
<tr>
<td width="50%">

**🔐 Permission Analytics**
```bash
GET /api/permissions/stats
```
```json
{
  "totalPermissions": 16,
  "systemPermissions": 12,
  "customPermissions": 4,
  "usageStats": {...}
}
```

</td>
<td width="50%">

**📝 Content Analytics**
```bash
GET /api/posts/stats  
```
```json
{
  "totalPosts": 245,
  "publishedPosts": 198,
  "draftPosts": 47,
  "postsToday": 12,
  "topAuthors": [...]
}
```

</td>
</tr>
</table>

---

<div align="center">

## 🤝 Contributing

*Help us make RBAC System even better!*

</div>

### 🚀 **Getting Started**

1. 🍴 **Fork** the repository
2. 🌿 **Create** feature branch: `git checkout -b feature/amazing-feature`  
3. 💾 **Commit** your changes: `git commit -m 'Add amazing feature'`
4. 📤 **Push** to branch: `git push origin feature/amazing-feature`
5. 🔄 **Open** a Pull Request

### 🎯 **Areas for Contribution**

<table>
<tr>
<td width="25%">

**� Bug Fixes**
- Security patches
- Performance issues  
- API inconsistencies

</td>
<td width="25%">

**✨ Features**
- New permissions
- Integration modules
- UI improvements

</td>
<td width="25%">

**📚 Documentation**
- API examples
- Tutorial guides
- Best practices

</td>
<td width="25%">

**🧪 Testing**
- Unit tests
- Integration tests
- Load testing

</td>
</tr>
</table>

---

<div align="center">

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

<div align="center">

## 🆘 Support & Community

*Get help and connect with other developers*

</div>

<table align="center">
<tr>
<td align="center">

### 🐛 **Issues**
Found a bug?<br>
[Create an Issue](../../issues)

</td>
<td align="center">

### 💬 **Discussions**  
Have questions?<br>
[Join Discussion](../../discussions)

</td>
<td align="center">

### 📖 **Documentation**
Need help?<br>
[View Docs](../../wiki)

</td>
<td align="center">

### 🚀 **Examples**
See it in action<br>
[View Examples](../../examples)

</td>
</tr>
</table>

---

<div align="center">

## 🔄 Changelog

*Track our progress and updates*

</div>

### 🎉 **Version 1.0.0** - *Current Release*
- ✅ Complete RBAC implementation
- 🔐 JWT authentication system
- 📧 Email integration
- 📝 Post management demo
- 📚 Comprehensive documentation
- 🌱 Database seeding system
- 🐳 Docker support
- 🔒 Production security features

### 🔮 **Coming Soon** - *Version 1.1.0*
- 📊 Advanced analytics dashboard
- 🔔 Real-time notifications
- 🎨 Theme customization
- 🌐 Multi-language support
- 📱 Mobile API optimizations

---

<div align="center">

## 🙏 Acknowledgments

*Special thanks to the amazing open-source community*

<table>
<tr>
<td align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

</td>
<td align="center">

![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

</td>
<td align="center">

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</td>
<td align="center">

![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</td>
</tr>
</table>

---

<div align="center">

**🔒 Built with ❤️ for secure and scalable applications**

*Dynamic RBAC System - Where security meets flexibility*

[![⭐ Star this repo](https://img.shields.io/github/stars/username/repo?style=social)](../../stargazers)
[![🍴 Fork this repo](https://img.shields.io/github/forks/username/repo?style=social)](../../fork)
[![👁️ Watch this repo](https://img.shields.io/github/watchers/username/repo?style=social)](../../watchers)

</div>

---#   A s s i g n m e n t - D y n a m i c - R B A C - S y s t e m 
 
 