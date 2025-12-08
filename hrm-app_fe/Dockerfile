FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
# Sử dụng --legacy-peer-deps để tránh conflict @codetrix-studio/capacitor-google-auth vs @capacitor/core
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/www /usr/share/nginx/html
EXPOSE 80


