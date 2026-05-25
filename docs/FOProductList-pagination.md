# Pagination pour FOProductList

Ce guide contient un bloc de code a copier-coller pour ajouter une pagination simple a la liste des produits.

## 1) Ajout des etats et donnees derivees
Ajoute ce bloc dans FOProductList.jsx, apres les hooks useState/useMemo existants.

```jsx
// Pagination
const [currentPage, setCurrentPage] = useState(1);
const pageSize = 12;

const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
}, [currentPage, filteredProducts]);

useEffect(() => {
    // Revenir a la page 1 quand les filtres changent
    setCurrentPage(1);
}, [minPrice, maxPrice, categoryId, name, queryFromUrl]);
```

## 2) Remplacer la liste affichee
Remplace `filteredProducts.map(...)` par `pagedProducts.map(...)`.

Exemple:
```jsx
{pagedProducts.map((product, index) => (
    // ... tes cartes
))}
```

## 3) Ajouter la barre de pagination
Ajoute ce bloc juste apres la grille des produits, avant l'alerte d'empty state.

```jsx
{totalPages > 1 && (
    <nav aria-label="Pagination produits" className="mt-4">
        <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                    Precedent
                </button>
            </li>

            {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                    <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(page)}>
                            {page}
                        </button>
                    </li>
                );
            })}

            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                    Suivant
                </button>
            </li>
        </ul>
    </nav>
)}
```

## Notes
- `pageSize` controle le nombre de cartes par page.
- Le `useEffect` remet la pagination a la page 1 quand un filtre change.
- Le composant utilise les classes Bootstrap, donc aucun CSS additionnel n'est requis.
