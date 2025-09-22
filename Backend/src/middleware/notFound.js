/**
 * 404 handler for unknown routes
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/logout'],
      users: ['/api/users', '/api/users/:id'],
      roles: ['/api/roles', '/api/roles/:id'],
      permissions: ['/api/permissions', '/api/permissions/:id'],
      posts: ['/api/posts', '/api/posts/:id']
    }
  });
};