import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, Employee } from '../utils';
import { clearAllCache } from '@/utils/crmCache';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  path: string | null;
  login: (employeeId: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);

  // Improved session check - more flexible validation
  const hasValidStoredAuth = () => {
    try {
      const savedUser = localStorage.getItem('hrms_user');
      const savedEmployee = localStorage.getItem('hrms_employee');
      const savedCompany = localStorage.getItem('hrms_company');
      const savedToken = localStorage.getItem('hrms_token');

      // Check if we have the essential data
      if (!savedUser || !savedEmployee) {
        return false;
      }

      const userData = JSON.parse(savedUser);
      const employeeData = JSON.parse(savedEmployee);
      const companyData = savedCompany ? JSON.parse(savedCompany) : null;

      // Basic validation - check if required fields exist
      const hasValidUser = !!(userData && userData.id);
      const hasValidEmployee = !!(employeeData && employeeData.employeeId);

      return hasValidUser && hasValidEmployee;
    } catch (error) {
      console.error('Error checking stored auth:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (hasValidStoredAuth()) {
          const savedUser = localStorage.getItem('hrms_user');
          const savedEmployee = localStorage.getItem('hrms_employee');
          const savedCompany = localStorage.getItem('hrms_company');
          const savedToken = localStorage.getItem('hrms_token');
          const savedPath = localStorage.getItem('hrms_path');

          if (savedUser) setUser(JSON.parse(savedUser));
          if (savedEmployee) setEmployee(JSON.parse(savedEmployee));
          if (savedCompany) setCompany(JSON.parse(savedCompany));
          if (savedToken) setToken(savedToken);
          if (savedPath) setPath(savedPath);
          setIsAuthenticated(true);
        } else {
          // Clear any corrupted/incomplete data
          clearAuthData();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    setEmployee(null);
    setCompany(null);
    setIsAuthenticated(false);
    setToken(null);
    setPath(null);

    // Clear all auth-related localStorage items
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_employee');
    localStorage.removeItem('hrms_company');
    localStorage.removeItem('hrms_cookies');
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_path');
  };

  const login = async (employeeId: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const encodedPassword = btoa(password);
      // Make login request to n8n webhook
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const apiUrl = `${API_BASE_URL}/api/method/crm.api.lead.login`;

      const loginResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          usr: employeeId,
          pwd: encodedPassword
        })
      });

      const responseData = await loginResponse.json();
      console.log('Login response:', responseData);

      // Handle failed login response - check the new response structure
      if (responseData.message?.status === "FAILED" || !responseData.message?.data) {
        throw new Error(responseData.message?.message || 'Authentication failed');
      }

      if (!loginResponse.ok) {
        const errorMessage = responseData.message?.message || responseData.exc || responseData.error || `Authentication failed with status ${loginResponse.status}`;
        throw new Error(errorMessage);
      }

      // Extract login data from the new response structure
      const loginData = responseData.message.data;

      // Check if we have the required data in the response
      if (!loginData.user_id || !loginData.first_name) {
        throw new Error('Invalid response data. Please contact IT.');
      }

      // Determine user role based on the response role or employee ID
      let userRole: User['role'] = (loginData.role as User['role']) || 'employee';
      if (employeeId === 'HR001' || employeeId === 'hr001') {
        userRole = 'admin';
      } else if (loginData.role === 'manager') {
        userRole = 'manager';
      }

      // Parse team and hierarchy from stringified JSON if they exist
      let teamData: string[] = [];
      let hierarchyData: any[] = [];

      try {
        if (loginData.team && typeof loginData.team === 'string') {
          teamData = JSON.parse(loginData.team);
        }
        if (loginData.hierarchy && typeof loginData.hierarchy === 'string') {
          hierarchyData = JSON.parse(loginData.hierarchy);
        }
      } catch (parseError) {
        console.warn('Error parsing team or hierarchy data:', parseError);
      }

      // Create employee data from the API response
      const employeeData: Employee = {
        id: loginData.user_id,
        employeeId: loginData.user_id, // Using user_id as employeeId since no separate employee field
        userId: loginData.user_id,
        companyId: 'gopocket', // Default company ID
        firstName: loginData.first_name,
        lastName: '', // No separate last name in response
        email: loginData.company_email,
        phone: '', // Not provided in new response
        avatar: '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png', // Default avatar
        department: '', // Not provided in new response
        designation: loginData.role || 'employee',
        joiningDate: '', // Not provided in new response
        salary: 0, // Not provided in response
        status: 'confirmed', // Default status
        address: '', // Not provided in new response
        token: loginData.token,
        path: loginData.path,
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create user data
      const userData: User = {
        id: loginData.user_id,
        employeeId: loginData.user_id,
        email: loginData.company_email,
        firstName: loginData.first_name,
        lastName: '', // No separate last name in response
        role: userRole,
        companyId: employeeData.companyId,
        avatar: '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png',
        isActive: true, // Assuming active if login successful
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        token: loginData.token,
        path: loginData.path,
        team: loginData.team,
        hierarchy: loginData.hierarchy,
        branch: loginData.branch
      };

      // Create company data (using defaults since not provided in response)
      const companyData: Company = {
        id: 'gopocket',
        name: 'GoPocket',
        subdomain: 'gopocket',
        logo: '/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png',
        address: '123 Business St, Tech City, TC 12345',
        phone: '+1 (555) 123-4567',
        email: 'contact@gopocket.in',
        website: 'https://gopocket.in',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Set state
      setUser(userData);
      setEmployee(employeeData);
      setCompany(companyData);
      setIsAuthenticated(true);
      setToken(loginData.token || null);
      setPath(loginData.path || null);

      // Save to localStorage - this is critical for persistence
      localStorage.setItem('hrms_user', JSON.stringify(userData));
      localStorage.setItem('hrms_employee', JSON.stringify(employeeData));
      localStorage.setItem('hrms_company', JSON.stringify(companyData));
      localStorage.setItem('hrms_token', loginData.token || '');
      localStorage.setItem('hrms_path', loginData.path || '');

    } catch (error) {
      console.error('Login error:', error);
      clearAuthData();

      if (error instanceof Error) {
        throw error;
      } else if (typeof error === 'string') {
        throw new Error(error);
      } else {
        throw new Error('Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  const logout = () => {
    // Immediately clear local data
    clearAuthData();
    // Clear IndexedDB cache
    clearAllCache().catch(console.error);
  };

  const switchRole = (role: string) => {
    if (user) {
      const updatedUser = { ...user, role: role as User['role'] };
      setUser(updatedUser);
      localStorage.setItem('hrms_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      employee,
      company,
      isAuthenticated,
      isLoading,
      token,
      path,
      login,
      logout,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};