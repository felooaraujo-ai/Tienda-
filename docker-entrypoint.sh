#!/bin/sh
set -e

# Railway inyecta el puerto en $PORT. Si no está, usamos 8080.
: "${PORT:=8080}"

# Apache debe escuchar en ese puerto (por defecto viene en 80).
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Diagnóstico: qué MPM quedó activo (debe haber uno solo: prefork)
echo "=== MPM habilitados ==="
ls -1 /etc/apache2/mods-enabled/ | grep -i mpm || echo "(ninguno)"
echo "======================="
echo "Apache escuchando en el puerto ${PORT}"

exec apache2-foreground
