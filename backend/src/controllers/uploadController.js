const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const sharp = require('sharp');

// Configurar multer para usar memória (não salvar em disco)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});

/**
 * Upload de imagem para Cloudinary
 * @route POST /api/upload/image
 */
exports.uploadImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Nenhuma imagem foi enviada' 
        });
      }

      // Upload para Cloudinary usando buffer
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'loja-produtos', // Pasta no Cloudinary
            resource_type: 'image',
            transformation: [
              { width: 1000, height: 1000, crop: 'limit' }, // Limitar tamanho máximo
              { quality: 'auto:good' } // Otimizar qualidade automaticamente
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        // Enviar buffer para o stream
        uploadStream.end(req.file.buffer);
      });
// Gerar thumbnail em base64 como backup (200x200px, ~10-20KB)
      const thumbnailBuffer = await sharp(req.file.buffer)
        .resize(200, 200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 60 })
        .toBuffer();

      const thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;

      res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        backup: thumbnailBase64 // Backup thumbnail para salvar no banco
      });

    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
      res.status(500).json({ 
        error: 'Erro ao fazer upload da imagem',
        details: error.message 
      });
    }
  }
];

/**
 * Upload múltiplo de imagens para Cloudinary
 * @route POST /api/upload/images
 */
exports.uploadMultipleImages = [
  upload.array('images', 10), // Máximo 10 imagens
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'Nenhuma imagem foi enviada' 
        });
      }

      // Upload todas as imagens em paralelo
      const uploadPromises = req.files.map(async (file) => {
        // Upload para Cloudinary
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'loja-produtos',
              resource_type: 'image',
              transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        // Gerar thumbnail como backup
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(200, 200, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 60 })
          .toBuffer();

        const thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;

        return {
          url: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
          backup: thumbnailBase64
        };
      });

      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        images: results
      });

    } catch (error) {
      console.error('❌ Erro ao fazer upload múltiplo:', error);
      res.status(500).json({ 
        error: 'Erro ao fazer upload das imagens',
        details: error.message 
      });
    }
  }
];

/**
 * Deletar imagem do Cloudinary
 * @route DELETE /api/upload/image/:publicId
 */
exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ 
        error: 'ID público da imagem não fornecido' 
      });
    }

    // Decodificar publicId (pode vir com / encoded como %2F)
    const decodedPublicId = decodeURIComponent(publicId);

    await cloudinary.uploader.destroy(decodedPublicId);

    res.json({
      success: true,
      message: 'Imagem deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar imagem',
      details: error.message 
    });
  }
};
