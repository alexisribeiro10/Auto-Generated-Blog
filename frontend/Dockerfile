FROM node:20

WORKDIR /app

# Copiar package.json e package-lock.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar todo o resto do código
COPY . .

# Expõe a porta do React dev server
EXPOSE 3000

# Comando para iniciar o dev server
CMD ["npm", "start"]