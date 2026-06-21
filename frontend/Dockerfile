FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf

COPY <<'NGINXCONF' /etc/nginx/conf.d/default.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://fakelingo-backend:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
NGINXCONF

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
