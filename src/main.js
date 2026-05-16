import './style.css'
import { supabase } from './lib/supabase'
import mainImg from './assets/main-img.jpeg'

// --- STATE ---
const state = {
  products: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  currentPath: window.location.hash || '#home',
  isAdmin: sessionStorage.getItem('isAdmin') === 'true',
  tempImages: [], 
  editingProductId: null,
  isMobileMenuOpen: false
}

// --- UTILS ---
const formatPrice = (price) => `₹${Number(price).toLocaleString()}`

const updateLocalStorage = () => {
  localStorage.setItem('cart', JSON.stringify(state.cart))
  renderNavbar()
}

// --- CORE COMPONENTS ---
const renderNavbar = async () => {
  const navbar = document.getElementById('navbar')
  const cartCount = state.cart.reduce((acc, item) => acc + item.quantity, 0)
  
  if (state.categories.length === 0) {
    const { data } = await supabase.from('categories').select('*')
    state.categories = data || []
  }

  const visibleCats = state.categories.slice(0, 5)
  const moreCats = state.categories.slice(5)
  
  navbar.innerHTML = `
    <nav class="nav-container container">
      <div class="nav-left">
        <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
          <i data-lucide="menu"></i>
        </button>
        <div class="nav-logo">
          <a href="#home">BHAI JI FASHION</a>
        </div>
      </div>
      
      <div class="nav-middle">
        <div class="nav-links desktop-only">
          <a href="#home" class="nav-item">Home</a>
          ${visibleCats.map(cat => `<a href="#home" onclick="filterByCategory('${cat.name}')" class="nav-item">${cat.name}</a>`).join('')}
          ${moreCats.length > 0 ? `
            <div class="nav-dropdown">
              <button class="nav-item more-btn"><i data-lucide="more-horizontal"></i></button>
              <div class="dropdown-content glass-card">
                ${moreCats.map(cat => `<a href="#home" onclick="filterByCategory('${cat.name}')">${cat.name}</a>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="nav-search-integrated">
          <i data-lucide="search" class="search-icon"></i>
          <input type="text" id="global-search" placeholder="Search..." oninput="handleSearch(this.value)">
        </div>
      </div>

      <div class="nav-actions">
        <a href="#admin" class="nav-icon-link" title="Admin">
          <i data-lucide="user-cog"></i>
        </a>
        <a href="#cart" class="cart-btn nav-icon-link">
          <i data-lucide="shopping-cart"></i>
          <span class="cart-badge">${cartCount}</span>
        </a>
      </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <div class="mobile-menu ${state.isMobileMenuOpen ? 'open' : ''}">
      <div class="mobile-menu-content">
        <div class="mobile-menu-header">
          <h3>Categories</h3>
          <button onclick="toggleMobileMenu()"><i data-lucide="x"></i></button>
        </div>
        <div class="mobile-links">
          <a href="#home" onclick="toggleMobileMenu()">All Products</a>
          ${state.categories.map(cat => `
            <a href="#home" onclick="filterByCategory('${cat.name}'); toggleMobileMenu()">${cat.name}</a>
          `).join('')}
          <hr style="opacity: 0.1; margin: 20px 0;">
          <a href="#admin" onclick="toggleMobileMenu()">Admin Panel</a>
          <a href="#cart" onclick="toggleMobileMenu()">My Cart</a>
        </div>
      </div>
    </div>
  `
  lucide.createIcons()
}

window.toggleMobileMenu = () => {
  state.isMobileMenuOpen = !state.isMobileMenuOpen
  renderNavbar()
}

window.filterByCategory = (catName) => {
  const sections = document.querySelectorAll('.category-section')
  sections.forEach(sec => {
    if (sec.dataset.category === catName || !catName) {
      sec.style.display = 'block'
      sec.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else { sec.style.display = 'none' }
  })
}

window.handleSearch = (val) => {
  const query = val.toLowerCase()
  const cards = document.querySelectorAll('.product-card')
  cards.forEach(card => {
    const name = card.querySelector('.product-name').innerText.toLowerCase()
    card.style.display = name.includes(query) ? 'block' : 'none'
  })
}

// --- VIEWS ---

const HomeView = async () => {
  const app = document.getElementById('app')
  app.innerHTML = `
    <section class="hero-section container">
      <h1 class="hero-title">BHAI JI FASHION</h1>
      <p class="hero-subtitle">Elevate your style with our premium collection.<br>Minimalist design, maximum impact.</p>
    </section>
    <section class="carousel-container container">
      <div class="carousel" id="home-carousel">
        <div class="carousel-item active">
          <img src="${mainImg}" alt="New Arrivals">
        </div>
      </div>
    </section>
    <div id="product-list-container" class="container"><div class="loader">Loading products...</div></div>
  `
  await fetchProducts(); renderProductsByCategory()
}

const ProductDetailView = async (id) => {
  const app = document.getElementById('app')
  const product = state.products.find(p => p.id == id)
  if (!product) { app.innerHTML = `<div class="container section-padding"><h2>Product not found</h2></div>`; return }
  const images = Array.isArray(product.images) ? product.images : [product.image || 'https://via.placeholder.com/600']
  const mainImage = images[0]
  app.innerHTML = `
    <div class="container section-padding fade-in">
      <div class="product-detail-grid">
        <div class="detail-image-gallery">
          <img src="${mainImage}" id="main-detail-img" alt="${product.name}" class="main-detail-image">
          ${images.length > 1 ? `<div class="thumbnail-row">${images.map(img => `<img src="${img}" class="detail-thumb" onclick="document.getElementById('main-detail-img').src='${img}'">`).join('')}</div>` : ''}
        </div>
        <div class="detail-content">
          <nav class="breadcrumb"><a href="#home">Home</a> / ${product.name}</nav>
          <h1 class="detail-title">${product.name}</h1>
          <p class="detail-price">${formatPrice(product.price)}</p>
          <p class="detail-desc">${product.description}</p>
          <div class="detail-options">
            <div class="option-group"><label>Select Size</label><div class="size-chips">${(product.sizes || ['S', 'M', 'L', 'XL']).map((s, i) => `<button class="chip ${i === 0 ? 'active' : ''}">${s}</button>`).join('')}</div></div>
            <div class="option-group"><label>Quantity</label><div class="qty-selector"><button onclick="changeQty(-1)">-</button><span id="detail-qty">1</span><button onclick="changeQty(1)">+</button></div></div>
          </div>
          <div class="detail-actions">
            <button class="btn-primary" onclick="addToCart(${product.id}, true)">Buy Now</button>
            <button class="btn-secondary" onclick="addToCart(${product.id})">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  `
  lucide.createIcons()
}

const CartView = () => {
  const app = document.getElementById('app')
  const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  if (state.cart.length === 0) { app.innerHTML = `<div class="container section-padding text-center"><h2>Your cart is empty</h2><a href="#home" class="btn-primary" style="display:inline-block; margin-top:20px;">Shop Now</a></div>`; return }
  app.innerHTML = `
    <div class="container section-padding"><h1 class="section-title">Your Cart</h1><div class="cart-layout"><div class="cart-items">
      ${state.cart.map(item => {
        const itemImg = Array.isArray(item.images) ? item.images[0] : (item.image || 'https://via.placeholder.com/100');
        return `<div class="cart-item glass-card"><img src="${itemImg}" alt="${item.name}"><div class="cart-item-info"><h3>${item.name}</h3><p class="price-accent">${formatPrice(item.price)}</p><div class="qty-selector"><button onclick="updateCartQty(${item.id}, -1)">-</button><span>${item.quantity}</span><button onclick="updateCartQty(${item.id}, 1)">+</button></div></div><button class="remove-btn" onclick="removeFromCart(${item.id})"><i data-lucide="trash-2"></i></button></div>`
      }).join('')}</div>
      <div class="cart-summary glass-card"><h3>Order Summary</h3><div class="summary-row"><span>Subtotal</span><span>${formatPrice(total)}</span></div><div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div><button class="btn-primary full-width" onclick="location.hash='#checkout'">Proceed to Checkout</button></div>
    </div></div>
  `
  lucide.createIcons()
}

const CheckoutView = () => {
  const app = document.getElementById('app')
  const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  app.innerHTML = `
    <div class="container section-padding"><h1 class="section-title">Checkout</h1><div class="checkout-layout"><div class="glass-card"><form id="checkout-form">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="cust-name" placeholder="Enter your full name" required maxlength="25">
      </div>
      <div class="form-group">
        <label>Mobile Number</label>
        <input type="text" id="cust-phone" placeholder="10-digit mobile number" required pattern="[0-9]{10}" maxlength="10" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="cust-email" placeholder="email@example.com" required>
      </div>
      <div class="form-group">
        <label>Full Delivery Address</label>
        <textarea id="cust-address" placeholder="Flat/House No, Street, Area" required maxlength="100"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>City</label>
          <input type="text" id="cust-city" placeholder="Your City" required maxlength="25">
        </div>
        <div class="form-group">
          <label>Pincode</label>
          <input type="text" id="cust-pincode" placeholder="6-digit code" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
        </div>
      </div>
      <div class="summary-footer"><h3 class="total-display">Total Payable: ${formatPrice(total)}</h3><button type="submit" class="btn-primary full-width"><i data-lucide="send"></i> Place Order on WhatsApp</button></div>
    </form></div></div></div>
  `
  document.getElementById('checkout-form').addEventListener('submit', handleOrderSubmit); lucide.createIcons()
}

const handleOrderSubmit = (e) => {
  e.preventDefault(); const formData = { name: document.getElementById('cust-name').value, phone: document.getElementById('cust-phone').value, email: document.getElementById('cust-email').value, address: document.getElementById('cust-address').value, city: document.getElementById('cust-city').value, pincode: document.getElementById('cust-pincode').value }
  const itemsText = state.cart.map(item => `- ${item.name} (x${item.quantity}) @ ${formatPrice(item.price)}`).join('\n'); const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const message = `*NEW ORDER FROM BHAI JI FASHION*\n\n*Customer Details:*\nName: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\nAddress: ${formData.address}, ${formData.city} - ${formData.pincode}\n\n*Order Items:*\n${itemsText}\n\n*Total Amount: ${formatPrice(total)}*\n\nPlease confirm my order. Thank you!`
  window.open(`https://wa.me/919592881227?text=${encodeURIComponent(message)}`, '_blank')
}

const AdminView = async () => {
  const app = document.getElementById('app')
  if (!state.isAdmin) {
    app.innerHTML = `
      <div class="container section-padding"><div class="small-container"><div class="glass-card fade-in"><h1 class="text-center" style="margin-bottom: 40px;">Admin Login</h1><form id="admin-login-form">
        <div class="form-group"><label>Username</label><input type="text" id="admin-user" placeholder="Enter username" required></div>
        <div class="form-group"><label>Password</label><input type="password" id="admin-pass" placeholder="Enter password" required></div>
        <button type="submit" class="btn-primary full-width">Login to Dashboard</button>
      </form></div></div></div>
    `
    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
      e.preventDefault(); if (document.getElementById('admin-user').value === 'admin' && document.getElementById('admin-pass').value === 'bhaiji123') { state.isAdmin = true; sessionStorage.setItem('isAdmin', 'true'); AdminView() } else { alert('Invalid credentials') }
    }); lucide.createIcons(); return
  }
  const generatedSku = 'BJ-' + Math.random().toString(36).substr(2, 6).toUpperCase(); const { data: categories } = await supabase.from('categories').select('*')
  app.innerHTML = `
    <div class="container section-padding"><div class="admin-header" style="margin-bottom: 60px;"><h1>Admin Dashboard</h1><button onclick="logoutAdmin()" class="btn-secondary logout-btn"><i data-lucide="log-out"></i> Logout</button></div>
      <div class="admin-grid" id="admin-form-anchor">
        <section class="glass-card"><h2 class="card-title" id="form-title">${state.editingProductId ? 'Edit Product' : 'Add New Product'}</h2><form id="add-product-form" class="admin-form-modern">
          <div class="form-group"><label>Product ID (SKU)</label><input type="text" id="prod-sku" value="${generatedSku}" readonly class="readonly-input"></div>
          <div class="form-group"><label>Product Name</label><input type="text" id="prod-name" placeholder="e.g. Slim Fit Cotton Shirt" required></div>
          <div class="form-group"><label>Description</label><textarea id="prod-desc" placeholder="Describe the product features..." required></textarea></div>
          <div class="form-row"><div class="form-group"><label>Price (₹)</label><input type="number" id="prod-price" placeholder="999" required></div><div class="form-group"><label>Category</label><select id="prod-cat" required><option value="">-- Select Category --</option>${categories ? categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('') : ''}</select></div></div>
          <div class="form-group"><label>Product Images</label><div class="upload-container" id="image-upload-wrapper"><div id="image-previews" style="display:contents;"></div><div class="upload-box" onclick="document.getElementById('prod-files').click()"><i data-lucide="plus"></i><span>Add Image</span></div></div><input type="file" id="prod-files" style="display:none;" multiple accept="image/*"></div>
          <div class="form-row"><div class="form-group"><label>Available Colors</label><input type="text" id="prod-colors" placeholder="Red, Black, White"></div><div class="form-group"><label>Available Sizes</label><input type="text" id="prod-sizes" placeholder="S, M, L, XL"></div></div>
          <div style="display: flex; gap: 10px;"><button type="submit" id="submit-btn" class="btn-primary full-width"><i data-lucide="${state.editingProductId ? 'save' : 'plus-circle'}"></i> ${state.editingProductId ? 'Update Product' : 'Publish Product'}</button>${state.editingProductId ? `<button type="button" onclick="cancelEdit()" class="btn-secondary full-width">Cancel</button>` : ''}</div>
        </form></section>
        <section class="glass-card"><h2 class="card-title">Manage Categories</h2><form id="add-category-form" class="admin-form-modern"><div class="form-group"><label>Category Name</label><input type="text" id="cat-name" placeholder="e.g. Winter Wear" required></div><div class="form-group"><label>Tagline</label><input type="text" id="cat-tagline" placeholder="Stay warm, stay stylish" required></div><button type="submit" class="btn-secondary full-width"><i data-lucide="folder-plus"></i> Add Category</button></form><div id="admin-category-list" class="category-list-mini" style="margin-top: 30px;"></div></section>
        <section class="glass-card"><h2 class="card-title">Active Inventory</h2><div id="admin-product-list" class="admin-product-management"></div></section>
      </div>
    </div>
  `
  document.getElementById('prod-files').addEventListener('change', handleFileSelect); document.getElementById('add-product-form').addEventListener('submit', handleAddProduct); document.getElementById('add-category-form').addEventListener('submit', handleAddCategory)
  renderAdminCategories(); renderAdminProducts(); if (state.editingProductId) { const prod = state.products.find(p => p.id === state.editingProductId); if (prod) { document.getElementById('prod-sku').value = prod.sku; document.getElementById('prod-name').value = prod.name; document.getElementById('prod-desc').value = prod.description; document.getElementById('prod-price').value = prod.price; document.getElementById('prod-cat').value = prod.category; document.getElementById('prod-colors').value = (prod.colors || []).join(', '); document.getElementById('prod-sizes').value = (prod.sizes || []).join(', '); state.tempImages = Array.isArray(prod.images) ? [...prod.images] : []; renderImagePreviews() } } else { state.tempImages = []; renderImagePreviews() }; lucide.createIcons()
}

const handleFileSelect = (e) => { const files = Array.from(e.target.files); state.tempImages = [...state.tempImages, ...files]; renderImagePreviews(); e.target.value = '' }
const renderImagePreviews = () => {
  const container = document.getElementById('image-previews'); if (!container) return; container.innerHTML = state.tempImages.map((img, index) => { const url = typeof img === 'string' ? img : URL.createObjectURL(img); return `<div class="image-preview-item"><img src="${url}" alt="Preview"><button type="button" class="remove-preview" onclick="removeTempImage(${index})">&times;</button></div>` }).join('')
  const uploadBox = document.querySelector('.upload-box span'); if (uploadBox) uploadBox.innerText = state.tempImages.length > 0 ? 'Add More' : 'Add Image'
}
window.removeTempImage = (index) => { state.tempImages.splice(index, 1); renderImagePreviews() }
const handleAddProduct = async (e) => {
  e.preventDefault(); if (state.tempImages.length === 0) return alert('Please add at least one image.'); const btn = document.getElementById('submit-btn'); btn.disabled = true; btn.innerHTML = state.editingProductId ? 'Updating...' : 'Publishing...'
  try {
    const imageUrls = []; for (const item of state.tempImages) { if (typeof item === 'string') { imageUrls.push(item) } else { const fileExt = item.name.split('.').pop(); const fileName = `${Math.random()}.${fileExt}`; const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, item); if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName); imageUrls.push(publicUrl) } }
    const productData = { sku: document.getElementById('prod-sku').value, name: document.getElementById('prod-name').value, description: document.getElementById('prod-desc').value, price: parseFloat(document.getElementById('prod-price').value), category: document.getElementById('prod-cat').value, images: imageUrls, colors: document.getElementById('prod-colors').value.split(',').map(s => s.trim()), sizes: document.getElementById('prod-sizes').value.split(',').map(s => s.trim()) }
    if (state.editingProductId) { const { error } = await supabase.from('products').update(productData).eq('id', state.editingProductId); if (error) throw error; alert('Product updated successfully!'); state.editingProductId = null } else { const { error } = await supabase.from('products').insert([productData]); if (error) throw error; alert('Product published successfully!') }; state.tempImages = []; AdminView()
  } catch (err) { alert('Error: ' + err.message) } finally { btn.disabled = false; lucide.createIcons() }
}
const renderAdminProducts = async () => {
  const container = document.getElementById('admin-product-list'); const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }); state.products = data || []; if (data) { container.innerHTML = data.map(prod => { const img = Array.isArray(prod.images) ? prod.images[0] : (prod.image || 'https://via.placeholder.com/50'); return `<div class="admin-prod-item glass-card"><div class="admin-prod-info"><img src="${img}" alt=""><div><h4>${prod.name}</h4><small>${prod.sku} • ${formatPrice(prod.price)}</small></div></div><div class="admin-prod-actions" style="display: flex; gap: 8px;"><button onclick="editProduct(${prod.id})" class="edit-btn-mini"><i data-lucide="edit-3"></i></button><button onclick="deleteProduct(${prod.id})" class="delete-btn-mini"><i data-lucide="trash-2"></i></button></div></div>` }).join(''); lucide.createIcons() }
}
window.editProduct = (id) => { state.editingProductId = id; AdminView(); document.getElementById('admin-form-anchor').scrollIntoView({ behavior: 'smooth' }) }
window.cancelEdit = () => { state.editingProductId = null; AdminView() }
window.deleteProduct = async (id) => { if (confirm('Are you sure?')) { const { error } = await supabase.from('products').delete().eq('id', id); if (!error) AdminView() } }
const handleAddCategory = async (e) => { e.preventDefault(); const categoryData = { name: document.getElementById('cat-name').value, tagline: document.getElementById('cat-tagline').value }; const { error } = await supabase.from('categories').insert([categoryData]); if (!error) { alert('Category added!'); state.categories = []; AdminView() } }
const renderAdminCategories = async () => {
  const container = document.getElementById('admin-category-list'); const { data } = await supabase.from('categories').select('*'); if (data) { container.innerHTML = `<h3 style="margin-bottom: 15px; color: var(--secondary);">Existing Categories</h3>${data.map(cat => `<div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(62, 37, 34, 0.3); margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border);"><span>${cat.name}</span><button onclick="deleteCategory(${cat.id})" style="color: #f43f5e;"><i data-lucide="trash"></i></button></div>`).join('')}`; lucide.createIcons() }
}
window.logoutAdmin = () => { state.isAdmin = false; sessionStorage.removeItem('isAdmin'); AdminView() }
window.deleteCategory = async (id) => { if (confirm('Delete this category?')) { await supabase.from('categories').delete().eq('id', id); state.categories = []; AdminView() } }
const fetchProducts = async () => { const { data } = await supabase.from('products').select('*'); state.products = data || [] }
const renderProductsByCategory = () => { const container = document.getElementById('product-list-container'); if (!container) return; const categories = [...new Set(state.products.map(p => p.category))]; container.innerHTML = categories.map(cat => `<div class="category-section section-padding" data-category="${cat}"><h2 class="category-title">${cat}</h2><div class="product-grid">${state.products.filter(p => p.category === cat).map(p => ProductCard(p)).join('')}</div></div>`).join(''); lucide.createIcons() }
const ProductCard = (product) => { const displayImage = Array.isArray(product.images) ? product.images[0] : (product.image || 'https://via.placeholder.com/400'); return `<div class="product-card fade-in" onclick="viewProduct(${product.id})"><div class="product-image-wrapper"><img src="${displayImage}" alt="${product.name}" class="product-image"><button class="like-btn" onclick="event.stopPropagation();"><i data-lucide="heart"></i></button><div class="product-id-badge">${product.sku || 'N/A'}</div></div><div class="product-info"><h3 class="product-name">${product.name}</h3><p class="product-price">${formatPrice(product.price)}</p><div class="product-actions"><button class="btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})"><i data-lucide="shopping-bag"></i> Add</button><button class="btn-secondary"><i data-lucide="eye"></i> View</button></div></div></div>` }
const navigate = () => { state.currentPath = window.location.hash || '#home'; renderNavbar(); if (state.currentPath === '#home') HomeView(); else if (state.currentPath.startsWith('#product/')) ProductDetailView(state.currentPath.split('/')[1]); else if (state.currentPath === '#cart') CartView(); else if (state.currentPath === '#checkout') CheckoutView(); else if (state.currentPath === '#admin') AdminView(); window.scrollTo(0, 0) }
window.addEventListener('hashchange', navigate); window.addEventListener('DOMContentLoaded', navigate)
window.addToCart = (id, buyNow = false) => { const product = state.products.find(p => p.id == id); const existing = state.cart.find(item => item.id == id); if (existing) existing.quantity++; else state.cart.push({ ...product, quantity: 1 }); updateLocalStorage(); if (buyNow) window.location.hash = '#checkout'; else alert(`${product.name} added!`) }
window.viewProduct = (id) => { window.location.hash = `#product/${id}` }
window.updateCartQty = (id, delta) => { const item = state.cart.find(i => i.id == id); if (item) { item.quantity += delta; if (item.quantity <= 0) state.cart = state.cart.filter(i => i.id != id); updateLocalStorage(); CartView() } }
window.removeFromCart = (id) => { state.cart = state.cart.filter(i => i.id != id); updateLocalStorage(); CartView() }
window.changeQty = (delta) => { const qtyElem = document.getElementById('detail-qty'); let qty = parseInt(qtyElem.innerText) + delta; if (qty < 1) qty = 1; qtyElem.innerText = qty }
