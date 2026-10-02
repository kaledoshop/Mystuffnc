// Charge le contenu géré depuis le dashboard (textes, créations, catalogue, dates prises)
// Si Firebase n'est pas configuré, la page garde son contenu d'origine.
import { db, firebaseReady } from "./fb.js";
import { collection, doc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fmt = n => Number(n).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " XPF";

async function loadTextes() {
  const snap = await getDoc(doc(db, "site", "contenu"));
  if (!snap.exists()) return;
  const data = snap.data();
  document.querySelectorAll("[data-cms]").forEach(el => {
    const v = data[el.dataset.cms];
    if (v) el.textContent = v;
  });
}

async function loadCreations() {
  const track = document.getElementById("reelTrack");
  if (!track) return;
  const snap = await getDocs(query(collection(db, "creations"), orderBy("ordre", "asc")));
  const items = snap.docs.map(d => d.data()).filter(c => c.url);
  if (!items.length) return;
  const fig = (c, dup) => `<figure${dup ? ' aria-hidden="true"' : ""}><img src="${c.url}" alt="${dup ? "" : (c.alt || "Création My Stuff")}" decoding="async"></figure>`;
  const half = items.map(c => fig(c, false)).join("") + items.map(c => fig(c, true)).join("");
  track.innerHTML = half + half;
}

async function loadCatalogue() {
  const grid = document.getElementById("catalogue");
  if (!grid) return;
  const snap = await getDocs(query(collection(db, "produits"), orderBy("ordre", "asc")));
  const items = snap.docs.map(d => d.data()).filter(p => p.actif !== false);
  if (!items.length) {
    grid.innerHTML = `<p class="empty">Le catalogue arrive bientôt. En attendant, écris-nous sur Messenger 🫧</p>`;
    return;
  }
  grid.innerHTML = items.map(p => `
    <article class="card">
      <div class="thumb">${p.image ? `<img src="${p.image}" alt="${p.nom}">` : `<span aria-hidden="true">${p.emoji || "🎁"}</span>`}</div>
      <h3>${p.nom}</h3>
      ${p.description ? `<p class="desc">${p.description}</p>` : ""}
      <div class="row">
        <span class="price">${p.prix ? fmt(p.prix) : "Sur devis"}</span>
        <button class="add" data-msg="Bonjour My Stuff ! Je suis intéressé(e) par : ${p.nom}.">Demander</button>
      </div>
    </article>`).join("");
}

// Dates déjà réservées pour le photocall : on les bloque dans le formulaire
async function loadDatesPrises() {
  const input = document.querySelector('#pcForm input[name="date"]');
  if (!input) return;
  const snap = await getDocs(collection(db, "reservations"));
  const prises = new Set(snap.docs.map(d => d.data().date).filter(Boolean));
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

// Enregistre aussi la demande dans le dashboard, en plus de l'envoi sur Messenger
async function enregistrerDemande(data) {
  try { await addDoc(collection(db, "demandes"), { ...data, statut: "nouveau", cree: serverTimestamp() }); }
  catch (e) { console.warn("Demande non enregistrée :", e); }
}

if (firebaseReady && db) {
  window.MYSTUFF_SAVE = enregistrerDemande;
  loadTextes().catch(console.warn);
  loadCreations().catch(console.warn);
  loadCatalogue().catch(console.warn);
  loadDatesPrises().catch(console.warn);
} else {
  const grid = document.getElementById("catalogue");
  if (grid) grid.innerHTML = `<p class="empty">Le catalogue s'affichera ici une fois Firebase configuré (voir le README).</p>`;
}
