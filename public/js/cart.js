/**
 * Módulo del Carrito de Compras en tiempo real con almacenamiento local (localStorage)
 * Soporta venta por UNIDAD y por PESO/VOLUMEN (kg / litro) con cantidades fraccionarias.
 */
const STORAGE_KEY = 'almacen_online_cart_v2';

// Configuración por unidad de medida: cantidad inicial al agregar y paso de los botones +/-
export const UNIDAD_CONFIG = {
  unidad: { label: 'u.', nombre: 'unidad', paso: 1, inicial: 1, decimales: 0 },
  kg:     { label: 'kg', nombre: 'kilo',   paso: 0.25, inicial: 0.5, decimales: 3 },
  litro:  { label: 'L',  nombre: 'litro',  paso: 0.25, inicial: 0.5, decimales: 3 }
};

export function getUnidadConfig(unidad) {
  return UNIDAD_CONFIG[unidad] || UNIDAD_CONFIG.unidad;
}

// Formatea una cantidad según su unidad de medida (ej. "1,2 kg" o "3 u.")
export function formatCantidad(cantidad, unidad) {
  const cfg = getUnidadConfig(unidad);
  if (unidad === 'unidad') {
    return `${Math.round(cantidad)} ${cfg.label}`;
  }
  // Mostrar hasta 3 decimales sin ceros sobrantes (1,200 -> 1,2)
  const num = parseFloat(cantidad.toFixed(3));
  return `${num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${cfg.label}`;
}

// Redondea una cantidad de peso a 3 decimales de forma segura
function roundQty(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

class CartStore {
  constructor() {
    this.items = this.loadFromStorage();
    this.listeners = [];
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error al cargar carrito desde localStorage:', e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error al guardar carrito en localStorage:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.saveToStorage();
    this.listeners.forEach(fn => fn(this.getItems(), this.getTotal(), this.getItemCount()));
  }

  getItems() {
    return [...this.items];
  }

  /**
   * Agrega un producto al carrito.
   * @param {Object} product producto con unidad_medida
   * @param {number|null} amount cantidad a agregar (por defecto la inicial de su unidad)
   */
  addItem(product, amount = null) {
    const unidad = product.unidad_medida || 'unidad';
    const cfg = getUnidadConfig(unidad);
    const stock = parseFloat(product.stock);
    let add = amount !== null ? parseFloat(amount) : cfg.inicial;

    if (unidad === 'unidad') {
      add = Math.max(1, Math.round(add));
    } else {
      add = roundQty(add);
      if (add <= 0) add = cfg.inicial;
    }

    const existingIndex = this.items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      const nuevaCantidad = unidad === 'unidad'
        ? this.items[existingIndex].quantity + add
        : roundQty(this.items[existingIndex].quantity + add);

      if (nuevaCantidad > stock + 1e-9) {
        throw new Error(`Stock máximo disponible: ${formatCantidad(stock, unidad)}.`);
      }
      this.items[existingIndex].quantity = nuevaCantidad;
    } else {
      if (stock < (unidad === 'unidad' ? 1 : 0.001)) {
        throw new Error('Producto sin stock disponible.');
      }
      if (add > stock + 1e-9) {
        throw new Error(`Stock máximo disponible: ${formatCantidad(stock, unidad)}.`);
      }
      this.items.push({
        id: product.id,
        nombre: product.nombre,
        precio: parseFloat(product.precio),
        unidad_medida: unidad,
        imagen_url: product.imagen_url,
        stock: stock,
        quantity: add
      });
    }

    this.notify();
  }

  /**
   * Incrementa o decrementa la cantidad según el paso de la unidad de medida.
   * @param {number} productId
   * @param {number} direction -1 o +1 (se multiplica por el paso de la unidad)
   */
  updateQuantity(productId, direction) {
    const index = this.items.findIndex(item => item.id === productId);
    if (index === -1) return;

    const item = this.items[index];
    const cfg = getUnidadConfig(item.unidad_medida);
    const delta = direction * cfg.paso;
    let newQty = item.unidad_medida === 'unidad'
      ? item.quantity + delta
      : roundQty(item.quantity + delta);

    if (newQty <= 0) {
      this.removeItem(productId);
      return;
    }

    if (newQty > item.stock + 1e-9) {
      throw new Error(`Solo hay ${formatCantidad(item.stock, item.unidad_medida)} disponibles.`);
    }

    item.quantity = newQty;
    this.notify();
  }

  /**
   * Fija una cantidad exacta (usado por el input de peso en el carrito).
   * @param {number} productId
   * @param {number} value cantidad exacta (en la unidad del producto)
   */
  setQuantity(productId, value) {
    const index = this.items.findIndex(item => item.id === productId);
    if (index === -1) return;

    const item = this.items[index];
    let qty = parseFloat(value);

    if (isNaN(qty) || qty <= 0) {
      this.removeItem(productId);
      return;
    }

    qty = item.unidad_medida === 'unidad' ? Math.round(qty) : roundQty(qty);

    if (qty > item.stock + 1e-9) {
      qty = item.unidad_medida === 'unidad' ? Math.floor(item.stock) : roundQty(item.stock);
      this.items[index].quantity = qty;
      this.notify();
      throw new Error(`Ajustado al stock disponible: ${formatCantidad(qty, item.unidad_medida)}.`);
    }

    item.quantity = qty;
    this.notify();
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.notify();
  }

  clearCart() {
    this.items = [];
    this.notify();
  }

  // Subtotal de una línea, redondeado a 2 decimales
  getLineSubtotal(item) {
    return Math.round((item.precio * item.quantity + Number.EPSILON) * 100) / 100;
  }

  getTotal() {
    return this.items.reduce((total, item) => total + this.getLineSubtotal(item), 0);
  }

  // Cantidad de líneas distintas en el carrito (para el badge)
  getItemCount() {
    return this.items.length;
  }
}

export const Cart = new CartStore();
