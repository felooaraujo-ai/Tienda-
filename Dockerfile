# Imagen PHP con Apache ya incluido
FROM php:8.2-apache

# Extensiones necesarias: mysqli (DB). cURL ya viene incluido en la imagen.
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# Copiar todo el proyecto al document root de Apache
COPY . /var/www/html/

# Permisos (necesario para que el webhook pueda escribir api/webhook.log)
RUN chown -R www-data:www-data /var/www/html

# Script de arranque que hace que Apache escuche en $PORT (Railway)
COPY docker-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod +x /usr/local/bin/railway-entrypoint.sh

# Railway enruta a este puerto por defecto si no inyecta $PORT
EXPOSE 8080

CMD ["/usr/local/bin/railway-entrypoint.sh"]
