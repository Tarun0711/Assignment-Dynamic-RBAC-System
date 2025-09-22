import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI, handleApiError } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions?: Permission[];
}

export interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  avatar?: string;
  customPermissions?: {
    granted: Permission[];
    revoked: Permission[];
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
}

interface UserContextType extends AuthState {
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message: string }>;
  register: (userData: { name: string; email: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasResourceAccess: (resource: string, action?: string) => boolean;
  refreshUser: () => Promise<void>;
  updateProfile: (userData: { name: string }) => Promise<{ success: boolean; message: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: [],
  });
  
  const { toast } = useToast();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        // Verify token is still valid by fetching user profile
        const response = await authAPI.getProfile();
        const { user, permissions } = response.data.data;
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          permissions: permissions || [],
        });
      } catch (error) {
        // Token is invalid, clear stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;
      const message = response.data.message || 'Login successful';
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Get user permissions
      const profileResponse = await authAPI.getProfile();
      const { permissions } = profileResponse.data.data;
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        permissions: permissions || [],
      });
      
      return { success: true, message };
    } catch (error: any) {
      const apiError = handleApiError(error);
      return { success: false, message: apiError.message };
    }
  };

  const register = async (userData: { name: string; email: string; password: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      const message = response.data.message || 'Registration successful';
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Get user permissions
      const profileResponse = await authAPI.getProfile();
      const { permissions } = profileResponse.data.data;
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        permissions: permissions || [],
      });
      
      return { success: true, message };
    } catch (error: any) {
      const apiError = handleApiError(error);
      return { success: false, message: apiError.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout API fails, we should clear local state
      console.error('Logout API failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    }
  };

  const hasPermission = (permission: string): boolean => {
    return authState.permissions.some(p => p.name === permission);
  };

  const hasResourceAccess = (resource: string, action?: string): boolean => {
    if (action) {
      return authState.permissions.some(p => p.name === `${resource}.${action}`);
    }
    // Check if user has any permission for the resource (create, read, update, or delete)
    return authState.permissions.some(p => p.resource === resource);
  };

  const refreshUser = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const response = await authAPI.getProfile();
      const { user, permissions } = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      
      setAuthState(prev => ({
        ...prev,
        user,
        permissions: permissions || [],
      }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might be logged out
      await logout();
    }
  };

  const updateProfile = async (userData: { name: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.updateProfile(userData);
      const { user } = response.data.data;
      const message = response.data.message || 'Profile updated successfully';
      
      localStorage.setItem('user', JSON.stringify(user));
      
      setAuthState(prev => ({
        ...prev,
        user,
      }));
      
      return { success: true, message };
    } catch (error: any) {
      const apiError = handleApiError(error);
      return { success: false, message: apiError.message };
    }
  };

  const value: UserContextType = {
    ...authState,
    login,
    register,
    logout,
    hasPermission,
    hasResourceAccess,
    refreshUser,
    updateProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}