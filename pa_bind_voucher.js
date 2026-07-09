function bindVoucherSave() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='save-voucher']");
    if (!btn) return;
    const voucherId = btn.dataset.voucherId;
    if (!voucherId) return;

    saveVoucher(voucherId);
    btn.textContent = "✓ Đã lưu";
    btn.disabled = true;
    btn.classList.remove("btn--primary");
    btn.classList.add("btn--success");
    showToast("Đã lưu voucher vào kho của bạn");
  });
}

function bindAddToCart() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='add-to-cart']");
    if (!btn) return;
    e.preventDefault();

    const productId = btn.dataset.productId;
    if (!productId) return;

    const { getActiveCart: gac, setActiveCart: sac } = window.__storageExports || {};
    if (!gac || !sac) return;

    const cart = gac();
    if (!cart.items) cart.items = [];
    const existing = cart.items.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({ productId, quantity: 1 });
    }
    cart.updatedAt = new Date().toISOString();
    sac(cart);

    btn.textContent = "✓";
    setTimeout(() => { btn.textContent = "+"; }, 1000);
    showToast("Đã thêm vào giỏ hàng!");

    const badge = document.querySelector(".header-action-btn__badge");
    const newCount = cart.items.reduce((s, i) => s + i.quantity, 0);
    if (badge) {
      badge.textContent = newCount > 99 ? "99+" : newCount;
    }
  });
}

function bindProductAccordions() {
  document.querySelectorAll("[data-accordion-trigger]").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const accordion = trigger.closest(".product-accordion");
      if (!accordion) return;
      accordion.classList.toggle("is-open");
    });
  });
}

function renderCategorySidebar(categories, activeCategory = "") {
  return `
    <aside class="category-sidebar">
      <div class="category-sidebar__header">Danh mục sản 