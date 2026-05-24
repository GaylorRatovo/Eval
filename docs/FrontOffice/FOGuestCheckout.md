# FOGuestCheckout

## 1. Présentation générale
- Rôle : Finaliser une commande pour un client invité ou le connecter à un client existant.
- Utilisateurs : Clients invités ou administrés via la page de checkout.

## 2. Fonctionnement utilisateur
- Deux modes : `login` (choisir client existant) ou `register` (créer client et adresse).
- La page est protégée : sans user/id ou si l'utilisateur n'est pas invité, redirection automatique.
- Utilise `CustomerService` pour associer un client au panier ou créer un client pour le panier.
- Après association, `OderService.createOrderFromCart` crée la commande.

## 3. Flux de données
Utilisateur
    ↓
`FOGuestCheckout.jsx` (mode + form)
    ↓
`CustomerService.registerCustomerForCart` / `CustomerService.connectCustomerToCart`
    ↓
`OderService.createOrderFromCart` → persistance d'`Order` et `Cart`

## 4. Dépendances
- `CustomerService`, `CartService`, `OderService`, entité `Customer`.
- Composant `FOUserRow` pour la sélection d'un client existant.

## 5. Résumé
Gère l'inscription rapide ou la connexion d'un client pour finaliser une commande depuis un panier invité.
