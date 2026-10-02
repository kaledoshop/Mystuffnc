// Configuration du projet Firebase "My Stuff NC"
// (console.firebase.google.com → Paramètres du projet → Vos applications)
export const firebaseConfig = {
  apiKey: "AIzaSyBWtvgu8VxPJmmtfTs40zTMeqUwSEou7U0",
  authDomain: "my-stuff-nc.firebaseapp.com",
  projectId: "my-stuff-nc",
  storageBucket: "my-stuff-nc.firebasestorage.app",
  messagingSenderId: "969588096605",
  appId: "1:969588096605:web:956aa4cd1670b41c0097b4"
};

// Passe à false automatiquement si la config n'est pas remplie :
// dans ce cas le site garde son contenu d'origine et le dashboard affiche une explication.
export const firebaseReady = !Object.values(firebaseConfig).some(v => String(v).includes("A_REMPLIR"));
