import sys
path = 'js/admin.js'

part = r"""
/* ========================================================
   VOUCHERS (CRUD)
   ======================================================== */
function renderVouchers() {
  var tbody = document.getElementById('vouchers-body');
  if (!tbody) return;
  if (state.vouchers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-muted);padding:24px;">Chua co voucher</td></tr>';
    return;
  }
  tbody.innerHTML = state.vouchers.map(function(v) {
    var disc = v.discountType === 'percent' ? v.discountValue + '%' : formatCurrency(v.discountValue);
    var badge = v.isActive ? '<span class="status-badge status-badge--active">Dang hoat dong</span>' : '<span class="status-badge status-badge--inactive">Ngung</span>';
    var toggleLabel = v.isActive ? 'Ngung' : 'Kich hoat';
    var toggleIcon = v.isActive ? 'X' : 'V';
    return '<tr><td><strong>' + escapeHTML(v.code) + '</strong></td><td>' + escapeHTML(v.title) + '</td><td>' + disc + '</td><td>' + (v.minOrderValue ? formatCurrency(v.minOrderValue) : 'Khong') + '</td><td>' + (v.maxDiscountValue ? formatCurrency(v.maxDiscountValue) : 'Khong') + '</td><td>' + badge + '</td><td><div class="action-btns"><button class="action-btn" data-action="edit-voucher" data-id="' + v.id + '" title="Sua">Sua</button><button class="action-btn action-btn--danger" data-action="toggle-voucher" data-id="' + v.id + '" title="' + toggleLabel + '">' + toggleIcon + '</button></div></td></tr>';
  }).join('');
}

function setupVoucherModal() {
  var modal = document.getElementById('voucher-modal');
  var overlay = document.getElementById('voucher-modal-overlay');
  var closeBtn = document.getElementById('voucher-modal-close');
  var cancelBtn = document.getElementById('voucher-modal-cancel');
  var saveBtn = document.getElementById('voucher-modal-save');
  var addBtn = document.getElementById('btn-add-voucher');

  function open(editId) {
    var title = document.getElementById('voucher-modal-title');
    var codeInp = document.getElementById('voucher-code');
    var titleInp = document.getElementById('voucher-title');
    var descInp = document.getElementById('voucher-description');
    var typeInp = document.getElementById('voucher-discount-type');
    var valueInp = document.getElementById('voucher-discount-value');
    var minInp = document.getElementById('voucher-min-order');
    var maxInp = document.getElementById('voucher-max-discount');
    var limitInp = document.getElementById('voucher-usage-limit');
    var activeInp = document.getElementById('voucher-is-active');
    var startInp = document.getElementById('voucher-start-date');
    var endInp = document.getElementById('voucher-end-date');

    if (editId) {
      var v = state.vouchers.find(function(x) { return x.id === editId; });
      if (!v) return;
      title.textContent = 'Sua voucher';
      saveBtn.dataset.editId = editId;
      codeInp.value = v.code;
      titleInp.value = v.title;
      descInp.value = v.description || '';
      typeInp.value = v.discountType;
      valueInp.value = v.discountValue;
      minInp.value = v.minOrderValue || '';
      maxInp.value = v.maxDiscountValue || '';
      limitInp.value = v.usageLimit || '';
      activeInp.checked = v.isActive;
      startInp.value = v.startDate ? v.startDate.split('T')[0] : '';
      endInp.value = v.endDate ? v.endDate.split('T')[0] : '';
    } else {
      title.textContent = 'Them voucher';
      saveBtn.dataset.editId = '';
      codeInp.value = ''; titleInp.value = ''; descInp.value = '';
      typeInp.value = 'percent'; valueInp.value = ''; minInp.value = '';
      maxInp.value = ''; limitInp.value = ''; activeInp.checked = true;
      startInp.value = ''; endInp.value = '';
    }
    modal.classList.add('is-open');
  }

  function close() { modal.classList.remove('is-open'); }

  function save() {
    var code = document.getElementById('voucher-code').value.trim().toUpperCase();
    var title = document.getElementById('voucher-title').value.trim();
    var description = document.getElementById('voucher-description').value.trim();
    var discountType = document.getElementById('voucher-discount-type').value;
    var discountValue = parseInt(document.getElementById('voucher-discount-value').value) || 0;
    var minOrderValue = document.getElementById('voucher-min-order').value ? parseInt(document.getElementById('voucher-min-order').value) : null;
    var maxDiscountValue = document.getElementById('voucher-max-discount').value ? parseInt(document.getElementById('voucher-max-discount').value) : null;
    var usageLimit = document.getElementById('voucher-usage-limit').value ? parseInt(document.getElementById('voucher-usage-limit').value) : null;
    var isActive = document.getElementById('voucher-is-active').checked;
    var startDate = document.getElementById('voucher-start-date').value;
    var endDate = document.getElementById('voucher-end-date').value;
    if (!code || !title || discountValue <= 0) { alert('Vui long nhap ma, ten va gia tri giam gia hop le.'); return; }
    var editId = saveBtn.dataset.editId;
    if (editId) {
      var idx = state.vouchers.findIndex(function(x) { return x.id === editId; });
      if (idx !== -1) state.vouchers[idx] = Object.assign({}, state.vouchers[idx], { code: code, title: title, description: description, discountType: discountType, discountValue: discountValue, minOrderValue: minOrderValue, maxDiscountValue: maxDiscountValue, usageLimit: usageLimit, isActive: isActive, startDate: startDate ? startDate + 'T00:00:00' : null, endDate: endDate ? endDate + 'T23:59:59' : null });
    } else {
      var newId = 'v-' + String(state.vouchers.length + 1).padStart(3, '0');
      state.vouchers.push({ id: newId, code: code, title: title, description: description, discountType: discountType, discountValue: discountValue, minOrderValue: minOrderValue, maxDiscountValue: maxDiscountValue, usageLimit: usageLimit, usedCount: 0, isActive: isActive, startDate: startDate ? startDate + 'T00:00:00' : null, endDate: endDate ? endDate + 'T23:59:59' : null });
    }
    renderVouchers(); close();
  }

  if (addBtn) addBtn.addEventListener('click', function() { open(null); });
  if (overlay) overlay.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (saveBtn) saveBtn.addEventListener('click', save);

  document.addEventListener('click', function(e) {
    var btn = e.target.closest("[data-action='edit-voucher']");
    if (btn) open(btn.dataset.id);
    var toggle = e.target.closest("[data-action='toggle-voucher']");
    if (toggle) {
      var id = toggle.dataset.id;
      var v = state.vouchers.find(function(x) { return x.id === id; });
      if (v) { v.isActive = !v.isActive; renderVouchers(); }
    }
  });
}

/* ========================================================
   USERS
   ======================================================== */
function renderUsers() {
  var tbody = document.getElementById('users-body');
  if (!tbody) return;
  var users = state.users.filter(function(u) { return u.role !== 'admin'; });
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-muted);padding:24px;">Chua co khach hang</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(function(u) {
    var badge = u.isActive !== false ? '<span class="status-badge status-badge--active">Hoat dong</span>' : '<span class="status-badge status-badge--inactive">Khoa</span>';
    var toggleLabel = u.isActive !== false ? 'Khoa' : 'Mo khoa';
    var toggleIcon = u.isActive !== false ? 'X' : 'V';
    return '<tr><td><strong>' + escapeHTML(u.id) + '</strong></td><td>' + escapeHTML(u.name) + '<br><small style="color:var(--color-muted)">' + escapeHTML(u.email) + '</small></td><td>' + escapeHTML(u.phone || 'Chua cap nhat') + '</td><td>' + formatDate(u.createdAt) + '</td><td>' + badge + '</td><td><div class="action-btns"><button class="action-btn action-btn--danger" data-action="toggle-user" data-id="' + u.id + '" title="' + toggleLabel + '">' + toggleIcon + '</button></div></td></tr>';
  }).join('');
}

function setupUserActions() {
  document.addEventListener('click', function(e) {
    var toggle = e.target.closest("[data-action='toggle-user']");
    if (toggle) {
      var id = toggle.dataset.id;
      var u = state.users.find(function(x) { return x.id === id; });
      if (u) { u.isActive = !u.isActive; renderUsers(); }
    }
  });
}
"""

with open(path, 'a', encoding='utf-8') as f:
    f.write(part)
print('Vouchers + Users done')
sys.stdout.flush()