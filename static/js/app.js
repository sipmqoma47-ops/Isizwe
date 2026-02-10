/* app1.js — patched (no duplicates + safe init guard) */
(() => {
  // If this script gets included twice, don't run twice.
  if (window.__ISIZWE_APP1_LOADED__) return;
  window.__ISIZWE_APP1_LOADED__ = true;

  // =====================
  // Application State
  // =====================
  const state = {
    categories: [],
    activeSlug: null,
    activeMeta: null,
    products: [],
    query: "",
    whatsapp: null
  };

  // =====================
  // Helpers
  // =====================
  function $(id) {
    return document.getElementById(id);
  }

  function safeEl(id) {
    const el = $(id);
    if (!el) console.warn(`[app1] Missing element #${id}`);
    return el;
  }

  // Generate WhatsApp link with order details
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

    // `number` must be digits only for wa.me
    const n = String(number || "").replace(/[^\d]/g, "");
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
  }

  // =====================
  // UI Rendering
  // =====================
  function renderTabs() {
    const tabs = safeEl("tabs");
    if (!tabs) return;

    tabs.innerHTML = "";

    state.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "tab";
      btn.textContent = cat.label;
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `View ${cat.label} products`);
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
      btn.setAttribute("aria-selected", String(!!isActive));
    });
  }

  function currentProducts() {
    const q = (state.query || "").trim().toLowerCase();
    if (!q) return state.products;

    return state.products.filter((p) => {
      const searchText = `${p.name} ${p.desc || ""} ${p.price || ""}`.toLowerCase();
      return searchText.includes(q);
    });
  }

  function render() {
    const titleEl = safeEl("categoryTitle");
    const descEl = safeEl("categoryDesc");
    const grid = safeEl("grid");
    const emptyEl = safeEl("empty");

    if (titleEl) titleEl.textContent = state.activeMeta?.label || "Products";
    if (descEl) descEl.textContent = state.activeMeta?.description || "";

    if (!grid) return;
    grid.innerHTML = "";

    const products = currentProducts();

    if (emptyEl) {
      if (products.length === 0) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = state.query
          ? `No products found for "${state.query}". Try a different search.`
          : "No products available in this category.";
      } else {
        emptyEl.classList.add("hidden");
      }
    }

    products.forEach((p) => renderProductCard(p, grid));
  }

  function renderProductCard(product, container) {
    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("role", "listitem");

    // Product image
    const img = document.createElement("img");
    img.className = "card__img";
    img.src = product.image || "/static/images/placeholder.jpg";
    img.alt = product.name;
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "/static/images/placeholder.jpg";
      img.alt = "Product image not available";
    };

    // Card body
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
    price.style.cssText =
      "font-weight: 700; color: var(--primary); font-size: 1.125rem; margin-bottom: 0.5rem;";

    const qtyRow = createQuantitySelector();

    const notes = document.createElement("input");
    notes.className = "card__notes";
    notes.type = "text";
    notes.placeholder = "Add notes (optional) - e.g., color, size, finish...";
    notes.setAttribute("aria-label", "Order notes");
    notes.style.cssText = `
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-family: inherit;
      background: var(--bg);
      transition: all var(--transition-fast);
    `;
    notes.onfocus = function () {
      this.style.borderColor = "var(--primary)";
      this.style.background = "white";
    };
    notes.onblur = function () {
      this.style.borderColor = "var(--border)";
      this.style.background = "var(--bg)";
    };

    const wa = document.createElement("a");
    wa.className = "wa";
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    wa.setAttribute("aria-label", `Order ${product.name} via WhatsApp`);
    wa.innerHTML = `
      <span style="font-size: 1.25rem;">💬</span>
      <span>Order via WhatsApp</span>
    `;

    function updateOrderLink() {
      const qty = Math.max(1, parseInt(qtyRow.input.value || "1", 10) || 1);
      qtyRow.input.value = String(qty);

      if (!state.whatsapp) {
        // Avoid broken link if API didn't provide whatsapp
        wa.href = "#";
        wa.onclick = (e) => {
          e.preventDefault();
          alert("WhatsApp number not configured yet.");
        };
        return;
      }

      wa.onclick = null;
      wa.href = waLink(state.whatsapp, product, qty, notes.value.trim());
    }

    qtyRow.minus.onclick = () => {
      qtyRow.input.value = String(Math.max(1, (parseInt(qtyRow.input.value, 10) || 1) - 1));
      updateOrderLink();
    };
    qtyRow.plus.onclick = () => {
      qtyRow.input.value = String((parseInt(qtyRow.input.value, 10) || 1) + 1);
      updateOrderLink();
    };
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
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.5rem 0;
    `;

    const label = document.createElement("label");
    label.textContent = "Qty:";
    label.style.cssText = "font-weight: 600; font-size: 0.875rem; color: var(--gray-700);";

    const controls = document.createElement("div");
    controls.style.cssText = `
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: white;
    `;

    const minus = document.createElement("button");
    minus.className = "qty-btn";
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Decrease quantity");
    minus.style.cssText = `
      width: 36px;
      height: 36px;
      border: none;
      background: var(--gray-100);
      color: var(--gray-700);
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    minus.onmouseover = () => (minus.style.background = "var(--gray-200)");
    minus.onmouseout = () => (minus.style.background = "var(--gray-100)");

    const input = document.createElement("input");
    input.className = "qty-input";
    input.type = "number";
    input.min = "1";
    input.value = "1";
    input.setAttribute("aria-label", "Quantity");
    input.style.cssText = `
      width: 50px;
      height: 36px;
      border: none;
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
      text-align: center;
      font-size: 1rem;
      font-weight: 600;
      outline: none;
      -moz-appearance: textfield;
    `;

    // Add spinner-hiding CSS once
    if (!document.getElementById("qty-spinner-hide-style")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "qty-spinner-hide-style";
      styleSheet.textContent = `
        .qty-input::-webkit-inner-spin-button,
        .qty-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    const plus = document.createElement("button");
    plus.className = "qty-btn";
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Increase quantity");
    plus.style.cssText = minus.style.cssText;
    plus.onmouseover = () => (plus.style.background = "var(--gray-200)");
    plus.onmouseout = () => (plus.style.background = "var(--gray-100)");

    controls.append(minus, input, plus);
    container.append(label, controls);

    return { container, minus, input, plus };
  }

  function showError(message) {
    const titleEl = safeEl("categoryTitle");
    const descEl = safeEl("categoryDesc");
    const grid = safeEl("grid");
    const emptyEl = safeEl("empty");

    if (titleEl) titleEl.textContent = "Error";
    if (descEl) descEl.textContent = message;
    if (grid) grid.innerHTML = "";
    if (emptyEl) emptyEl.classList.add("hidden");
  }

  // =====================
  // API Calls
  // =====================
  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      state.categories = await res.json();
      renderTabs();

      const first = state.categories[0];
      if (first) await setActive(first.slug);
    } catch (err) {
      console.error("Failed to load categories:", err);
      showError("Failed to load categories. Please refresh the page.");
    }
  }

  async function loadProducts(slug) {
    try {
      const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      state.activeMeta = data.category;
      state.products = data.products || [];
      state.whatsapp = data.whatsapp;
    } catch (err) {
      console.error("Failed to load products:", err);
      showError("Failed to load products. Please try again.");
    }
  }

  async function setActive(slug) {
    state.activeSlug = slug;
    state.query = "";

    const searchEl = safeEl("search");
    if (searchEl) searchEl.value = "";

    syncActiveTab();

    const titleEl = safeEl("categoryTitle");
    const descEl = safeEl("categoryDesc");
    const grid = safeEl("grid");

    if (titleEl) titleEl.textContent = "Loading...";
    if (descEl) descEl.textContent = "";
    if (grid) grid.innerHTML = "";

    await loadProducts(slug);
    render();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =====================
  // Event wiring
  // =====================
  function wireEvents() {
    const search = safeEl("search");
    const clearBtn = safeEl("clearBtn");
    const tabsContainer = safeEl("tabs");

    if (search && !search.dataset.bound) {
      search.dataset.bound = "1";

      search.addEventListener("input", (e) => {
        state.query = e.target.value || "";
        render();
      });

      search.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          state.query = "";
          search.value = "";
          render();
        }
      });
    }

    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = "1";
      clearBtn.addEventListener("click", () => {
        state.query = "";
        if (search) {
          search.value = "";
          search.focus();
        }
        render();
      });
    }

    if (tabsContainer && !tabsContainer.dataset.bound) {
      tabsContainer.dataset.bound = "1";
      tabsContainer.addEventListener("keydown", (e) => {
        const tabs = [...tabsContainer.children];
        const currentIndex = tabs.findIndex((tab) => tab.classList.contains("active"));

        if (e.key === "ArrowRight" && currentIndex < tabs.length - 1) {
          tabs[currentIndex + 1].click();
          tabs[currentIndex + 1].focus();
        } else if (e.key === "ArrowLeft" && currentIndex > 0) {
          tabs[currentIndex - 1].click();
          tabs[currentIndex - 1].focus();
        }
      });
    }

    document.documentElement.style.scrollBehavior = "smooth";
  }

  // =====================
  // Init
  // =====================
  async function init() {
    try {
      wireEvents();

      const titleEl = safeEl("categoryTitle");
      const descEl = safeEl("categoryDesc");
      if (titleEl) titleEl.textContent = "Loading Products...";
      if (descEl) descEl.textContent = "Please wait while we fetch our printing services.";

      await loadCategories();
    } catch (err) {
      console.error("Initialization error:", err);
      showError("Failed to load application. Please refresh the page or check your connection.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Optional debugging exports
  window.appState = state;
  window.appDebug = { loadCategories, setActive, render };
})();
/* app1.js — patched (no duplicates + safe init guard) */
(() => {
  // If this script gets included twice, don't run twice.
  if (window.__ISIZWE_APP1_LOADED__) return;
  window.__ISIZWE_APP1_LOADED__ = true;

  // =====================
  // Application State
  // =====================
  const state = {
    categories: [],
    activeSlug: null,
    activeMeta: null,
    products: [],
    query: "",
    whatsapp: null
  };

  // =====================
  // Helpers
  // =====================
  function $(id) {
    return document.getElementById(id);
  }

  function safeEl(id) {
    const el = $(id);
    if (!el) console.warn(`[app1] Missing element #${id}`);
    return el;
  }

  // Generate WhatsApp link with order details
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

    // `number` must be digits only for wa.me
    const n = String(number || "").replace(/[^\d]/g, "");
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
  }

  // =====================
  // UI Rendering
  // =====================
  function renderTabs() {
    const tabs = safeEl("tabs");
    if (!tabs) return;

    tabs.innerHTML = "";

    state.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "tab";
      btn.textContent = cat.label;
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `View ${cat.label} products`);
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
      btn.setAttribute("aria-selected", String(!!isActive));
    });
  }

  function currentProducts() {
    const q = (state.query || "").trim().toLowerCase();
    if (!q) return state.products;

    return state.products.filter((p) => {
      const searchText = `${p.name} ${p.desc || ""} ${p.price || ""}`.toLowerCase();
      return searchText.includes(q);
    });
  }

  function render() {
    const titleEl = safeEl("categoryTitle");
    const descEl = safeEl("categoryDesc");
    const grid = safeEl("grid");
    const emptyEl = safeEl("empty");

    if (titleEl) titleEl.textContent = state.activeMeta?.label || "Products";
    if (descEl) descEl.textContent = state.activeMeta?.description || "";

    if (!grid) return;
    grid.innerHTML = "";

    const products = currentProducts();

    if (emptyEl) {
      if (products.length === 0) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = state.query
          ? `No products found for "${state.query}". Try a different search.`
          : "No products available in this category.";
      } else {
        emptyEl.classList.add("hidden");
      }
    }

    products.forEach((p) => renderProductCard(p, grid));
  }

  function renderProductCard(product, container) {
    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("role", "listitem");

    // Product image
    const img = document.createElement("img");
    img.className = "card__img";
    img.src = product.image || "/static/images/placeholder.jpg";
    img.alt = product.name;
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "/static/images/placeholder.jpg";
      img.alt = "Product image not available";
    };

    // Card body
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
    price.style.cssText =
      "font-weight: 700; color: var(--primary); font-size: 1.125rem; margin-bottom: 0.5rem;";

    const qtyRow = createQuantitySelector();

    const notes = document.createElement("input");
    notes.className = "card__notes";
    notes.type = "text";
    notes.placeholder = "Add notes (optional) - e.g., color, size, finish...";
    notes.setAttribute("aria-label", "Order notes");
    notes.style.cssText = `
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-family: inherit;
      background: var(--bg);
      transition: all var(--transition-fast);
    `;
    notes.onfocus = function () {
      this.style.borderColor = "var(--primary)";
      this.style.background = "white";
    };
    notes.onblur = function () {
      this.style.borderColor = "var(--border)";
      this.style.background = "var(--bg)";
    };

    const wa = document.createElement("a");
    wa.className = "wa";
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    wa.setAttribute("aria-label", `Order ${product.name} via WhatsApp`);
    wa.innerHTML = `
      <span style="font-size: 1.25rem;">💬</span>
      <span>Order via WhatsApp</span>
    `;

    function updateOrderLink() {
      const qty = Math.max(1, parseInt(qtyRow.input.value || "1", 10) || 1);
      qtyRow.input.value = String(qty);

      if (!state.whatsapp) {
        // Avoid broken link if API didn't provide whatsapp
        wa.href = "#";
        wa.onclick = (e) => {
          e.preventDefault();
          alert("WhatsApp number not configured yet.");
        };
        return;
      }

      wa.onclick = null;
      wa.href = waLink(state.whatsapp, product, qty, notes.value.trim());
    }

    qtyRow.minus.onclick = () => {
      qtyRow.input.value = String(Math.max(1, (parseInt(qtyRow.input.value, 10) || 1) - 1));
      updateOrderLink();
    };
    qtyRow.plus.onclick = () => {
      qtyRow.input.value = String((parseInt(qtyRow.input.value, 10) || 1) + 1);
      updateOrderLink();
    };
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
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.5rem 0;
    `;

    const label = document.createElement("label");
    label.textContent = "Qty:";
    label.style.cssText = "font-weight: 600; font-size: 0.875rem; color: var(--gray-700);";

    const controls = document.createElement("div");
    controls.style.cssText = `
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: white;
    `;

    const minus = document.createElement("button");
    minus.className = "qty-btn";
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Decrease quantity");
    minus.style.cssText = `
      width: 36px;
      height: 36px;
      border: none;
      background: var(--gray-100);
      color: var(--gray-700);
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    minus.onmouseover = () => (minus.style.background = "var(--gray-200)");
    minus.onmouseout = () => (minus.style.background = "var(--gray-100)");

    const input = document.createElement("input");
    input.className = "qty-input";
    input.type = "number";
    input.min = "1";
    input.value = "1";
    input.setAttribute("aria-label", "Quantity");
    input.style.cssText = `
      width: 50px;
      height: 36px;
      border: none;
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
      text-align: center;
      font-size: 1rem;
      font-weight: 600;
      outline: none;
      -moz-appearance: textfield;
    `;

    // Add spinner-hiding CSS once
    if (!document.getElementById("qty-spinner-hide-style")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "qty-spinner-hide-style";
      styleSheet.textContent = `
        .qty-input::-webkit-inner-spin-button,
        .qty-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    const plus = document.createElement("button");
    plus.className = "qty-btn";
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Increase quantity");
    plus.style.cssText = minus.style.cssText;
    plus.onmouseover = () => (plus.style.background = "var(--gray-200)");
    plus.onmouseout = () => (plus.style.background = "var(--gray-100)");

    controls.append(minus, input, plus);
    container.append(label, controls);

    return { container, minus, input, plus };
  }

  function showError(message) {
    const titleEl = safeEl("categoryTitle");
    const descEl = safeEl("categoryDesc");
    const grid = safeEl("grid");
    const emptyEl = safeEl("empty");

    if (titleEl) titleEl.textContent = "Error";
    if (descEl) descEl.textContent = message;
    if (grid) grid.innerHTML = "";
    if (emptyEl) emptyEl.classList.add("hidden");
  }

  // =====================
  // API Calls
  // =====================
  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      state.categories = await res.json();
      renderTabs();

      const first = state.categories[0];
      if (first) await setActive(first.slug);
    } catch (err) {
      console.error("Failed to load categories:", err);
      showError("Failed to load categories. Please refresh the page.");
    }
  }

  async function loadProducts(slug) {
    try {
      const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      state.activeMeta = data.category;
      state.products = data.products || [];
      state.whatsapp = data.whatsapp;
    } catch (err) {
      console.error("Failed to load products:", err);
      showError("Failed to load products. Please try again.");
    }
  }

  async function setActive(slug) {
    state.activeSlug = slug;
    state.query = "";

    const searchEl = safeEl("search");
    if (searchEl) searchEl.value = "";

    syncActiveTab();

    const titleEl = safeEl("categoryTitle");
    const descEl = safeEl("categoryDesc");
    const grid = safeEl("grid");

    if (titleEl) titleEl.textContent = "Loading...";
    if (descEl) descEl.textContent = "";
    if (grid) grid.innerHTML = "";

    await loadProducts(slug);
    render();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =====================
  // Event wiring
  // =====================
  function wireEvents() {
    const search = safeEl("search");
    const clearBtn = safeEl("clearBtn");
    const tabsContainer = safeEl("tabs");

    if (search && !search.dataset.bound) {
      search.dataset.bound = "1";

      search.addEventListener("input", (e) => {
        state.query = e.target.value || "";
        render();
      });

      search.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          state.query = "";
          search.value = "";
          render();
        }
      });
    }

    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = "1";
      clearBtn.addEventListener("click", () => {
        state.query = "";
        if (search) {
          search.value = "";
          search.focus();
        }
        render();
      });
    }

    if (tabsContainer && !tabsContainer.dataset.bound) {
      tabsContainer.dataset.bound = "1";
      tabsContainer.addEventListener("keydown", (e) => {
        const tabs = [...tabsContainer.children];
        const currentIndex = tabs.findIndex((tab) => tab.classList.contains("active"));

        if (e.key === "ArrowRight" && currentIndex < tabs.length - 1) {
          tabs[currentIndex + 1].click();
          tabs[currentIndex + 1].focus();
        } else if (e.key === "ArrowLeft" && currentIndex > 0) {
          tabs[currentIndex - 1].click();
          tabs[currentIndex - 1].focus();
        }
      });
    }

    document.documentElement.style.scrollBehavior = "smooth";
  }

  // =====================
  // Init
  // =====================
  async function init() {
    try {
      wireEvents();

      const titleEl = safeEl("categoryTitle");
      const descEl = safeEl("categoryDesc");
      if (titleEl) titleEl.textContent = "Loading Products...";
      if (descEl) descEl.textContent = "Please wait while we fetch our printing services.";

      await loadCategories();
    } catch (err) {
      console.error("Initialization error:", err);
      showError("Failed to load application. Please refresh the page or check your connection.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Optional debugging exports
  window.appState = state;
  window.appDebug = { loadCategories, setActive, render };
})();

