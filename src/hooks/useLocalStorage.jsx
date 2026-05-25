import {useState} from "react";

/**
 * Hook de synchronisation entre l'état React et localStorage.
 *
 * Paramètres:
 * - `key` (string): clé de stockage local.
 * - `initialValue` (any): valeur de repli si rien n'est stocké.
 *
 * Type de résultat:
 * - Array `[value, setStoredValue]`.
 *
 * Ce que fait la fonction:
 * - Lit une valeur initiale depuis `localStorage`.
 * - Fournit un setter qui met à jour à la fois l'état React et le stockage local.
 *
 * Règles métier:
 * - `null` supprime la clé du stockage local.
 * - Toute autre valeur est sérialisée en JSON.
 *
 * Fonctionnement:
 * - L'initialisation tente un `JSON.parse` de la valeur stockée.
 * - Le setter persiste ensuite la nouvelle valeur de manière atomique côté UI.
 *
 * Exemple d'utilisation:
 * - Input: `const [user, setUser] = useLocalStorage("user", null)`
 * - Output attendu: `user` reflète le stockage local et `setUser` le met à jour.
 */
function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);

            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    /**
     * Met à jour l'état et persiste la nouvelle valeur dans localStorage.
     *
     * Paramètres:
     * - `newValue` (any): nouvelle valeur à stocker.
     *
     * Type de résultat:
     * - void.
     *
     * Ce que fait la fonction:
     * - Synchronise l'état React avec le stockage local.
     * - Supprime la clé si la nouvelle valeur vaut `null`.
     *
     * Règles métier:
     * - Une valeur nulle signifie suppression du stockage.
     *
     * Fonctionnement:
     * - L'état est mis à jour puis la valeur est sérialisée si nécessaire.
     *
     * Exemple d'utilisation:
     * - Input: `setStoredValue({ id: 3 })`
     * - Output attendu: la clé stockée contient l'objet sérialisé.
     */
    const setStoredValue = (newValue) => {
        try {
            setValue(newValue);

            // set(null) équivaut à supprimer
            if (newValue === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(newValue));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return [value, setStoredValue];
}

export default useLocalStorage;