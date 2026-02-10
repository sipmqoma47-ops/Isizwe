/* app1.js — updated: image lightbox + WhatsApp force-open via wa.me */
(() => {
  if (window.__ISIZWE_APP1_LOADED__) return;
  window.__ISIZWE_APP1_LOADED__ = true;

  const DEFAULT_WHATSAPP = "27730708651"; // digits only

  const state = {
    categories: [],
    activeSlug: null,
    activeMeta: null,
    products: [],
    query: "",
    whatsapp: null
  };

  function $(id) { return document.getElementById(id); }
  function safeEl(id) { return $(id) || null; }

  function getWhatsAppNumber() {
    const fromApi = String(state.whatsapp || "").replace(/[^\d]/g, "");
    if (fromApi) return fromApi;

    const fromWindow = String(window.ISIZWE_WHATSAPP || "").replace(/[^\d]/g, "");
    if (fromWindow) return fromWindow;

    return DEFAULT_WHATSAPP;
  }

  // WhatsApp Click-to-Chat API
  function waLink(number, product, qty, notes) {
    const note = notes ? `\nNotes: ${notes}` : "";
    const msg =
      `Hi Isizwe Print & Projects,\n\n` +
      `I would like to order:\n` +
      `📄 Product: ${product.name}\n` +
      `📦 Quantity: ${qty}\n` +
      `💰 Price: ${product.price}${note}\n\n` +
      `Please confirm the price and turnaround time.\n` +
      `Thank you!`;

    const n = String(number || "").replace(/[^\d]/g, "");
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
  }

  // Force open WhatsApp (web/app)
  function openWhatsApp(url) {
    // Must be called from a user click to avoid popup blockers
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // =====================
  // Lightbox
  // =====================
  function ensureLightbox() {
    if (document.getElementById("imgLightbox")) return;

    const style = document.createElement("style");
    style.id = "imgLightboxStyle";
    style.textContent = `
      #imgLightbox{position:fixed;inset:0;background:rgba(0,0,0,.82);display:none;align-items:center;justify-content:center;padding:18px;z-index:3000}
      #imgLightbox.open{display:flex}
      #imgLightbox .lb-card{width:min(1000px,95vw);max-height:88vh;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);position:relative}
      #imgLightbox img{width:100%;height:auto;max-height:88vh;object-fit:contain;display:block;background:rgba(0,0,0,.15)}
      #imgLightbox .lb-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:10px;align-items:center;justify-content:space-between;pointer-events:none}
      #imgLightbox .lb-title{pointer-events:none;color:#fff;font-weight:800;font-size:14px;text-shadow:0 2px 10px rgba(0,0,0,.45);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:80%}
      #imgLightbox .lb-close{pointer-events:auto;border:none;cursor:pointer;width:42px;height:42px;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;font-size:18px;font-weight:900}
      #imgLightbox .lb-close:hover{background:rgba(0,0,0,.65)}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "imgLightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="lb-card">
        <div class="lb-top">
          <div class="lb-title" id="lbTitle"></div>
          <button class="lb-close" id="lbClose" aria-label="Close image">✕</button>
        </div>
        <img id="lbImg" alt="Preview" />
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = document.getElementById("lbClose");
    const lbImg = document.getElementById("lbImg");

    function close() {
      overlay.classList.remove("open");
      overlay.style.display = "none";
      lbImg.src = "";
    }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
  }

  function openLightbox(src, title) {
    ensureLightbox();
    const overlay = document.getElementById("imgLightbox");
    const lbImg = document.getElementById("lbImg");
    const lbTitle = document.getElementById("lbTitle");
    lbTitle.textContent = title || "";
    lbImg.src = src;
    overlay.style.display = "flex";
    overlay.classList.add("open");
  }

  // =====================
  // Render
  // =====================
  function renderTabs() {
    const tabs = safeEl("tabs");
    if (!tabs) return;

    tabs.innerHTML = "";
    state.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "tab";
      btn.type = "button";
      btn.textContent = cat.label;
      btn.onclick = () => setActive(cat.slug);
      tabs.appendChild(btn);
    });

    syncActiveTab();
  }

  function syncActiveTab() {
    const tabsContainer = safeEl("tabs");
    if (!tabsContainer) return;

    const tabs = tabsContainer.children;
    [...tabs].forEach((btn, idx) => {
      const cat = state.categories[idx];
      const isActive = cat && cat.slug === state.activeSlug;
      btn.classList.toggle("active", !!isActive);
    });
  }

  function currentProducts() {
    const q = (state.query || "").trim().toLowerCase();
    if (!q) return state.products;
    return state.products.filter((p) => {
      const t = `${p.name} ${p.desc || ""} ${p.price || ""}`.toLowerCase();
      return t.includes(q);
    });
  }

  function render() {
    const grid = safeEl("grid");
    const emptyEl = safeEl("empty");
    if (!grid) return;

    grid.innerHTML = "";
    const products = currentProducts();

    if (emptyEl) {
      if (products.length === 0) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = "No products available in this category.";
      } else {
        emptyEl.classList.add("hidden");
      }
    }

    products.forEach((p) => renderProductCard(p, grid));
  }

  function renderProductCard(product, container) {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card__img";
    img.src = product.image || "/static/images/placeholder.jpg";
    img.alt = product.name;
    img.loading = "lazy";
    img.style.cursor = "zoom-in";
    img.onerror = () => {
      img.src = "/static/images/placeholder.jpg";
      img.style.cursor = "default";
    };
    img.addEventListener("click", () => openLightbox(img.src, product.name));

    const body = document.createElement("div");
    body.className = "card__body";

    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = product.name;

    const desc = document.createElement("p");
    desc.className = "card__desc";
    desc.textContent = product.desc || "High-quality printing service";

    const price = document.createElement("div");
    price.className = "card__price";
    price.textContent = product.price || "Contact for pricing";

    const qtyRow = createQuantitySelector();

    const notes = document.createElement("input");
    notes.className = "card__notes";
    notes.type = "text";
    notes.placeholder = "Add notes (optional) - e.g., color, size, finish...";

    const wa = document.createElement("a");
    wa.className = "wa";
    wa.href = "#";
    wa.innerHTML = `<span style="font-size:1.25rem;">💬</span><span>Order via WhatsApp</span>`;
    wa.setAttribute("role", "button");

    function updateOrderLink() {
      const qty = Math.max(1, parseInt(qtyRow.input.value || "1", 10) || 1);
      qtyRow.input.value = String(qty);

      const number = getWhatsAppNumber();
      const url = waLink(number, product, qty, notes.value.trim());
      wa.dataset.url = url; // store url for click handler
      wa.href = url;        // also set href as fallback
    }

    // ✅ Force open WhatsApp on click
    wa.addEventListener("click", (e) => {
      e.preventDefault();
      const url = wa.dataset.url || wa.href;
      if (url && url !== "#") openWhatsApp(url);
    });

    qtyRow.minus.onclick = () => { qtyRow.input.value = String(Math.max(1, (parseInt(qtyRow.input.value, 10) || 1) - 1)); updateOrderLink(); };
    qtyRow.plus.onclick  = () => { qtyRow.input.value = String((parseInt(qtyRow.input.value, 10) || 1) + 1); updateOrderLink(); };
    qtyRow.input.oninput = updateOrderLink;
    notes.oninput = updateOrderLink;

    updateOrderLink();

    body.append(title, desc, price, qtyRow.container, notes, wa);
    card.append(img, body);
    container.append(card);
  }

  function createQuantitySelector() {
    const container = document.createElement("div");
    container.className = "card__qty";
    container.style.cssText = "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;";

    const label = document.createElement("label");
    label.textContent = "Qty:";
    label.style.cssText = "font-weight:700;font-size:.875rem;";

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;align-items:center;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:#fff;";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.style.cssText = "width:36px;height:36px;border:none;background:var(--gray-100);font-weight:900;cursor:pointer;";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.value = "1";
    input.style.cssText = "width:56px;height:36px;border:none;border-left:1px solid var(--border);border-right:1px solid var(--border);text-align:center;font-weight:800;";

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.style.cssText = minus.style.cssText;

    controls.append(minus, input, plus);
    container.append(label, controls);

    return { container, minus, input, plus };
  }

  // =====================
  // API
  // =====================
  async function loadCategories() {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.categories = await res.json();
    renderTabs();
    const first = state.categories[0];
    if (first) await setActive(first.slug);
  }

  async function loadProducts(slug) {
    const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.activeMeta = data.category;
    state.products = data.products || [];
    state.whatsapp = data.whatsapp; // if missing, fallback will be used
  }

  async function setActive(slug) {
    state.activeSlug = slug;
    syncActiveTab();
    await loadProducts(slug);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function init() {
    try {
      ensureLightbox();
      await loadCategories();
    } catch (e) {
      console.error(e);
      const emptyEl = safeEl("empty");
      if (emptyEl) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = "Failed to load products. Please refresh.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
/* app1.js — updated: image lightbox + WhatsApp force-open via wa.me */
(() => {
  if (window.__ISIZWE_APP1_LOADED__) return;
  window.__ISIZWE_APP1_LOADED__ = true;

  const DEFAULT_WHATSAPP = "27730708651"; // digits only

  const state = {
    categories: [],
    activeSlug: null,
    activeMeta: null,
    products: [],
    query: "",
    whatsapp: null
  };

  function $(id) { return document.getElementById(id); }
  function safeEl(id) { return $(id) || null; }

  function getWhatsAppNumber() {
    const fromApi = String(state.whatsapp || "").replace(/[^\d]/g, "");
    if (fromApi) return fromApi;

    const fromWindow = String(window.ISIZWE_WHATSAPP || "").replace(/[^\d]/g, "");
    if (fromWindow) return fromWindow;

    return DEFAULT_WHATSAPP;
  }

  // WhatsApp Click-to-Chat API
  function waLink(number, product, qty, notes) {
    const note = notes ? `\nNotes: ${notes}` : "";
    const msg =
      `Hi Isizwe Print & Projects,\n\n` +
      `I would like to order:\n` +
      `📄 Product: ${product.name}\n` +
      `📦 Quantity: ${qty}\n` +
      `💰 Price: ${product.price}${note}\n\n` +
      `Please confirm the price and turnaround time.\n` +
      `Thank you!`;

    const n = String(number || "").replace(/[^\d]/g, "");
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
  }

  // Force open WhatsApp (web/app)
  function openWhatsApp(url) {
    // Must be called from a user click to avoid popup blockers
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // =====================
  // Lightbox
  // =====================
  function ensureLightbox() {
    if (document.getElementById("imgLightbox")) return;

    const style = document.createElement("style");
    style.id = "imgLightboxStyle";
    style.textContent = `
      #imgLightbox{position:fixed;inset:0;background:rgba(0,0,0,.82);display:none;align-items:center;justify-content:center;padding:18px;z-index:3000}
      #imgLightbox.open{display:flex}
      #imgLightbox .lb-card{width:min(1000px,95vw);max-height:88vh;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);position:relative}
      #imgLightbox img{width:100%;height:auto;max-height:88vh;object-fit:contain;display:block;background:rgba(0,0,0,.15)}
      #imgLightbox .lb-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:10px;align-items:center;justify-content:space-between;pointer-events:none}
      #imgLightbox .lb-title{pointer-events:none;color:#fff;font-weight:800;font-size:14px;text-shadow:0 2px 10px rgba(0,0,0,.45);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:80%}
      #imgLightbox .lb-close{pointer-events:auto;border:none;cursor:pointer;width:42px;height:42px;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;font-size:18px;font-weight:900}
      #imgLightbox .lb-close:hover{background:rgba(0,0,0,.65)}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "imgLightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="lb-card">
        <div class="lb-top">
          <div class="lb-title" id="lbTitle"></div>
          <button class="lb-close" id="lbClose" aria-label="Close image">✕</button>
        </div>
        <img id="lbImg" alt="Preview" />
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = document.getElementById("lbClose");
    const lbImg = document.getElementById("lbImg");

    function close() {
      overlay.classList.remove("open");
      overlay.style.display = "none";
      lbImg.src = "";
    }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
  }

  function openLightbox(src, title) {
    ensureLightbox();
    const overlay = document.getElementById("imgLightbox");
    const lbImg = document.getElementById("lbImg");
    const lbTitle = document.getElementById("lbTitle");
    lbTitle.textContent = title || "";
    lbImg.src = src;
    overlay.style.display = "flex";
    overlay.classList.add("open");
  }

  // =====================
  // Render
  // =====================
  function renderTabs() {
    const tabs = safeEl("tabs");
    if (!tabs) return;

    tabs.innerHTML = "";
    state.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "tab";
      btn.type = "button";
      btn.textContent = cat.label;
      btn.onclick = () => setActive(cat.slug);
      tabs.appendChild(btn);
    });

    syncActiveTab();
  }

  function syncActiveTab() {
    const tabsContainer = safeEl("tabs");
    if (!tabsContainer) return;

    const tabs = tabsContainer.children;
    [...tabs].forEach((btn, idx) => {
      const cat = state.categories[idx];
      const isActive = cat && cat.slug === state.activeSlug;
      btn.classList.toggle("active", !!isActive);
    });
  }

  function currentProducts() {
    const q = (state.query || "").trim().toLowerCase();
    if (!q) return state.products;
    return state.products.filter((p) => {
      const t = `${p.name} ${p.desc || ""} ${p.price || ""}`.toLowerCase();
      return t.includes(q);
    });
  }

  function render() {
    const grid = safeEl("grid");
    const emptyEl = safeEl("empty");
    if (!grid) return;

    grid.innerHTML = "";
    const products = currentProducts();

    if (emptyEl) {
      if (products.length === 0) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = "No products available in this category.";
      } else {
        emptyEl.classList.add("hidden");
      }
    }

    products.forEach((p) => renderProductCard(p, grid));
  }

  function renderProductCard(product, container) {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card__img";
    img.src = product.image || "/static/images/placeholder.jpg";
    img.alt = product.name;
    img.loading = "lazy";
    img.style.cursor = "zoom-in";
    img.onerror = () => {
      img.src = "/static/images/placeholder.jpg";
      img.style.cursor = "default";
    };
    img.addEventListener("click", () => openLightbox(img.src, product.name));

    const body = document.createElement("div");
    body.className = "card__body";

    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = product.name;

    const desc = document.createElement("p");
    desc.className = "card__desc";
    desc.textContent = product.desc || "High-quality printing service";

    const price = document.createElement("div");
    price.className = "card__price";
    price.textContent = product.price || "Contact for pricing";

    const qtyRow = createQuantitySelector();

    const notes = document.createElement("input");
    notes.className = "card__notes";
    notes.type = "text";
    notes.placeholder = "Add notes (optional) - e.g., color, size, finish...";

    const wa = document.createElement("a");
    wa.className = "wa";
    wa.href = "#";
    wa.innerHTML = `<span style="font-size:1.25rem;">💬</span><span>Order via WhatsApp</span>`;
    wa.setAttribute("role", "button");

    function updateOrderLink() {
      const qty = Math.max(1, parseInt(qtyRow.input.value || "1", 10) || 1);
      qtyRow.input.value = String(qty);

      const number = getWhatsAppNumber();
      const url = waLink(number, product, qty, notes.value.trim());
      wa.dataset.url = url; // store url for click handler
      wa.href = url;        // also set href as fallback
    }

    // ✅ Force open WhatsApp on click
    wa.addEventListener("click", (e) => {
      e.preventDefault();
      const url = wa.dataset.url || wa.href;
      if (url && url !== "#") openWhatsApp(url);
    });

    qtyRow.minus.onclick = () => { qtyRow.input.value = String(Math.max(1, (parseInt(qtyRow.input.value, 10) || 1) - 1)); updateOrderLink(); };
    qtyRow.plus.onclick  = () => { qtyRow.input.value = String((parseInt(qtyRow.input.value, 10) || 1) + 1); updateOrderLink(); };
    qtyRow.input.oninput = updateOrderLink;
    notes.oninput = updateOrderLink;

    updateOrderLink();

    body.append(title, desc, price, qtyRow.container, notes, wa);
    card.append(img, body);
    container.append(card);
  }

  function createQuantitySelector() {
    const container = document.createElement("div");
    container.className = "card__qty";
    container.style.cssText = "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;";

    const label = document.createElement("label");
    label.textContent = "Qty:";
    label.style.cssText = "font-weight:700;font-size:.875rem;";

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;align-items:center;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:#fff;";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.style.cssText = "width:36px;height:36px;border:none;background:var(--gray-100);font-weight:900;cursor:pointer;";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.value = "1";
    input.style.cssText = "width:56px;height:36px;border:none;border-left:1px solid var(--border);border-right:1px solid var(--border);text-align:center;font-weight:800;";

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.style.cssText = minus.style.cssText;

    controls.append(minus, input, plus);
    container.append(label, controls);

    return { container, minus, input, plus };
  }

  // =====================
  // API
  // =====================
  async function loadCategories() {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.categories = await res.json();
    renderTabs();
    const first = state.categories[0];
    if (first) await setActive(first.slug);
  }

  async function loadProducts(slug) {
    const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.activeMeta = data.category;
    state.products = data.products || [];
    state.whatsapp = data.whatsapp; // if missing, fallback will be used
  }

  async function setActive(slug) {
    state.activeSlug = slug;
    syncActiveTab();
    await loadProducts(slug);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function init() {
    try {
      ensureLightbox();
      await loadCategories();
    } catch (e) {
      console.error(e);
      const emptyEl = safeEl("empty");
      if (emptyEl) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = "Failed to load products. Please refresh.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

