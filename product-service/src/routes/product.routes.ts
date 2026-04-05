import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product.service';

const router = Router();
// ProductService, ProductController'a constructor üzerinden enjekte edilir
const controller = new ProductController(new ProductService());

// RMM Seviye 2: HTTP verb + kaynak URI + doğru status kodları
router.get('/', (req, res) => controller.getAll(req, res));      // 200
router.get('/:id', (req, res) => controller.getById(req, res));  // 200 | 404
router.post('/', (req, res) => controller.create(req, res));     // 201 | 400
router.put('/:id', (req, res) => controller.update(req, res));   // 200 | 404
router.delete('/:id', (req, res) => controller.remove(req, res)); // 200 | 404

export default router;
