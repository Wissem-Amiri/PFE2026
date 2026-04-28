# Étude et réalisation du Sprint 3 : Recrutement & Acquisition

Dans cette section, nous présentons la conception UML dédiée au Sprint 3. Ce module marque l'ouverture de la plateforme vers l'extérieur (les candidats) tout en permettant la mobilité interne (les employés existants). Il gère le cycle de vie complet du recrutement, de la publication de l'offre jusqu'à l'embauche.

---

## 1. Diagramme des Cas d'Utilisation

Ce diagramme illustre les interactions possibles entre les différents acteurs (Administrateur, Candidat, Employé) et le module de recrutement.

```mermaid
usecaseDiagram
    actor "Candidat" as cand
    actor "Employé" as emp
    actor "Administrateur" as admin

    package "Module de Recrutement" {
        usecase "Consulter les offres d'emploi" as UC1
        usecase "Postuler à une offre (Upload CV/Lettre)" as UC2
        
        usecase "Gérer les offres d'emploi" as UC3
        usecase "Créer une offre" as UC3_1
        usecase "Modifier/Supprimer une offre" as UC3_2
        
        usecase "Gérer les candidatures" as UC4
        usecase "Accepter une candidature" as UC4_1
        usecase "Refuser une candidature" as UC4_2
    }

    %% Accès côté Postulants (Externes et Internes)
    cand --> UC1
    cand --> UC2
    emp --> UC1
    emp --> UC2
    
    %% Accès côté RH
    admin --> UC3
    admin --> UC4

    %% Inclusions pour la gestion des offres
    UC3 ..> UC3_1 : <<include>>
    UC3 ..> UC3_2 : <<include>>

    %% Inclusions pour la gestion des candidatures
    UC4 ..> UC4_1 : <<include>>
    UC4 ..> UC4_2 : <<include>>
```

**Description des Cas d'Utilisation :**
- **Consulter et Postuler :** Les candidats externes et les employés (mobilité interne) peuvent consulter les annonces actives et soumettre leur profil. La postulation exige obligatoirement le téléchargement des documents requis (CV, lettre de motivation).
- **Gérer les offres d'emploi :** L'administrateur RH a un contrôle total (CRUD) sur la publication des offres.
- **Gérer les candidatures :** L'administrateur RH filtre les postulants et décide de l'issue de chaque candidature (acceptation ou refus).

---

## 2. Diagramme de Classes (Intégration du Sprint 3)

Ce diagramme vient compléter la structure initiale en y greffant les entités liées au recrutement, reflétant fidèlement le schéma de la base de données (tables `jobs`, `postulant`, `candidatures`).

```mermaid
classDiagram
    class Utilisateur {
        <<Abstract>>
        +id: UUID
        +user_name: string
        +email: string
        +status: string
    }

    class Employe {
        +department: string
        +position: string
        +hire_date: date
        +vacation_balance: numeric
    }

    class Administrateur {
        +department: string
    }

    class Candidat {
        +bio: string
        +country: string
        +resume_url: string
        +motivational_letter_url: string
        +portfolio: string
        +experiences: JSONB
    }

    class OffreEmploi {
        +id: UUID
        +title: string
        +category: string
        +description: string
        +deadline: date
        +is_open: boolean
        +open_seats: integer
        +requirements: string
    }

    class Candidature {
        +id: UUID
        +status: Enum(pending, accepted, rejected)
        +is_archived: boolean
        +applied_at: datetime
    }

    %% Héritage (Siblings)
    Utilisateur <|-- Employe
    Utilisateur <|-- Administrateur 
    Utilisateur <|-- Candidat

    %% Associations
    Administrateur "1" --> "0..*" OffreEmploi : crée / gère
    Administrateur "1" --> "0..*" Candidature : évalue
    Candidat "1" --> "0..*" Candidature : soumet
    Employe "1" --> "0..*" Candidature : soumet (mobilité)
    Candidature "0..*" --> "1" OffreEmploi : concerne
```

**Justification de la conception :**
- Le `Candidat` hérite d'`Utilisateur`, tout comme l'`Employé` et l'`Administrateur`. Cela garantit que le système d'authentification central (Sprint 1) fonctionne de manière uniforme pour tous.
- La classe d'association `Candidature` fait le lien parfait entre un `Candidat` (ou `Employe`) et une `OffreEmploi` (`jobs`), en stockant l'état (`status`) du recrutement.

---

## 3. Diagrammes de Séquences

Les processus de recrutement sont détaillés à l'aide de la notation BCE (Boundary, Control, Entity) pour séparer l'interface, la logique métier et la persistance des données.

### 3.1. Scénario : Publier une offre d'emploi

**Diagramme de séquence détaillé du cas d'utilisation « Créer une offre »**

Pour publier un nouveau besoin en recrutement, l'administrateur RH accède à l'interface de gestion des offres. Après avoir saisi les détails de l'annonce (titre, description, exigences, date limite), il soumet le formulaire. Le service de recrutement valide les informations saisies et exécute une requête d'insertion dans la base de données (table `jobs`). Une fois la création confirmée par la base, le système retourne une réponse de succès et affiche un message de confirmation à l'administrateur.

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrateur
    participant I as <<Boundary>> Interface Admin (Jobs)
    participant S as <<Control>> RecrutementService
    participant DB as <<Entity>> jobs

    A->>I: Accède au formulaire de création d'offre
    A->>I: Saisit les détails (titre, postes, deadline, exigences)
    A->>I: Clique sur "Publier l'offre"
    I->>S: creerOffre(donnees_offre)
    
    S->>S: Vérification des champs requis
    
    S->>DB: INSERT INTO jobs (donnees_offre)
    DB-->>S: Confirmation (ID généré)
    
    S-->>I: Succès (201 Created)
    I-->>A: Notification "Offre d'emploi publiée avec succès"
```

### 3.2. Scénario : Postuler à une offre d'emploi

**Diagramme de séquence détaillé du cas d'utilisation « Postuler à une offre »**

Le candidat, après avoir consulté une offre ouverte, clique sur le bouton pour postuler. Il remplit son profil et télécharge son CV et sa lettre de motivation. Ces fichiers sont d'abord envoyés au service de stockage (Storage). Une fois les URLs des fichiers obtenues, le service de recrutement insère une nouvelle ligne dans la table `candidatures` liant l'utilisateur à l'offre. Le candidat reçoit alors un message confirmant l'envoi de sa candidature.

```mermaid
sequenceDiagram
    autonumber
    actor C as Candidat (ou Employé)
    participant I as <<Boundary>> Interface Candidature
    participant S as <<Control>> RecrutementService
    participant ST as <<Entity>> Storage (Fichiers)
    participant DB as <<Entity>> candidatures

    C->>I: Consulte une offre et clique sur "Postuler"
    C->>I: Saisit ses informations et joint son CV
    C->>I: Clique sur "Soumettre la candidature"
    I->>S: postuler(candidat_id, job_id, fichiers)
    
    S->>ST: Upload des fichiers (CV, Lettre)
    ST-->>S: Retourne les URLs (resume_url)
    
    S->>DB: INSERT INTO candidatures (postulant_id, job_id, status='pending')
    DB-->>S: Confirmation création
    
    S-->>I: Succès
    I-->>C: Affiche "Candidature envoyée avec succès"
```

### 3.3. Scénario : Traiter une candidature (Accepter)

**Diagramme de séquence détaillé du cas d'utilisation « Accepter une candidature »**

L'administrateur consulte la liste des candidatures en attente pour une offre spécifique. S'il décide de retenir un candidat, il clique sur "Accepter". Le système met immédiatement à jour le statut de la candidature à « Accepté » dans la table `candidatures`. Techniquement, ce processus déclenche également la transition du statut du candidat vers un futur employé, et une notification (In-App ou Email) est envoyée pour l'informer de sa réussite.

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrateur
    participant I as <<Boundary>> Interface Admin (Candidatures)
    participant S as <<Control>> RecrutementService
    participant DB as <<Entity>> candidatures
    participant NotifDB as <<Entity>> notifications

    A->>I: Accède à la liste des candidatures (status='pending')
    I->>S: getCandidatures(job_id)
    S->>DB: SELECT * FROM candidatures WHERE job_id = X
    DB-->>S: Liste des postulants
    S-->>I: Retourne la liste
    I-->>A: Affiche les profils des candidats
    
    A->>I: Sélectionne un profil et clique "Accepter"
    I->>S: accepterCandidature(candidature_id)
    
    S->>DB: UPDATE candidatures SET status='accepted'
    DB-->>S: Confirmation de mise à jour
    
    S->>NotifDB: INSERT INTO notifications (candidat_id, "Félicitations, candidature retenue")
    NotifDB-->>S: Confirmation
    
    S-->>I: Succès de l'opération
    I-->>A: Notification "Candidature acceptée et candidat notifié"
```
