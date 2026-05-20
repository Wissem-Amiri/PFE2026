# 📘 Guide de Révision Pédagogique Ultime — Soutenance PFE
## Candidat : Wissem Amiri — Projet : UnifyHR (Binome)

Ce guide exhaustif regroupe **l'intégralité absolue** des questions posées, des concepts analysés et des fichiers révisés tout au long de notre accompagnement pédagogique (phases initiales et phase active). Il a été conçu pour te servir de support d'étude ultime (star bi star) pour rédiger ton rapport de stage et briller devant ton jury de soutenance de PFE.

---

## 🗺️ Sommaire Général

### [PARTIE 1 : ARCHITECTURE GLOBALE, AUTHENTIFICATION & SÉCURITÉ](#partie-1)
*   1.1. La Structure Modulaire du Projet & package.json
*   1.2. L'Authentification Centrale & la Barrière de Sécurité `AuthGuard` (`lib/auth.tsx`)
*   1.3. La Sécurité Globale du Typage TypeScript (`Database` Index Access Types)

### [PARTIE 2 : AUTOMATES MÉTIERS & CALCULS DÉTERMINISTES](#partie-2)
*   2.1. Le Moteur d'IA Local de Scoring de CV (`app/api/aiScoring.ts`)
*   2.2. L'Automate de Calcul & de Synchronisation des Congés (`app/api/leaves.ts`)
*   2.3. Le Seuil d'Alerte d'Effectif par Département (Department Availability)

### [PARTIE 3 : LOGIQUE DES OFFRES D'EMPLOI & STOCKAGE (`app/api/job.ts`)](#partie-3)
*   3.1. Le Filtrage Dynamique des Offres Ouvertes/Fermées
*   3.2. L'Algorithme Anti-Collision d'Upload & la formule Substring
*   3.3. Le Clamping Mathématique (`Math.max`) & la Neutralisation des Heures (`setHours`)

### [PARTIE 4 : VISION ARTIFICIELLE & SUIVI DE PRÉSENCE (`app/api/presence.ts`)](#partie-4)
*   4.1. Scan Photo vs Analyse Temporelle Vidéo (Durée Réelle)
*   4.2. Le Timeout Réseau Critique de 5 minutes
*   4.3. L'Alignement d'Interface TypeScript (`json_file_path: ''`)

### [PARTIE 5 : ALGORITHMES ET TRI EN MÉMOIRE (`recordings.ts` & `applications.ts`)](#partie-5)
*   5.1. L'Algorithme de Normalisation d'Unités en Mémoire (KB, MB, GB)
*   5.2. Le Patron d'Architecture "Aplatissement de Données" (Data Flattening)
*   5.3. Le Webhook de Réception Asynchrone des CV (`/api/resume/parse/route.ts`)

### [PARTIE 6 : CACHING, DÉFILEMENT INFINI & PERFORMANCE (React Query)](#partie-6)
*   6.1. La Structure Hiérarchique des Clés de Cache (`queryKeys.ts`)
*   6.2. Le Défilement Infini (`useInfiniteQuery`) & la Condition d'Arrêt
*   6.3. Le Rôle de la Variable Interne `lastPage`
*   6.4. Les Requêtes Conditionnelles de Performance (`enabled: !!userId`)

---

<a name="partie-1"></a>
# PARTIE 1 : ARCHITECTURE GLOBALE, AUTHENTIFICATION & SÉCURITÉ

## 1.1. La Structure Modulaire du Projet & package.json
### Question :
**"Comment expliquer la structure générale de notre application au jury ?"**

### Réponse :
Notre application **UnifyHR** repose sur une architecture moderne de type **Serverless / Modulaire**. 
*   **Next.js 14+ (App Router)** : Gère le routage par dossiers (ex: `app/dashboard/admin` devient automatiquement accessible via l'URL `/dashboard/admin`), le rendu optimisé côté client, et la compilation.
*   **Supabase (Backend-as-a-Service)** : Gère de manière sécurisée la base de données relationnelle PostgreSQL, le stockage binaire des fichiers (CVs, photos, vidéos) et l'authentification sécurisée des utilisateurs (Supabase Auth).
*   **TanStack Query (React Query)** : Agit comme une couche de synchronisation réseau intermédiaire. Il met en cache les données reçues pour éviter que le site ne recharge les mêmes informations en permanence, offrant une fluidité instantanée.

---

## 1.2. L'Authentification Centrale & la Barrière de Sécurité `AuthGuard` (`lib/auth.tsx`)
### Question :
**"Comment fonctionne la protection des dossiers par rôles ? Que fait AuthGuard ?"**

### Réponse :
C'est le **cerveau de la sécurité de ton application**. `AuthGuard` intercepte chaque changement de page et applique trois règles d'or de sécurité en temps réel :

```typescript
export function AuthGuard({ children }) {
  const { user, profile, isLoading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return // 1. On attend le chargement complet de l'authentification

    const isAuthPage = pathname === '/login' || pathname.startsWith('/auth/')
    const isDashboard = pathname.startsWith('/dashboard/')

    // RÈGLE 1 : Si l'utilisateur est connecté mais tente d'aller sur /login -> Redirection vers son dashboard dédié
    if (user && (isAuthPage || pathname === '/')) {
      const dashboardPath = getDashboardByRole(profile?.role)
      router.push(dashboardPath)
      return
    }

    // RÈGLE 2 : Si l'utilisateur n'est pas connecté et tente d'accéder à une page privée -> Redirection immédiate vers /login
    if (!user && !isAuthPage && pathname !== '/') {
      router.push('/login')
      return
    }

    // RÈGLE 3 : Protection anti-intrusion par rôle (Ex: Un candidat tente de forcer l'URL /dashboard/admin)
    if (user && isDashboard && profile !== undefined) {
      const correctDashboard = getDashboardByRole(profile?.role)
      if (!pathname.startsWith(correctDashboard)) {
        router.push(correctDashboard) // Correction de trajectoire immédiate !
      }
    }
  }, [user, profile, isLoading, pathname])

  if (isLoading) return <Spin size="large" />
  return <>{children}</>
}
```
*   **getDashboardByRole** : Oriente dynamiquement l'utilisateur vers son espace de travail selon son profil stocké en base :
    *   `admin` ➔ `/dashboard/admin`
    *   `employee` ➔ `/dashboard/employee`
    *   `candidate` ➔ `/dashboard/candidate`

---

## 1.3. La Sécurité Globale du Typage TypeScript (`Database` Index Access Types)
### Question :
```typescript
export async function updateJob(id: string, jobData: Database['public']['Tables']['jobs']['Update'])
```
**"Que veut dire ce type jobData et pourquoi est-il différent selon les fonctions ?"**

### Réponse :
C'est un **Type d'accès indexé (Indexed Access Type)** de TypeScript :
*   **Typage Robuste** : Au lieu d'écrire à la main la liste des champs autorisés pour modifier une offre d'emploi, nous disons à TypeScript d'aller chercher la définition exacte de la table `jobs` de PostgreSQL pour l'action `Update` générée automatiquement par Supabase.
*   **Champs Optionnels** : Le type `Update` rend tous les champs de l'offre optionnels. Lors d'une modification, on peut n'envoyer que `{ open_seats: 2 }` sans avoir à ré-envoyer le titre ou la description de l'offre.
*   **Pourquoi des fonctions avec typage restreint ?** 
    *   Pour les congés (`updateLeaveStatus`), nous n'utilisons pas ce type automatique. Pour des raisons de **sécurité critique**, nous verrouillons les paramètres acceptés aux seuls champs `status` et `rejectionReason`. Cela empêche un utilisateur malveillant de modifier frauduleusement ses dates ou l'ID de l'employé associé.

---

<a name="partie-2"></a>
# PARTIE 2 : AUTOMATES MÉTIERS & CALCULS DÉTERMINISTES

## 2.1. Le Moteur d'IA Local de Scoring de CV (`app/api/aiScoring.ts`)
### Question :
**"Comment le code calcule-t-il le score de matching entre un CV et un Job ?"**

### Réponse :
Il s'agit d'un **algorithme de scoring déterministe** qui compare les données extraites par ton OCR/NLP en Python avec l'offre d'emploi :

1.  **Correspondance des Compétences (Max 40 points)** :
    On parcourt le tableau des compétences extraites du CV (`Skills`). Pour chaque compétence trouvée dans la description du poste, on attribue **8 points** (bloqué à un maximum de 40 points).
2.  **Calcul de la durée de l'expérience pertinente** :
    Pour chaque rôle précédemment occupé (`Worked_As`), on utilise une **Regex** pour extraire la durée textuelle et la convertir en mois (ex: `"2 years"` ➔ 24 mois). Si l'intitulé du poste correspond au profil recherché (`isRelevant`), on ajoute ces mois au total.
3.  **Bonus d'expérience (Max 30 points)** :
    On convertit le total des mois en années (`totalMonths / 12`) :
    *   Plus de 3 ans d'expérience pertinente ➔ **+20 points**
    *   Plus de 5 ans d'expérience pertinente ➔ **+30 points**
4.  **Limite de score (Clamping à 99)** :
    On additionne les scores et on utilise `Math.min(score, 99)`. 
    *   *Pourquoi bloquer à 99% ?* Pour un rendu professionnel ! Une IA ne peut jamais garantir une adéquation parfaite à 100%. Garder un maximum à 99% est plus réaliste pour un recruteur.

---

## 2.2. L'Automate de Calcul & de Synchronisation des Congés (`app/api/leaves.ts`)
### Question :
**"Comment calcule-t-on le solde restant d'un employé à partir de sa date d'embauche ?"**

### Réponse :
La fonction `syncVacationBalance` effectue un calcul dynamique en temps réel pour éviter les décalages de calcul :

```typescript
export async function syncVacationBalance(employeeId: string) {
  const { data: emp } = await supabase.from('employee').select('*').eq('id', employeeId).single()
  
  const hireDate = dayjs((emp as any).hire_date)
  const now = dayjs()
  
  // 1. Calcul du droit acquis (nombre de mois révolus depuis l'embauche * taux mensuel de cumul)
  const fullMonths = now.diff(hireDate, 'month')
  const totalAccrued = fullMonths * ((emp as any).monthly_rate || 0)

  // 2. Calcul des jours déjà pris (congés approuvés uniquement)
  const { data: approvedLeaves } = await supabase.from('leaves').select('*').eq('employee_id', employeeId).eq('status', 'approved')
  const usedDays = ((approvedLeaves as any[]) ?? []).reduce((acc, leave) => {
    return acc + dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1
  }, 0)

  // 3. Déduction pour obtenir le solde restant final (bloqué à 0 minimum)
  const finalBalance = Math.max(0, totalAccrued - usedDays)

  // 4. Synchronisation automatique avec la base de données
  if (finalBalance !== (emp as any).vacation_balance) {
    await supabase.from('employee').update({ vacation_balance: finalBalance }).eq('id', employeeId)
  }

  return { balance: finalBalance }
}
```

---

## 2.3. Le Seuil d'Alerte d'Effectif par Département (Department Availability)
### Question :
**"Comment le système prévient-il l'administrateur avant qu'il ne valide un congé ?"**

### Réponse :
Pour éviter qu'un département ne se retrouve en sous-effectif, la fonction `getLeavesDepartmentAvailability` calcule l'impact du congé demandé avant validation :
1.  Elle compte le nombre total d'employés dans le département cible (ex: 10 personnes).
2.  Elle compte le nombre d'employés ayant déjà un congé approuvé pendant la période demandée (ex: 8 personnes).
3.  Elle calcule le reste actif (`remaining = total - onLeave`).
4.  Elle attribue un statut d'alerte :
    *   Moins de 3 personnes restantes ➔ **`Critical`** (Alerte rouge à l'écran : validation fortement déconseillée).
    *   Entre 3 et 5 personnes restantes ➔ **`Warning`** (Alerte jaune : attention requise).
    *   Plus de 5 personnes restantes ➔ **`Good`** (Indicateur vert).

---

<a name="partie-3"></a>
# PARTIE 3 : LOGIQUE DES OFFRES D'EMPLOI & STOCKAGE (`app/api/job.ts`)

## 3.1. Le Filtrage Dynamique des Offres Ouvertes/Fermées
### Question :
**"Comment le tableau de bord sait-il si une offre d'emploi est ouverte ou fermée ?"**

### Réponse :
Le système calcule dynamiquement le statut en combinant trois critères :
*   **Offre Ouverte (Logique `AND` / et)** : L'offre est ouverte si :
    *   La case d'ouverture manuelle est cochée (`is_open = true`)
    *   **ET** il reste des places disponibles (`open_seats > 0`)
    *   **ET** la date limite de postulation est dans le futur (`deadline > aujourd'hui`).
*   **Offre Fermée (Logique `OR` / ou)** : Dès que l'un de ces critères n'est plus respecté, l'offre est immédiatement classée comme fermée. On utilise l'opérateur `.or()` de Supabase pour vérifier ces conditions en une seule requête SQL performante.

---

## 3.2. L'Algorithme Anti-Collision d'Upload & la formule Substring
### Question :
```typescript
const fileExt = file.name.split('.').pop()
const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`
```
**"Comment fonctionne cet algorithme de nom unique ?"**

### Réponse :
Cet algorithme garantit qu'aucun fichier ne sera écrasé par erreur dans le stockage cloud (Supabase Storage) :
1.  **`split('.').pop()`** : Découpe le nom du fichier au niveau des points et récupère le dernier élément, ce qui extrait proprement l'extension (ex: `"pdf"` ou `"png"`).
2.  **`Math.random().toString(36)`** : Génère un nombre décimal aléatoire et le convertit en Base 36 (les chiffres de 0 à 9 et les lettres de A à Z). Cela produit une chaîne du type `"0.x8f2m9q5"`.
3.  **`substring(2, 15)`** : Extrait la sous-chaîne. On commence à l'index **`2`** pour sauter le `"0."` initial, et on s'arrête à **`15`** pour obtenir une clé unique de **13 caractères aléatoires**.
4.  **`Date.now()`** : Ajoute l'horodatage système en millisecondes. 
*   **Collision impossible** : Même dans l'éventualité infime où deux générateurs aléatoires sortiraient le même hachage, il est physiquement impossible que deux candidats cliquent au même millième de seconde près.

---

## 3.3. Le Clamping Mathématique (`Math.max`) & la Neutralisation des Heures (`setHours`)
### Question :
```typescript
const newSeats = Math.max(0, job.open_seats - 1)
...
today.setHours(0, 0, 0, 0)
```
**"À quoi servent ces fonctions de protection ?"**

### Réponse :
*   **`Math.max(0, job.open_seats - 1)` (Clamping/Verrouillage)** : Si une offre d'emploi a 0 place restante et qu'un candidat est validé, soustraire 1 donnerait `-1`. Cette fonction verrouille la valeur minimale autorisée à **`0`**, protégeant ainsi l'intégrité logique de ta base de données.
*   **`setHours(0, 0, 0, 0)` (Neutralisation temporelle)** : Par défaut, comparer deux dates en JavaScript compare aussi les heures et minutes. Si la date limite d'une offre est fixée à aujourd'hui et qu'il est 14h00, la comparaison brute considérera la date limite dépassée. Remettre les horloges à **minuit pile (`00:00:00.000`)** permet d'effectuer une comparaison calendaire stricte et équitable.

---

<a name="partie-4"></a>
# PARTIE 4 : VISION ARTIFICIELLE & SUIVI DE PRÉSENCE (`app/api/presence.ts`)

## 4.1. Scan Photo vs Analyse Temporelle Vidéo (Durée Réelle)
### Question :
**"Pourquoi avons-nous deux points d'accès (Image et Vidéo) dans notre service de vision artificielle ?"**

### Réponse :
Ils répondent à deux cas d'usage complémentaires en Ressources Humaines :
*   **`processImagePresence` (La Photo)** : Conçu pour les contrôles de présence instantanés (ex: scan du visage lors de l'arrivée au bureau ou en classe). Il renvoie un résultat binaire : Présent ou Absent à un instant précis.
*   **`processVideoPresence` (La Vidéo)** : Conçu pour mesurer la **durée d'assiduité effective** (ex: réunion d'une heure ou cours en ligne enregistré). L'IA de vision par ordinateur analyse le fichier vidéo frame par frame pour calculer le nombre exact de minutes où le visage de l'employé est visible à l'écran (ex: 45 minutes de présence).

---

## 4.2. Le Timeout Réseau Critique de 5 minutes
### Question :
**"Pourquoi y a-t-il un timeout de 300 000 ms (5 minutes) dans processVideoPresence ?"**

### Réponse :
L'analyse de flux vidéo par intelligence artificielle est un processus extrêmement **lourd en calculs (CPU/GPU-bound)**. 
*   Le serveur Python doit décoder la vidéo, extraire chaque image, appliquer des réseaux de neurones convolutifs (CNN) pour la détection et la reconnaissance des visages, compiler les présences, et ré-encoder le flux vidéo final.
*   Ce traitement peut prendre plusieurs minutes. Configurer un timeout réseau de **5 minutes** évite que la connexion HTTP entre Next.js et ton serveur Python ne soit brutalement coupée pour inactivité.

---

## 4.3. L'Alignement d'Interface TypeScript (`json_file_path: ''`)
### Question :
```typescript
json_file_path: '', // Video endpoint doesn't return a json path directly in root
video_file_path: data.video_file
```
**"Pourquoi passer une chaîne vide à json_file_path ?"**

### Réponse :
*   **Le Contrat TypeScript** : Notre interface `PresenceResponse` déclare que la propriété `json_file_path` est obligatoire (elle n'a pas de point d'interrogation `?`).
*   **La différence d'API** : Le point d'accès d'analyse vidéo ne renvoie pas de fichier JSON à la racine de sa réponse.
*   **La solution** : Pour satisfaire le compilateur TypeScript et éviter un échec de build de ton application, on passe une chaîne de caractères vide (`''`). C'est une technique classique d'alignement de types (Type Conformance).

---

<a name="partie-5"></a>
# PARTIE 5 : ALGORITHMES ET TRI EN MÉMOIRE (`recordings.ts` & `applications.ts`)

## 5.1. L'Algorithme de Normalisation d'Unités en Mémoire (KB, MB, GB)
### Question :
**"Comment fonctionne le tri complexe des tailles de fichiers en mémoire ?"**

### Réponse :
Comme la taille des enregistrements vidéo est stockée en texte (ex: `"1.5 GB"`, `"450 KB"`), un tri SQL brut trierait par ordre alphabétique, produisant des résultats erronés (ex: `"50 KB"` passerait après `"2 GB"` car "5" > "2"). 

L'algorithme résout cela en mémoire en 4 étapes clés :
1.  **Extraction** : Il nettoie les chaînes de caractères en enlevant les unités (`.replace().trim()`) et convertit le texte en nombre décimal (`parseFloat`).
2.  **Normalisation (Unité commune : le Mégaoctet - MB)** :
    *   Si la taille contient `"GB"` ➔ Multiplication par **`1024`** pour obtenir des MB.
    *   Si la taille contient `"KB"` ➔ Division par **`1024`** pour obtenir des MB.
    *   Si la taille contient `"MB"` ➔ Conservation de la valeur brute.
3.  **Tri mathématique** : Il enregistre cette valeur propre dans une clé temporaire `_parsedSize` et applique la fonction de tri standard de JavaScript : `.sort((a, b) => b._parsedSize - a._parsedSize)`.
4.  **Découpage (Pagination)** : Il utilise `.slice()` pour ne renvoyer que le segment correspondant à la page demandée.

---

## 5.2. Le Patron d'Architecture "Aplatissement de Données" (Data Flattening)
### Question :
```typescript
return {
  data: (data || []).map((item: any) => ({
    ...item,
    job_title: item.job?.title,
    user_name: item.candidate?.user?.user_name,
    avatar_url: item.candidate?.user?.avatar_url
  })),
  ...
}
```
**"Pourquoi applique-t-on cette transformation lors de la récupération des candidatures ?"**

### Réponse :
C'est le patron de conception **Aplatissement de données (Data Flattening)** :
*   **Le problème** : Supabase renvoie les relations SQL sous forme d'objets profondément imbriqués (ex: `item.candidate.user.user_name`). Écrire ces chemins dans tes composants React est fastidieux, nuit à la lisibilité et provoque des plantages si une relation est manquante.
*   **La solution** : On utilise `.map()` pour extraire ces valeurs profondes et les repositionner directement à la racine de l'objet (`job_title`, `user_name`).
*   **Le résultat** : Les composants d'affichage React reçoivent un objet plat et propre, simplifiant l'intégration dans ton tableau de données et sécurisant le rendu de l'interface.

---

## 5.3. Le Webhook de Réception Asynchrone des CV (`/api/resume/parse/route.ts`)
### Question :
**"Quel est le rôle de ce routeur API Next.js ?"**

### Réponse :
Ce routeur agit comme un **Webhook de traitement asynchrone** :
1.  Il reçoit la requête POST contenant l'identifiant de la candidature.
2.  Il récupère le CV stocké dans le Cloud, le télécharge en mémoire sous forme de **Blob** et l'envoie au microservice IA Python.
3.  Il reçoit les compétences et l'expérience extraites, appelle notre moteur de scoring pour calculer le score d'adéquation, et met à jour la table `applications` de Supabase.
4.  Il gère l'ensemble du pipeline dans un bloc `try/catch` global pour renvoyer des codes d'état HTTP standardisés (200 en cas de succès, 500 en cas d'erreur de parsing) sans jamais planter le serveur Next.js principal.

---

<a name="partie-6"></a>
# PARTIE 6 : CACHING, DÉFILEMENT INFINI & PERFORMANCE (React Query)

## 6.1. La Structure Hiérarchique des Clés de Cache (`queryKeys.ts`)
### Question :
```typescript
// queryKeys.ts
applications: ['applications'] as const

// useApplications.ts
queryKey: [...queryKeys.applications, params]
```
**"Pourquoi la clé est-elle statique dans queryKeys.ts mais dynamique dans le Hook ?"**

### Réponse :
C'est une conception avancée pour gérer le cache de manière hiérarchique :
*   **Clé dynamique au runtime** : Grâce au spread operator (`...`), la clé s'assemble en `['applications', params]`. Chaque combinaison de filtres (page 1, recherche "Développeur", score min 80) dispose de son propre tiroir de cache privé.
*   **Invalidation globale simple** : Si un candidat est accepté ou rejeté, la liste des candidatures change. Pour vider le cache et forcer la mise à jour, on appelle :
    `queryClient.invalidateQueries({ queryKey: queryKeys.applications })`.
*   Comme `queryKeys.applications` pointe sur la racine statique `['applications']`, React Query comprend immédiatement qu'il doit **invalider en cascade** toutes les clés enfants (toutes les pages et tous les filtres associés).

---

## 6.2. Le Défilement Infini (`useInfiniteQuery`) & la Condition d'Arrêt
### Question :
```typescript
nextPage: (data?.length || 0) < params.pageSize ? undefined : (pageParam as number) + 1
```
**"Comment le défilement infini sait-il qu'il est arrivé à la fin de la base de données ?"**

### Réponse :
C'est le calcul de la **condition d'arrêt dynamique** :
1.  Imaginons que tu demandes **10 employés par page** (`pageSize = 10`).
2.  L'utilisateur clique sur "Charger plus" pour afficher la page 3.
3.  Si le serveur ne te renvoie que **4 employés** au lieu des 10 demandés, le code comprend instantanément : *"Il n'y a plus d'éléments à charger, nous sommes arrivés au bout de la base"*.
4.  La condition `data.length < pageSize` devient vraie. `nextPage` prend la valeur **`undefined`**, ce qui a pour effet immédiat de masquer le bouton "Charger plus" ou d'arrêter les écouteurs de défilement sur le navigateur de l'utilisateur.
5.  S'il y en avait eu 10, le système aurait calculé `pageParam + 1` pour préparer le chargement de la page 4.

---

## 6.3. Le Rôle de la Variable Interne `lastPage`
### Question :
```typescript
getNextPageParam: (lastPage) => lastPage.nextPage
```
**"Que représente concrètement la variable lastPage ?"**

### Réponse :
*   **`lastPage`** représente l'objet de données de la **toute dernière page qui vient d'être téléchargée avec succès** par l'application (ex: le colis de données `{ data, count, nextPage }`).
*   **L'analogie du livre** : C'est comme la dernière page d'un chapitre de livre d'aventures. Tout en bas de la page lue (`lastPage`), il est écrit : *"Rendez-vous à la page 12 pour lire la suite"* (C'est la valeur `nextPage`). Grâce à cette indication écrite sur le dernier morceau lu, tu sais exactement où aller pour charger l'étape suivante.

---

## 6.4. Les Requêtes Conditionnelles de Performance (`enabled: !!userId`)
### Question :
**"Pourquoi a-t-on écrit enabled: !!userId dans le Hook de notifications ?"**

### Réponse :
C'est un **garde-fou de performance (Conditional Fetching)** :
*   **Le problème** : Au démarrage de l'application, l'authentification prend une fraction de seconde pour vérifier la session utilisateur. Pendant ce court laps de temps, la variable `userId` est temporairement vide (`null` ou `undefined`). Lancer une requête d'API sans ID déclencherait une erreur SQL inutile.
*   **La solution (`enabled`)** : Cette option dit à React Query : *"Bloque le lancement automatique de cette requête tant que la condition n'est pas vraie"*.
*   **Le rôle de la double négation (`!!`)** : C'est une astuce de programmation JavaScript pour convertir n'importe quelle valeur en un booléen strict.
    *   Si `userId` est vide (`null`) ➔ `!userId` vaut `true` ➔ `!!userId` vaut **`false`** (La requête est bloquée).
    *   Dès que l'utilisateur est connecté et que `userId` contient son identifiant unique ➔ `!userId` vaut `false` ➔ `!!userId` vaut **`true`** (La requête est débloquée et s'exécute proprement).
