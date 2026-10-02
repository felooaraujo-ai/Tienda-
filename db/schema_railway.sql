-- =======================================================
-- Esquema para Railway (base por defecto: `railway`)
-- Pegá todo esto en MySQL -> Data y ejecutá (Run).
-- No incluye CREATE DATABASE / USE: usa la base ya existente.
-- =======================================================

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `precio` DECIMAL(10, 2) NOT NULL,
  `unidad_medida` ENUM('unidad', 'kg', 'litro') NOT NULL DEFAULT 'unidad',
  `categoria` VARCHAR(50) NOT NULL,
  `imagen_url` VARCHAR(500) NULL,
  `stock` DECIMAL(10, 3) NOT NULL DEFAULT 0,
  `destacado` TINYINT(1) DEFAULT 0,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ordenes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `external_reference` VARCHAR(64) NOT NULL UNIQUE,
  `monto_total` DECIMAL(10, 2) NOT NULL,
  `estado` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `mp_payment_id` VARCHAR(100) NULL,
  `mp_merchant_order_id` VARCHAR(100) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orden_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orden_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `cantidad` DECIMAL(10, 3) NOT NULL,
  `unidad_medida` ENUM('unidad', 'kg', 'litro') NOT NULL DEFAULT 'unidad',
  `precio_unitario` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`orden_id`) REFERENCES `ordenes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`username`, `password_hash`, `nombre`) VALUES
('admin', '$2y$10$K9W4r.2aA8zK5uH6hQ2S1.oT.2L6/S.q8u8V4W6z9y7eO.e1eK3K6', 'Administrador Almacén')
ON DUPLICATE KEY UPDATE `username`=`username`;

INSERT INTO `productos` (`nombre`, `descripcion`, `precio`, `unidad_medida`, `categoria`, `imagen_url`, `stock`, `destacado`) VALUES
('Queso Cremoso', 'Queso cremoso fresco de primera calidad. Precio por kilo, se corta a la fracción que pidas.', 9800.00, 'kg', 'fiambres', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&q=80', 12.500, 1),
('Jamón Cocido', 'Jamón cocido natural feteado al momento. Precio por kilo.', 12500.00, 'kg', 'fiambres', 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&q=80', 8.000, 1),
('Salame Milán', 'Salame tipo Milán estacionado. Precio por kilo.', 15800.00, 'kg', 'fiambres', 'https://images.unsplash.com/photo-1612871689353-cccf581d667b?w=500&q=80', 6.300, 0),
('Banana', 'Banana ecuatoriana madura. Precio por kilo.', 1900.00, 'kg', 'frutas-verduras', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80', 40.000, 1),
('Tomate Redondo', 'Tomate redondo para ensalada. Precio por kilo.', 2400.00, 'kg', 'frutas-verduras', 'https://images.unsplash.com/photo-1546470427-f5b2a3b2c3c6?w=500&q=80', 25.000, 0),
('Papa Blanca', 'Papa blanca lavada. Precio por kilo.', 1200.00, 'kg', 'frutas-verduras', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80', 60.000, 0),
('Fideos Tirabuzón 500g', 'Fideos secos tipo tirabuzón, paquete de 500g.', 1600.00, 'unidad', 'almacen', 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=500&q=80', 50, 1),
('Arroz Largo Fino 1kg', 'Arroz largo fino, paquete de 1kg.', 2100.00, 'unidad', 'almacen', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80', 45, 0),
('Yerba Mate 1kg', 'Yerba mate elaborada con palo, paquete de 1kg.', 4200.00, 'unidad', 'almacen', 'https://images.unsplash.com/photo-1609252509102-aa73ff792667?w=500&q=80', 30, 1),
('Azúcar a Granel', 'Azúcar común tipo A, se vende suelta por peso. Precio por kilo.', 1500.00, 'kg', 'almacen', 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&q=80', 35.000, 0),
('Gaseosa Cola 2.25L', 'Gaseosa sabor cola, botella de 2.25 litros.', 3200.00, 'unidad', 'bebidas', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', 48, 1),
('Agua Mineral sin Gas 2L', 'Agua mineral sin gas, botella de 2 litros.', 1500.00, 'unidad', 'bebidas', 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&q=80', 60, 0),
('Vino Tinto Suelto', 'Vino tinto de mesa fraccionado. Precio por litro.', 2800.00, 'litro', 'bebidas', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=80', 20.000, 0),
('Leche Entera 1L', 'Leche entera larga vida, sachet de 1 litro.', 1400.00, 'unidad', 'lacteos', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', 55, 1),
('Dulce de Leche 400g', 'Dulce de leche clásico, pote de 400g.', 2600.00, 'unidad', 'lacteos', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&q=80', 28, 0)
ON DUPLICATE KEY UPDATE `nombre`=`nombre`;
