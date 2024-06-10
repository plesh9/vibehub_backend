FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Генеруємо Prisma моделі
RUN npx prisma generate

# Збираємо проект
RUN npm run build

CMD [ "npm", "run", "start:dev" ]
