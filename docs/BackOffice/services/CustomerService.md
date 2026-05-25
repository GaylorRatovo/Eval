# CustomerService

## Rôle
Associer un client à un panier existant ou créer un client et son adresse pour poursuivre le checkout.

## Fonctions
### `connectCustomerToCart(cart, customer)`
Recharge le client, récupère sa première adresse puis rattache le panier à ce client.

### `registerCustomerForCart(cart, form, options = {})`
Crée un client, crée son adresse de livraison/facturation puis met à jour le panier avec ces nouvelles références.

## Constantes
- `ANONYMOUS_ID`: identifiant du client anonyme.
- `DEFAULT_COUNTRY_ID`: pays par défaut pour la création d'adresse.

## Exemple
```js
const result = await CustomerService.registerCustomerForCart(cart, {
  firstname: 'Ada',
  lastname: 'Lovelace',
  email: 'ada@example.com',
  password: 'secret',
  address1: '12 Rue des Tests',
  postcode: '101',
  city: 'Antananarivo'
})
```

## Résultat attendu
Un objet `{ cart, customer, address }` prêt pour la création de commande.
