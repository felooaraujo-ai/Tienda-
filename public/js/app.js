import { API } from './api.js';
import { Cart, getUnidadConfig, formatCantidad } from './cart.js';

document.addEventListener('DOMContentLoaded', () => {
  // Estado local de la aplicación
  let currentCategory = 'todos';
  let searchQuery = '';
  let products = [];

  // Elementos DOM
  const productsGrid = document.getElementById('products-grid');
  const searchInput = document.getElementById('search-input');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const cartTrigger = document.getElementById('cart-trigger');
  const cartBadge = document.getElementById('cart-badge');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartBody = document.getElementById('cart-body');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const btnCheckout = document.getElementById('btn-checkout-mp');
  const btnClearCart = document.getElementById('btn-clear-cart');
  const toastContainer = document.getElementById('toast-container');

  // Utility: formato de moneda ARS
  function money(value) {
    return `$ ${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Utility: Mostrar notificaciones Toast
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Cargar productos desde el Backend PHP MySQL
  async function loadProducts() {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="margin: 0 auto 1rem auto; width: 32px; height: 32px;"></div>
        <p style="color: var(--text-muted);">Cargando productos del almacén...</p>
      </div>
    `;

    try {
      products = await API.getProducts(currentCategory, searchQuery);
      renderProducts();
    } catch (error) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--danger);">
          <p style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">⚠️ Error al cargar catálogo</p>
          <p style="color: var(--text-muted);">${error.message}</p>
        </div>
      `;
    }
  }

  // Renderizar la grilla de productos
  function renderProducts() {
    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <p style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</p>
          <p style="font-size: 1.1rem; font-weight: 600;">No se encontraron productos</p>
          <p style="font-size: 0.9rem;">Prueba cambiando de categoría o término de búsqueda.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = products.map(prod => {
      const unidad = prod.unidad_medida || 'unidad';
      const cfg = getUnidadConfig(unidad);
      const esPorPeso = unidad !== 'unidad';
      const agotado = prod.stock <= 0;

      // Sufijo de precio: "/ kg", "/ L" o "c/u"
      const precioSufijo = esPorPeso ? `<span class="price-unit">/ ${cfg.label}</span>` : '';

      // Control de agregado: para peso, selector de cantidad con subtotal en vivo
      let control;
      if (agotado) {
        control = `<button class="add-to-cart-btn" disabled>Agotado</button>`;
      } else if (esPorPeso) {
        control = `
          <div class="weight-control" data-id="${prod.id}">
            <div class="weight-input-row">
              <button class="weight-step" data-id="${prod.id}" data-dir="-1" aria-label="Quitar">−</button>
              <input type="number" class="weight-input" data-id="${prod.id}"
                     value="${cfg.inicial}" min="${cfg.paso}" step="${cfg.paso}" max="${prod.stock}"
                     inputmode="decimal" aria-label="Cantidad en ${cfg.label}">
              <span class="weight-unit">${cfg.label}</span>
              <button class="weight-step" data-id="${prod.id}" data-dir="1" aria-label="Agregar">+</button>
            </div>
            <div class="weight-subtotal" data-id="${prod.id}">= ${money(prod.precio * cfg.inicial)}</div>
            <button class="add-to-cart-btn add-weight-btn" data-id="${prod.id}">🛒 Agregar</button>
          </div>
        `;
      } else {
        control = `<button class="add-to-cart-btn add-unit-btn" data-id="${prod.id}">🛒 Agregar</button>`;
      }

      return `
      <article class="product-card ${esPorPeso ? 'is-weight' : ''}" data-id="${prod.id}">
        ${prod.destacado ? `<span class="card-badge-featured">⭐ Destacado</span>` : ''}
        ${esPorPeso ? `<span class="card-badge-weight">⚖️ Por ${cfg.label}</span>` : ''}
        <div class="product-image-container">
          <img src="${prod.imagen_url}" alt="${prod.nombre}" class="product-image" loading="lazy" onError="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'">
        </div>
        <div class="product-info">
          <span class="product-category">${prod.categoria}</span>
          <h3 class="product-title">${prod.nombre}</h3>
          <p class="product-description">${prod.descripcion || ''}</p>
          <div class="product-price-row">
            <span class="product-price">${money(prod.precio)} ${precioSufijo}</span>
          </div>
          <div class="product-footer">
            ${control}
          </div>
        </div>
      </article>
      `;
    }).join('');

    attachProductListeners();
  }

  function attachProductListeners() {
    // Botón agregar (producto por unidad)
    document.querySelectorAll('.add-unit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = parseInt(e.currentTarget.dataset.id, 10);
        const targetProduct = products.find(p => p.id === prodId);
        if (!targetProduct) return;
        try {
          Cart.addItem(targetProduct);
          showToast(`¡"${targetProduct.nombre}" agregado al carrito!`, 'success');
        } catch (err) {
          showToast(err.message, 'warning');
        }
      });
    });

    // Botones +/- del selector de peso en la tarjeta
    document.querySelectorAll('.weight-step').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = parseInt(e.currentTarget.dataset.id, 10);
        const dir = parseInt(e.currentTarget.dataset.dir, 10);
        const targetProduct = products.find(p => p.id === prodId);
        if (!targetProduct) return;
        const cfg = getUnidadConfig(targetProduct.unidad_medida);
        const input = document.querySelector(`.weight-input[data-id="${prodId}"]`);
        let val = parseFloat(input.value) || 0;
        val = Math.max(cfg.paso, Math.round((val + dir * cfg.paso) * 1000) / 1000);
        if (val > targetProduct.stock) val = targetProduct.stock;
        input.value = parseFloat(val.toFixed(3));
        updateCardSubtotal(prodId);
      });
    });

    // Input de peso: actualizar subtotal en vivo
    document.querySelectorAll('.weight-input').forEach(input => {
      input.addEventListener('input', (e) => {
        updateCardSubtotal(parseInt(e.currentTarget.dataset.id, 10));
      });
    });

    // Botón agregar (producto por peso) con la cantidad elegida
    document.querySelectorAll('.add-weight-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = parseInt(e.currentTarget.dataset.id, 10);
        const targetProduct = products.find(p => p.id === prodId);
        if (!targetProduct) return;
        const input = document.querySelector(`.weight-input[data-id="${prodId}"]`);
        const amount = parseFloat(input.value);
        if (isNaN(amount) || amount <= 0) {
          showToast('Ingresá una cantidad válida.', 'warning');
          return;
        }
        try {
          Cart.addItem(targetProduct, amount);
          const cfg = getUnidadConfig(targetProduct.unidad_medida);
          showToast(`¡${formatCantidad(amount, targetProduct.unidad_medida)} de "${targetProduct.nombre}" agregado!`, 'success');
        } catch (err) {
          showToast(err.message, 'warning');
        }
      });
    });
  }

  // Recalcula el subtotal mostrado en la tarjeta de un producto por peso
  function updateCardSubtotal(prodId) {
    const targetProduct = products.find(p => p.id === prodId);
    if (!targetProduct) return;
    const input = document.querySelector(`.weight-input[data-id="${prodId}"]`);
    const sub = document.querySelector(`.weight-subtotal[data-id="${prodId}"]`);
    const amount = parseFloat(input.value) || 0;
    if (sub) sub.textContent = `= ${money(targetProduct.precio * amount)}`;
  }

  // Toggle del Drawer de Carrito
  function toggleCart(open = true) {
    if (open) {
      cartOverlay.classList.add('open');
      cartDrawer.classList.add('open');
    } else {
      cartOverlay.classList.remove('open');
      cartDrawer.classList.remove('open');
    }
  }

  cartTrigger.addEventListener('click', () => toggleCart(true));
  cartCloseBtn.addEventListener('click', () => toggleCart(false));
  cartOverlay.addEventListener('click', () => toggleCart(false));

  // Renderizar el contenido del carrito en tiempo real
  function renderCart(items, total, count) {
    cartBadge.textContent = count;

    if (items.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <p style="font-weight: 600; font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.25rem;">Tu carrito está vacío</p>
          <p style="font-size: 0.9rem;">Agregá productos del almacén para comenzar.</p>
        </div>
      `;
      cartTotalPrice.textContent = '$ 0,00';
      btnCheckout.disabled = true;
      if (btnClearCart) btnClearCart.style.display = 'none';
      return;
    }

    if (btnClearCart) btnClearCart.style.display = 'block';
    btnCheckout.disabled = false;
    cartTotalPrice.textContent = money(total);

    cartBody.innerHTML = items.map(item => {
      const unidad = item.unidad_medida || 'unidad';
      const cfg = getUnidadConfig(unidad);
      const esPorPeso = unidad !== 'unidad';
      const lineSubtotal = Math.round((item.precio * item.quantity) * 100) / 100;

      // Control de cantidad: input editable para peso, contador entero para unidad
      const cantidadControl = esPorPeso
        ? `
          <div class="cart-item-controls">
            <button class="qty-btn btn-minus" data-id="${item.id}">−</button>
            <input type="number" class="qty-input" data-id="${item.id}"
                   value="${parseFloat(item.quantity.toFixed(3))}" min="${cfg.paso}" step="${cfg.paso}"
                   inputmode="decimal" aria-label="Cantidad en ${cfg.label}">
            <span class="qty-unit">${cfg.label}</span>
            <button class="qty-btn btn-plus" data-id="${item.id}">+</button>
          </div>
        `
        : `
          <div class="cart-item-controls">
            <button class="qty-btn btn-minus" data-id="${item.id}">−</button>
            <span class="qty-value">${Math.round(item.quantity)} ${cfg.label}</span>
            <button class="qty-btn btn-plus" data-id="${item.id}">+</button>
          </div>
        `;

      return `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.imagen_url}" alt="${item.nombre}" class="cart-item-img">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.nombre}</h4>
          <span class="cart-item-price">${money(item.precio)} / ${cfg.label} · <strong>${money(lineSubtotal)}</strong></span>
          ${cantidadControl}
        </div>
        <button class="remove-item-btn" data-id="${item.id}" title="Quitar producto">🗑️</button>
      </div>
      `;
    }).join('');

    // Listeners de control de cantidad e items
    cartBody.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        try {
          Cart.updateQuantity(id, -1);
        } catch (err) {
          showToast(err.message, 'warning');
        }
      });
    });

    cartBody.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        try {
          Cart.updateQuantity(id, 1);
        } catch (err) {
          showToast(err.message, 'warning');
        }
      });
    });

    // Input editable de peso dentro del carrito
    cartBody.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        try {
          Cart.setQuantity(id, e.currentTarget.value);
        } catch (err) {
          showToast(err.message, 'warning');
        }
      });
    });

    cartBody.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        Cart.removeItem(id);
      });
    });
  }

  // Suscribir rendering de carrito a cambios de estado
  Cart.subscribe(renderCart);
  // Carga inicial de carrito
  renderCart(Cart.getItems(), Cart.getTotal(), Cart.getItemCount());

  // Limpiar Carrito
  if (btnClearCart) {
    btnClearCart.addEventListener('click', () => {
      if (confirm('¿Deseas vaciar todos los productos del carrito?')) {
        Cart.clearCart();
      }
    });
  }

  // Evento Checkout Mercado Pago
  btnCheckout.addEventListener('click', async () => {
    const items = Cart.getItems();
    if (items.length === 0) return;

    btnCheckout.disabled = true;
    const originalText = btnCheckout.innerHTML;
    btnCheckout.innerHTML = `
      <div class="spinner"></div>
      <span>Generando Pago...</span>
    `;

    try {
      const response = await API.createCheckoutPreference(items);
      showToast('¡Redirigiendo a Mercado Pago!', 'success');

      // Usar siempre init_point oficial (Mercado Pago maneja el modo Prueba o Producción según el Access Token)
      const redirectUrl = response.init_point || response.sandbox_init_point;

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800);

    } catch (error) {
      showToast(error.message || 'Error al conectar con la pasarela de pago.', 'danger');
      btnCheckout.disabled = false;
      btnCheckout.innerHTML = originalText;
    }
  });

  // Filtros de Categorías
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentCategory = e.currentTarget.dataset.category;
      loadProducts();
    });
  });

  // Buscador con debounce
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadProducts();
    }, 350);
  });

  // Inicializar productos
  loadProducts();
});
