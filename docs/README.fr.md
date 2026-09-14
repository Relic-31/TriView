# TriView

[English / 中文](../README.md)

TriView est un exercice interactif de lecture de vues orthogonales. Un solide est créé en mémoire, puis ses vues de face, de gauche et de dessus sont affichées avec une ou deux lignes manquantes. Les contours extérieurs sont conservés.

L'interface est en chinois. Le projet propose cinq familles de profils extrudés : chanfreins, arche, rainure semi-circulaire, épaulement et angles arrondis, avec des trous circulaires ou oblongs et des lamages.

## Démarrage

Téléchargez et décompressez le dépôt, puis ouvrez `index.html` dans un navigateur moderne en conservant les dossiers `src` et `assets`. Aucun outil de compilation, serveur applicatif ou CDN n'est nécessaire.

Vous pouvez également lancer `python3 -m http.server 8000` à la racine, puis ouvrir http://localhost:8000.

## Utilisation

1. Choisissez le trait continu (实线) ou interrompu (虚线), puis une ligne, un arc ou un cercle.
2. Pour une ligne, sélectionnez ses extrémités. Pour un cercle, sélectionnez le centre et un point du cercle. Pour un arc, sélectionnez le centre, le début et la fin, en choisissant son sens.
3. Vérifiez la réponse avec 检查答案. Une erreur impose de recommencer le même exercice avec 重新做. Une réponse correcte ouvre automatiquement le suivant.
4. Dépliez 查看隐藏的立体图形 pour afficher le modèle 3D : glisser pour tourner, molette pour zoomer.

Les vues suivent la projection du premier dièdre. La grille vaut 0,5 unité ; l'accrochage vaut 0,25 unité. Raccourcis : 1/2 pour le type de trait, E pour effacer, Échap pour annuler la sélection, Ctrl/Commande+Z pour annuler une action.

## Tests et publication

Exécutez `npm test` avec Node.js 20 ou plus récent, sans installation préalable. Consultez la [liste des vérifications manuelles](manual-checks.md) pour les essais dans un navigateur.

Pour GitHub Pages, choisissez Settings → Pages → Deploy from a branch → main → /(root). L'adresse prévue est https://relic-31.github.io/TriView/ ; elle ne sera disponible qu'après activation et déploiement.

## Limites

Ce prototype ne remplace pas un logiciel de CAO. Il couvre les familles de solides incluses, utilise une approximation polygonale pour le rendu 3D et certaines occultations, et vérifie les tracés par échantillonnage avec tolérance. Les vues incomplètes ne garantissent pas l'unicité du solide. La progression est réinitialisée au rechargement.

Licence [MIT](../LICENSE).
