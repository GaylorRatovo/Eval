import {useMemo, useState} from "react";
import {RESOURCES_TO_RESET} from "../backend/services/Reset.js";
import {deleteAll} from "../backend/services/Reset.js";

/**
 * Page BackOffice: réinitialisation sélective des ressources PrestaShop (reset massifs).
 *
 * Paramètres: aucun.
 * Retour: JSX — liste de ressources et contrôles de sélection.
 *
 * Règles métier:
 * - Utilise `RESOURCES_TO_RESET` pour l'ordre et `deleteAll` pour l'opération.
 * - Respecte les `PROTECTED_IDS` définis dans le service `Reset`.
 */
function BOReset() {
    const [selected, setSelected] = useState(new Set());
    const [isResetting, setIsResetting] = useState(false);
    const [resetStatus, setResetStatus] = useState(null);
    const orderByValue = useMemo(() => {
        const orderMap = new Map();
        RESOURCES_TO_RESET.forEach((r) => orderMap.set(r.value, {
            order: r.order,
            description: r.description,
            value: r.value
        }));
        return orderMap;
    }, [])
    const isAllSelected = selected.size === RESOURCES_TO_RESET.length;
    
    /**
     * Bascule la sélection d'une ressource à supprimer.
     *
     * Paramètres: `key` (string) — valeur de ressource.
     * Retour: void.
     */
    const toggleItem = (key) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            console.log("reset key", key);
            const ordered = Array.from(next).sort((a, b) => {
                const orderA = orderByValue.get(a)?.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = orderByValue.get(b)?.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
            return new Set(ordered);
        });
    }

    /**
     * Sélectionne ou désélectionne toutes les ressources.
     *
     * Paramètres: aucun.
     * Retour: void.
     */
    const toggleAll = () => {
        if (isAllSelected) {
            setSelected(new Set());
        }
        else {
            const allKeys = RESOURCES_TO_RESET.map((r) => r.value);
            setSelected(new Set(allKeys));
        }
    }

    /**
     * Lance la suppression des ressources sélectionnées via `deleteAll`.
     *
     * Paramètres: aucun.
     * Retour: void.
     */
    const doDelete = async () => {
        // Etape 1: ignorer si aucune ressource n'est choisie.
        if (selected.size === 0) {
            setResetStatus({ success: false, message: "Selectionnez au moins une ressource." });
            return;
        }

        // Etape 2: afficher l'etat "en cours".
        setIsResetting(true);
        setResetStatus(null);

        try {
            await deleteAll(selected);
            // Etape 3: indiquer le succes.
            setResetStatus({ success: true, message: "Reset termine avec succes." });
        } catch (error) {
            // Etape 4: afficher l'erreur.
            setResetStatus({
                success: false,
                message: error?.message || "Erreur lors du reset."
            });
        } finally {
            setIsResetting(false);
        }
    }

    return (
        <div>
            {/* En-tete */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold mb-1">Reset</h1>
                    <p className="text-body-secondary mb-0">Reinitialiser les ressources BackOffice</p>
                </div>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    {/* Indication visuelle de statut */}
                    {isResetting && (
                        <div className="alert alert-info d-flex align-items-center" role="alert">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Reset en cours...
                        </div>
                    )}

                    {!isResetting && resetStatus && (
                        <div className={`alert ${resetStatus.success ? "alert-success" : "alert-danger"}`} role="alert">
                            <i className={`bx ${resetStatus.success ? "bx-check-circle" : "bx-error-circle"} me-2`}></i>
                            {resetStatus.message}
                        </div>
                    )}

                    {/* Liste des ressources */}
                    <div className="d-grid gap-2">
                        {[...orderByValue.values()].map((resource) => (
                            <div key={resource.value} className="form-check">
                                <input
                                    id={`reset-${resource.value}`}
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selected.has(resource.value)}
                                    onChange={() => toggleItem(resource.value)}
                                />
                                <label className="form-check-label" htmlFor={`reset-${resource.value}`}>
                                    <strong>{resource.value}</strong>
                                    <span className="text-body-secondary"> — {resource.description}</span>
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="d-flex flex-wrap gap-2 mt-4">
                        <button className="btn btn-outline-secondary" onClick={toggleAll}>
                            {isAllSelected ? "Deselectionner tout" : "Selectionner tout"}
                        </button>
                        <button className="btn btn-danger" onClick={doDelete} disabled={isResetting}>
                            <i className="bx bx-trash me-2"></i>
                            {isResetting ? "Reset en cours..." : "Valider"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default BOReset;