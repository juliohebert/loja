-- Adicionar coluna imagens_backup para backup de segurança das imagens
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS imagens_backup JSON DEFAULT '[]';

-- Comentário da coluna
COMMENT ON COLUMN produtos.imagens_backup IS 'Backup em thumbnail base64 das imagens (segurança caso Cloudinary falhe)';

SELECT 'Coluna imagens_backup adicionada com sucesso!' AS resultado;
