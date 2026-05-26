# Analyse : Pourquoi les Quantités Diffèrent Entre les Deux Tableaux

## 🎯 Résumé rapide

**Les deux tableaux ont des quantités différentes parce qu'ils mesurent des choses différentes :**

| Aspect | Tableau 1 (FromProductLines) | Tableau 2 (FromStock) |
|--------|-----|-----|
| **Source** | Détails de commandes (`orderDetail.productQuantity`) | Mouvements de stock d'entrée (`mvtStock.physicalQuantity`) |
| **Ce qu'on mesure** | **Quantités vendues** — Ce qui a été commandé | **Quantités entrées en stock** — Ce qui est arrivé |
| **Filtre de date** | Date de la commande | Date du mouvement de stock |
| **Cas de différence** | Retours, pertes, ajustements | Décalages d'approvisionnement |

---

## 📊 Analyse Détaillée du Code

### 1️⃣ Tableau 1 : `orderCategoryMetrics` (FromProductLines)

```javascript
// src/pages/BOStatistic.jsx, ligne 94-96
const orderCategoryMetrics = useMemo(() => {
    const orderLineMetrics = OrderLineMetrics.listFromOrderGroups(orderFiltered, productsWithDecl)
    const orderLineMetricsGroupedByProduct = OrderLineMetrics.groupByProductAndCombinationLines(orderLineMetrics)
    return OrderCategoryMetrics.groupByCategoryFromProductLines(orderLineMetricsGroupedByProduct)
}, [orderFiltered, productsWithDecl])
```

**Pipeline en détail :**

**A. `OrderLineMetrics.listFromOrderGroups()`**
- **Source** : `orderFiltered` (commandes filtrées par date)
- **Extraction** : Pour chaque `orderDetail` :
  ```javascript
  quantity = orderDetail.productQuantity  // ← La quantité commandée
  unitSalePrice = orderDetail.unitPriceTaxExcl
  ```
- **Résultat** : Chaque ligne = 1 détail de commande

**B. `groupByProductAndCombinationLines()`**
- **Groupement** : Par clé `productId|productAttributeId`
- **Cumul** : Somme les quantités
  ```javascript
  current.quantity += quantity  // Accumulation par produit
  ```

**C. `groupByCategoryFromProductLines()`**
- **Regroupement final** : Par catégorie
- **Cumul des quantités** :
  ```javascript
  current.quantity = normalizeNumber(current.quantity) + quantity
  ```

**✅ Résultat** : **Quantité totale commandée par catégorie sur la période**

---

### 2️⃣ Tableau 2 : `orderCategoryMetricsFromStock` (FromTotals)

```javascript
// src/pages/BOStatistic.jsx, ligne 100-106
const orderCategoryMetricsFromStock = useMemo(() => {
    const orderLineMetricsFromStock = OrderLineMetrics.listFromProductsWithStockMovements(
        orderFiltered,
        productsWithDecl,
        mvtFiltered,              // ← Mouvements filtrés par date
        stockAvailables
    )
    return OrderCategoryMetrics.groupByCategoryFromTotals(orderLineMetricsFromStock)
}, [orderFiltered, mvtFiltered, productsWithDecl, stockAvailables])
```

**Pipeline en détail :**

**A. `OrderLineMetrics.listFromProductsWithStockMovements()`**
- **Source 1** : `mvtFiltered` (mouvements de stock)
  ```javascript
  if (Number(mvt.sign) !== entrySign) continue  // ← On ne prend que les ENTRÉES
  
  // Cumul des quantités entrées
  entryQtyByKey.set(key, prevQty + mvt.physicalQuantity)  // ← Quantité entrée en stock
  ```

- **Source 2** : `orderFiltered` (pour les totaux vente, pas les quantités)
  ```javascript
  // Cumul des ventes par produit
  current.totalVente = normalizeNumber(current.totalVente) + ...
  current.quantity = normalizeNumber(current.quantity) + quantity  // ← De orderDetail!
  ```

- **Source 3** : Indexation par produit, pas par commande
  ```javascript
  for (const productDto of productsWithCombinations) {
      // Itération par produit
  }
  ```

**⚠️ Point clé** : 
```javascript
const totalEntryQty = normalizeNumber(entryQtyByKey.get(key))  // ← Du mouvement de stock
const totalAchat = totalEntryQty * unitPurchasePrice          // ← Basé sur le stock reçu

// Dans le mergedDetail pour OrderCategoryMetrics.groupByCategoryFromTotals
productQuantity: normalizeNumber(totals?.quantity)  // ← De orderTotalsByKey (commandes)
```

**✅ Résultat** : **Quantité totale entrée en stock par catégorie sur la période**

---

## 🔍 Comparaison Visuelle

```
Exemple avec 1 produit sur la période 2025-05-01 à 2025-05-31:

┌─────────────────────────────────────────────────────────────┐
│              COMMANDES (Tableau 1)                          │
├─────────────────────────────────────────────────────────────┤
│ 2025-05-05 : Commande CO-001 → 50 unités                    │
│ 2025-05-10 : Commande CO-002 → 30 unités                    │
│ 2025-05-20 : Commande CO-003 → -20 unités (retour)         │
│                                                              │
│ TOTAL QUANTITÉ = 50 + 30 - 20 = 60 unités                   │
│ (Ce qu'on a VENDU/COMMANDÉ)                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         MOUVEMENTS DE STOCK (Tableau 2)                     │
├─────────────────────────────────────────────────────────────┤
│ 2025-05-02 : Entrée Fournisseur → +80 unités               │
│ 2025-05-15 : Entrée Retour → +10 unités                     │
│ 2025-05-25 : Sortie Casse → -5 unités (exclu, sign ≠ entry)│
│                                                              │
│ TOTAL QUANTITÉ ENTRÉE = 80 + 10 = 90 unités                │
│ (Ce qu'on a REÇU en stock)                                 │
└─────────────────────────────────────────────────────────────┘

⚠️  DIFFÉRENCE : 90 - 60 = 30 unités écart
```

---

## 📌 Cas Typiques de Différence

### Cas 1️⃣ : Stock reçu en retard
```
Commande CO-001 : 2025-05-10 → 50 unités
Réception stock  : 2025-06-05 → 50 unités

Tableau 1 (mai)  : 50 unités vendues
Tableau 2 (mai)  : 0 unités reçues

Tableau 1 (juin) : 0 unités vendues
Tableau 2 (juin) : 50 unités reçues
```

### Cas 2️⃣ : Stock perdu ou cassé
```
Commande CO-001 : 2025-05-05 → 50 unités
Réception stock  : 2025-05-05 → 50 unités
Casse détectée   : 2025-05-15 → -10 unités (sortie)

Tableau 1 (mai) : 50 unités vendues
Tableau 2 (mai) : 50 unités reçues
(Casse = sortie, sign ≠ entry, donc exclue de Tableau 2)
```

### Cas 3️⃣ : Retours clients
```
Commande CO-001 : 2025-05-05 → 50 unités
Retour client   : 2025-05-20 → -20 unités (OrderDetail négatif)
Réception retour: 2025-05-22 → +20 unités (mouvement d'entrée)

Tableau 1 (mai) : 50 - 20 = 30 unités commandées
Tableau 2 (mai) : 50 + 20 = 70 unités reçues
```

---

## 🛠️ Code Source — Points Clés

### **Différence 1 : Source de la quantité**

**Tableau 1** (OrderLineMetrics.listFromOrderGroups) :
```javascript
// src/backend/dto/OrderLineMetrics.js, ligne 67
const quantity = normalizeNumber(orderDetail?.productQuantity)
// → Quantité de la ligne de commande (peut être négative)
```

**Tableau 2** (OrderLineMetrics.listFromProductsWithStockMovements) :
```javascript
// src/backend/dto/OrderLineMetrics.js, ligne 141
if (Number(mvt?.sign) !== entrySign) continue  // ← Filtre : entrées uniquement

// Cumul, ligne 150
entryQtyByKey.set(key, prevQty + normalizeNumber(mvt?.physicalQuantity))
// → Quantité du mouvement d'entrée (sign = +1)
```

### **Différence 2 : Calcul du coût**

**Tableau 1** :
```javascript
// src/backend/dto/OrderCategoryMetrics.js, ligne 73-76
const quantity = normalizeNumber(item?.quantity)
const totalVente = quantity * normalizeNumber(item?.unitSalePrice)
const totalAchat = quantity * normalizeNumber(item?.unitPurchasePrice)
// → totalAchat = quantité commandée × prix d'achat du catalogue
```

**Tableau 2** :
```javascript
// src/backend/dto/OrderLineMetrics.js, ligne 262-266
const totalEntryQty = normalizeNumber(entryQtyByKey.get(key))
const totalAchat = totalEntryQty * unitPurchasePrice
// → totalAchat = quantité reçue en stock × prix d'achat du catalogue
```

### **Différence 3 : Agrégation finale**

**Tableau 1** (`groupByCategoryFromProductLines`) :
```javascript
// src/backend/dto/OrderCategoryMetrics.js, ligne 27-102
// Refait tous les calculs (quantity × unitPrice)
const benefice = totalVente - totalAchat
```

**Tableau 2** (`groupByCategoryFromTotals`) :
```javascript
// src/backend/dto/OrderCategoryMetrics.js, ligne 118-161
// Les totaux existent déjà, on les somme juste
current.quantity = normalizeNumber(current.quantity) + normalizeNumber(line?.orderDetail?.productQuantity)
current.totalVente = normalizeNumber(current.totalVente) + normalizeNumber(line?.totalVente)
```

---

## ✅ Conclusion

Les deux tableaux répondent à des **questions métier différentes** :

| Question | Tableau 1 | Tableau 2 |
|----------|-----------|-----------|
| *Combien ai-je vendu* ? | ✅ Quantité commandée | ❌ Non conçu pour ça |
| *Quel coût pour ce que j'ai reçu* ? | ❌ Utilise prix catalogue | ✅ Basé sur flux réel |
| *Quel est le delta logistique* ? | Commande | Réception |

**Les écarts revelent :**
- Retards d'approvisionnement (mouvements postérieurs à la commande)
- Pertes/casse (sorties)
- Ajustements manuels de stock
- Décalages entre périodes de commande et de réception

C'est **normal et utile** d'avoir deux chiffres différents !
