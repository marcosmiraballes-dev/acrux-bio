import { Router } from 'express';
import { FacturacionController } from '../controllers/facturacion.controller';

const router = Router();
const facturacionController = new FacturacionController();

router.get('/clientes', (req, res) => facturacionController.getClientes(req, res));
router.get('/clientes/:id', (req, res) => facturacionController.getClienteById(req, res));
router.post('/clientes', (req, res) => facturacionController.createCliente(req, res));
router.put('/clientes/:id', (req, res) => facturacionController.updateCliente(req, res));
router.delete('/clientes/:id', (req, res) => facturacionController.deleteCliente(req, res));

router.get('/clientes/:id/servicios', (req, res) => facturacionController.getServiciosByCliente(req, res));
router.post('/servicios', (req, res) => facturacionController.createServicio(req, res));
router.put('/servicios/:id', (req, res) => facturacionController.updateServicio(req, res));
router.delete('/servicios/:id', (req, res) => facturacionController.deleteServicio(req, res));

router.get('/cobros/mes/:mes/:anio', (req, res) => facturacionController.getCobrosMes(req, res));
router.get('/cobros/cliente/:clienteId', (req, res) => facturacionController.getCobrosByCliente(req, res));
router.post('/cobros', (req, res) => facturacionController.createCobro(req, res));
router.put('/cobros/:id', (req, res) => facturacionController.updateCobro(req, res));
router.post('/cobros/generar/:mes/:anio', (req, res) => facturacionController.generarCobrosMes(req, res));

router.post('/movimientos', (req, res) => facturacionController.crearMovimiento(req, res));
router.get('/movimientos/cliente/:cliente_id', (req, res) => facturacionController.listarMovimientosPorCliente(req, res));
router.delete('/movimientos/:id', (req, res) => facturacionController.eliminarMovimiento(req, res));

export default router;
