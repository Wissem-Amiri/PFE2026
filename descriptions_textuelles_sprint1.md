# Descriptions Textuelles des Cas d'Utilisation - Sprint 1

Ce document détaille les scénarios d'utilisation pour la gestion des employés.

---

## 1. Cas d'utilisation : Ajouter un employé

| Élément | Description |
| :--- | :--- |
| **Nom** | Ajouter un employé |
| **Acteur Principal** | Administrateur |
| **Pré-conditions** | L'administrateur doit être authentifié. |
| **Description** | Permet à l'administrateur de créer un compte d'accès et un profil complet pour un nouvel employé. |

**Scénario Nominal :**
1. L'administrateur clique sur le bouton "Ajouter un employé".
2. Le système affiche un formulaire de saisie (Nom, Email, Mot de passe, Département, Poste, Salaire, Date d'embauche).
3. L'administrateur remplit les champs et valide.
4. Le système déclenche une transaction atomique (RPC) :
    - Création du compte dans le système d'authentification.
    - Création de l'identité de connexion.
    - Création du profil utilisateur.
    - Création de la fiche contrat de l'employé.
5. Le système confirme la réussite de l'opération par un message.
6. Le système actualise la liste des employés.

**Post-conditions :** Un nouvel employé est ajouté au système et peut se connecter immédiatement.

---

## 2. Cas d'utilisation : Rechercher un employé

| Élément | Description |
| :--- | :--- |
| **Nom** | Rechercher un employé |
| **Acteur Principal** | Administrateur |
| **Pré-conditions** | L'administrateur doit être sur la page de gestion des employés. |
| **Description** | Permet de filtrer la liste des employés selon différents critères. |

**Scénario Nominal :**
1. L'administrateur saisit un critère dans la barre de recherche (Nom, Poste ou Département).
2. Le système interroge la base de données en appliquant les filtres en temps réel.
3. Le système affiche uniquement les employés correspondants aux critères.
4. L'administrateur consulte les résultats.

---

## 3. Cas d'utilisation : Modifier un employé

| Élément | Description |
| :--- | :--- |
| **Nom** | Modifier un employé |
| **Acteur Principal** | Administrateur |
| **Pré-conditions** | L'employé doit avoir été identifié via la recherche. |
| **Description** | Permet de mettre à jour les informations professionnelles ou personnelles d'un employé. |

**Scénario Nominal :**
1. L'administrateur clique sur l'icône "Modifier" à côté de l'employé concerné.
2. Le système affiche le formulaire pré-rempli avec les données actuelles.
3. L'administrateur modifie les champs nécessaires (ex: changement de département ou de salaire).
4. L'administrateur valide les modifications.
5. Le système met à jour les tables `utilisateur` et `employee` dans la base de données.
6. Le système confirme la mise à jour et rafraîchit l'affichage.

---

## 4. Cas d'utilisation : Supprimer un employé

| Élément | Description |
| :--- | :--- |
| **Nom** | Supprimer un employé |
| **Acteur Principal** | Administrateur |
| **Pré-conditions** | L'employé doit être présent dans la liste. |
| **Description** | Permet de retirer définitivement un employé du système. |

**Scénario Nominal :**
1. L'administrateur clique sur le bouton "Supprimer".
2. Le système affiche une boîte de dialogue demandant confirmation.
3. L'administrateur confirme la suppression.
4. Le système supprime l'entrée correspondante dans la table `utilisateur`.
5. Grâce à la suppression en cascade (Cascade Delete), le système retire automatiquement les données liées (contrat, congés, etc.).
6. Le système affiche un message de succès et retire l'employé de la liste.
