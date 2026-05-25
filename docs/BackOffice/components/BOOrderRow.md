# BOOrderRow

## Rôle
Afficher les commandes dans un tableau et fournir la cellule d'action pour changer l'état.

## Fonctions internes
### `OrderActionCell`
Rend la liste déroulante d'état, la date de modification et le bouton `Modifier`.

## Propriétés
- `rows`: commandes à afficher.
- `edit`: état d'édition courant.
- `onChange`: callback de changement de champ.
- `onClick`: callback de validation.
- `title`: titre facultatif.

## Exemple
```jsx
<BOOrderRow rows={orders} edit={edit} onChange={handleChange} onClick={handleClick} />
```
