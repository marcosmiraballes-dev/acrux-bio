import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';
import { LocatarioRegistroService } from '../services/locatario-registro.service';

const router = Router();
const service = new LocatarioRegistroService();

const soloLocatario = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  if (!user || user.rol !== 'LOCATARIO') {
    return res.status(403).json({ success: false, error: 'Acceso no autorizado' });
  }
  next();
};

const getLocalId = async (userId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('usuarios')
    .select('local_id')
    .eq('id', userId)
    .single();
  return data?.local_id || null;
};

router.get('/info', authenticate, soloLocatario, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const localId = await getLocalId(user.id);
    if (!localId) return res.status(400).json({ success: false, error: 'Local no asignado' });
    const data = await service.getInfoLocal(localId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/tipos-residuos', authenticate, soloLocatario, async (req: Request, res: Response) => {
  try {
    const data = await service.getTiposResiduos();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/sectores', authenticate, soloLocatario, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const localId = await getLocalId(user.id);
    if (!localId) return res.status(400).json({ success: false, error: 'Local no asignado' });
    const data = await service.getSectores(localId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/registro', authenticate, soloLocatario, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const localId = await getLocalId(user.id);
    if (!localId) return res.status(400).json({ success: false, error: 'Local no asignado' });
    const { detalles, sectorId } = req.body;
    const result = await service.registrarResiduos(user.id, localId, detalles, sectorId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
