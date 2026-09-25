/* =====================================================================
   MaliFutur.ai — script.js (logique complète du site)
   Fondé par Sami Nouh Gourier — samifuture.mali@gmail.com
   ---------------------------------------------------------------------
   ⚠️ NOTE IMPORTANTE POUR SAMI (protection de la clé API) :
   GitHub Pages est un hébergement 100% PUBLIC : tout code JavaScript
   contenant une clé API serait visible et volable en 2 clics.
   C'est pourquoi ce chatbot utilise le principe "BYO-Key" (Bring Your
   Own Key) : CHAQUE ÉTUDIANT colle SA PROPRE clé Gemini gratuite une
   seule fois. La clé est stockée dans le localStorage du navigateur de
   l'étudiant uniquement — elle ne quitte jamais son téléphone sauf
   vers les serveurs de Google. Aucune clé de la plateforme à protéger.
   Pour une clé côté serveur (option pro), il faudra un backend gratuit
   (Cloudflare Workers / Firebase) — dis-moi et je te le prépare.
   ===================================================================== */
"use strict";

/* ---------- 1) Menu mobile ---------- */
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});

/* ---------- 2) Thème sombre (économie de batterie) ---------- */
const themeBtn = document.getElementById("themeBtn");
function applyTheme(t){ document.documentElement.setAttribute("data-theme", t);
  try{ localStorage.setItem("mf-theme", t); }catch(e){} }
try{ const saved = localStorage.getItem("mf-theme"); if(saved) applyTheme(saved); }catch(e){}
themeBtn.addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

/* ---------- 3) Lecteur YouTube : chargement différé (façade) ----------
   La vidéo ne consomme AUCUNE donnée tant que l'étudiant n'a pas cliqué.
   ⚠️ SAMI : remplace "PLAYLIST_ID" par l'ID réel de ta playlist
   (dans l'URL youtube.com/playlist?list=XXXXXXXX c'est la partie après "list="). */
const YT_PLAYLIST_ID = "PLAYLIST_ID"; // ← À REMPLACER
const ytFacade = document.getElementById("ytFacade");
function loadYouTube(){
  if (ytFacade.dataset.loaded) return;
  ytFacade.dataset.loaded = "1";
  ytFacade.innerHTML =
    '<iframe class="yt-iframe" title="Formation Introduction à l'IA"' +
    ' src="https://www.youtube.com/embed/videoseries?list=' + YT_PLAYLIST_ID +
    '&rel=0&hl=fr" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"' +
    ' allowfullscreen loading="lazy"></iframe>';
}
ytFacade.addEventListener("click", loadYouTube);
ytFacade.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") loadYouTube(); });

/* =====================================================================
   4) WIDGET CHATBOT — Tuteur IA (Gemini API + mode hors-ligne)
   ===================================================================== */
const chatFab    = document.getElementById("chatFab");
const chatPanel  = document.getElementById("chatPanel");
const chatClose  = document.getElementById("chatClose");
const chatGear   = document.getElementById("chatGear");
const chatSettings = document.getElementById("chatSettings");
const chatLog    = document.getElementById("chatLog");
const chatForm   = document.getElementById("chatForm");
const chatInput  = document.getElementById("chatInput");
const chatStatus = document.getElementById("chatStatus");
const apiKeyInput  = document.getElementById("apiKeyInput");
const saveKeyBtn   = document.getElementById("saveKeyBtn");
const clearKeyBtn  = document.getElementById("clearKeyBtn");
const navTuteur  = document.getElementById("navTuteur");

const LS_KEY = "mf-gemini-key"; // localStorage de l'ÉTUDIANT uniquement

function getKey(){ try{ return localStorage.getItem(LS_KEY) || ""; }catch(e){ return ""; } }
function setKey(k){ try{ k ? localStorage.setItem(LS_KEY, k) : localStorage.removeItem(LS_KEY); }catch(e){} }

/* ---- Ouverture / fermeture ---- */
function openChat(){
  chatPanel.classList.add("open");
  if (!chatLog.children.length) addMsg(
    "👋 Bonjour ! Je suis le Tuteur IA de MaliFutur.ai. Pose-moi ta question sur l'IA, Python ou la robotique !\n\n" +
    (getKey() ? "✅ Clé Gemini détectée — mode intelligent actif." : "💡 Active l'IA complète : touche ⚙️ et colle ta clé Gemini gratuite (ai.google.dev). Sans clé, je fonctionne en mode simplifié hors-ligne."), "bot");
  chatInput.focus();
}
chatFab.addEventListener("click", () => chatPanel.classList.contains("open") ? chatPanel.classList.remove("open") : openChat());
chatClose.addEventListener("click", () => chatPanel.classList.remove("open"));
navTuteur.addEventListener("click", e => { e.preventDefault(); openChat(); nav.classList.remove("open"); });
chatGear.addEventListener("click", () => {
  chatSettings.classList.toggle("open");
  apiKeyInput.value = getKey();
});
saveKeyBtn.addEventListener("click", () => {
  setKey(apiKeyInput.value.trim());
  updateStatus();
  addMsg(getKey() ? "✅ Clé enregistrée sur TON appareil uniquement. IA complète activée ! 🎉" : "🗑 Clé supprimée.", "bot");
});
clearKeyBtn.addEventListener("click", () => { apiKeyInput.value = ""; setKey(""); updateStatus();
  addMsg("🗑 Clé supprimée de ton navigateur. Mode hors-ligne activé.", "bot"); });

function updateStatus(){ chatStatus.textContent = getKey() ? "En ligne (Gemini IA)" : "En ligne (mode local)"; }
updateStatus();

/* ---- Messages ---- */
function addMsg(text, who){
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.textContent = text; /* textContent = protection anti-XSS */
  chatLog.appendChild(d);
  chatLog.scrollTop = chatLog.scrollHeight;
  return d;
}

/* ---- Appel Gemini API (clé de l'ÉTUDIANT, directement vers Google) ---- */
async function askGemini(question){
  const key = getKey();
  const sys = "Tu es le tuteur virtuel officiel de MaliFutur.ai, plateforme éducative gratuite du Mali " +
    "fondée par Sami Nouh Gourier, qui prépare les jeunes au CIAR-Mali. " +
    "Réponds TOUJOURS en français simple et clair, adapté à des étudiants débutants maliens. " +
    "Sois encourageant, précis et pédagogue. Réponses courtes (max 150 mots) sauf si l'étudiant demande plus de détails.";
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(key),
    { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: [{ parts: [{ text: question }] }]
      }) });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas compris. Reformule ta question 🙂";
}

/* ---- Réponses hors-ligne (si pas de clé ou pas de réseau) ---- */
const BRAIN = [
  { keys:["python","piton"], ans:"🐍 Python est le langage n°1 de l'IA : très simple à apprendre. Exemple :\n\nprint("Bonjour Mali !")\n\nCommence par la formation vidéo ci-dessus 👆" },
  { keys:["ia","intelligence","algorithme","machine learning","apprendre"], ans:"🧠 L'IA permet aux ordinateurs d'apprendre à partir de données (ex. : reconnaissance vocale, traduction). Regarde la formation vidéo gratuite sur cette page pour tout comprendre !" },
  { keys:["robot","robotique","capteur"], ans:"🤖 Un robot = capteurs (percevoir) + programme (réfléchir) + moteurs (agir). Le CIAR-Mali forme les experts en robotique du Mali !" },
  { keys:["ciar"], ans:"🏛 Le CIAR-Mali (Centre Malien d'IA et de Robotique) forme les talents du numérique malien. Nos cours te préparent à y entrer !" },
  { keys:["clé","cle","key","api","gemini"], ans:"🔑 Pour l'IA complète : 1) crée une clé gratuite sur ai.google.dev 2) touche ⚙️ ici 3) colle ta clé. Elle reste uniquement sur TON téléphone, en sécurité." },
  { keys:["gratuit","payer","prix"], ans:"🎉 Tout est 100% gratuit, pour toujours ! C'est la mission de MaliFutur.ai." },
  { keys:["contact","telegram","email","aide"], ans:"📬 Écris au fondateur Sami Nouh Gourier :\n✉️ samifuture.mali@gmail.com\n✈️ Telegram : lien dans la section Contact." },
  { keys:["bonjour","salut","coucou"], ans:"👋 Bonjour ! Je suis ton tuteur IA. Demande-moi : c'est quoi l'IA ? le Python ? un robot ? 🙂" },
  { keys:["merci"], ans:"😊 Avec plaisir ! Continue, l'avenir du Mali est entre tes mains 🇲🇱" }
];
function offlineReply(q){
  const clean = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const hit = BRAIN.find(b => b.keys.some(k => clean.includes(k)));
  return hit ? hit.ans
    : "🤔 Essaie un mot-clé : « IA », « Python », « robot », « CIAR »…\n\n💡 Pour des réponses illimitées, active ta clé Gemini gratuite (⚙️ en haut du chat).";
}

/* ---- Envoi ---- */
let busy = false;
chatForm.addEventListener("submit", async e => {
  e.preventDefault();
  const q = chatInput.value.trim();
  if (!q || busy) return;
  addMsg(q, "user");
  chatInput.value = "";
  busy = true;
  const thinking = addMsg("✍️ …", "bot");
  thinking.classList.add("typing");
  try{
    let answer;
    if (getKey()){ answer = await askGemini(q); }
    else {
      await new Promise(r => setTimeout(r, 500)); /* effet naturel */
      answer = offlineReply(q);
    }
    thinking.classList.remove("typing");
    thinking.textContent = answer;
  }catch(err){
    thinking.classList.remove("typing");
    thinking.textContent = "⚠️ Connexion à l'IA impossible (réseau ou clé invalide). Réponse locale :

" + offlineReply(q);
  }
  chatLog.scrollTop = chatLog.scrollHeight;
  busy = false;
});
