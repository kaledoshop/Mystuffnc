// Panier + envoi des commandes et des messages directement depuis le site.
// Sans Firebase, tout bascule automatiquement sur Messenger.
import { db, firebaseReady } from "./fb.js";
import { collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const MESSENGER = "https://m.me/mystuffnc";
const $ = s => document.querySelector(s);
const fmt = n => Number(n || 0).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " XPF";
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let toastTimer;
function toast(msg) {
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

// ── État du panier (gardé dans le navigateur du client) ──
let panier = [];
try { panier = JSON.parse(localStorage.getItem("mystuff-panier") || "[]"); } catch (_) { panier = []; }
const sauver = () => { try { localStorage.setItem("mystuff-panier", JSON.stringify(panier)); } catch (_) {} };
const total = () => panier.reduce((s, a) => s + a.prix * a.qte, 0);

function rendre() {
  const n = panier.reduce((s, a) => s + a.qte, 0);
  const c = $("#cartCount"); if (c) c.textContent = n;
  const items = $("#items"); if (!items) return;
  items.innerHTML = panier.length ? panier.map((a, i) => `
    <div class="item">
      <span class="ic" aria-hidden="true">${esc(a.emoji || "🎁")}</span>
      <div><b>${esc(a.nom)}</b><small>${a.prix ? fmt(a.prix) : "sur devis"}</small></div>
      <div class="qty">
        <button data-moins="${i}" aria-label="Retirer un article">−</button>${a.qte}<button data-plus="${i}" aria-label="Ajouter un article">+</button>
      </div>
    </div>`).join("") : `<p class="empty">Ton panier est vide 🫧</p>`;
  const t = $("#total"); if (t) t.textContent = fmt(total());
  const b = $("#envoyer"); if (b) { b.disabled = !panier.length; b.style.opacity = panier.length ? 1 : .5; }
}

function ouvrir(o) {
  document.body.classList.toggle("cart-open", o);
  const d = $("#drawer"); if (d) d.setAttribute("aria-hidden", String(!o));
}

// ── Ajouter au panier depuis la boutique ──
document.addEventListener("click", e => {
  const b = e.target.closest(".add[data-nom]");
  if (!b) return;
  const nom = b.dataset.nom, prix = Number(b.dataset.prix || 0), emoji = b.dataset.emoji || "🎁";
  const ex = panier.find(a => a.nom === nom);
  if (ex) ex.qte++; else panier.push({ nom, prix, emoji, qte: 1 });
  sauver(); rendre();
  b.textContent = "Ajouté ✓"; setTimeout(() => b.textContent = "Ajouter", 1200);
  toast("Ajouté au panier.");
});

$("#cartBtn")?.addEventListener("click", () => ouvrir(true));
$("#fermerPanier")?.addEventListener("click", () => ouvrir(false));
$("#scrim")?.addEventListener("click", () => ouvrir(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") ouvrir(false); });
$("#items")?.addEventListener("click", e => {
  const p = e.target.dataset.plus, m = e.target.dataset.moins;
  if (p !== undefined) panier[+p].qte++;
  if (m !== undefined) { panier[+m].qte--; if (panier[+m].qte <= 0) panier.splice(+m, 1); }
  if (p !== undefined || m !== undefined) { sauver(); rendre(); }
});

// ── Secours : si Firebase n'est pas branché, on passe par Messenger ──
async function versMessenger(texte) {
  let copie = false;
  try { await navigator.clipboard.writeText(texte); copie = true; } catch (_) {}
  window.open(MESSENGER, "_blank", "noopener");
  toast(copie ? "Message copié, colle-le dans Messenger." : "Messenger s'ouvre, recopie ta demande.");
}

// ── Envoi de la commande ──
$("#commandeForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  if (!panier.length) return toast("Ton panier est vide.");
  const f = new FormData(e.target);
  const recap = panier.map(a => `- ${a.qte} × ${a.nom}${a.prix ? ` (${fmt(a.prix * a.qte)})` : ""}`).join("\n");
  const texte = `Bonjour My Stuff ! Commande de ${f.get("nom")} :\n${recap}\nTotal : ${fmt(total())}\nContact : ${f.get("contact")}\nRetrait : ${f.get("retrait")}${f.get("message") ? `\nMessage : ${f.get("message")}` : ""}`;

  if (firebaseReady && db) {
    const bouton = $("#envoyer"); bouton.disabled = true; bouton.textContent = "Envoi…";
    try {
      await addDoc(collection(db, "commandes"), {
        nom: f.get("nom"), contact: f.get("contact"), retrait: f.get("retrait"),
        message: f.get("message") || "", articles: panier, total: total(),
        statut: "nouveau", cree: serverTimestamp()
      });
      panier = []; sauver(); rendre(); e.target.reset(); ouvrir(false);
      toast("Commande envoyée ! My Stuff te recontacte très vite.");
    } catch (err) {
      console.warn(err); await versMessenger(texte);
    } finally { bouton.disabled = false; bouton.textContent = "Envoyer la commande"; }
  } else {
    await versMessenger(texte);
  }
});

// ── Formulaire de message (page Contact) ──
$("#msgForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const texte = `Bonjour My Stuff ! ${f.get("message")}\n— ${f.get("nom")} (${f.get("contact")})`;
  if (firebaseReady && db) {
    try {
      await addDoc(collection(db, "demandes"), {
        type: "message", nom: f.get("nom"), contact: f.get("contact"),
        message: f.get("message"), statut: "nouveau", cree: serverTimestamp()
      });
      e.target.reset(); toast("Message envoyé ! On te répond très vite.");
    } catch (err) { console.warn(err); await versMessenger(texte); }
  } else { await versMessenger(texte); }
});

rendre();
