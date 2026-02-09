const state = {
  categories: [],
  activeSlug: null,
  activeMeta: null,
  products: [],
  query: ""
};

function $(id){ return document.getElementById(id); }

function waLink(number, product, qty, notes){
  const note = notes ? `\nNotes: ${notes}` : "";
  const msg =
    `Hi Isizwe Print & Projects,\n` +
    `I want to order:\n` +
    `${product.name}\n` +
    `Qty: ${qty}\n` +
    `Price: ${product.price}${note}\n` +
    `Please confirm price and turnaround time.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

async function loadCategories(){
  const res = await fetch("/api/categories");
  state.categories = await res.json();

  renderTabs();

  // default category
  const first = state.categories[0];
  if(first){
    await setActive(first.slug);
  }
}

function renderTabs(){
  const tabs = $("tabs");
  tabs.innerHTML = "";

  state.categories.forEach(cat => {
    const b = document.createElement("button");
    b.className = "tab";
    b.textContent = cat.label;
    b.onclick = () => setActive(cat.slug);
    tabs.appendChild(b);
  });

  syncActiveTab();
}

function syncActiveTab(){
  const tabs = $("tabs").children;
  [...tabs].forEach((btn, idx) => {
    const cat = state.categories[idx];
    btn.classList.toggle("active", cat.slug === state.activeSlug);
  });
}

async function setActive(slug){
  state.activeSlug = slug;
  state.query = "";
  $("search").value = "";
  syncActiveTab();
  await loadProducts(slug);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadProducts(slug){
  const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}`);
  const data = await res.json();

  state.activeMeta = data.category;
  state.products = data.products || [];
  state.whatsapp = data.whatsapp;
}

function currentProducts(){
  const q = state.query.trim().toLowerCase();
  if(!q) return state.products;
  return state.products.filter(p => {
    const hay = `${p.name} ${p.desc || ""} ${p.price || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

function render(){
  $("categoryTitle").textContent = state.activeMeta?.label || "Products";
  $("categoryDesc").textContent = state.activeMeta?.description || "";

  const grid = $("grid");
  grid.innerHTML = "";

  const products = currentProducts();
  $("empty").classList.toggle("hidden", products.length !== 0);

  products.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card__img";
    img.src = p.image || "/static/images/placeholder.jpg";
    img.alt = p.name;
    img.loading = "lazy";
    img.onerror = () => { img.src = "/static/images/placeholder.jpg"; };

    const body = document.createElement("div");
    body.className = "card__body";

    const title = document.createElement("h4");
    title.className = "card__title";
    title.textContent = p.name;

    const desc = document.createElement("p");
    desc.className = "card__desc";
    desc.textContent = p.desc || "";

    const price = document.createElement("div");
    price.className = "card__price";
    price.textContent = p.price || "";

    // Quantity selector
    const qtyRow = document.createElement("div");
    qtyRow.className = "qtyrow";

    const minus = document.createElement("button");
    minus.className = "qtybtn";
    minus.type = "button";
    minus.textContent = "−";

    const qty = document.createElement("input");
    qty.className = "qtyinput";
    qty.type = "number";
    qty.note = "1";
    qty.min = "1";
    qty.value = "1";

    const plus = document.createElement("button");
    plus.className = "qtybtn";
    plus.type = "button";
    plus.textContent = "+";

    // Notes
    const notes = document.createElement("input");
    notes.className = "note";
    notes.type = "text";
    notes.placeholder = "Notes (optional) e.g. black ink, size…";

    // Actions
    const actions = document.createElement("div");
    actions.className = "actions";

    const wa = document.createElement("a");
    wa.className = "wa";
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.textContent = "Order via WhatsApp";

    const copy = document.createElement("button");
    copy.className = "copy";
    copy.type = "button";
    copy.textContent = "⧉";

    function updateLinks(){
      const qv = Math.max(1, parseInt(qty.value || "1", 10) || 1);
      qty.value = String(qv);
      wa.href = waLink(state.whatsapp, p, qv, notes.value.trim());
    }

    minus.onclick = () => { qty.value = String(Math.max(1, (parseInt(qty.value,10)||1) - 1)); updateLinks(); };
    plus.onclick  = () => { qty.value = String((parseInt(qty.value,10)||1) + 1); updateLinks(); };
    qty.oninput = updateLinks;
    notes.oninput = updateLinks;

    copy.onclick = async () => {
      const qv = Math.max(1, parseInt(qty.value || "1", 10) || 1);
      const nv = notes.value.trim();
      const text =
        `Order summary\n` +
        `Product: ${p.name}\n` +
        `Qty: ${qv}\n` +
        `Price: ${p.price}\n` +
        (nv ? `Notes: ${nv}\n` : "");

      try {
        await navigator.clipboard.writeText(text);
        alert("Copied. Paste into WhatsApp.");
      } catch {
        alert("Could not copy.\n\n" + text);
      }
    };

    updateLinks();

    qtyRow.append(minus, qty, plus);
    actions.append(wa, copy);

    body.append(title, desc, price, qtyRow, notes, actions);
    card.append(img, body);
    grid.append(card);
  });
}

// Search + clear
$("search").addEventListener("input", (e) => {
  state.query = e.target.value || "";
  render();
});

$("clearBtn").addEventListener("click", () => {
  state.query = "";
  $("search").value = "";
  render();
});

loadCategories().catch(err => {
  console.error(err);
  $("categoryTitle").textContent = "Error loading data";
  $("categoryDesc").textContent = "Check Flask API routes.";
});

