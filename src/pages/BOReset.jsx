import {useMemo, useState} from "react";
import {RESOURCES_TO_RESET} from "../backend/services/Reset.js";
import {deleteAll} from "../backend/services/Reset.js";

/**
 * Page BackOffice de reinitialisation des ressources.
 * Regles metier: respecter l'ordre logique de suppression pour eviter les conflits de dependances.
 * Methode: selection de ressources puis suppression en masse via le service Reset.
 * Parametres: aucun.
 * Retour: JSX de selection/suppression.
 */
function BOReset() {
    const [selected, setSelected] = useState(new Set());
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
	 * Active/desactive une ressource dans la selection.
	 * Regles metier: maintien de l'ordre de suppression defini dans RESOURCES_TO_RESET.
	 * Parametres: key (string) valeur de ressource.
	 * Retour: void.
	 */
    const toggleItem = (key) => {
        setSelected((prev) => {
            // Etape 1: cloner la selection actuelle pour eviter la mutation directe.
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            console.log("reset key", key);
            // Etape 2: trier selon l'ordre metier de suppression.
            const ordered = Array.from(next).sort((a, b) => {
                const orderA = orderByValue.get(a)?.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = orderByValue.get(b)?.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
            return new Set(ordered);
        });
    }

	/**
	 * Selectionne ou deselectionne toutes les ressources.
	 * Parametres: aucun.
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
     * Lance la suppression des ressources selectionnees.
     * Regles metier: operation destructive reservee a des environnements de test.
     * Parametres: aucun.
     * Retour: void (promise non attendue explicitement dans le composant).
     */
    const doDelete = () => {
        deleteAll(selected);
    }

    return (
        <div className="d-flex flex-column gap-4">
            <div>
                <h4 className="mb-1">Reset donnees</h4>
                <p className="text-muted mb-0">Suppression manuelle des ressources de test.</p>
            </div>
            <div className="card">
                <div className="card-body">
                    <div className="d-flex flex-column gap-2">
                        {[...orderByValue.values()].map((resource) => (
                            <div className="form-check" key={resource.value}>
                                <input
                                    className="form-check-input"
                                    id={`reset-${resource.value}`}
                                    type="checkbox"
                                    checked={selected.has(resource.value)}
                                    onChange={() => toggleItem(resource.value)}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor={`reset-${resource.value}`}
                                >
                                    {resource.value} / {resource.description}
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        <button className="btn btn-outline-secondary" onClick={toggleAll}>
                            {isAllSelected ? "Deselectionner tout" : "Selectionner tout"}
                        </button>
                        <button className="btn btn-danger" onClick={doDelete}>Valider</button>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default BOReset;