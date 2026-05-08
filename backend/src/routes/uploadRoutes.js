const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/auth');

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload de uma imagem para Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Nenhuma imagem foi enviada
 *       500:
 *         description: Erro ao fazer upload
 */
router.post('/image', authMiddleware, uploadController.uploadImage);

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload de múltiplas imagens para Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Imagens enviadas com sucesso
 *       400:
 *         description: Nenhuma imagem foi enviada
 *       500:
 *         description: Erro ao fazer upload
 */
router.post('/images', authMiddleware, uploadController.uploadMultipleImages);

/**
 * @swagger
 * /api/upload/image/{publicId}:
 *   delete:
 *     summary: Deletar imagem do Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Imagem deletada com sucesso
 *       400:
 *         description: ID público não fornecido
 *       500:
 *         description: Erro ao deletar imagem
 */
router.delete('/image/:publicId', authMiddleware, uploadController.deleteImage);

module.exports = router;
