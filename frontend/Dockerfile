FROM nginx:alpine

# Copiar archivos estáticos desde el contexto de construcción (raíz del proyecto)
# NOTA: Compose construye desde la raíz del proyecto con context: .
COPY frontend/index.html /usr/share/nginx/html/
COPY frontend/app.js /usr/share/nginx/html/
COPY frontend/styles.css /usr/share/nginx/html/

# Copiar script de generación de configuración
COPY frontend/env.sh /docker-entrypoint.d/40-generate-env.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-generate-env.sh \
	&& chmod +x /docker-entrypoint.d/40-generate-env.sh

EXPOSE 80

# CMD por defecto de nginx (ya está en la imagen base)
CMD ["nginx", "-g", "daemon off;"]
