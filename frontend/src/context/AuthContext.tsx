import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Usuario } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ⏱️ TIMEOUT DE SESIÓN: 15 minutos (en milisegundos)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const token = authService.getStoredToken();
    
    if (storedUser && token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // 🔒 LOGOUT AUTOMÁTICO POR INACTIVIDAD
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    
    // Limpiar timer si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ⏲️ RESETEAR TIMER DE INACTIVIDAD
  const resetInactivityTimer = useCallback(() => {
    // Limpiar timer anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Solo crear nuevo timer si hay usuario autenticado
    if (user) {
      timeoutRef.current = setTimeout(() => {
        console.log('⏱️ Sesión expirada por inactividad (15 minutos)');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, logout]);

  // 👂 DETECTAR ACTIVIDAD DEL USUARIO
  useEffect(() => {
    if (!user) return; // No monitorear si no hay usuario

    // Eventos que indican actividad
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Handler que resetea el timer
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Iniciar timer al montar
    resetInactivityTimer();

    // Cleanup: remover listeners y timer
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const { token, usuario } = response.data;
      
      // Guardar en localStorage
      authService.saveAuth(token, usuario);
      
      // Actualizar estado
      setUser(usuario);
      
      // Iniciar timer de inactividad
      resetInactivityTimer();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
