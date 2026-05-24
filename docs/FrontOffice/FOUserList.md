# FOUserList

## 1. Présentation générale
- Rôle : Permettre à un utilisateur de se connecter en choisissant un client existant ou en choisissant une connexion anonyme.
- Utilisateurs : Utilisateurs du site souhaitant s'identifier pour utiliser le panier.

## 2. Fonctionnement utilisateur
- Charge la liste des clients via `Customer.getAllFiltered()`.
- Bouton pour connexion anonyme (`CustomerService.ANONYMOUS_ID`) ou sélection d'un client.
- Le contexte utilisateur est stocké via `useLocalStorage` (`user`, `isGuest`) puis redirection vers le catalogue.

## 3. Dépendances
- `Customer` entity, `CustomerService`, `useLocalStorage`.

## 4. Résumé
Page de sélection/connexion client pour l'expérience d'achat (prototype simple sans mot de passe ici).
