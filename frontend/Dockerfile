FROM nginx:alpine

# Copiar archivos estáticos
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/

# Copiar script de generación de configuración
COPY env.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh

EXPOSE 80

# CMD por defecto de nginx (ya está en la imagen base)
CMD ["nginx", "-g", "daemon off;"]
