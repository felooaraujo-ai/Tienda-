# 🚂 Desplegar en Railway (para que funcione Mercado Pago de verdad)

El objetivo de subirlo a Railway es tener una **URL pública con HTTPS**, que es lo que
Mercado Pago necesita para:
- redirigir de vuelta al sitio después del pago (`back_urls` + `auto_return`), y
- enviar el **webhook / IPN** que actualiza la orden a `approved` y descuenta stock.

El proyecto ya está listo: `env.php` lee las credenciales desde **variables de entorno**
(`$_ENV / $_SERVER / getenv`), así que en Railway **no hace falta Composer ni archivo `.env`**.
Incluye un `Dockerfile` (PHP 8.2 + Apache + mysqli que escucha en `$PORT`).

---

## 1. Crear el proyecto y la base

1. En Railway, **New Project → Deploy from GitHub repo** (subí antes este código a un repo tuyo)
   o **Deploy from Dockerfile**. Railway detecta el `Dockerfile` automáticamente.
2. En el mismo proyecto: **New → Database → Add MySQL**.

## 2. Variables del servicio web

En el servicio de la app (no en el de MySQL) → pestaña **Variables**, cargá:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASS=${{MySQL.MYSQLPASSWORD}}
DB_NAME=kiosco_online
MP_ACCESS_TOKEN=APP_USR-...   (TU Access Token de Mercado Pago)
MP_PUBLIC_KEY=APP_USR-...     (TU Public Key)
BASE_URL=https://TU-APP.up.railway.app
```

- `DB_HOST/PORT/USER/PASS` usan **referencias** al servicio MySQL (la red interna de Railway).
- `DB_NAME` va fijo en `kiosco_online` porque el `schema.sql` crea esa base.
  (Alternativa: usar `${{MySQL.MYSQLDATABASE}}` —que vale `railway`— y borrar del `schema.sql`
  las líneas `CREATE DATABASE...` y `USE...`.)
- `BASE_URL`: generá el dominio en **Settings → Networking → Generate Domain** y pegá esa URL
  exacta (con `https://`). **Es la pieza clave para que Mercado Pago funcione.**

## 3. Importar las tablas

Desde tu PC, con el cliente `mysql`, usando la conexión **pública** de Railway
(MySQL → **Connect → Public Network**, de ahí salen host, puerto y pass):

```
mysql -h <PROXY_HOST> -P <PROXY_PORT> -u root -p<PASSWORD> < db/schema.sql
```

(O pegá el contenido de `db/schema.sql` en cualquier cliente MySQL conectado a esa base.)

## 4. Probar

- Tienda:  `https://TU-APP.up.railway.app/index.php`
- Admin:   `https://TU-APP.up.railway.app/admin/index.php`  (admin / admin123)
- Webhook: `https://TU-APP.up.railway.app/api/webhook.php`  → debe devolver `{"status":"ok"}`

Al estar en HTTPS público, `create_preference.php` arma solo el `notification_url`
apuntando a tu `webhook.php` y activa `auto_return`. No hay que tocar nada más en el código.

### Probar un pago
Con credenciales **de prueba (TEST-...)** usá las tarjetas de test de Mercado Pago
(https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards).
Cuando el pago se aprueba, Mercado Pago llama al webhook y vas a ver la orden como
`approved` en el panel admin (pestaña Historial de Órdenes), con el stock descontado.

---

## ⚠️ Seguridad: token hardcodeado

El `env.php` trae un `MP_ACCESS_TOKEN` de ejemplo escrito en el código como valor por defecto.
**Definí siempre tu propia variable `MP_ACCESS_TOKEN` en Railway** para que ese valor por
defecto no se use nunca, y revisá/eliminá ese token del `env.php` antes de subir el repo
(sobre todo si el repositorio es público). Nunca subas tus credenciales reales al código.
