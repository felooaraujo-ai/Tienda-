# 🛒 Almacén de Barrio Online - Full Stack PHP + MySQL + Mercado Pago

Aplicación web full stack para un **Almacén de Barrio / Mini Supermercado**, con **venta por peso/fracción** (ej. 0,5 kg de queso, 1,2 kg de fruta) y **cálculo automático de precio** según la cantidad elegida, además de venta por unidad. Incluye catálogo interactivo en tiempo real, carrito responsivo con persistencia local e integración oficial con la API de cobros de **Mercado Pago** (Checkout Pro y Webhooks IPN).

> **Desafío técnico resuelto:** cada producto tiene una `unidad_medida` (`unidad`, `kg` o `litro`). El precio se expresa por esa unidad y las cantidades admiten decimales (`DECIMAL(10,3)`), tanto en el stock como en el detalle de cada orden. Ver la explicación completa en `GUIA.md` (sección 6).

---

## 🛠️ Stack Tecnológico

- **Frontend:** HTML5, CSS3 Nativo (Variables CSS, Glassmorphism, Responsive Grid, Animations) y JavaScript Vanilla (ES Modules, reactive state management).
- **Backend:** PHP 8.x con MySQLi (Orientado a Objetos) para consultas seguras preparadas y comunicación cURL con la API REST de Mercado Pago.
- **Base de Datos:** MySQL (con motor InnoDB, llaves foráneas y transacciones ACID).
- **Pasarela de Pagos:** Mercado Pago API / SDK (Preferencia de Pago, `back_urls`, `auto_return` e IPN Webhook Listener).

---

## 📂 Estructura del Proyecto

```text
Antigravity/
├── config/
│   └── database.php        # Conexión MySQLi a MySQL (Singleton)
├── db/
│   └── schema.sql          # Tablas (productos, ordenes, orden_items) + Seed Data
├── api/
│   ├── get_products.php    # Endpoint REST JSON para consultar productos
│   ├── create_preference.php # Endpoint REST para crear la orden y la preferencia MP
│   └── webhook.php         # Receptor IPN / Webhook para actualizaciones de pago MP
├── public/
│   ├── css/
│   │   └── styles.css      # Sistema de diseño UI/UX (Kiosco Dark Glassmorphism)
│   ├── js/
│   │   ├── api.js          # Módulo Fetch API frontend
│   │   ├── cart.js         # Estado reactivo del carrito de compras (localStorage)
│   │   └── app.js          # Lógica del catálogo, filtros de categoría y checkout
│   ├── success.php         # Vista de retorno: Pago Aprobado
│   ├── pending.php         # Vista de retorno: Pago Pendiente
│   └── failure.php         # Vista de retorno: Pago Fallido / Rechazado
├── index.php               # Portal principal del Kiosco Online
├── env.php                 # Configuración de credenciales DB y Access Token de Mercado Pago
├── .env.example            # Ejemplo de variables de entorno
└── README.md               # Guía de instalación y documentación
```

---

## 🚀 Pasos de Instalación en XAMPP

### 1. Ubicación del Proyecto
Asegúrate de colocar la carpeta del proyecto dentro del directorio de Apache de XAMPP:
```
C:\xampp\htdocs\2026\Antigravity
```

### 2. Importar la Base de Datos en MySQL
1. Inicia **Apache** y **MySQL** desde el Panel de Control de XAMPP.
2. Abre **phpMyAdmin** (`http://localhost/phpmyadmin/`) o tu cliente MySQL (HeidiSQL, DBeaver, MySQL Workbench).
3. Importa o ejecuta el archivo SQL ubicado en:
   `db/schema.sql`
   *Esto creará automáticamente la base de datos `kiosco_online`, sus 4 tablas con llaves foráneas y cargará productos de almacén de ejemplo (por unidad, por kg y por litro).*
   > Si ya tenías la base vieja del Kiosco importada, descomentá y ejecutá una sola vez el bloque **MIGRACIÓN** que está al principio de `db/schema.sql`.

### 3. Configurar Credenciales de Mercado Pago
Abre el archivo `env.php` (o configura tu archivo `.env`) e ingresa tu **Access Token** y **Public Key** de prueba obtenidas desde el [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers/panel/credentials):

```php
define('MP_ACCESS_TOKEN', 'TEST-1234567890123456-072823-abcdef1234567890abcdef1234567890-123456789');
define('MP_PUBLIC_KEY', 'TEST-abcdef12-3456-7890-abcd-ef1234567890');
```

---

## 💻 Proceso de Pruebas y Uso

1. Ingresa desde tu navegador a:
   `http://localhost/2026/Antigravity`
2. **Explora el Catálogo**: Utiliza las pestañas de categorías (Fiambres, Frutas y Verduras, Almacén, Lácteos, Bebidas) o la barra de búsqueda en tiempo real.
3. **Agrega Productos**:
   - *Por unidad*: clic en "🛒 Agregar".
   - *Por peso/volumen (kg o L)*: elegí la cantidad con los botones `−/+` o escribiéndola, mirá el subtotal calcularse en vivo y luego "🛒 Agregar".
4. **Revisá tu Pedido**: Abrí el panel deslizable del carrito. Para productos por peso podés editar la cantidad exacta (ej. `1.2`); para los de unidad, ajustá con `−/+`.
5. **Checkout**: Haz clic en **"Pagar con Mercado Pago"**. Serás redirigido a la pasarela de prueba de Mercado Pago.
6. **Webhook IPN**: Mercado Pago notificará a `api/webhook.php`, el cual actualizará el estado de la orden en MySQL (`approved`, `rejected`) y descontará el stock de los productos.
