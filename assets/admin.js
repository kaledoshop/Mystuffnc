import { db, auth, storage, firebaseReady } from "./fb.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => Number(n || 0).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " XPF";
const dateFR = d => d ? new Date(d).toLocaleDateString("fr-FR") : "";
let msgTimer;
function flash(txt, ok = true) {
  const b = $("#flash"); b.textContent = txt; b.className = "flash " + (ok ? "ok" : "ko");
  clearTimeout(msgTimer); msgTimer = setTimeout(() => b.className = "flash", 3500);
}

// ── Connexion ───────────────────────────────────────────────
if (!firebaseReady) {
  $("#setup").hidden = false;
  $("#login").hidden = true;
} else {
  onAuthStateChanged(auth, user => {
    $("#login").hidden = !!user;
    $("#app").hidden = !user;
    $("#logout").hidden = !user;
    if (user) { $("#who").textContent = user.email; chargerTout(); }
  });
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try { await signInWithEmailAndPassword(auth, f.get("email"), f.get("pw")); }
    catch (err) { $("#loginErr").textContent = "Connexion refusée : vérifie l'e-mail et le mot de passe."; }
  });
  $("#logout").onclick = () => signOut(auth);
}

// ── Onglets ─────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected", x === t));
  document.querySelectorAll(".panel").forEach(p => p.hidden = p.id !== "panel-" + t.dataset.panel);
});

function chargerTout() {
  chargerDemandes(); chargerReservations(); chargerCreations(); chargerProduits(); chargerTextes();
}

// ── Demandes ────────────────────────────────────────────────
async function chargerDemandes() {
  const snap = await getDocs(query(collection(db, "demandes"), orderBy("cree", "desc")));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  $("#nbDemandes").textContent = rows.filter(r => r.statut === "nouveau").length;
  $("#demandes").innerHTML = rows.length ? rows.map(r => `
    <article class="row-card ${r.statut === "nouveau" ? "neuf" : ""}">
      <div>
        <b>${esc(r.type || "demande")}</b>
        ${r.date ? ` · ${dateFR(r.date)}` : ""} ${r.evenement ? ` · ${esc(r.evenement)}` : ""}
        <small>${r.cree?.toDate ? r.cree.toDate().toLocaleString("fr-FR") : ""}</small>
        ${r.message ? `<p>${esc(r.message)}</p>` : ""}
      </div>
      <div class="acts">
        ${r.statut === "nouveau" ? `<button data-traite="${r.id}">Marquer traité</button>` : `<span class="tagok">traité</span>`}
        <button class="danger" data-suppr-demande="${r.id}">Supprimer</button>
      </div>
    </article>`).join("") : `<p class="vide">Aucune demande pour l'instant.</p>`;
}
$("#demandes").addEventListener("click", async e => {
  const t = e.target.dataset.traite, s = e.target.dataset.supprDemande;
  if (t) { await updateDoc(doc(db, "demandes", t), { statut: "traite" }); flash("Demande marquée comme traitée."); chargerDemandes(); }
  if (s && confirm("Supprimer cette demande ?")) { await deleteDoc(doc(db, "demandes", s)); chargerDemandes(); }
});

// ── Réservations du photocall ───────────────────────────────
async function chargerReservations() {
  const snap = await getDocs(query(collection(db, "reservations"), orderBy("date", "asc")));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const auj = new Date().toISOString().slice(0, 10);
  $("#reservations").innerHTML = rows.length ? rows.map(r => `
    <article class="row-card ${r.date < auj ? "passe" : ""}">
      <div><b>${dateFR(r.date)}</b> ${r.evenement ? `· ${esc(r.evenement)}` : ""} ${r.client ? `· ${esc(r.client)}` : ""}
      ${r.note ? `<p>${esc(r.note)}</p>` : ""}</div>
      <div class="acts"><button class="danger" data-suppr-resa="${r.id}">Libérer</button></div>
    </article>`).join("") : `<p class="vide">Aucune date bloquée. Le calendrier est libre.</p>`;
}
$("#resaForm").addEventListener("submit", async e => {
  e.preventDefault(); const f = new FormData(e.target);
  await addDoc(collection(db, "reservations"), {
    date: f.get("date"), evenement: f.get("evenement"), client: f.get("client"), note: f.get("note"), cree: serverTimestamp()
  });
  e.target.reset(); flash("Date bloquée. Elle n'est plus proposée sur le site."); chargerReservations();
});
$("#reservations").addEventListener("click", async e => {
  const id = e.target.dataset.supprResa;
  if (id && confirm("Libérer cette date ?")) { await deleteDoc(doc(db, "reservations", id)); chargerReservations(); }
});

// ── Créations (photos du carrousel) ─────────────────────────
async function chargerCreations() {
  const snap = await getDocs(query(collection(db, "creations"), orderBy("ordre", "asc")));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  $("#creations").innerHTML = rows.length ? rows.map(c => `
    <figure class="vignette">
      <img src="${c.url}" alt="${esc(c.alt)}">
      <figcaption>
        <input value="${esc(c.alt)}" data-alt="${c.id}" placeholder="Description de la photo">
        <input type="number" value="${c.ordre ?? 0}" data-ordre="${c.id}" title="Ordre d'affichage">
        <button class="danger" data-suppr-crea="${c.id}" data-chemin="${esc(c.chemin || "")}">Supprimer</button>
      </figcaption>
    </figure>`).join("") : `<p class="vide">Aucune photo. Le site affiche celles d'origine.</p>`;
}
$("#creaForm").addEventListener("submit", async e => {
  e.preventDefault(); const f = new FormData(e.target); const file = f.get("photo");
  if (!file || !file.size) return flash("Choisis une photo.", false);
  flash("Envoi de la photo…");
  const chemin = `creations/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const r = ref(storage, chemin);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  await addDoc(collection(db, "creations"), { url, chemin, alt: f.get("alt") || "Création My Stuff", ordre: Number(f.get("ordre") || 0) });
  e.target.reset(); flash("Photo ajoutée au carrousel."); chargerCreations();
});
$("#creations").addEventListener("click", async e => {
  const id = e.target.dataset.supprCrea;
  if (id && confirm("Supprimer cette photo ?")) {
    const chemin = e.target.dataset.chemin;
    if (chemin) { try { await deleteObject(ref(storage, chemin)); } catch (_) {} }
    await deleteDoc(doc(db, "creations", id)); chargerCreations();
  }
});
$("#creations").addEventListener("change", async e => {
  const a = e.target.dataset.alt, o = e.target.dataset.ordre;
  if (a) { await updateDoc(doc(db, "creations", a), { alt: e.target.value }); flash("Description enregistrée."); }
  if (o) { await updateDoc(doc(db, "creations", o), { ordre: Number(e.target.value) }); flash("Ordre enregistré."); }
});

// ── Catalogue ───────────────────────────────────────────────
async function chargerProduits() {
  const snap = await getDocs(query(collection(db, "produits"), orderBy("ordre", "asc")));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  $("#produits").innerHTML = rows.length ? rows.map(p => `
    <article class="row-card">
      <div>
        <b>${esc(p.nom)}</b> · ${p.prix ? fmt(p.prix) : "sur devis"} ${p.actif === false ? "· <i>masqué</i>" : ""}
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
      </div>
      <div class="acts">
        <button data-actif="${p.id}" data-val="${p.actif === false}">${p.actif === false ? "Afficher" : "Masquer"}</button>
        <button class="danger" data-suppr-prod="${p.id}">Supprimer</button>
      </div>
    </article>`).join("") : `<p class="vide">Aucun produit. La page Boutique invite à écrire sur Messenger.</p>`;
}
$("#prodForm").addEventListener("submit", async e => {
  e.preventDefault(); const f = new FormData(e.target);
  let image = "";
  const file = f.get("image");
  if (file && file.size) {
    const chemin = `produits/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const r = ref(storage, chemin);
    await uploadBytes(r, file);
    image = await getDownloadURL(r);
  }
  await addDoc(collection(db, "produits"), {
    nom: f.get("nom"), description: f.get("description"), prix: Number(f.get("prix") || 0),
    emoji: f.get("emoji") || "🎁", image, ordre: Number(f.get("ordre") || 0), actif: true, cree: serverTimestamp()
  });
  e.target.reset(); flash("Produit ajouté."); chargerProduits();
});
$("#produits").addEventListener("click", async e => {
  const a = e.target.dataset.actif, s = e.target.dataset.supprProd;
  if (a) { await updateDoc(doc(db, "produits", a), { actif: e.target.dataset.val === "true" }); chargerProduits(); }
  if (s && confirm("Supprimer ce produit ?")) { await deleteDoc(doc(db, "produits", s)); chargerProduits(); }
});

// ── Textes du site ──────────────────────────────────────────
async function chargerTextes() {
  const snap = await getDoc(doc(db, "site", "contenu"));
  const d = snap.exists() ? snap.data() : {};
  document.querySelectorAll("#texteForm [name]").forEach(el => { if (d[el.name]) el.value = d[el.name]; });
}
$("#texteForm").addEventListener("submit", async e => {
  e.preventDefault();
  const data = {};
  new FormData(e.target).forEach((v, k) => { if (String(v).trim()) data[k] = v; });
  await setDoc(doc(db, "site", "contenu"), data, { merge: true });
  flash("Textes enregistrés. Ils apparaissent sur le site au prochain chargement.");
});
