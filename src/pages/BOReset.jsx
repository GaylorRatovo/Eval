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
    const doDelete = () => {
        deleteAll(selected);
    }

    return (
        <div>
            {[...orderByValue.values()].map((resource) => (
                <div key={resource.value}>
                    <input
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
            <button onClick={toggleAll}>{isAllSelected ? "Désélectionner tout" : "Sélectionner tout"}</button>
            <button onClick={doDelete}>Valider</button>
        </div>
    );

}

export default BOReset;