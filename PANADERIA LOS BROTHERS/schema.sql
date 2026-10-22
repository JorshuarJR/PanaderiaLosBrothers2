-- Panadería Los Brothers: esquema para MySQL en Railway.
-- Selecciona primero la base de datos correcta en Railway/phpMyAdmin y ejecuta este archivo UNA SOLA VEZ.
-- No contiene credenciales ni crea una base de datos con nombre fijo.

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  imagen VARCHAR(255),
  activo TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  direccion VARCHAR(255),
  entrega VARCHAR(50) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  productos JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notas TEXT,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pedidos_fecha (fecha),
  INDEX idx_pedidos_usuario (usuario_id),
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Productos iniciales. Importa este archivo solo una vez para no duplicarlos.
INSERT INTO productos
(
    nombre,
    categoria,
    descripcion,
    precio,
    imagen
)
VALUES

(
    'Croissant',
    'Panadería',
    'Croissant fresco y delicioso.',
    2500,
    'WhatsApp Image 2026-09-30 at 12.06.23 PM.jpeg'
),

(
    'Churros',
    'Panadería',
    'Churros para disfrutar en cualquier momento.',
    2500,
    'WhatsApp Image 2026-09-30 at 12.11.02 PM.jpeg'
),

(
    'Pan blandito',
    'Panadería',
    'Pan suave y recién preparado.',
    1500,
    'WhatsApp Image 2026-09-30 at 12.19.58 PM.jpeg'
),

(
    'Pan de queso',
    'Panadería',
    'Pan de queso recién horneado.',
    2000,
    'WhatsApp Image 2026-09-30 at 12.23.03 PM.jpeg'
),

(
    'Muffin',
    'Panadería',
    'Muffin suave para acompañar tu bebida.',
    2500,
    'WhatsApp Image 2026-09-30 at 12.23.04 PM.jpeg'
),

(
    'Croissants',
    'Panadería',
    'Deliciosos croissants para compartir.',
    2500,
    'WhatsApp Image 2026-09-30 at 12.31.18 PM.jpeg'
),

(
    'Buñuelo',
    'Panadería',
    'Buñuelo recién preparado.',
    1000,
    'WhatsApp Image 2026-09-30 at 12.33.14 PM.jpeg'
),

(
    'Brownie con chispas',
    'Repostería',
    'Brownie de chocolate con chispas de colores.',
    3500,
    'WhatsApp Image 2026-09-30 at 12.19.58 PM (1).jpeg'
),

(
    'Mantecada con chocolate',
    'Repostería',
    'Mantecada con chispas de chocolate.',
    3500,
    'WhatsApp Image 2026-09-30 at 12.19.58 PM (2).jpeg'
),

(
    'Galletas de chocolate',
    'Repostería',
    'Galletas con chispas de chocolate.',
    2500,
    'WhatsApp Image 2026-09-30 at 12.47.49 PM.jpeg'
),

(
    'Papas de tomate',
    'Snacks',
    'Papas sabor tomate.',
    2300,
    'WhatsApp Image 2026-09-30 at 1.01.36 PM.jpeg'
),

(
    'Tostacos',
    'Snacks',
    'Tostacos crujientes para el antojo.',
    2200,
    'WhatsApp Image 2026-09-30 at 1.01.37 PM.jpeg'
),

(
    'Papas BBQ',
    'Snacks',
    'Papas con delicioso sabor BBQ.',
    2300,
    'WhatsApp Image 2026-09-30 at 1.01.38 PM.jpeg'
),

(
    'Papas Margarita',
    'Snacks',
    'Papas Margarita para disfrutar.',
    2500,
    'WhatsApp Image 2026-09-30 at 1.01.42 PM.jpeg'
),

(
    'Café americano',
    'Cafetería',
    'Café americano servido en vaso.',
    2000,
    'WhatsApp Image 2026-09-30 at 12.26.39 PM (1).jpeg'
),

(
    'Tinto',
    'Cafetería',
    'Tinto colombiano servido en vaso.',
    1200,
    'WhatsApp Image 2026-09-30 at 12.26.39 PM.jpeg'
),

(
    'Aromática',
    'Cafetería',
    'Aromática caliente servida en taza.',
    1500,
    'WhatsApp Image 2026-09-30 at 12.28.18 PM.jpeg'
),

(
    'Pony Malta',
    'Bebidas',
    'Bebida de malta fría.',
    2000,
    'WhatsApp Image 2026-09-30 at 12.36.48 PM.jpeg'
),

(
    'Quatro',
    'Bebidas',
    'Gaseosa Quatro.',
    2500,
    'WhatsApp Image 2026-09-30 at 12.38.06 PM.jpeg'
),

(
    'Coca-Cola',
    'Bebidas',
    'Coca-Cola fría.',
    3000,
    'WhatsApp Image 2026-09-30 at 12.40.15 PM.jpeg'
),

(
    'Agua Cielo',
    'Bebidas',
    'Agua embotellada Cielo.',
    2000,
    'WhatsApp Image 2026-09-30 at 12.43.49 PM.jpeg'
),

(
    'Big Cola Piña',
    'Bebidas',
    'Gaseosa Big Cola sabor piña.',
    2500,
    'WhatsApp Image 2026-09-30 at 12.47.04 PM (1).jpeg'
),

(
    'Electrolit',
    'Bebidas',
    'Bebida hidratante Electrolit.',
    6000,
    'WhatsApp Image 2026-09-30 at 12.47.04 PM.jpeg'
),

(
    'Jugo Hit Mango',
    'Bebidas',
    'Jugo Hit sabor mango.',
    3000,
    'WhatsApp Image 2026-09-30 at 12.47.23 PM.jpeg'
),

(
    'Jugo Hit Mango',
    'Bebidas',
    'Jugo Hit mango en otra presentación.',
    3000,
    'WhatsApp Image 2026-09-30 at 12.51.49 PM (1).jpeg'
),

(
    'Monster Juice',
    'Bebidas',
    'Bebida Monster Juice.',
    8000,
    'WhatsApp Image 2026-09-30 at 12.51.49 PM (2).jpeg'
),

(
    'Speed Max Energy',
    'Bebidas',
    'Bebida energética Speed Max.',
    4000,
    'WhatsApp Image 2026-09-30 at 12.51.49 PM.jpeg'
),

(
    'Gomitas Trululú Nanos',
    'Dulces',
    'Gomitas Trululú con Nanos.',
    3000,
    'WhatsApp Image 2026-09-30 at 12.57.10 PM.jpeg'
);
