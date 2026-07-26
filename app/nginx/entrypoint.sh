#!/bin/sh

if [ ! -f /etc/nginx/ssl/server.crt ]; then
    echo "Generating self-signed SSL certificate for IP 192.168.0.5..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/server.key \
        -out /etc/nginx/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=DevServer/CN=192.168.0.5" \
        -addext "subjectAltName=IP:192.168.0.5,DNS:localhost"
    echo "SSL Certificate generated successfully."
fi

exec nginx -g "daemon off;"
