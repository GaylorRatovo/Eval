# Reactiver la recherche produit dans la navbar FO

Ce guide explique comment remettre en service la recherche dans la navbar FrontOffice.

## 1) Reactiver l'etat et le handler
Dans [src/layouts/FOMainLayout.jsx](src/layouts/FOMainLayout.jsx), decommente les lignes suivantes:

```jsx
const [searchTerm, setSearchTerm] = useState("");

const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    setSearchTerm(nextValue);

    const query = nextValue.trim();
    const target = query ? `/fo/products?q=${encodeURIComponent(query)}` : "/fo/products";
    navigate(target, { replace: true });
};
```

## 2) Reactiver la liaison dans l'input
Toujours dans [src/layouts/FOMainLayout.jsx](src/layouts/FOMainLayout.jsx), decommente les props de l'input:

```jsx
<input
    type="text"
    className="form-control border-0 shadow-none ps-2"
    placeholder="Rechercher un produit..."
    aria-label="Recherche"
    value={searchTerm}
    onChange={handleSearchChange}
/>
```

## 3) Comportement attendu
- Lorsque l'utilisateur tape, l'URL devient: `/fo/products?q=...`.
- La page liste lit `q` via `useLocation` et filtre automatiquement.

## 4) Tests rapides
- Taper "tshirt" dans la barre.
- Verifier que l'URL change en `/fo/products?q=tshirt`.
- Verifier que la grille affiche les produits filtres.
