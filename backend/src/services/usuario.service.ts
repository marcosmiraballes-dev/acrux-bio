import { supabase } from '../config/supabase';
import bcrypt from 'bcrypt';

export class UsuarioService {
  
  /**
   * Obtener todos los usuarios
   */
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }

    // Remover passwords de la respuesta
    return (data || []).map(user => {
      const { password, password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Obtener un usuario por ID
   */
  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error obteniendo usuario: ${error.message}`);
    }

    // Remover password
    if (data) {
      const { password, password_hash, ...userWithoutPassword } = data;
      return userWithoutPassword;
    }

    return null;
  }

  /**
   * Obtener usuario por email
   */
  async getByEmail(email: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error obteniendo usuario: ${error.message}`);
    }

    return data;
  }

  /**
   * Crear un nuevo usuario
   */
  async create(input: any): Promise<any> {
    // Hash del password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        ...input,
        password_hash: hashedPassword  // ✅ Cambiado a password_hash
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    // Remover password de la respuesta
    if (data) {
      const { password, password_hash, ...userWithoutPassword } = data;
      return userWithoutPassword;
    }

    return data;
  }

  /**
   * Actualizar un usuario existente
   */
  async update(id: string, input: any): Promise<any> {
    const updateData: any = {
      ...input,
      updated_at: new Date().toISOString()
    };

    // Si se está actualizando el password, hashearlo
    if (input.password) {
      updateData.password_hash = await bcrypt.hash(input.password, 10);  // ✅ Cambiado a password_hash
      delete updateData.password; // Eliminar password del objeto
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }

    if (!data) {
      throw new Error('Usuario no encontrado');
    }

    // Remover password de la respuesta
    const { password, password_hash, ...userWithoutPassword } = data;
    return userWithoutPassword;
  }

  /**
   * Eliminar un usuario FÍSICAMENTE de la base de datos
   */
  async delete(id: string): Promise<boolean> {
    // Verificar que no tenga recolecciones asociadas como capturador
    const { data: recolecciones } = await supabase
      .from('recolecciones')
      .select('id')
      .eq('usuario_id', id)
      .limit(1);

    if (recolecciones && recolecciones.length > 0) {
      throw new Error('No se puede eliminar un usuario que tiene recolecciones registradas. Desactívalo en su lugar.');
    }

    // ELIMINACIÓN FÍSICA - Borrar completamente de la BD
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }

    return true;
  }

  /**
   * Verificar password
   */
  async verifyPassword(email: string, password: string): Promise<any | null> {
    const user = await this.getByEmail(email);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);  // ✅ Cambiado a password_hash

    if (!isValid) {
      return null;
    }

    // Remover password de la respuesta
    const { password: _, password_hash: __, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}