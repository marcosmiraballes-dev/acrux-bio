import { supabase } from '../config/supabase';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';

export class AuthService {
  
  /**
   * Login de usuario
   */
  async login(email: string, password: string): Promise<any> {
    // Buscar usuario por email
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (error || !usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token
    const token = generateToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    });

    // Retornar usuario y token (sin password)
    const { password_hash, ...usuarioSinPassword } = usuario;

    return {
      token,
      usuario: usuarioSinPassword
    };
  }

  /**
   * Registro de nuevo usuario
   */
  async register(data: any): Promise<any> {
    const { nombre, email, password, rol = 'CAPTURADOR' } = data;

    // Verificar si el email ya existe
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (existente) {
      throw new Error('El email ya está registrado');
    }

    // Hashear password
    const password_hash = await bcrypt.hash(password, 10);

    // Crear usuario
    const { data: nuevoUsuario, error } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        email,
        password_hash,
        rol,
        activo: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    // Generar token
    const token = generateToken({
      id: nuevoUsuario.id,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol
    });

    // Retornar usuario y token (sin password)
    const { password_hash: _, ...usuarioSinPassword } = nuevoUsuario;

    return {
      token,
      usuario: usuarioSinPassword
    };
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(userId: string): Promise<any> {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, created_at')
      .eq('id', userId)
      .single();

    if (error || !usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  }
}