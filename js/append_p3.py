import sys
path = 'js/admin.js'

part = r"""
/* ========================================================
   ORDERS TABLE (with actions)
   ======================================================== */
function renderOrdersTable() {
  var tbody = document.getElementById('orders-body');
  if (!tbody) return;
  if (state.orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-muted);padding:24px;">Chua co don hang</td></tr>';
    return;
  }
  tbody.innerHTML = state.orders.map(function(order) {
    var itemsHtml = order.items.map(function(i) {
      return escapeHTML(i.productName) + ' x ' + i.quantity;
    }).join('<br>');
    var actions = '';
    if (order.status === 'pending') actions += '<button class="action-btn action-btn--confirm" data-action="confirm-order" data-id="' + order.id + '" title="Xac nhan">OK</button>';
    if (order.status === 'confirmed') actions += '<button class="action-btn action-btn--ship" data-action="ship-order" data-id="' + order.id + '" title="Giao hang">Ship</button>';
    if (['pending','confirmed','preparing'].indexOf(order.status) !== -1) actions += '<button class="action-btn action-btn--danger" data-action="cancel-order" data-id="' + order.id + '" title="Huy">X</button>';
    actions += '<button class="action-btn" data-action="view-order" data-id="' + order.id + '" title="Xem">View</button>';
    return '<tr><td><strong>' + escapeHTML(order.orderCode) + '</strong></td><td>' + escapeHTML(order.customerName) + '<br><small style="color:var(--color-muted)">' + escapeHTML(order.customerEmail) + '</small></td><td>' + itemsHtml + '</td><td>' + formatCurrency(order.total) + '</td><td><span class="status-badge status-badge--' + order.paymentStatus + '">' + getPaymentStatusLabel(order.paymentStatus) + '</span></td><td><span class="status-badge status-badge--' + order.status + '">' + getStatusLabel(order.status) + '</span></td><td><div class="action-btns">' + actions + '</div></td></tr>';
  }).join('');
}

function setupOrderActions() {
  document.addEventListener('click', function(e) {
    var confirmBtn = e.target.closest("[data-action='confirm-order']");
    if (confirmBtn) {
      var id = confirmBtn.dataset.id;
      var order = state.orders.find(function(o) { return o.id === id; });
      if (order && confirm('Xac nhan don hang ' + order.orderCode + '?')) {
        order.status = 'confirmed';
        renderOrdersTable(); renderDashboard();
      }
    }
    var shipBtn = e.target.closest("[data-action='ship-order']");
    if (shipBtn) {
      var id = shipBtn.dataset.id;
      var order = state.orders.find(function(o) { return o.id === id; });
      if (order && confirm('Chuyen don ' + order.orderCode + ' sang dang giao?')) {
        order.status = 'shipping';
        renderOrdersTable(); renderDashboard();
      }
    }
    var cancelBtn = e.target.closest("[data-action='cancel-order']");
    if (cancelBtn) {
      var id = cancelBtn.dataset.id;
      var order = state.orders.find(function(o) { return o.id === id; });
      if (order && confirm('Huy don hang ' + order.orderCode + '?')) {
        order.status = 'cancelled';
        renderOrdersTable(); renderDashboard();
      }
    }
    var viewBtn = e.target.closest("[data-action='view-order']");
    if (viewBtn) {
      var id = viewBtn.dataset.id;
      var order = state.orders.find(function(o) { return o.id === id; });
      if (order) {
        alert('Don hang: ' + order.orderCode + '\\nKhach: ' + order.customerName + '\\nSDT: ' + order.customerPhone + '\\nDC: ' + (order.shippingAddress || 'N/A') + '\\n---\\n' + order.items.map(function(i) { return i.productName + ' x ' + i.quantity + ' = ' + formatCurrency(i.unitPrice * i.quantity); }).join('\\n') + '\\n---\\nTong: ' + formatCurrency(order.total));
      }
    }
  });
}

/* ========================================================
   INVENTORY
   ======================================================== */
function renderInventory() {
  var tbody = document.getElementById('inventory-body');
  if (!tbody) return;
  var sorted = state.products.slice().sort(function(a, b) { return a.stock - b.stock; });
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-muted);padding:24px;">Chua co san pham</td></tr>';
    return;
  }
  tbody.innerHTML = sorted.map(function(p) {
    var warn = p.stock <= 5 ? 'RED' : p.stock <= 15 ? 'YEL' : 'GRN';
    var st = p.stock <= 0 ? '<span class="status-badge status-badge--inactive">Het hang</span>' : p.stock <= 10 ? '<span class="status-badge status-badge--pending">Sap het</span>' : '<span class="status-badge status-badge--active">Con hang</span>';
    var wt = p.stock <= 5 ? 'Canh bao thap' : p.stock <= 15 ? 'Sap het' : 'On dinh';
    return '<tr><td><strong>' + escapeHTML(p.name) + '</strong></td><td>' + getCategoryName(p.categoryId) + '</td><td>' + renderStockBadge(p.stock) + ' ' + (p.unit || '') + '</td><td>' + st + '</td><td>' + warn + ' ' + wt + '</td><td><div class="action-btns"><button class="action-btn" data-action="edit-stock" data-id="' + p.id + '" title="Cap nhat ton kho">Edit</button></div></td></tr>';
  }).join('');
  var lowEl = document.getElementById('low-stock-warning');
  if(lowEl){ var lc=state.products.filter(function(p){ return p.stock <= 10; }).length; lowEl.textContent=lc>0?lc+' san pham sap het':'On dinh'; lowEl.className=lc>0?'value value--warning':'value'; }
}
"""

with open(path, 'a', encoding='utf-8') as f:
    f.write(part)
print('Orders + Inventory done')
sys.stdout.flush()
