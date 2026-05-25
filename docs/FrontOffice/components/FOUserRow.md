# FOUserRow

## Rôle
Afficher une ligne de client dans un tableau de sélection.

## Propriétés
- `customer`: client à afficher.
- `onClick`: action déclenchée par le bouton de connexion.

## Comportement
- Rend l'identifiant, le prénom, le nom et l'email.
- Propose un bouton `Se connecter`.

## Résumé
Ligne de tableau réutilisable pour choisir un client FrontOffice.
# FOUserRow

## Rôle
Afficher une ligne de client avec un bouton pour se connecter en tant que ce client.

## Propriétés
- `customer`: client à afficher.
- `onClick`: callback déclenché au clic sur `Se connecter`.

## Exemple
```jsx
<FOUserRow customer={customer} onClick={() => connectCustomer(customer)} />
```
