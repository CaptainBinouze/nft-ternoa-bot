# Configuration du Projet

Ce projet utilise deux variables d'environnement pour sa configuration.

## CHECK_INTERVAL

`CHECK_INTERVAL` est une variable qui définit l'intervalle de temps (en millisecondes) pour l'exécution régulière d'une action dans le projet. 

Exemple : 
```
CHECK_INTERVAL=60000
```

## WALLETS

`WALLETS` est une variable qui représente une liste de wallets utilisés par le projet. Les portefeuilles sont séparés par des points-virgules (;).

Exemple : 
```
WALLETS="AEB;ADF"
```