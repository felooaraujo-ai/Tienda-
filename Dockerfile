# Imagen PHP con Apache ya incluido
FROM php:8.2-apache

# Extensiones necesarias: mysqli (DB). cURL ya viene incluido en la imagen.
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# Copiar todo el proyecto al document root de Apache
COPY . /var/www/html/

# Permisos (necesario para que el webhook pueda escribir api/webhook.log)
RUN chown -R www-data:www-data /var/www/html

# Railway inyecta el puerto en la variable $PORT. Apache debe escuchar ahí.
# Reescribimos el puerto al arrancar el contenedor.
CMD ["sh", "-c", "sed -i \"s/Listen 80/Listen ${PORT:-8080}/\" /etc/apache2/ports.conf && sed -i \"s/:80>/:${PORT:-8080}>/\" /etc/apache2/sites-available/000-default.conf && apache2-foreground"]
