import api from '../utils/api';
import { LoginCredentials, AuthResponse, Usuario } from '../types';

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Obtener perfil del usuario autenticado
  getProfile: async (): Promise<Usuario> => {
    const response = await api.get<{ success: boolean; data: Usuario }>('/auth/profile');
    return response.data.data;
  },

  // Guardar token y usuario en localStorage
  saveAuth: (token: string, usuario: Usuario): void => {
    localStorage.setItem('acrux_token', token);
    localStorage.setItem('acrux_user', JSON.stringify(usuario));
  },

  // Obtener usuario desde localStorage
  getStoredUser: (): Usuario | null => {
    const userStr = localStorage.getItem('acrux_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Obtener token desde localStorage
  getStoredToken: (): string | null => {
    return localStorage.getItem('acrux_token');
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('acrux_token');
    localStorage.removeItem('acrux_user');
  },

  // Verificar si está autenticado
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('acrux_token');
  },
};
