// Dashboard local : aucun compte, aucune donnée en ligne.
// Tout est gardé dans le navigateur, puis exporté dans contenu.json.
const $ = s => document.querySelector(s);
const CLE = "mystuff-contenu";
const VIDE = { textes: {}, creations: [], produits: [], datesPrises: [] };
let data = charger();

function charger() {
  try { return Object.assign(structuredClone(VIDE), JSON.parse(localStorage.getItem(CLE) || "{}")); }
  catch (_) { return structuredClone(VIDE); }
}
function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(data)); }
  catch (_) { flash("Mémoire du navigateur pleine : télécharge le fichier puis supprime quelques photos.", false); }
  rendre();
}
let tmr;
function flash(txt, ok = true) {
  const b = $("#flash"); b.textContent = txt; b.className = "flash " + (ok ? "ok" : "ko");
  clearTimeout(tmr); tmr = setTimeout(() => b.className = "flash", 3500);
}
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => Number(n || 0).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " XPF";
const dateFR = d => d ? new Date(d).toLocaleDateString("fr-FR") : "";

// Onglets
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected", x === t));
  document.querySelectorAll(".panel").forEach(p => p.hidden = p.id !== "panel-" + t.dataset.panel);
});

// Redimensionne la photo pour garder un fichier léger
function imageVersDataURL(file, max = 900, q = 0.78) {
  return new Promise((res, rej) => {
    const img = new Image(), fr = new FileReader();
    fr.onload = () => { img.src = fr.result; };
    fr.onerror = rej;
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", q));
    };
    img.onerror = rej;
    fr.readAsDataURL(file);
  });
}

// ── Créations ───────────────────────────────────────────────
$("#creaForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target), file = f.get("photo");
  if (!file || !file.size) return flash("Choisis une photo.", false);
  flash("Préparation de la photo…");
  data.creations.push({ url: await imageVersDataURL(file), alt: f.get("alt") || "Création My Stuff" });
  e.target.reset(); sauver(); flash("Photo ajoutée.");
});
$("#creations").addEventListener("click", e => {
  const i = e.target.dataset.sup, h = e.target.dataset.haut, b = e.target.dataset.bas;
  if (i !== undefined && confirm("Supprimer cette photo ?")) { data.creations.splice(+i, 1); sauver(); }
  if (h !== undefined && +h > 0) { const [c] = data.creations.splice(+h, 1); data.creations.splice(+h - 1, 0, c); sauver(); }
  if (b !== undefined && +b < data.creations.length - 1) { const [c] = data.creations.splice(+b, 1); data.creations.splice(+b + 1, 0, c); sauver(); }
});
$("#creations").addEventListener("change", e => {
  if (e.target.dataset.alt !== undefined) { data.creations[+e.target.dataset.alt].alt = e.target.value; sauver(); }
});

// ── Catalogue ───────────────────────────────────────────────
$("#prodForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target), file = f.get("image");
  const p = {
    nom: f.get("nom"), description: f.get("description"), prix: Number(f.get("prix") || 0),
    emoji: f.get("emoji") || "🎁", actif: true
  };
  if (file && file.size) p.image = await imageVersDataURL(file, 700);
  data.produits.push(p);
  e.target.reset(); sauver(); flash("Produit ajouté.");
});
$("#produits").addEventListener("click", e => {
  const s = e.target.dataset.supProd, a = e.target.dataset.actif;
  if (s !== undefined && confirm("Supprimer ce produit ?")) { data.produits.splice(+s, 1); sauver(); }
  if (a !== undefined) { data.produits[+a].actif = data.produits[+a].actif === false; sauver(); }
});

// ── Dates du photocall ──────────────────────────────────────
$("#dateForm").addEventListener("submit", e => {
  e.preventDefault();
  const d = new FormData(e.target).get("date");
  if (d && !data.datesPrises.includes(d)) data.datesPrises.push(d);
  data.datesPrises.sort();
  e.target.reset(); sauver(); flash("Date bloquée.");
});
$("#dates").addEventListener("click", e => {
  const i = e.target.dataset.supDate;
  if (i !== undefined) { data.datesPrises.splice(+i, 1); sauver(); }
});

// ── Textes ──────────────────────────────────────────────────
$("#texteForm").addEventListener("submit", e => {
  e.preventDefault();
  new FormData(e.target).forEach((v, k) => {
    if (String(v).trim()) data.textes[k] = v; else delete data.textes[k];
  });
  sauver(); flash("Textes enregistrés.");
});

// ── Export / import ─────────────────────────────────────────
$("#telecharger").onclick = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "contenu.json"; a.click();
  URL.revokeObjectURL(a.href);
  flash("contenu.json téléchargé. Dépose-le sur GitHub à côté de index.html.");
};
$("#importer").addEventListener("change", async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    data = Object.assign(structuredClone(VIDE), JSON.parse(await file.text()));
    sauver(); flash("Contenu importé.");
  } catch (_) { flash("Fichier illisible.", false); }
});
$("#vider").onclick = () => {
  if (confirm("Tout effacer et repartir du contenu d'origine du site ?")) { data = structuredClone(VIDE); sauver(); }
};

// ── Affichage ───────────────────────────────────────────────
function rendre() {
  $("#creations").innerHTML = data.creations.length ? data.creations.map((c, i) => `
    <figure class="vignette">
      <img src="${c.url}" alt="">
      <figcaption>
        <input value="${esc(c.alt)}" data-alt="${i}" placeholder="Description">
        <div class="acts">
          <button data-haut="${i}" title="Monter">↑</button>
          <button data-bas="${i}" title="Descendre">↓</button>
          <button class="danger" data-sup="${i}">Suppr.</button>
        </div>
      </figcaption>
    </figure>`).join("") : `<p class="vide">Aucune photo : le site garde celles d'origine.</p>`;

  $("#produits").innerHTML = data.produits.length ? data.produits.map((p, i) => `
    <article class="row-card">
      <div><b>${esc(p.nom)}</b> · ${p.prix ? fmt(p.prix) : "sur devis"} ${p.actif === false ? "· <i>masqué</i>" : ""}
      ${p.description ? `<p>${esc(p.description)}</p>` : ""}</div>
      <div class="acts">
        <button data-actif="${i}">${p.actif === false ? "Afficher" : "Masquer"}</button>
        <button class="danger" data-sup-prod="${i}">Supprimer</button>
      </div>
    </article>`).join("") : `<p class="vide">Aucun produit : la page Boutique invite à écrire sur Messenger.</p>`;

  $("#dates").innerHTML = data.datesPrises.length ? data.datesPrises.map((d, i) => `
    <article class="row-card"><div><b>${dateFR(d)}</b></div>
    <div class="acts"><button class="danger" data-sup-date="${i}">Libérer</button></div></article>`).join("")
    : `<p class="vide">Aucune date bloquée.</p>`;

  document.querySelectorAll("#texteForm [name]").forEach(el => { el.value = data.textes[el.name] || ""; });

  const poids = Math.round(JSON.stringify(data).length / 1024);
  $("#poids").textContent = poids > 1024 ? (poids / 1024).toFixed(1) + " Mo" : poids + " Ko";
}
rendre();
