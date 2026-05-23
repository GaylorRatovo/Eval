# Projet Eval

Ce projet suit une organisation imposée pour séparer clairement l'interface, le routage et la logique métier.

## Démarrage rapide

```bash
npm install
npm install material-react-table
npm install jszip
npm run dev
```

## Structure du projet

- Les routes sont centralisées dans `src/router/index.jsx`.
- `src/layouts` contient les layouts partagés.
- `src/pages` contient les pages du back-office.
- `src/backend/entities` regroupe les modèles `order`, `cart` et `product`, avec les méthodes de CRUD utilitaires et les appels API.
- `src/backend/services` regroupe les calculs et la logique métier en dehors des modèles.
- `src/backend/utils` regroupe les fonctions répétées et les helpers réutilisables.

## Conventions de nommage

- Les fichiers non backend doivent commencer par `BO` ou `FO` en majuscule pour mieux les distinguer.
- Les composants et pages doivent rester cohérents avec cette convention pour garder une arborescence lisible.

## Rappel

- Respecter la structure imposée par le sujet.
- Ajouter les nouvelles routes depuis `src/router/index.jsx`.

## AZA MI VIBE CODE BE INTSONY !!

## AZA ASIANA CSS MIHITSY ALOHA 