# Site My Stuff NC

Site vitrine de My Stuff (Nouméa, Nouvelle-Calédonie) : photocall style Vogue, personnalisation au vinyle, box cadeaux.
Site statique, sans base de données : les demandes partent sur Messenger.

## Contenu

- `index.html` — accueil (hero, créations qui défilent, spécialités)
- `photocall.html` — photocall Vogue + formulaire de devis
- `vinyle.html` — personnalisation au vinyle
- `box.html` — box cadeaux
- `contact.html` — contact
- `boutique.html` — catalogue, alimenté par le dashboard
- `admin.html` — dashboard Firebase (demandes, dates, photos, catalogue, textes), avec identification
- `admin-local.html` — dashboard sans identification, qui exporte `contenu.json`
- `contenu.json` — contenu modifié depuis le dashboard local (à déposer à côté de `index.html`)
- `assets/style.css` — tous les styles
- `assets/app.js` — bulles, carrousel, envoi vers Messenger, fenêtres CGV / mentions légales
- `assets/img/` — logo et photos d'origine
- `assets/firebase-config.js` — **à remplir** avec la config Firebase
- `assets/fb.js`, `assets/site-data.js`, `assets/admin.js` — branchement Firebase
- `assets/contenu.js`, `assets/admin-local.js` — version sans compte
- `firestore.rules`, `storage.rules` — règles de sécurité à copier dans Firebase
- `.nojekyll` — évite que GitHub Pages ignore certains fichiers

## Mettre en ligne sur GitHub Pages

1. Créer un compte sur github.com, puis un dépôt (bouton **New**), par exemple `mystuff-nc`, en **Public**.
2. Sur la page du dépôt : **Add file → Upload files**, glisser TOUT le contenu de ce dossier (et non le dossier lui-même), puis **Commit changes**.
3. Onglet **Settings → Pages**. Dans « Build and deployment », Source : **Deploy from a branch**, Branch : **main**, dossier : **/ (root)**. Cliquer **Save**.
4. Attendre 1 à 2 minutes : l'adresse `https://<compte>.github.io/mystuff-nc/` apparaît en haut de la page Settings → Pages.

Pour mettre à jour le site plus tard : réuploader les fichiers modifiés au même endroit (Upload files), GitHub écrase les anciens.

## Nom de domaine personnalisé (optionnel)

Après avoir acheté un domaine (ex. `mystuff.nc`) :
1. Settings → Pages → **Custom domain** : saisir le domaine, puis Save (un fichier `CNAME` est créé automatiquement).
2. Chez le vendeur du domaine, créer un enregistrement `CNAME` qui pointe `www` vers `<compte>.github.io`.
3. Cocher **Enforce HTTPS** une fois le certificat généré.

## À faire avant la mise en ligne

- Remplir les 14 champs surlignés en jaune dans les **Conditions de vente** et les **Mentions légales** (`assets/app.js` non concerné : ils sont dans chaque fichier `.html`, chercher `todo`) : nom ou raison sociale, RIDET, adresse, e-mail, téléphone, moyens de paiement, acompte, caution du photocall, conditions d'annulation, lieu de retrait, hébergeur (GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA, si le site reste sur GitHub Pages).
- Vérifier que les clients apparaissant sur les photos sont d'accord.
- Remplacer les photos : déposer les nouveaux fichiers dans `assets/img/` et modifier le chemin dans le HTML (ou dans la liste `CREATIONS` en haut de `assets/app.js` pour le carrousel).

## Mettre en route le dashboard (Firebase)

Le dashboard est la page `admin.html`. Sans Firebase, le site fonctionne quand même avec son contenu d'origine, et le dashboard affiche un message d'explication.

1. Aller sur console.firebase.google.com, **Créer un projet** (nom : mystuff). Google Analytics n'est pas nécessaire.
2. Dans le projet : **Créer une application Web** (icône `</>`). Copier l'objet `firebaseConfig` affiché et le coller dans `assets/firebase-config.js`, à la place des `A_REMPLIR`.
3. **Build → Firestore Database → Créer une base**, en mode production, région au choix (europe-west par exemple).
4. **Build → Storage → Commencer**, pour les photos.
5. **Build → Authentication → Commencer → Adresse e-mail/Mot de passe**, puis onglet **Users → Add user** : créer le compte de My Stuff (e-mail + mot de passe). C'est ce compte qui ouvre le dashboard.
6. Onglet **Rules** de Firestore : coller le contenu de `firestore.rules` et publier. Même chose dans Storage avec `storage.rules`.
7. **Authentication → Settings → Authorized domains** : ajouter `<compte>.github.io` (et le nom de domaine plus tard).
8. Réuploader les fichiers sur GitHub. Le dashboard est sur `https://<compte>.github.io/mystuff-nc/admin.html`.

### Ce que fait le dashboard

- **Demandes** : chaque devis photocall ou demande envoyée depuis le site est enregistrée, même si le client n'a pas terminé sur Messenger. Bouton pour marquer traité.
- **Photocall** : bloquer une date. Le formulaire du site refuse alors cette date.
- **Créations** : ajouter, décrire, ordonner ou supprimer les photos du carrousel de l'accueil. Tant qu'aucune photo n'est ajoutée, le site garde celles d'origine.
- **Catalogue** : ajouter des produits avec prix en XPF, photo, emoji ; les masquer ou les supprimer. Ils s'affichent sur la page Boutique.
- **Textes** : modifier les principaux textes du site sans toucher au code.

### Coût

Le quota gratuit de Firebase (plan Spark) couvre très largement ce type de site : 50 000 lectures par jour, 1 Go de stockage Firestore, 5 Go de photos. Aucune carte bancaire n'est demandée sur ce plan.

### Sécurité

Les règles fournies laissent tout le monde **lire** le contenu public (c'est un site vitrine) mais réservent l'**écriture** au compte connecté. La clé `apiKey` dans `firebase-config.js` n'est pas un secret : elle identifie le projet, elle ne donne aucun droit. Ce sont les règles qui protègent les données. Il ne faut donc jamais mettre le mot de passe du compte admin dans le code.

## Dashboard sans identification (`admin-local.html`)

Pour gérer le site sans créer de compte ni de base de données. Rien n'est stocké en ligne : les modifications restent dans le navigateur, puis sont exportées dans un fichier.

1. Ouvrir `admin-local.html` (double-clic sur le fichier, ou l'adresse `…github.io/mystuff-nc/admin-local.html`).
2. Ajouter ou retirer des photos de créations, des produits avec leur prix, des dates de photocall déjà prises, modifier les textes.
3. Cliquer sur **Télécharger contenu.json**.
4. Sur GitHub : **Add file → Upload files**, déposer `contenu.json` à la racine du dépôt, à côté de `index.html`, puis **Commit changes**. Une minute plus tard, le site affiche le nouveau contenu.

Bon à savoir :
- Il faut toujours travailler depuis **le même appareil et le même navigateur**, sinon le dashboard repart vide. Pour changer de machine, utiliser **Importer un contenu.json** avec le dernier fichier téléchargé.
- Les photos sont réduites automatiquement et stockées dans le fichier. Garder `contenu.json` sous environ 4 Mo (le poids est affiché en haut à droite), donc une quinzaine de photos maximum.
- Cette version ne peut pas recevoir les demandes de devis : sans base de données, il n'y a rien pour les enregistrer. Elles continuent d'arriver sur Messenger.
- Si `admin-local.html` est en ligne, n'importe qui connaissant l'adresse peut l'ouvrir. Ce n'est pas grave : la page ne contient aucune donnée client et personne ne peut modifier le site depuis là, puisque la mise en ligne passe par un dépôt GitHub protégé par ton compte. Pour être tranquille, tu peux aussi ne pas mettre ce fichier en ligne et l'ouvrir uniquement depuis ton ordinateur.
- Si les deux dashboards sont utilisés, Firebase prend le dessus sur `contenu.json`. Mieux vaut choisir l'un ou l'autre.
