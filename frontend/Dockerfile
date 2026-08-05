FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY env.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh
EXPOSE 80
