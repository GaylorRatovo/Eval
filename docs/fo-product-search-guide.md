# FrontOffice Product Search Guide (copy/paste)

This guide shows how to enable the product search in the header. For now, the search input is commented out in the navbar. When you are ready, uncomment it and add the code below.

## 1) FOMainLayout: state + handler + input

Add the state and handler near the top of the component:

```jsx
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

function FOMainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    setSearchTerm(nextValue);

    const query = nextValue.trim();
    const target = query ? `/fo/products?q=${encodeURIComponent(query)}` : "/fo/products";
    navigate(target, { replace: true });
  };

  // ...rest of the component
}
```

Uncomment the search markup in the navbar and connect it:

```jsx
<div className="navbar-nav align-items-center flex-grow-1">
  <div className="nav-item d-flex align-items-center w-100">
    <i className="bx bx-search fs-4 lh-0"></i>
    <input
      type="text"
      className="form-control border-0 shadow-none ps-2"
      placeholder="Rechercher un produit..."
      aria-label="Recherche"
      value={searchTerm}
      onChange={handleSearchChange}
    />
  </div>
</div>
```

## 2) FOProductList: read the query and filter

Add the query parsing and filter right before the `return`:

```jsx
import { useLocation, useNavigate } from "react-router-dom";

function FOProductList() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") || "";
  const normalizedQuery = query.trim().toLowerCase();

  const filteredProducts = normalizedQuery
    ? products.filter((product) => {
        const name = product?.name?.[0]?.value || "";
        const ref = product?.reference || "";
        return (
          name.toLowerCase().includes(normalizedQuery) ||
          ref.toLowerCase().includes(normalizedQuery)
        );
      })
    : products;

  // Replace `products.map(...)` with `filteredProducts.map(...)` in the render.
}
```

## 3) Render the filtered list

Change the product loop:

```jsx
{filteredProducts.map((product) => {
  // ...same card rendering
})}
```

## 4) Optional: show a small hint for results

```jsx
<p className="text-muted mb-0">
  {normalizedQuery
    ? `Resultats pour "${query}" (${filteredProducts.length})`
    : "Decouvrez nos produits et leurs disponibilites."}
</p>
```

## Notes

- The search input is currently commented out in the navbar. When ready, uncomment it and add the handler.
- This uses the URL query parameter `?q=` so the search is shareable and refresh-safe.
- No new CSS needed. The input uses existing Sneat classes.
