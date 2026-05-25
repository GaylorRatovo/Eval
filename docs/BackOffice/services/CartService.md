# CartService

## Rôle
Gérer la vie d'un panier PrestaShop : création, ajout de lignes, suppression, enrichissement, calculs et connexion à un client.

## Fonctions
### `buildDeliveryOption(addressId, carrierId = DEFAULT_CARRIER_ID)`
Construit la valeur JSON attendue par PrestaShop pour l'option de livraison.

### `isCartActive(idCart)`
Vérifie si un panier n'a pas encore de commande associée.

### `getLastCartByCustomer(idCustomer)`
Récupère le panier le plus récent d'un client.

### `createOrUpdateCart(idCustomer, date = new Date(), initialRows = [])`
Crée un panier si aucun panier actif n'existe, sinon réutilise le panier actif.

### `deleteItems(cart, rowIndex)`
Supprime une ligne du panier. Si le panier devient vide, il est supprimé.

### `addProductToCart(idCustomer, idProduct, idProductAttribute, quantity, multiplicateur = 1)`
Ajoute un produit au panier du client en tenant compte d'un multiplicateur.

### `duplicateCart(cart, multiplicateur, dateUpdate)`
Duplique les lignes d'un panier avec un facteur multiplicatif.

### `getProductForRow(cartRow)`
Charge le produit lié à une ligne de panier.

### `getStockForProductAttribute(productId, productAttributeId = 0)`
Retourne le stock disponible pour un produit ou une déclinaison.

### `getCartRowDetails(cartRow)`
Construit les détails métier d'une ligne de panier : produit, image, déclinaison, prix TTC, stock.

### `updateCartForCustomer(cart, customer, address)`
Réaffecte un panier à un client et à une adresse.

### `getCartTotals(cart)`
Calcule les totaux HT/TTC d'un panier enrichi.

### `getCartsWithoutOrder()`
Récupère les paniers sans commande associée.

### `getCartWithoutOrderByCustomer(customerId)`
Filtre les paniers sans commande d'un client précis.

### `enrichCarts(carts = [])`
Transforme une liste de paniers bruts en objets enrichis via `CartWithDetails`.

## Exemple
```js
const cart = await CartService.addProductToCart(12, 45, 0, 3)
const totals = CartService.getCartTotals(cart)
```
