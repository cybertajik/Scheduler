FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { listen 80; server_name localhost; add_header X-Frame-Options "SAMEORIGIN" always; add_header X-XSS-Protection "1; mode=block" always; add_header X-Content-Type-Options "nosniff" always; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } location ~* \.(?:css|js|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2)$ { root /usr/share/nginx/html; expires 1y; add_header Cache-Control "public, max-age=31536000, immutable"; } location /api/ { proxy_pass http://backend:8000/api/; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; } location /health { access_log off; return 200 "OK\n"; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
