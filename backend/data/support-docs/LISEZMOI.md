# Base documentaire du service après-vente (assistant IA)

Chaque fichier `.md` de ce dossier (sauf celui-ci) est une source que l'assistant
SAV peut citer. Format :

```
titre: Titre affiché
lien: /page-du-site-ou-url
---
Texte de la politique officielle…
```

L'assistant ne répond sur une politique (retours, garantie, livraison, montage,
CGV) QUE si elle figure ici. À la date d'intégration, le site ne publie aucune
politique de retour, de garantie, de livraison ni de montage : ajoutez les textes
officiels validés par la direction (ex. `retours.md`, `garantie.md`,
`livraison.md`, `montage.md`). Redémarrer le backend après modification.
