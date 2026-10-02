const MESSENGER = "https://m.me/mystuffnc";

const $ = s => document.querySelector(s);

// ── Toast ──
let tt;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove("show"),2600); }

// ── Envoi vers Messenger (copie le message puis ouvre la conversation) ──
async function sendToMessenger(text, done){
  let copied=false;
  try{ await navigator.clipboard.writeText(text); copied=true; }catch(e){}
  window.open(MESSENGER,"_blank","noopener");
  toast(copied ? done+" Colle-le dans Messenger." : "Messenger s'ouvre : recopie ta demande dans la conversation.");
}
const pcForm=$("#pcForm");
if(pcForm) pcForm.addEventListener("submit",e=>{
  e.preventDefault(); const f=new FormData(e.target);
  const d=f.get("date") ? new Date(f.get("date")).toLocaleDateString("fr-FR") : "";
  if (window.MYSTUFF_SAVE) window.MYSTUFF_SAVE({type:"photocall", date:f.get("date"), evenement:f.get("type"), message:"Demande de devis photocall"});
  sendToMessenger(`Bonjour My Stuff ! Je voudrais un devis pour le photocall Vogue.\nDate : ${d}\nÉvénement : ${f.get("type")}`, "Demande copiée.");
});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-msg]");
  if(!b) return;
  if (window.MYSTUFF_SAVE) window.MYSTUFF_SAVE({type:"message", message:b.dataset.msg});
  sendToMessenger(b.dataset.msg,"Message copié.");
});

// ── Menu mobile ──
$("#menuBtn").onclick=()=>{ const o=$("#nav").classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded",o); };
$("#nav").addEventListener("click",e=>{ if(e.target.tagName==="A"){ $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded",false);} });

// ── Bulles à éclater dans le hero ──
(function(){
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = $("#bubbles"); if(!box) return;
  let popped = 0;
  function spawn(){
    if (document.hidden || box.children.length > 12) return;
    const b = document.createElement("button");
    b.className = "b"; b.tabIndex = -1;
    const s = 18 + Math.random()*46;
    b.style.width = b.style.height = s+"px";
    b.style.left = Math.random()*100+"%";
    b.style.bottom = -s+"px";
    b.style.setProperty("--d", (12+Math.random()*10)+"s");
    b.style.setProperty("--x", (Math.random()*80-40)+"px");
    b.addEventListener("animationend", ev => { if(ev.animationName==="rise"||ev.animationName==="pop") b.remove(); });
    b.addEventListener("pointerdown", () => {
      if (b.classList.contains("pop")) return;
      const r = b.getBoundingClientRect(), pr = box.getBoundingClientRect();
      b.style.animation = "none"; b.style.left = (r.left-pr.left)+"px"; b.style.bottom = "auto"; b.style.top = (r.top-pr.top)+"px"; b.style.transform="none";
      void b.offsetWidth; b.classList.add("pop"); b.style.animation="";
      popped++;
      if (popped===10) toast("10 bulles éclatées ! Viens voir nos créations 🎈");
    });
    box.appendChild(b);
  }
  for (let i=0;i<5;i++) setTimeout(spawn, i*500);
  setInterval(spawn, 1700);
})();


// ── Conditions de vente / mentions légales ──
document.addEventListener("click",e=>{
  const o=e.target.closest("[data-open]");
  if(o){ const d=document.getElementById(o.dataset.open); if(d&&d.showModal){ d.showModal(); } }
  if(e.target.closest("[data-close]")) e.target.closest("dialog").close();
  if(e.target.tagName==="DIALOG") e.target.close();
});




// ── Nos créations : défilement continu (la liste est affichée deux fois pour boucler) ──
const CREATIONS = [{"src": "assets/img/img08.jpg", "alt": "Ballon bulle 40 ans dor\u00e9 et blanc avec message personnalis\u00e9", "w": 329, "h": 440}, {"src": "assets/img/img09.jpg", "alt": "Ballon bulle noir et argent avec papillons pour la f\u00eate des m\u00e8res", "w": 329, "h": 440}, {"src": "assets/img/img12.jpg", "alt": "Ballon bulle Happy 18th Birthday bleu et blanc avec pr\u00e9nom", "w": 323, "h": 440}, {"src": "assets/img/img13.jpg", "alt": "Ballon bulle Happy 18th Birthday noir et or dans son seau personnalis\u00e9", "w": 329, "h": 440}];
(function(){
  const fig=(c,dup)=>`<figure${dup?' aria-hidden="true"':''}><img src="${c.src}" alt="${dup?'':c.alt}" width="${c.w}" height="${c.h}" decoding="async"></figure>`;
  const half = CREATIONS.map(c=>fig(c,false)).join("") + CREATIONS.map(c=>fig(c,true)).join("");
  const rt=document.getElementById("reelTrack"); if(rt) rt.innerHTML = half + half;
})();
