import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { name: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: { name: string }) =>
    api.put('/auth/profile', userData),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
  
  resendVerification: () => api.post('/auth/resend-verification'),
};

// User API endpoints
export const userAPI = {
  getUsers: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    role?: string; 
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/users', { params }),
  
  getUserById: (id: string) => api.get(`/users/${id}`),
  
  createUser: (userData: { 
    name: string; 
    email: string; 
    password: string; 
    roleId: string;
  }) => api.post('/users', userData),
  
  updateUser: (id: string, userData: { 
    name?: string; 
    isActive?: boolean;
  }) => api.put(`/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  assignRole: (id: string, roleId: string) =>
    api.put(`/users/${id}/role`, { roleId }),
  
  grantCustomPermissions: (id: string, permissions: string[]) =>
    api.post(`/users/${id}/permissions/grant`, { permissions }),
  
  revokeCustomPermissions: (id: string, permissions: string[]) =>
    api.post(`/users/${id}/permissions/revoke`, { permissions }),

  removeCustomPermissions: (id: string, permissions: string[]) =>
    api.delete(`/users/${id}/permissions`, { data: { permissions } }),

  getUserStats: () => api.get('/users/stats'),
};

// Role API endpoints
export const roleAPI = {
  getRoles: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/roles', { params }),
  
  getRoleById: (id: string) => api.get(`/roles/${id}`),
  
  createRole: (roleData: { name: string; description: string; permissions: string[] }) =>
    api.post('/roles', roleData),
  
  updateRole: (id: string, roleData: any) => api.put(`/roles/${id}`, roleData),
  
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  
  assignPermission: (id: string, permissionId: string) =>
    api.patch(`/roles/${id}/assign-permission`, { permissionId }),
  
  removePermission: (id: string, permissionId: string) =>
    api.patch(`/roles/${id}/remove-permission`, { permissionId }),
};

// Permission API endpoints
export const permissionAPI = {
  getPermissions: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    resource?: string;
    action?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/permissions', { params }),
  
  getPermissionById: (id: string) => api.get(`/permissions/${id}`),
  
  createPermission: (permissionData: {
    name: string;
    description: string;
  }) => api.post('/permissions', permissionData),
  
  updatePermission: (id: string, permissionData: { description: string }) =>
    api.put(`/permissions/${id}`, permissionData),
  
  deletePermission: (id: string) => api.delete(`/permissions/${id}`),
  
  getPermissionStats: () => api.get('/permissions/stats'),
  
  bulkCreatePermissions: (permissions: Array<{ name: string; description: string }>) =>
    api.post('/permissions/bulk', { permissions }),
};

// Post API endpoints
export const postAPI = {
  getPosts: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/posts', { params }),
  
  getPostById: (id: string) => api.get(`/posts/${id}`),
  
  createPost: (postData: { title: string; content: string; tags?: string[]; status?: 'draft' | 'published' | 'archived' }) =>
    api.post('/posts', postData),
  
  updatePost: (id: string, postData: { title?: string; content?: string; tags?: string[]; status?: 'draft' | 'published' | 'archived' }) => api.put(`/posts/${id}`, postData),
  
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  
  togglePostStatus: (id: string) => api.patch(`/posts/${id}/toggle-status`),
};

// Generic API error handler
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data.message || 'An error occurred',
      status,
      errors: data.errors || null,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      errors: null,
    };
  } else {
    // Something else happened
    return {
      message: 'An unexpected error occurred',
      status: 0,
      errors: null,
    };
  }
};

export default api;
