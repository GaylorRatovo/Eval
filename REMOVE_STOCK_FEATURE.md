# Remove Stock Feature - Documentation

## Overview

Cette fonctionnalité ajoute un lien **"Remove Stock"** à chaque produit de la liste FrontOffice. Elle permet aux administrateurs de retirer du stock de produits après authentification.

## Architecture

### Flow utilisateur

```
Utilisateur clique sur "Remove Stock"
          ↓
Modal 1: Saisir mot de passe admin
          ↓
Vérification du mot de passe
          ├─ ❌ Mot de passe incorrect → Afficher erreur
          ├─ ✓ Mot de passe correct → Passer à l'étape 2
          ↓
Modal 2: Sélectionner catégorie + quantité
          ↓
Mise à jour du stock en base de données
          ↓
Message de succès et fermeture des modals
```

## Composants créés

### 1. **AdminPasswordModal.jsx**
**Localisation**: `src/components/AdminPasswordModal.jsx`

**Responsabilités**:
- Affiche un modal demandant le mot de passe admin
- Valide les identifiants contre le mot de passe hardcodé
- Affiche un message d'erreur en cas d'échec
- Appelle le callback `onSuccess` en cas de succès

**Props**:
```javascript
{
  onSuccess: Function,    // Callback appelé si authentification réussie
  onClose: Function,      // Callback pour fermer le modal
  productId: Number       // ID du produit (pour contexte)
}
```

**Styles utilisés**:
- Bootstrap: `modal`, `modal-dialog-centered`, `form-control`, `btn-close-white`, `bg-danger`
- Erreur: `alert alert-danger`

**Mot de passe admin**: `admin123` (défini dans `StockRemovalService.js`)

---

### 2. **RemoveStockModal.jsx**
**Localisation**: `src/components/RemoveStockModal.jsx`

**Responsabilités**:
- Charge les catégories/attributs du produit
- Affiche un sélecteur de catégorie
- Capture la quantité à retirer
- Appelle le service pour mettre à jour le stock
- Affiche message de succès ou erreur

**Props**:
```javascript
{
  onClose: Function,       // Callback pour fermer le modal
  productId: Number,       // ID du produit
  productName: String      // Nom du produit pour affichage
}
```

**Fonctionnement**:
1. Au montage, charge les attributs du produit via `Product.getAttributes()`
2. Affiche un dropdown avec les catégories disponibles
3. Permet saisir une quantité > 0
4. À la soumission:
   - Appelle `removeProductStock(productId, categoryId, quantity)`
   - Affiche un message de succès
   - Ferme automatiquement après 2 secondes

**Styles utilisés**:
- Bootstrap: `modal`, `form-select`, `form-control`, `bg-warning`, `alert-success`
- Loading: `spinner-border`

---

### 3. **FOProductCard.jsx** (modifié)
**Localisation**: `src/components/FOProductCard.jsx`

**Changements**:
- Ajout des imports: `useState`, `AdminPasswordModal`, `RemoveStockModal`
- Gestion d'état pour afficher/masquer les deux modals
- Bouton "🗑️ Remove Stock" avec style Bootstrap
- Deux callbacks pour gérer le flux entre les modals

**États gérés**:
```javascript
showPasswordModal     // boolean - affiche le modal de mot de passe
showRemoveStockModal  // boolean - affiche le modal de suppression
```

**Comportement du bouton**:
```
Clic sur "Remove Stock"
  ↓
Affiche AdminPasswordModal
  ├─ Admin valide → Ferme AdminPasswordModal + Affiche RemoveStockModal
  └─ Admin invalide → Garde AdminPasswordModal affichée + Erreur
  ↓
Admin complète RemoveStockModal
  ↓
Ferme RemoveStockModal
```

---

## Service créé

### 4. **StockRemovalService.js**
**Localisation**: `src/backend/services/StockRemovalService.js`

**Fonctions exportées**:

#### `verifyAdminPassword(password: string): boolean`
```javascript
// Valide le mot de passe admin
if (verifyAdminPassword('admin123')) {
  // ✓ Correct
}
```

#### `removeProductStock(productId, categoryId, quantityToRemove): Promise<object>`
```javascript
// Retire de la quantité de stock
const result = await removeProductStock(42, 5, 10);
// Retour: { success: true, message: "...", newQuantity: 15 }
```

**Processus interne**:
1. Récupère le stock actuel via `StockAvailable.getList({id_product, id_product_attribute})`
2. Calcule la nouvelle quantité: `Math.max(0, current - toRemove)`
3. Sauvegarde en base: `stockAvailable.save()`
4. Retourne l'objet result avec la nouvelle quantité

---

## Intégration dans FOProductList

Le composant `FOProductList.jsx` n'a **pas besoin de modification**. 

Les modals gérés dans `FOProductCard` s'affichent localement et indépendamment pour chaque produit.

---

## Flux d'exécution complet

### Étape 1: Utilisateur clique "Remove Stock"
```jsx
// FOProductCard.jsx
<button onClick={handleRemoveStockClick}>
  🗑️ Remove Stock
</button>

// → showPasswordModal = true
```

### Étape 2: Modal mot de passe s'affiche
```jsx
{showPasswordModal && (
  <AdminPasswordModal
    onSuccess={handlePasswordVerified}
    onClose={handleCloseModals}
    productId={product.id}
  />
)}
```

### Étape 3: Admin saisit mot de passe
```javascript
// AdminPasswordModal.jsx
const handleSubmit = (e) => {
  if (verifyAdminPassword(password)) {
    onSuccess();  // → handlePasswordVerified()
  } else {
    setError('Mot de passe admin incorrect');
  }
};
```

### Étape 4: Validation réussie → Affiche second modal
```javascript
// FOProductCard.jsx
const handlePasswordVerified = () => {
  setShowPasswordModal(false);
  setShowRemoveStockModal(true);  // Affiche RemoveStockModal
};
```

### Étape 5: Admin sélectionne catégorie et quantité
```jsx
// RemoveStockModal.jsx
<select value={selectedCategory} onChange={...}>
  {categories.map(cat => ...)}
</select>

<input type="number" value={quantity} onChange={...} />
```

### Étape 6: Admin clique "Remove Stock"
```javascript
const handleSubmit = async (e) => {
  const result = await removeProductStock(
    productId,
    selectedCategory,
    parseInt(quantity)
  );
  
  setSuccess(`✓ Stock removed successfully! New quantity: ${result.newQuantity}`);
  
  // Ferme après 2 secondes
  setTimeout(() => onClose(), 2000);
};
```

### Étape 7: Succès et retour à la liste
```
✓ Message de succès affiché
  ↓ (2 secondes)
Fermeture de tous les modals
  ↓
Retour à FOProductList normale
```

---

## Gestion des erreurs

| Erreur | Traitement |
|--------|-----------|
| Mot de passe incorrect | Affichage `alert-danger` dans AdminPasswordModal |
| Catégorie non sélectionnée | Validation du formulaire avant soumission |
| Quantité invalide | Validation: `quantity > 0` |
| Stock non trouvé | Erreur capturée par `try/catch` dans RemoveStockModal |
| Erreur API | Message d'erreur affiché à l'utilisateur |

---

## Constantes et configurations

### Mot de passe admin
**Fichier**: `src/backend/services/StockRemovalService.js`
```javascript
const ADMIN_PASSWORD = 'admin123';
```

Pour modifier le mot de passe, changez cette valeur.

### Styles Bootstrap utilisés
- `modal d-block` - affiche le modal
- `btn-close`, `btn-close-white` - boutons de fermeture
- `btn btn-sm btn-outline-danger` - bouton "Remove Stock"
- `bg-danger`, `bg-warning` - en-têtes des modals
- `alert alert-danger`, `alert alert-success` - messages
- `form-control`, `form-select` - champs de saisie
- `spinner-border` - indicateur de chargement

---

## Dépendances

### Composants utilisés:
- `React` (useState, useEffect)
- `Product` entity
- `StockAvailable` entity
- Services:
  - `StockRemovalService.js` (verifyAdminPassword, removeProductStock)

### Entités:
- `Product.getAttributes()` - récupère les catégories
- `StockAvailable.getList()` - récupère le stock actuel
- `StockAvailable.save()` - sauvegarde les modifications

---

## Tests manuels recommandés

### Test 1: Mot de passe incorrect
1. Cliquer "Remove Stock"
2. Saisir un mauvais mot de passe
3. ✓ Erreur affichée
4. ✓ Modal reste ouvert

### Test 2: Mot de passe correct
1. Cliquer "Remove Stock"
2. Saisir `admin123`
3. ✓ Premier modal ferme
4. ✓ Deuxième modal s'affiche

### Test 3: Retrait de stock
1. Passer l'authentification
2. Sélectionner une catégorie
3. Saisir une quantité (ex: 5)
4. Cliquer "Remove Stock"
5. ✓ Message de succès affiché
6. ✓ Modals ferment après 2 secondes
7. ✓ Vérifier en base que le stock a diminué

### Test 4: Annulation
1. À chaque étape, cliquer "Cancel"
2. ✓ Modal ferme
3. ✓ Retour à la liste

### Test 5: Validation des champs
1. Ouvrir RemoveStockModal
2. Ne rien saisir
3. ✓ Bouton "Remove Stock" désactivé
4. Saisir quantité 0
5. ✓ Bouton reste désactivé

---

## Améliorations futures possibles

1. **Historique des modifications**: Logger qui a retiré quel stock et quand
2. **Limite de quantité**: Empêcher de retirer plus que disponible
3. **Email de notification**: Avertir les responsables après modification
4. **Deux facteurs**: Ajouter SMS/email de confirmation
5. **Rôles multiples**: Supporter différents niveaux d'admin
6. **Audit trail**: Enregistrer toutes les modifications de stock

---

## Fichiers modifiés/créés

| Fichier | Type | Action |
|---------|------|--------|
| `src/components/AdminPasswordModal.jsx` | ✨ Nouveau | Création |
| `src/components/RemoveStockModal.jsx` | ✨ Nouveau | Création |
| `src/backend/services/StockRemovalService.js` | ✨ Nouveau | Création |
| `src/components/FOProductCard.jsx` | 📝 Modifié | Ajout bouton + modals |
| `src/pages/FOProductList.jsx` | ✓ Inchangé | Pas de modification |

---

## Vue d'ensemble des modals

### Modal 1: Authentification
```
┌─────────────────────────────────────┐
│ Admin Authentication Required   [×] │
├─────────────────────────────────────┤
│                                     │
│  Please enter the admin password:   │
│                                     │
│  Admin Password: [_____________]    │
│                                     │
│  ❌ Mot de passe admin incorrect    │
│                                     │
├─────────────────────────────────────┤
│  [ Cancel ]  [ Verify ]             │
└─────────────────────────────────────┘
```

### Modal 2: Suppression de stock
```
┌─────────────────────────────────────┐
│ Remove Stock                    [×] │
├─────────────────────────────────────┤
│                                     │
│  Product: **Product Name**          │
│                                     │
│  Category                           │
│  [-- Select a category --        ▼]│
│                                     │
│  Quantity to Remove                 │
│  [__________________]               │
│                                     │
│  ✓ Stock removed successfully!      │
│                                     │
├─────────────────────────────────────┤
│  [ Cancel ]  [ Remove Stock ]       │
└─────────────────────────────────────┘
```

---

## Code résumé - Interactions principales

### Ouverture du premier modal
```javascript
// FOProductCard.jsx
const handleRemoveStockClick = () => {
  setShowPasswordModal(true);
};
```

### Validation du mot de passe
```javascript
// AdminPasswordModal.jsx
const handleSubmit = (e) => {
  if (verifyAdminPassword(password)) {
    onSuccess();  // Transition vers second modal
  } else {
    setError('Mot de passe admin incorrect');
  }
};
```

### Retrait du stock
```javascript
// RemoveStockModal.jsx
const result = await removeProductStock(
  productId,
  selectedCategory,
  parseInt(quantity)
);
setSuccess(`✓ Stock removed successfully! New quantity: ${result.newQuantity}`);
```

### Fermeture
```javascript
// Après succès, fermeture automatique
setTimeout(() => {
  onClose();  // Ferme tous les modals
}, 2000);
```

---

## Intégration rapide

Pour intégrer cette fonctionnalité dans votre projet:

1. ✅ Créer les 3 fichiers (AdminPasswordModal.jsx, RemoveStockModal.jsx, StockRemovalService.js)
2. ✅ Mettre à jour FOProductCard.jsx
3. ✅ Tester le flux complet
4. ✅ Vérifier les mises à jour en base de données

Les fichiers sont prêts à l'emploi avec Bootstrap comme framework CSS!
