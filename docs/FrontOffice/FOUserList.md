# FOUserList

## Rôle
Permettre le choix d'un client FrontOffice ou une connexion anonyme.

## Comportement
- Charge les clients via `Customer.getExclApi([1, 2])`.
- Affiche un tableau de sélection via `FOUserRow`.
- Crée un utilisateur anonyme via `CustomerService.ANONYMOUS_ID`.
- Enregistre `user` et `isGuest` dans `localStorage`.

## Navigation
- Un client choisi redirige vers `/fo/products`.
- La connexion anonyme redirige aussi vers `/fo/products` en mode invité.

## Dépendances
- `src/backend/entities/Customer.js`
- `src/backend/services/CustomerService.js`
- `src/components/FOUserRow.jsx`
- `src/hooks/useLocalStorage.jsx`

## Résumé
Page d'entrée FrontOffice pour démarrer une session client ou invité.
# FOUserList

## Présentation générale
`FOUserList.jsx` permet de choisir un client existant ou d'entrer en mode invité avant de naviguer dans le catalogue FrontOffice.

## Fonctionnement utilisateur
1. La page charge la liste des clients hors comptes anonymes.
2. L'utilisateur peut se connecter comme client existant.
3. Il peut aussi activer une connexion anonyme.
4. Le choix est stocké dans `localStorage` via `useLocalStorage`.
5. L'utilisateur est redirigé vers `/fo/products`.

## Flux de données
Utilisateur
	↓
`FOUserList.jsx`
	↓
`Customer.getExclApi()`
	↓
`useLocalStorage('user')` et `useLocalStorage('isGuest')`
	↓
navigation vers le catalogue

## Logique métier
Cette page prépare le contexte utilisateur avant l'accès au catalogue. Le mode anonyme utilise `CustomerService.ANONYMOUS_ID` pour distinguer un visiteur sans compte d'un client authentifié.

## Exemples concrets
- Cliquer sur `Connexion anonyme` enregistre un utilisateur invité et ouvre le catalogue.
- Choisir un client existant permet de reprendre ses paniers et commandes.

## Relations avec PrestaShop
Ressources utilisées : `customers`.

## Dépendances
- `src/backend/entities/Customer.js`
- `src/backend/services/CustomerService.js`
- `src/hooks/useLocalStorage.jsx`

## Voir aussi
- [useLocalStorage](hooks/useLocalStorage.md)

## Résumé
Écran de sélection du contexte utilisateur pour lancer l'expérience d'achat en mode client ou invité.
