# BOMainLayout

## Présentation générale
`BOMainLayout.jsx` est le shell principal du BackOffice. Il protège les routes administratives, affiche la navigation commune et gère la déconnexion locale.

## Fonctionnement utilisateur
1. L'utilisateur arrive sur `/` ou sur une route BO protégée.
2. Le layout lit `localStorage.boAuth`.
3. Si l'utilisateur n'est pas authentifié, il est renvoyé vers la page de login.
4. Si l'utilisateur est déjà connecté et revient sur `/`, il est redirigé vers `/orders`.
5. Le bouton `Logout` supprime l'état local et renvoie vers `/`.

## Flux de données
Utilisateur
    ↓
`BOMainLayout.jsx`
    ↓
lecture de `boAuth` dans `localStorage`
    ↓
`Navigate` ou `Outlet`
    ↓
navigation commune vers `reset`, `import`, `stocks`, `orders`, `statistics`, `dashboard`

## Logique métier
Le layout sert de garde d'accès. Il ne vérifie pas un token serveur, mais un simple flag local. C'est suffisant pour le contexte actuel du projet, où l'authentification est volontairement simplifiée.

## Explication du code
`useLocation` permet de détecter si l'utilisateur est sur la route racine. `useNavigate` sert au logout. `Link` construit le menu. `Outlet` rend la page enfant actuellement sélectionnée.

## Analogies simples
Comme l'entrée d'une zone réservée avec un badge temporaire : on passe la porte, on voit le panneau de navigation commun, et on peut se déconnecter pour repartir à l'accueil.

## Exemples concrets
- Aller sur `/statistics` sans session affiche immédiatement la connexion.
- Recharger la page sur `/` alors que `boAuth` existe renvoie vers `/orders`.

## Relations avec PrestaShop
Aucune ressource PrestaShop n'est manipulée ici. Le rôle est uniquement applicatif.

## Dépendances
- `react-router-dom`
- Pages BO enfants : `BOLogin`, `BOReset`, `BOImport`, `BOStock`, `BOOrderList`, `BOStatistic`, `BODashboard`

## Voir aussi
- [BOLogin](BOLogin.md)
- [BOOrderList](BOOrderList.md)

## Résumé
Garde d'accès et navigation commune du BackOffice, basée sur un contrôle local simple.
