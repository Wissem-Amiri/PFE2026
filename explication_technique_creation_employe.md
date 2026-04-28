# Explication Technique : Pourquoi utiliser un RPC pour créer un employé ?

Ce document explique les trois obstacles majeurs (le "Point 1") que nous avons rencontrés lors de l'implémentation de la fonctionnalité "Ajouter un employé".

---

## Étape 1 : Le conflit de session (Le problème du Logout)

Dans Supabase, la fonction `auth.signUp()` est conçue pour l'**auto-inscription**. 
*   **Ce qui se passe :** Quand tu appelles cette fonction, Supabase crée le compte et connecte immédiatement la personne qui vient de s'inscrire pour qu'elle puisse utiliser l'application.
*   **Le problème pour l'Admin :** Si l'Admin utilise cette fonction pour créer un employé, Supabase croit que l'Admin est en train de s'inscrire lui-même. Il remplace donc la session de l'Admin par celle du nouvel employé.
*   **Résultat :** L'Admin est déconnecté de son tableau de bord et se retrouve sur le compte de l'employé qu'il vient de créer. C'est inacceptable pour une gestion professionnelle.

---

## Étape 2 : Le verrou de sécurité (La contrainte de Clé Étrangère)

On pourrait se dire : *"Puisque `auth.signUp()` déconnecte l'Admin, créons simplement l'employé directement dans la table `public.utilisateur` sans passer par l'authentification."*

*   **Le problème de lien :** Ta base de données est structurée de manière très sûre. La table `public.utilisateur` a un lien direct (Clé Étrangère / Foreign Key) vers la table interne de Supabase `auth.users`.
*   **La règle d'intégrité :** La base de données impose que pour chaque ligne dans `utilisateur`, il DOIT exister une ligne correspondante dans `auth.users`. 
*   **Résultat :** Si tu essaies d'insérer un employé dans ta table `public.utilisateur` alors qu'il n'existe pas encore dans le système d'authentification, la base de données bloque l'opération pour protéger l'intégrité des données.

---

## Étape 3 : La complexité du schéma Auth (Erreur de Schema)

On a alors essayé de créer l'utilisateur manuellement en écrivant directement dans la table `auth.users` via du code SQL.

*   **Le secret de Supabase :** Le système d'authentification de Supabase (appelé GoTrue) est extrêmement sensible. Il ne demande pas juste un email. Il s'attend à ce que chaque utilisateur possède :
    1.  Une entrée dans `auth.users` avec des jetons (tokens) de confirmation déjà remplis.
    2.  Une entrée dans `auth.identities` (pour dire que c'est une connexion par email).
*   **L'erreur technique :** Si on oublie de remplir une seule colonne technique (comme `confirmation_token`), Supabase renvoie l'erreur `Database error querying schema` car il ne comprend plus qui est cet utilisateur "incomplet".

---

## La Solution Finale : Le RPC (Le Majordome)

Pour résoudre ces 3 problèmes d'un coup, nous avons créé un **RPC (Remote Procedure Call)**.

C'est une fonction qui s'exécute **directement sur le serveur de la base de données**. 
*   Elle a les "Super Pouvoirs" (`SECURITY DEFINER`) pour écrire dans les tables protégées.
*   Elle fait tout en une seule fois (Étape 1, 2 et 3) sans jamais toucher à la session de l'Admin dans le navigateur.
