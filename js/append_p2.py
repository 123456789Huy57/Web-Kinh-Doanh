import sys
path = 'js/admin.js'

part = r"""
/* ========================================================
   PRODUCTS (CRUD)
   ======================================================== */
function renderProducts() {
  const tbody = document.getElementById('products-body');
  if (!tbody) return;
  let filtered = [...state.products];
  const searchInput = document.getElementById('product-search');
  const catFilter = document.getElementById('product-category-filter');
  const statusFilter = document.getElementById('product-status-filter');
  if (searchInput && searchInput.value) {
    const q = searchInput.value.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.slug.includes(q));
  }
  if (catFilter && catFilter.value) {
    filtered = filtered.filter(p => p.categoryId === catFilter.value);
  }
  if (statusFilter && statusFilter.value === 'inactive') {
    filtered = filtered.filter(p => p.isActive === false);
  } else if (statusFilter && statusFilter.value === 'active') {
    filtered = filtered.filter(p => p.isActive !== false);
  }
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-muted);padding:24px;">Khong tim thay san pham</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(p => {
    const img = p.imageUrl || './assets/images/placeholder-product.svg';
    const priceHtml = p.salePrice
      ? '<span style="color:var(--color-sale);font-weight:600;">' + formatCurrency(p.salePrice) + '</span><br><small style="text-decoration:line-through;color:var(--color-muted);">' + formatCurrency(p.price) + '</small>'
      : formatCurrency(p.price);
    const badge = p.isActive !== false
      ? '<span class="status-badge status-badge--active">Dang ban</span>'
      : '<span class="status-badge status-badge--inactive">Ngung ban</span>';
    const toggleLabel = p.isActive !== false ? 'Ngung ban' : 'Kich hoat';
    const toggleIcon = p.isActive !== false ? 'X' : 'V';
    return '<tr>'
      + '<td><img src="' + img + '" alt="" class="product-thumb" loading="lazy" /></td>'
      + '<td><strong>' + escapeHTML(p.name) + '</strong></td>'
      + '<td>' + getCategoryName(p.categoryId) + '</td>'
      + '<td>' + priceHtml + '</td>'
      + '<td>' + renderStockBadge(p.stock) + '</td>'
      + '<td>' + badge + '</td>'
      + '<td><div class="action-btns">'
      + '<button class="action-btn" data-action="edit-product" data-id="' + p.id + '" title="Sua">Sua</button>'
      + '<button class="action-btn action-btn--danger" data-action="toggle-product" data-id="' + p.id + '" title="' + toggleLabel + '">' + toggleIcon + '</button>'
      + '</div></td></tr>';
  }).join('');
}

function renderStockBadge(stock) {
  if (stock <= 0) return '<span class="stock-low">Het hang</span>';
  if (stock <= 10) return '<span class="stock-low">' + stock + '</span>';
  if (stock <= 30) return '<span class="stock-medium">' + stock + '</span>';
  return '<span class="stock-ok">' + stock + '</span>';
}

function getCategoryName(catId) {
  const cat = state.categories.find(c => c.id === catId);
  return cat ? cat.name : catId;
}

/* Product Modal */
function setupProductModal() {
  const modal = document.getElementById('product-modal');
  const overlay = document.getElementById('product-modal-overlay');
  const closeBtn = document.getElementById('product-modal-close');
  const cancelBtn = document.getElementById('product-modal-cancel');
  const saveBtn = document.getElementById('product-modal-save');
  const addBtn = document.getElementById('btn-add-product');

  function open(editId) {
    const title = document.getElementById('product-modal-title');
    const nameInp = document.getElementById('product-name');
    const catInp = document.getElementById('product-category');
    const unitInp = document.getElementById('product-unit');
    const priceInp = document.getElementById('product-price');
    const saleInp = document.getElementById('product-sale-price');
    const stockInp = document.getElementById('product-stock');
    const brandInp = document.getElementById('product-brand');
    const descInp = document.getElementById('product-description');
    const imgInp = document.getElementById('product-image');
    const activeInp = document.getElementById('product-is-active');
    const featuredInp = document.getElementById('product-is-featured');

    catInp.innerHTML = '<option value="">Chon danh muc</option>' + state.categories.map(c => '<option value="' + c.id + '">' + escapeHTML(c.name) + '</option>').join('');
    if (editId) {
      const p = state.products.find(x => x.id === editId);
      if (!p) return;
      title.textContent = 'Sua san pham';
      saveBtn.dataset.editId = editId;
      nameInp.value = p.name;
      catInp.value = p.categoryId;
      unitInp.value = p.unit || '';
      priceInp.value = p.price;
      saleInp.value = p.salePrice || '';
      stockInp.value = p.stock;
      brandInp.value = p.brand || '';
      descInp.value = p.description || '';
      imgInp.value = p.imageUrl || '';
      activeInp.checked = p.isActive !== false;
      featuredInp.checked = p.isFeatured || false;
    } else {
      title.textContent = 'Them san pham';
      saveBtn.dataset.editId = '';
      nameInp.value = ''; catInp.value = ''; unitInp.value = '';
      priceInp.value = ''; saleInp.value = ''; stockInp.value = '0';
      brandInp.value = ''; descInp.value = ''; imgInp.value = '';
      activeInp.checked = true; featuredInp.checked = false;
    }
    modal.classList.add('is-open');
  }

  function close() { modal.classList.remove('is-open'); }

  function save() {
    const name = document.getElementById('product-name').value.trim();
    const categoryId = document.getElementById('product-category').value;
    const unit = document.getElementById('product-unit').value.trim();
    const price = parseInt(document.getElementById('product-price').value) || 0;
    const salePrice = document.getElementById('product-sale-price').value ? parseInt(document.getElementById('product-sale-price').value) : null;
    const stock = parseInt(document.getElementById('product-stock').value) || 0;
    const brand = document.getElementById('product-brand').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const imageUrl = document.getElementById('product-image').value.trim() || './assets/images/placeholder-product.svg';
    const isActive = document.getElementById('product-is-active').checked;
    const isFeatured = document.getElementById('product-is-featured').checked;
    if (!name || !categoryId || price <= 0) { alert('Vui long nhap ten, danh muc va gia hop le.'); return; }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const editId = saveBtn.dataset.editId;
    if (editId) {
      const idx = state.products.findIndex(x => x.id === editId);
      if (idx !== -1) state.products[idx] = Object.assign({}, state.products[idx], { name: name, categoryId: categoryId, unit: unit, price: price, salePrice: salePrice, stock: stock, brand: brand, description: description, imageUrl: imageUrl, isActive: isActive, isFeatured: isFeatured, slug: slug });
    } else {
      const newId = 'p-' + String(state.products.length + 1).padStart(3, '0');
      state.products.push({ id: newId, slug: slug, name: name, categoryId: categoryId, unit: unit, price: price, salePrice: salePrice, stock: stock, brand: brand, imageUrl: imageUrl, description: description, rating: 0, reviewCount: 0, tags: [], badges: [], isFeatured: isFeatured, isActive: isActive, nutrition: {} });
    }
    renderProducts(); close();
  }

  if (addBtn) addBtn.addEventListener('click', function() { open(null); });
  if (overlay) overlay.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (saveBtn) saveBtn.addEventListener('click', save);

  document.addEventListener('click', function(e) {
    var btn = e.target.closest("[data-action='edit-product']");
    if (btn) open(btn.dataset.id);
    var toggle = e.target.closest("[data-action='toggle-product']");
    if (toggle) {
      var id = toggle.dataset.id;
      var p = state.products.find(function(x) { return x.id === id; });
      if (p) { p.isActive = !p.isActive; renderProducts(); }
    }
  });

  ['product-search', 'product-category-filter', 'product-status-filter'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', renderProducts);
  });
}
"""

with open(path, 'a', encoding='utf-8') as f:
    f.write(part)
print('Products done')
sys.stdout.flush()
