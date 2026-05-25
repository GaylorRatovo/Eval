# Export CSV avec Material React Table

Ce guide propose un bloc a copier-coller pour exporter une table Material React Table en CSV.

## 1) Installer la dependance (si besoin)

```bash
npm i export-to-csv
```

## 2) Ajouter le helper d'export

Dans le fichier ou la table est declaree (ex: BOStatistic.jsx), ajoute ceci:

```jsx
import { ExportToCsv } from "export-to-csv";

const csvExporter = new ExportToCsv({
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    showLabels: true,
    useBom: true,
    filename: "export-table",
});

const handleExportCSV = () => {
    const rows = table.getRowModel().rows;
    const data = rows.map((row) => row.original);
    csvExporter.generateCsv(data);
};
```

## 3) Ajouter un bouton d'export

Place un bouton pres de la table:

```jsx
<button className="btn btn-outline-secondary btn-sm" onClick={handleExportCSV}>
    Export CSV
</button>
```

## Notes
- `table` est l'instance retournee par `useMaterialReactTable`.
- Si tu veux exporter uniquement les lignes filtrees, garde `table.getRowModel().rows`.
- Si tu veux exporter toutes les lignes, utilise `table.getPrePaginationRowModel().rows`.
