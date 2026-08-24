FROM nginx:alpine

# Copiar la aplicación estática completa desde el contexto raíz.
COPY frontend/ /usr/share/nginx/html/

# Generar la configuración pública del backend al arrancar el contenedor.
COPY frontend/env.sh /docker-entrypoint.d/40-generate-env.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-generate-env.sh \
	&& chmod +x /docker-entrypoint.d/40-generate-env.sh

EXPOSE 80

# El entrypoint de nginx ejecuta /docker-entrypoint.d/*.sh antes de iniciar nginx.
CMD ["nginx", "-g", "daemon off;"]
