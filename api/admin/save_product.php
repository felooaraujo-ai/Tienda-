<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/auth.php';

// Exigir autenticación de administrador
requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $id = (int)($data['id'] ?? 0);
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $precio = (float)($data['precio'] ?? 0);
    $unidadMedida = strtolower(trim($data['unidad_medida'] ?? 'unidad'));
    if (!in_array($unidadMedida, ['unidad', 'kg', 'litro'], true)) {
        $unidadMedida = 'unidad';
    }
    $categoria = strtolower(trim($data['categoria'] ?? 'almacen'));
    $imagenUrl = trim($data['imagen_url'] ?? '');
    // El stock admite decimales (ej. 12.5 kg). Para 'unidad' se normaliza a entero.
    $stock = (float)($data['stock'] ?? 0);
    if ($unidadMedida === 'unidad') {
        $stock = (float)(int)round($stock);
    } else {
        $stock = round($stock, 3);
    }
    $destacado = !empty($data['destacado']) ? 1 : 0;

    if (empty($nombre)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'El nombre del producto es obligatorio.']);
        exit;
    }

    if ($precio <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'El precio debe ser mayor a $0.']);
        exit;
    }

    if (empty($imagenUrl)) {
        $imagenUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
    }

    $db = Database::getConnection();

    if ($id > 0) {
        // Actualizar producto existente
        $stmt = $db->prepare("
            UPDATE productos
            SET nombre = ?,
                descripcion = ?,
                precio = ?,
                unidad_medida = ?,
                categoria = ?,
                imagen_url = ?,
                stock = ?,
                destacado = ?
            WHERE id = ?
        ");
        $stmt->bind_param("ssdsssdii", $nombre, $descripcion, $precio, $unidadMedida, $categoria, $imagenUrl, $stock, $destacado, $id);
        $stmt->execute();

        echo json_encode([
            'status' => 'success',
            'message' => "¡Producto '{$nombre}' actualizado correctamente!",
            'product_id' => $id
        ]);
    } else {
        // Insertar nuevo producto
        $stmt = $db->prepare("
            INSERT INTO productos (nombre, descripcion, precio, unidad_medida, categoria, imagen_url, stock, destacado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("ssdsssdi", $nombre, $descripcion, $precio, $unidadMedida, $categoria, $imagenUrl, $stock, $destacado);
        $stmt->execute();

        $newId = (int)$db->insert_id;

        echo json_encode([
            'status' => 'success',
            'message' => "¡Nuevo producto '{$nombre}' creado correctamente!",
            'product_id' => $newId
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error al guardar producto (MySQLi): ' . $e->getMessage()
    ]);
}
