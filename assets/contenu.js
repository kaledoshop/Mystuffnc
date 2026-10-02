// Applique le contenu de contenu.json (préparé avec admin-local.html).
// Si le fichier n'existe pas, la page garde son contenu d'origine.
(async function () {
  let data;
  try {
    const r = await fetch("contenu.json", { cache: "no-store" });
    if (!r.ok) return;
    data = await r.json();
  } catch (_) { return; }
  if (!data) return;

  const fmt = n => Number(n).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " XPF";
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 1. textes
  if (data.textes) {
    document.querySelectorAll("[data-cms]").forEach(el => {
      const v = data.textes[el.dataset.cms];
      if (v) el.textContent = v;
    });
  }

  // 2. carrousel des créations
  const track = document.getElementById("reelTrack");
  if (track && Array.isArray(data.creations) && data.creations.length) {
    const fig = (c, dup) => `<figure${dup ? ' aria-hidden="true"' : ""}><img src="${c.url}" alt="${dup ? "" : esc(c.alt || "Création My Stuff")}" decoding="async"></figure>`;
    const half = data.creations.map(c => fig(c, false)).join("") + data.creations.map(c => fig(c, true)).join("");
    track.innerHTML = half + half;
  }

  // 3. catalogue
  const grid = document.getElementById("catalogue");
  if (grid && Array.isArray(data.produits)) {
    const items = data.produits.filter(p => p.actif !== false);
    grid.innerHTML = items.length ? items.map(p => `
      <article class="card">
        <div class="thumb">${p.image ? `<img src="${p.image}" alt="${esc(p.nom)}">` : `<span aria-hidden="true">${esc(p.emoji || "🎁")}</span>`}</div>
        <h3>${esc(p.nom)}</h3>
        ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
        <div class="row">
          <span class="price">${p.prix ? fmt(p.prix) : "Sur devis"}</span>
          <button class="add" data-msg="Bonjour My Stuff ! Je suis intéressé(e) par : ${esc(p.nom)}.">Demander</button>
        </div>
      </article>`).join("") : `<p class="empty">Le catalogue arrive bientôt. En attendant, écris-nous sur Messenger 🫧</p>`;
  }

  // 4. dates du photocall déjà prises
  const input = document.querySelector('#pcForm input[name="date"]');
  if (input && Array.isArray(data.datesPrises)) {
    const prises = new Set(data.datesPrises);
    const note = document.getElementById("dateNote");
    input.addEventListener("change", () => {
      if (prises.has(input.value)) {
        input.setCustomValidity("Cette date est déjà réservée.");
        if (note) note.textContent = "Cette date est déjà prise, choisis-en une autre ou écris-nous.";
      } else {
        input.setCustomValidity("");
        if (note) note.textContent = "";
      }
    });
  }
})();
