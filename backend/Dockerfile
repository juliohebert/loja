# Imagem base do Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Expor porta da aplicação
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]
