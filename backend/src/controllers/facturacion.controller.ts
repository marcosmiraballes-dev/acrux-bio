import { Request, Response } from 'express';
import { z } from 'zod';
import { FacturacionService } from '../services/facturacion.service';
import {
  createClienteFacturacionSchema,
  updateClienteFacturacionSchema,
  createServicioClienteSchema,
  updateServicioClienteSchema,
  createCobroMensualSchema,
  updateCobroMensualSchema,
} from '../schemas/facturacion.schema';

const facturacionService = new FacturacionService();

export class FacturacionController {
  async getClientes(req: Request, res: Response) {
    try {
      const data = await facturacionService.getClientes();
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async getClienteById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await facturacionService.getClienteById(id);

      if (!data) {
        return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async createCliente(req: Request, res: Response) {
    try {
      const payload = createClienteFacturacionSchema.parse(req.body);
      const data = await facturacionService.createCliente(payload);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.issues });
      }
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async updateCliente(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = updateClienteFacturacionSchema.parse(req.body);
      const data = await facturacionService.updateCliente(id, payload);
      return res.json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.issues });
      }
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async deleteCliente(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await facturacionService.deleteCliente(id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async getServiciosByCliente(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await facturacionService.getServiciosByCliente(id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async createServicio(req: Request, res: Response) {
    try {
      const payload = createServicioClienteSchema.parse(req.body);
      const data = await facturacionService.createServicio(payload);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.issues });
      }
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async updateServicio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = updateServicioClienteSchema.parse(req.body);
      const data = await facturacionService.updateServicio(id, payload);
      return res.json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.issues });
      }
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async deleteServicio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await facturacionService.deleteServicio(id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async getCobrosByCliente(req: Request, res: Response) {
    try {
      const { clienteId } = req.params;
      const data = await facturacionService.getCobrosByCliente(clienteId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async getCobrosMes(req: Request, res: Response) {
    try {
      const mes = Number(req.params.mes);
      const anio = Number(req.params.anio);

      if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(anio) || anio < 1000 || anio > 9999) {
        return res.status(400).json({ success: false, error: 'Parámetros de mes o año inválidos' });
      }

      const data = await facturacionService.getCobrosMes(mes, anio);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async createCobro(req: Request, res: Response) {
    try {
      const payload = createCobroMensualSchema.parse(req.body);
      const data = await facturacionService.createCobro(payload);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.issues });
      }
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async updateCobro(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = updateCobroMensualSchema.parse(req.body);
      const data = await facturacionService.updateCobro(id, payload);
      return res.json({ success: true, data });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.issues });
      }
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }

  async generarCobrosMes(req: Request, res: Response) {
    try {
      const mes = Number(req.params.mes);
      const anio = Number(req.params.anio);

      if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(anio) || anio < 1000 || anio > 9999) {
        return res.status(400).json({ success: false, error: 'Parámetros de mes o año inválidos' });
      }

      const data = await facturacionService.generarCobrosMes(mes, anio);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }
}
