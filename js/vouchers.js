import { fetchJSON, formatCurrency, formatDate, escapeHTML } from "./utils.js";
import { getCurrentUser, getSavedVouchers, removeSavedVoucher, saveVoucher, isVoucherSaved, mergeAdminVouchers } from "./storage.js";
import { showToast } from "./main.js";

const DATA_PATHS = {
  vouchers: "./data/vouchers.json"
};

let pageState = {
  vouchers: []
};

function getVoucherCategoryLabel(category) {
  return category === "shipping" ? "Giảm phí ship" : "Giảm sản phẩm";
}

function getVoucherBadge(category) {
  return category === "shipping"
    ? '<span class="badge badge--premium">Ship</span>'
    : '<span class="badge badge--sale">Sản phẩm</span>';
}

function calculateDiscount(voucher) {
  if (voucher.discountType === "percent") return `${voucher.discountValue}%`;
  return formatCurrency(voucher.discountValue);
}

function getSavedVoucherList() {
  const saved = getSavedVouchers();
  const savedMap = new Map(saved.map((item) => [item.voucherId, item.savedAt]));
  return pageState.vouchers
    .filter((voucher) => savedMap.has(voucher.id))
    .map((voucher) => ({
      ...voucher,
      savedAt: savedMap.get(voucher.id)
    }));
}

function sortVouchers(vouchers) {
  return [...vouchers].sort((a, b) => {
    if (a.category !== b.category) return a.category === "product" ? -1 : 1;
    if ((a.discountType || "") !== (b.discountType || "")) {
      return a.discountType === "percent" ? -1 : 1;
    }
    if ((b.discountValue || 0) !== (a.discountValue || 0)) return (b.discountValue || 0) - (a.discountValue || 0);
    return String(a.code).localeCompare(String(b.code));
  });
}

function renderVoucherCard(voucher, mode = "browse") {
  const expired = voucher.endDate ? new Date(voucher.endDate) < new Date() : false;
  const saved = isVoucherSaved(voucher.id);
  const savedText = voucher.savedAt ? `Đã lưu ${formatDate(voucher.savedAt)}` : "Đã lưu";

  return `
    <article class="vault-card${expired ? " is-expired" : ""}">
      <div class="vault-card__top">
        ${getVoucherBadge(voucher.category)}
        <span class="vault-card__saved">${mode === "wallet" ? savedText : (saved ? "Đã lưu trong ví" : "Có thể lưu")}</span>
      </div>
      <div class="vault-card__discount">${calculateDiscount(voucher)}</div>
      <div class="vault-card__body">
        <div class="vault-card__code">${escapeHTML(voucher.code)}</div>
        <h3 class="vault-card__title">${escapeHTML(voucher.title)}</h3>
        <p class="vault-card__desc">${escapeHTML(voucher.description || "")}</p>
        <div class="vault-card__meta">
          <span>Đơn từ ${formatCurrency(voucher.minOrderValue || voucher.minOrder || 0)}</span>
          <span>${voucher.endDate ? "HSD " + formatDate(voucher.endDate) : "Không giới hạn"}</span>
        </div>
      </div>
      <div class="vault-card__footer">
        <span class="vault-card__type">${escapeHTML(getVoucherCategoryLabel(voucher.category))}</span>
        ${mode === "wallet"
          ? `<button class="btn btn--ghost btn--sm" data-action="remove-voucher" data-voucher-id="${voucher.id}" type="button">Bỏ lưu</button>`
          : `<button class="btn ${saved ? "btn--outline" : "btn--primary"} btn--sm" data-action="save-voucher" data-voucher-id="${voucher.id}" type="button" ${expired ? "disabled" : ""}>${expired ? "Hết hạn" : saved ? "Đã lưu" : "Lưu voucher"}</button>`}
      </div>
    </article>
  `;
}

function renderVoucherShelf({ eyebrow, title, desc, vouchers, mode, emptyText }) {
  return `
    <section class="vault-shelf">
      <div class="vault-shelf__header">
        <div>
          <span class="vault-shelf__eyebrow">${escapeHTML(eyebrow)}</span>
          <h2 class="vault-shelf__title">${escapeHTML(title)}</h2>
          ${desc ? `<p class="vault-shelf__desc">${escapeHTML(desc)}</p>` : ""}
        </div>
        ${vouchers.length ? `<span class="vault-shelf__count">${vouchers.length} mã</span>` : ""}
      </div>
      ${vouchers.length ? `
        <div class="vault-shelf__track" aria-label="${escapeHTML(title)}">
          ${vouchers.map((voucher) => renderVoucherCard(voucher, mode)).join("")}
        </div>
      ` : `
        <div class="vault-empty vault-empty--compact">
          <h3>${escapeHTML(emptyText)}</h3>
          <p>Voucher sẽ xuất hiện tại đây khi bạn lưu thêm mã mới.</p>
        </div>
      `}
    </section>
  `;
}

function renderPage() {
  const currentUser = getCurrentUser();
  const available = sortVouchers(pageState.vouchers);

  if (!currentUser?.id) {
    return `
      <div class="vault-hero">
        <span class="eyebrow">Voucher hôm nay</span>
        <h1 class="vault-hero__title">Xem ưu đãi trước, đăng nhập khi muốn lưu vào ví</h1>
        <p class="vault-hero__desc">Khách có thể xem toàn bộ voucher. Khi bấm lưu, hệ thống sẽ yêu cầu đăng nhập để gắn voucher vào đúng tài khoản.</p>
      </div>
      ${renderVoucherShelf({
        eyebrow: "Đang mở",
        title: "Voucher có thể lưu",
        desc: "Kéo ngang để xem nhanh các mã đang áp dụng.",
        vouchers: available,
        mode: "browse",
        emptyText: "Chưa có voucher khả dụng"
      })}
    `;
  }

  const savedVouchers = sortVouchers(getSavedVoucherList());
  const savedIds = new Set(savedVouchers.map((voucher) => voucher.id));
  const unsavedVouchers = available.filter((voucher) => !savedIds.has(voucher.id));

  return `
    <div class="vault-hero">
      <span class="eyebrow">Kho voucher của tôi</span>
      <h1 class="vault-hero__title">Kho voucher của tôi</h1>
    </div>

    ${renderVoucherShelf({
      eyebrow: "Đã lưu",
      title: "Sẵn sàng dùng khi thanh toán",
      desc: "Các voucher trong ví của bạn, có thể bỏ lưu nếu không còn cần.",
      vouchers: savedVouchers,
      mode: "wallet",
      emptyText: "Bạn chưa lưu voucher nào"
    })}

    ${renderVoucherShelf({
      eyebrow: "Gợi ý thêm",
      title: "Voucher khác có thể lưu",
      desc: "Những mã còn lại, kéo ngang để chọn thêm vào kho.",
      vouchers: unsavedVouchers,
      mode: "browse",
      emptyText: "Bạn đã lưu hết voucher đang có"
    })}
  `;
}

function bindEvents() {
  document.getElementById("vouchers-root")?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-action='remove-voucher']");
    if (removeButton) {
      const voucherId = removeButton.dataset.voucherId;
      if (!voucherId) return;
      removeSavedVoucher(voucherId);
      showToast("Đã bỏ lưu voucher");
      rerender();
      return;
    }

    const saveButton = event.target.closest("[data-action='save-voucher']");
    if (!saveButton) return;
    if (saveButton.disabled) return;
    const voucherId = saveButton.dataset.voucherId;
    if (!voucherId) return;

    if (!getCurrentUser()?.id) {
      showToast("Vui lòng đăng nhập để lưu voucher vào ví", "warning");
      setTimeout(() => {
        window.location.href = "./login.html?redirect=vouchers";
      }, 700);
      return;
    }

    saveVoucher(voucherId);
    showToast("Đã lưu voucher vào ví của bạn");
    rerender();
  });
}

function rerender() {
  const root = document.getElementById("vouchers-root");
  if (!root) return;
  root.innerHTML = renderPage();
}

async function initVouchersPage() {
  const vouchersRaw = await fetchJSON(DATA_PATHS.vouchers, []);
  pageState.vouchers = mergeAdminVouchers(vouchersRaw || []).filter((voucher) => voucher.isActive !== false);
  const root = document.getElementById("vouchers-root");
  if (!root) return;
  root.innerHTML = renderPage();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "vouchers") {
    initVouchersPage();
  }
});

export { initVouchersPage };
