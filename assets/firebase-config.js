// ⚠️ À REMPLIR avec la config de ton projet Firebase
// (console.firebase.google.com → Paramètres du projet → Vos applications → Application Web)
export const firebaseConfig = {
  apiKey: "A_REMPLIR",
  authDomain: "A_REMPLIR.firebaseapp.com",
  projectId: "A_REMPLIR",
  storageBucket: "A_REMPLIR.appspot.com",
  messagingSenderId: "A_REMPLIR",
  appId: "A_REMPLIR"
};

// Tant que la config n'est pas remplie, le site fonctionne avec son contenu d'origine
// et le dashboard affiche un message d'explication.
export const firebaseReady = !Object.values(firebaseConfig).some(v => String(v).includes("A_REMPLIR"));
