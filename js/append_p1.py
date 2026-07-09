import sys
path = 'js/admin.js'

part = """
/* ========================================================
   DASHBOARD
   ======================================================== */
function renderDashboard() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthOrders = state.orders.filter(o =>
    new Date(o.createdAt) >= thisMonthStart
  );
  const revenue = thisMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = state.orders.filter(o =>
    ["pending", "preparing", "confirmed"].includes(o.status)
  ).length;
  const activeProducts = state.products.filter(p => p.isActive !== false).length;
  const totalUsers = state.users.filter(u => u.role === "customer").length;

  document.getElementById("stat-revenue").textContent = formatCurrency(revenue);
  document.getElementById("stat-orders").textContent = formatNumber(pendingOrders);
  document.getElementById("stat-products").textContent = formatNumber(activeProducts);
  document.getElementById("stat-users").textContent = formatNumber(totalUsers);
  renderDashboardOrders();
}

function renderDashboardOrders() {
  const tbody = document.getElementById("dashboard-orders-body");
  const recentOrders = state.orders.slice(0, 5);
  if (recentOrders.length === 0) {
    tbody.innerHTML = "<tr><td colspan=\\"6\\" style=\\"text-align:center;color:var(--color-muted);padding:24px;\\">Chua co don hang</td></tr>";
    return;
  }
  tbody.innerHTML = recentOrders.map(order => \`
    <tr>
      <td><strong>\${escapeHTML(order.orderCode)}</strong></td>
      <td>\${escapeHTML(order.customerName)}</td>
      <td>\${order.items.map(i => escapeHTML(i.productName)).join(", ")}</td>
      <td>\${formatCurrency(order.total)}</td>
      <td><span class=\\"status-badge status-badge--\${order.status}\\">\${getStatusLabel(order.status)}</span></td>
      <td>\${formatDate(order.createdAt)}</td>
    </tr>
  \`).join("");
}

function getStatusLabel(status) {
  const labels = { pending: "Cho xu ly", confirmed: "Da xac nhan", preparing: "Dang chuan bi", shipping: "Dang giao", delivered: "Da giao", cancelled: "Da huy" };
  return labels[status] || status;
}

function getPaymentStatusLabel(paymentStatus) {
  const labels = { unpaid: "Chua thanh toan", paid: "Da thanh toan", refunded: "Da hoan tien" };
  return labels[paymentStatus] || paymentStatus;
}
"""

with open(path, 'a', encoding='utf-8') as f:
    f.write(part)
print('Dashboard done')
sys.stdout.flush()
