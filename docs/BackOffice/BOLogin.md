# BOLogin

## 1. Présentation générale
- Rôle : Authentifier un utilisateur pour accéder au BackOffice (page de connexion simple).
- Problème métier : Restreindre l'accès aux pages administratives.
- Utilisateurs : Administrateurs.

## 2. Fonctionnement utilisateur
1. L'utilisateur saisit un email et mot de passe.
2. `checkCredentials` compare avec des valeurs codées en dur.
3. En cas de succès, `localStorage.boAuth` est positionné à `true` et l'utilisateur est redirigé vers `/orders`.
4. En cas d'échec, une alerte est affichée.

## 3. Flux de données
Utilisateur
    ↓
`BOLogin.jsx` (email/password)
    ↓
Vérification locale via `checkCredentials` (comparaison statique)
    ↓
`localStorage` + navigation via `useNavigate`

## 4. Logique métier
- Quoi : Contrôle d'accès simple.
- Comment : Vérification en dur des identifiants (`admin@gmail.com` / `admin123`).
- Pourquoi : Prototype/simplification pour développement; à remplacer en production par un système sécurisé.
- Quand : Au submit du formulaire.

Vérifications métier : aucune sécurisée — identifiants en clair (à corriger pour production).

## 5. Explication du code
- Composant : `BOLogin.jsx` — formulaire contrôlé, gestion d'état pour email/password.
- Hooks : `useState`, `useNavigate`.

## 6. Analogies
Comme une clé de porte laissée sous un paillasson — pratique pour dev, dangereuse en production.

## 7. Exemples concrets
- Saisir `admin@gmail.com` / `admin123` redirige vers la liste des commandes.

## 8. Relations avec PrestaShop
Aucune interaction PrestaShop directement depuis cette page (auth local).

## 9. Dépendances
- `react-router` (`useNavigate`) et `localStorage`.

## 10. Résumé
- Résumé métier : Page de connexion prototype.
- Résumé technique : Authentification locale non sécurisée — remplacer avant mise en production.
