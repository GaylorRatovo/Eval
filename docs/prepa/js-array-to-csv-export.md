# Export d'une Liste JavaScript en CSV

Ce guide propose du code a copier-coller pour exporter un tableau JavaScript en fichier CSV.

## 1) Approche Sans Dépendance (Vanilla JavaScript)

C'est la solution la plus simple et la plus legere. Aucune dependance a installer.

### Helper d'export

```javascript
const exportToCSV = (data, filename = "export.csv") => {
    // Convertir les donnees en CSV
    const csv = convertArrayToCSV(data);
    
    // Creer un blob
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    
    // Creer un lien et telecharger
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

const convertArrayToCSV = (data) => {
    if (!data || data.length === 0) return "";
    
    // Recuperer les cles (en-tetes)
    const headers = Object.keys(data[0]);
    
    // Creer la ligne d'en-tete
    const headerRow = headers.map(escapeCSVField).join(",");
    
    // Creer les lignes de donnees
    const rows = data.map((item) =>
        headers.map((header) => escapeCSVField(item[header])).join(",")
    );
    
    return [headerRow, ...rows].join("\n");
};

const escapeCSVField = (field) => {
    if (field === null || field === undefined) return "";
    
    const stringField = String(field);
    
    // Si le champ contient une virgule, un guillemet ou une nouvelle ligne, l'entourer de guillemets
    if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    
    return stringField;
};
```

### Exemple d'utilisation

```javascript
// Donnees a exporter
const users = [
    { id: 1, name: "Alice Dupont", email: "alice@example.com", age: 28 },
    { id: 2, name: "Bob Martin", email: "bob@example.com", age: 35 },
    { id: 3, name: "Charlie Durand", email: "charlie@example.com", age: 42 },
];

// Lancer l'export
exportToCSV(users, "users-export.csv");
```

## 2) Approche Avec Dépendance (export-to-csv)

Pour plus de controle et de fonctionnalites.

### Installation

```bash
npm i export-to-csv
```

### Code a copier-coller

```javascript
import { ExportToCsv } from "export-to-csv";

const exportToCSV = (data, filename = "export.csv") => {
    const csvExporter = new ExportToCsv({
        fieldSeparator: ",",
        quoteStrings: '"',
        decimalSeparator: ".",
        showLabels: true,
        useBom: true,
        filename: filename,
    });
    
    csvExporter.generateCsv(data);
};

// Utilisation
const products = [
    { id: 1, name: "Laptop", price: 999.99, stock: 15 },
    { id: 2, name: "Mouse", price: 29.99, stock: 150 },
    { id: 3, name: "Keyboard", price: 79.99, stock: 45 },
];

exportToCSV(products, "products-export.csv");
```

## 3) Utilisation dans un Composant React

Intègre l'export dans un bouton React:

```jsx
import { useState } from "react";

const MyTable = ({ data }) => {
    const handleExport = () => {
        const csv = convertArrayToCSV(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `export-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    return (
        <div>
            <button 
                className="btn btn-primary" 
                onClick={handleExport}
            >
                📥 Exporter en CSV
            </button>
            {/* Reste du composant */}
        </div>
    );
};
```

## 4) Exemple Complet (Vue d'ensemble)

```javascript
// Fonction complete a utiliser directement
function downloadCSV(arrayOfObjects, filename = "export.csv") {
    const csv = [
        // En-tete
        Object.keys(arrayOfObjects[0]).join(","),
        // Donnees
        ...arrayOfObjects.map((row) =>
            Object.values(row)
                .map((value) =>
                    typeof value === "string" && value.includes(",")
                        ? `"${value}"`
                        : value
                )
                .join(",")
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Test
downloadCSV([
    { id: 1, name: "Alice", department: "IT" },
    { id: 2, name: "Bob", department: "HR" },
], "employees.csv");
```

## Notes Importantes

- **BOM (Byte Order Mark)**: Ajouter `\ufeff` au debut du CSV pour que Excel affiche correctement les caracteres accentues (ex: é, è, ê).
- **Echappement**: Les guillemets dans les donnees doivent etre doubles (`""`).
- **Separateurs**: La virgule est standard, mais tu peux utiliser `;` pour Excel si besoin.
- **Dates**: Convertis les dates en format lisible avant l'export (ex: `new Date().toLocaleDateString("fr-FR")`).
- **Nombres**: Les nombres avec decimales seront exprimes avec un point (`.`) par defaut.

## Bonus: Export avec BOM pour Excel

```javascript
const exportToCSVWithBOM = (data, filename = "export.csv") => {
    const csv = convertArrayToCSV(data);
    const BOM = "\ufeff";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};
```
