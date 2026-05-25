# FOGuestCheckout

## Rôle
Finaliser la commande d'un client invité en le rattachant au panier courant.

## Comportement
- Redirige vers `/fo` si aucun utilisateur n'est présent.
- Redirige vers `/fo/cart` si l'utilisateur n'est pas en mode invité.
- Charge le panier actif du client invité.
- Propose deux modes : sélection d'un client existant ou création d'un nouveau compte.

## Mode connexion
- Charge les clients via `Customer.getExclApi()`.
- Filtre les clients anonymes et invités.
- Connecte le client choisi au panier via `CustomerService.connectCustomerToCart()`.

## Mode inscription
- Valide la présence de tous les champs du formulaire.
- Crée le client et l'adresse via `CustomerService.registerCustomerForCart()`.
- Met à jour `user` et désactive `isGuest` après succès.

## Validation finale
- Vérifie la présence du panier et du client avant la commande.
- Crée la commande via `OderService.createOrderFromCart()`.
- Envoie ensuite vers `/fo/orders`.

## Dépendances
- `src/backend/entities/Customer.js`
- `src/backend/services/CartService.js`
- `src/backend/services/CustomerService.js`
- `src/backend/services/OderService.js`
- `src/components/FOUserRow.jsx`
- `src/hooks/useLocalStorage.jsx`

## Résumé
Point de transition entre panier invité, création de compte et validation de commande.
# FOGuestCheckout

## Présentation générale
`FOGuestCheckout.jsx` finalise une commande lorsque le panier appartient à un client invité ou quand il faut rattacher ce panier à un client existant.

## Fonctionnement utilisateur
1. La page vérifie que l'utilisateur est bien en mode invité.
2. Elle recharge le panier actif du client invité.
3. En mode `login`, l'utilisateur choisit un client existant.
4. En mode `register`, il saisit les informations du nouveau client.
5. `CustomerService` rattache ou crée le client et son adresse.
6. `OderService.createOrderFromCart` crée la commande.

## Flux de données
Utilisateur
    ↓
`FOGuestCheckout.jsx`
    ↓
`CustomerService.connectCustomerToCart` ou `CustomerService.registerCustomerForCart`
    ↓
`CartService` + `Customer` + `Address`
    ↓
`OderService.createOrderFromCart`

## Logique métier
La page refuse l'accès si l'utilisateur n'est pas invité ou si le panier est introuvable. Les champs du formulaire sont vérifiés avant la création du compte. Le flux invite à terminer la commande sans exiger un compte déjà existant.

## Exemples concrets
- Sélectionner un client existant rattache son adresse au panier invité.
- Créer un nouveau compte enregistre client et adresse, puis finalise la commande.

## Relations avec PrestaShop
Ressources utilisées : `customers`, `addresses`, `carts`, `orders`.

## Dépendances
- `src/backend/services/CustomerService.js`
- `src/backend/services/CartService.js`
- `src/backend/services/OderService.js`
- `src/components/FOUserRow.jsx`

## Voir aussi
- [CustomerService](../BackOffice/services/CustomerService.md)
- [FOUserRow](components/FOUserRow.md)

## Résumé
Checkout invité avec deux chemins métier : rattacher un client existant ou en créer un nouveau avant la commande.
