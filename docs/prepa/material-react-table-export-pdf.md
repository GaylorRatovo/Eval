# Export PDF avec Material React Table

Ce guide propose un bloc a copier-coller pour exporter une table Material React Table en PDF.

## 1) Installer les dependances (si besoin)

```bash
npm i jspdf jspdf-autotable
```

## 2) Ajouter le helper d'export

Dans le fichier ou la table est declaree (ex: BOStatistic.jsx), ajoute ceci:

```jsx
import jsPDF from "jspdf";
import "jspdf-autotable";

const handleExportPDF = () => {
    const doc = new jsPDF();

    const columns = table.getAllLeafColumns()
        .filter((col) => col.id !== "mrt-row-actions")
        .map((col) => col.columnDef.header || col.id);

    const rows = table.getRowModel().rows.map((row) =>
        columns.map((colHeader, index) => {
            const col = table.getAllLeafColumns()[index];
            return row.getValue(col.id);
        })
    );

    doc.text("Export table", 14, 15);
    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 20,
        styles: { fontSize: 9 },
    });

    doc.save("export-table.pdf");
};
```

## 3) Ajouter un bouton d'export

```jsx
<button className="btn btn-outline-secondary btn-sm" onClick={handleExportPDF}>
    Export PDF
</button>
```

## Notes
- `table` est l'instance retournee par `useMaterialReactTable`.
- Si tu utilises la pagination, l'export ne prend que la page courante.
- Pour exporter toutes les lignes, utilise `table.getPrePaginationRowModel().rows`.
