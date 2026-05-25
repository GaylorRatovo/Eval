# Exporter une page (ou une section) en PDF

Ce guide permet d'exporter soit toute la page, soit une partie specifique (un bloc) en PDF.

## 1) Installer la dependance

```bash
npm i html2canvas jspdf
```

## 2) Ajouter le helper d'export

Dans le composant React cible, ajoute:

```jsx
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const exportSectionToPDF = async ({
    elementId,
    filename = "export",
    orientation = "p",
    scale = 2,
}) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error("Element introuvable:", elementId);
        return;
    }

    // Capture l'element en image
    const canvas = await html2canvas(element, { scale });
    const imgData = canvas.toDataURL("image/png");

    // Cree le PDF
    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Conserver le ratio et ajuster a la largeur
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    let heightLeft = imgHeight;

    // Premiere page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Pages suivantes si necessaire
    while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
};
```

## 3) Utilisation pour une section

1. Ajoute un id sur la section cible.

```jsx
<div id="export-section">
    {/* Contenu a exporter */}
</div>
```

2. Ajoute un bouton d'export.

```jsx
<button
    className="btn btn-outline-secondary btn-sm"
    onClick={() => exportSectionToPDF({ elementId: "export-section", filename: "section" })}
>
    Exporter la section en PDF
</button>
```

## 4) Utilisation pour toute la page

1. Encadre le contenu global dans un bloc avec id.

```jsx
<div id="export-page">
    {/* Toute la page */}
</div>
```

2. Bouton:

```jsx
<button
    className="btn btn-outline-secondary btn-sm"
    onClick={() => exportSectionToPDF({ elementId: "export-page", filename: "page" })}
>
    Exporter la page en PDF
</button>
```

## Notes
- L'export genere une image du DOM, donc les contenus dynamiques doivent etre visibles avant export.
- Pour une meilleure qualite, augmente `scale` (2 ou 3).
- Si la page est tres longue, le PDF peut devenir lourd.
