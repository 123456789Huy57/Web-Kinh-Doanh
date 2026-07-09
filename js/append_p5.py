import sys
path = 'js/admin.js'

part = r"""
/* ========================================================
   BANNERS (static sample data)
   ======================================================== */
function renderBanners() {
  var tbody = document.getElementById('banners-body');
  if (!tbody) return;
  var banners = [
    { id: 'b1', title: 'Sale Cuoi Mua', status: 'active', schedule: '01/06 - 30/06' },
    { id: 'b2', title: 'Bo Suan Mua He', status: 'inactive', schedule: 'Khong han' },
    { id: 'b3', title: 'Giam 20% Moi Ngay', status: 'active', schedule: 'Hang ngay' }
  ];
  tbody.innerHTML = banners.map(function(b) {
    var badge = b.status === 'active' ? '<span class="status-badge status-badge--active">Dang hien</span>' : '<span class="status-badge status-badge--inactive">An</span>';
    return '<tr><td><strong>' + b.title + '</strong></td><td>' + badge + '</td><td>' + b.schedule + '</td><td><div class="action-btns"><button class="action-btn" title="Chinh sua">Sua</button><button class="action-btn action-btn--danger" title="Xoa">X</button></div></td></tr>';
  }).join('');
}

/* ========================================================
   SUPPORT (static sample data)
   ======================================================== */
function renderSupport() {
  var tbody = document.getElementById('support-body');
  if (!tbody) return;
  var tickets = [
    { id: 'TK-001', customer: 'Nguyen Van A', subject: 'Loi thanh toan', status: 'pending', date: '2025-06-10' },
    { id: 'TK-002', customer: 'Tran Thi B', subject: 'Hoi ve san pham', status: 'resolved', date: '2025-06-08' },
    { id: 'TK-003', customer: 'Le Van C', subject: 'Doi tra hang', status: 'pending', date: '2025-06-11' }
  ];
  tbody.innerHTML = tickets.map(function(t) {
    var badge = t.status === 'pending' ? '<span class="status-badge status-badge--pending">Dang xu ly</span>' : '<span class="status-badge status-badge--active">Da giai quyet</span>';
    return '<tr><td><strong>' + t.id + '</strong></td><td>' + escapeHTML(t.customer) + '</td><td>' + escapeHTML(t.subject) + '</td><td>' + badge + '</td><td>' + t.date + '</td><td><div class="action-btns"><button class="action-btn" title="Tra loi">Reply</button></div></td></tr>';
  }).join('');
}

/* ========================================================
   SETTINGS
   ======================================================== */
function setupSettings() {
  var saveBtn = document.getElementById('btn-save-shop');
  var clearBtn = document.getElementById('btn-clear-data');
  var notifToggle = document.getElementById('notif-new-order');

  if (saveBtn) saveBtn.addEventListener('click', function() {
    var shopName = document.getElementById('shop-name');
    var shopEmail = document.getElementById('shop-email');
    var shopPhone = document.getElementById('shop-phone');
    var shopAddress = document.getElementById('shop-address');
    var settings = {
      shopName: shopName ? shopName.value : 'NutriStore',
      shopEmail: shopEmail ? shopEmail.value : 'contact@nutristore.vn',
      shopPhone: shopPhone ? shopPhone.value : '0123-456-789',
      shopAddress: shopAddress ? shopAddress.value : ''
    };
    localStorage.setItem('aic_settings', JSON.stringify(settings));
    alert('Da luu cai dat!');
  });

  if (clearBtn) clearBtn.addEventListener('click', function() {
    if (confirm('Xac nhan xoa tat ca du lieu localStorage? Hanh dong nay khong the hoan tac.')) {
      Object.keys(localStorage).forEach(function(key) {
        if (key.startsWith('aic_')) localStorage.removeItem(key);
      });
      alert('Da xoa du lieu. Tai lai trang...');
      window.location.reload();
    }
  });

  if (notifToggle) {
    var saved = localStorage.getItem('aic_notif_new_order');
    notifToggle.checked = saved !== 'false';
    notifToggle.addEventListener('change', function() {
      localStorage.setItem('aic_notif_new_order', String(this.checked));
    });
  }
}

/* ========================================================
   BOOT
   ======================================================== */
document.addEventListener('DOMContentLoaded', function() {
  init();
  setupProductModal();
  setupVoucherModal();
  setupOrderActions();
  setupUserActions();
  setupSettings();
});
"""

with open(path, 'a', encoding='utf-8') as f:
    f.write(part)
print('Banners + Support + Settings + DOMContentLoaded done')
sys.stdout.flush()
