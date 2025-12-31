import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'acrux-bio-secret-key-2024';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días

export interface JWTPayload {
  id: string;
  email: string;
  rol: string;
}

/**
 * Generar un token JWT
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verificar y decodificar un token JWT
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};