// ─────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

// ─────────────────────────────────────────────────
//  AUTH HELPERS
// ─────────────────────────────────────────────────
const Auth = {
  getToken() { return localStorage.getItem('ge_token'); },
  getUser() {
    const u = localStorage.getItem('ge_user');
    return u ? JSON.parse(u) : null;
  },
  setSession(token, user) {
    localStorage.setItem('ge_token', token);
    localStorage.setItem('ge_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('ge_token');
    localStorage.removeItem('ge_user');
  },
  isLoggedIn() { return !!this.getToken(); }
};

// ─────────────────────────────────────────────────
//  API HELPERS
// ─────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// ─────────────────────────────────────────────────
//  CART HELPERS
// ─────────────────────────────────────────────────
const Cart = {
  get() {
    const c = localStorage.getItem('ge_cart');
    return c ? JSON.parse(c) : [];
  },
  save(cart) {
    localStorage.setItem('ge_cart', JSON.stringify(cart));
    this.updateBadge();
  },
  add(product, qty = 1) {
    const cart = this.get();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, product.stock || 99);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity: qty
      });
    }
    this.save(cart);
    showToast(`"${product.name}" added to cart`, 'success', '🛍️');
  },
  remove(productId) {
    const cart = this.get().filter(i => i.id !== productId);
    this.save(cart);
  },
  updateQty(productId, qty) {
    const cart = this.get();
    const item = cart.find(i => i.id === productId);
    if (item) {
      if (qty <= 0) return this.remove(productId);
      item.quantity = qty;
      this.save(cart);
    }
  },
  clear() { this.save([]); },
  count() { return this.get().reduce((s, i) => s + i.quantity, 0); },
  subtotal() { return this.get().reduce((s, i) => s + i.price * i.quantity, 0); },
  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.count();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// ─────────────────────────────────────────────────
//  TOASTS
// ─────────────────────────────────────────────────
function showToast(message, type = 'info', icon = 'ℹ️') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-msg">${message}</div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => removeToast(toast), 3500);
}

function removeToast(el) {
  if (!el || !el.parentElement) return;
  el.classList.add('removing');
  setTimeout(() => el.remove(), 250);
}

// ─────────────────────────────────────────────────
//  NAVBAR
// ─────────────────────────────────────────────────
function initNavbar(activePage) {
  // Scroll effect
  window.addEventListener('scroll', () => {
    document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Active link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === activePage) link.classList.add('active');
  });

  // Cart badge
  Cart.updateBadge();

  // Auth state
  renderNavAuth();
}

function renderNavAuth() {
  const authArea = document.getElementById('nav-auth');
  if (!authArea) return;
  const user = Auth.getUser();

  if (user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    authArea.innerHTML = `
      <div class="nav-user" onclick="toggleUserMenu()">
        <div class="nav-avatar">${initials}</div>
        <span class="nav-user-name">${user.name.split(' ')[0]}</span>
        <span style="color:var(--text-4);font-size:0.7rem">▾</span>
      </div>
      <div id="user-menu" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:#120a3a;border:1.5px solid rgba(124,95,230,0.3);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);min-width:180px;overflow:hidden;z-index:100;">
        <a href="/orders.html" style="display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:0.875rem;color:#c4b8ff;background:transparent;transition:var(--transition);">📦 My Orders</a>
        <div style="height:1px;background:var(--border);"></div>
        <button onclick="logout()" style="width:100%;display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:0.875rem;color:#f87171;cursor:pointer;background:transparent;border:none;font-family:inherit;">🚪 Sign Out</button>
      </div>
    `;
    authArea.style.position = 'relative';
  } else {
    authArea.innerHTML = `
      <a href="/auth.html" class="btn-outline">Sign In</a>
      <a href="/auth.html?tab=register" class="btn-primary">Get Started</a>
    `;
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', e => {
  const userMenu = document.getElementById('user-menu');
  if (userMenu && !e.target.closest('.nav-user')) {
    userMenu.style.display = 'none';
  }
});

function logout() {
  Auth.clearSession();
  showToast('Signed out successfully', 'info', '👋');
  setTimeout(() => window.location.href = '/auth.html', 800);
}

// ─────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '★';
  if (half) stars += '½';
  for (let i = Math.ceil(rating); i < 5; i++) stars += '☆';
  return stars;
}

function getBadgeClass(badge) {
  const map = { 'New': 'badge-new', 'Sale': 'badge-sale', 'Hot': 'badge-hot', 'Best Seller': 'badge-best', 'Pro': 'badge-pro', 'Gaming': 'badge-gaming' };
  return map[badge] || 'badge-best';
}

function renderProductCard(product) {
  return `
    <div class="product-card" onclick="window.location.href='/product-details.html?id=${product.id}'">
      <div class="product-img-wrap">
        <img class="product-card-img" src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.badge ? `<span class="product-badge ${getBadgeClass(product.badge)}">${product.badge}</span>` : ''}
        <button class="product-card-quick" onclick="event.stopPropagation(); Cart.add(${JSON.stringify(product).replace(/"/g, '&quot;')})" title="Quick add to cart">🛒</button>
      </div>
      <div class="product-card-body">
        <div class="product-cat">${product.category}</div>
        <div class="product-card-name">${product.name}</div>
        <div class="product-stars">${renderStars(product.rating)} <span>(${product.reviews.toLocaleString()})</span></div>
        <div class="product-card-footer">
          <div class="product-price-wrap">
            <span class="product-price">${formatPrice(product.price)}</span>
            ${product.originalPrice > product.price ? `<span class="product-original-price">${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          <button class="btn-cart" onclick="event.stopPropagation(); Cart.add(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            + Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

function navbarHTML(activePage = '') {
  return `
  <nav class="navbar">
    <div class="nav-inner">
      <a href="/index.html" class="nav-logo">
        <img src="/images/logo.svg" alt="NovaTech Store" style="height:80px; display:block; vertical-align:middle;">
      </a>
      <div class="nav-links">
        <a href="/index.html" class="nav-link" data-page="home">Home</a>
        <a href="/products.html" class="nav-link" data-page="products">Products</a>
        <a href="/about.html" class="nav-link" data-page="about">About</a>
      </div>
      <div class="nav-actions">
        <a href="/cart.html" class="nav-btn-icon" style="position:relative" title="Cart">
          🛒
          <span class="cart-badge" style="display:none">0</span>
        </a>
        <div id="nav-auth" style="display:flex;align-items:center;gap:10px;"></div>
      </div>
    </div>
  </nav>
  `;
}

function footerHTML() {
  return `
  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">Nova<span>Tech</span></div>
        <p class="footer-brand-desc">Your destination for cutting-edge electronics. We bring you the latest in tech with exceptional service and competitive pricing.</p>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <ul>
          <li><a href="/products.html?category=laptops">Laptops</a></li>
          <li><a href="/products.html?category=smartphones">Smartphones</a></li>
          <li><a href="/products.html?category=audio">Audio</a></li>
          <li><a href="/products.html?category=cameras">Cameras</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="/about.html">About Us</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Press</a></li>
          <li><a href="#">Blog</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Support</h4>
        <ul>
          <li><a href="#">Help Center</a></li>
          <li><a href="#">Returns</a></li>
          <li><a href="#">Track Order</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2024 NovaTech. All rights reserved.</span>
      <span>Made with  and NovaTech</span>
    </div>
  </footer>
  `;
}
