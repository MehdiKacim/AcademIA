export type EntityType = 'course' | 'module' | 'section';

/**
 * Génère une clé unique pour stocker les notes dans le localStorage.
 * @param entityType Le type d'entité (cours, module ou section).
 * @param entityId L'ID du cours.
 * @param moduleIndex L'index du module (optionnel, pour les notes de module ou section).
 * @param sectionIndex L'index de la section (optionnel, pour les notes de section).
 * @returns La clé unique pour le localStorage.
 */
export const generateNoteKey = (entityType: EntityType, entityId: string, moduleIndex?: number, sectionIndex?: number): string => {
  if (entityType === 'section' && moduleIndex !== undefined && sectionIndex !== undefined) {
    return `notes_${entityType}_${entityId}_${moduleIndex}_${sectionIndex}`;
  }
  if (entityType === 'module' && moduleIndex !== undefined) {
    return `notes_${entityType}_${entityId}_${moduleIndex}`;
  }
  return `notes_${entityType}_${entityId}`;
};

/**
 * Récupère les notes pour une clé donnée depuis le localStorage.
 * @param key La clé des notes.
 * @returns Un tableau de chaînes de caractères représentant les notes.
 */
export const getNotes = (key: string): string[] => {
  try {
    const storedNotes = localStorage.getItem(key);
    return storedNotes ? JSON.parse(storedNotes) : [];
  } catch (error) {
    console.error("Erreur lors de la récupération des notes du localStorage:", error);
    return [];
  }
};

/**
 * Ajoute une nouvelle note pour une clé donnée dans le localStorage.
 * @param key La clé des notes.
 * @param note La note à ajouter.
 * @returns Le tableau mis à jour des notes.
 */
export const addNote = (key: string, note: string): string[] => {
  try {
    const existingNotes = getNotes(key);
    const updatedNotes = [...existingNotes, note];
    localStorage.setItem(key, JSON.stringify(updatedNotes));
    return updatedNotes;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la note au localStorage:", error);
    return getNotes(key); // Retourne l'état actuel sans la nouvelle note si l'ajout échoue
  }
};

/**
 * Met à jour une note existante pour une clé donnée dans le localStorage.
 * @param key La clé des notes.
 * @param index L'index de la note à mettre à jour.
 * @param newContent Le nouveau contenu de la note.
 * @returns Le tableau mis à jour des notes.
 */
export const updateNote = (key: string, index: number, newContent: string): string[] => {
  try {
    const existingNotes = getNotes(key);
    if (index >= 0 && index < existingNotes.length) {
      existingNotes[index] = newContent;
      localStorage.setItem(key, JSON.stringify(existingNotes));
      return existingNotes;
    }
    return existingNotes; // Retourne l'état inchangé si l'index est invalide
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la note dans le localStorage:", error);
    return getNotes(key);
  }
};

/**
 * Supprime une note pour une clé donnée dans le localStorage.
 * @param key La clé des notes.
 * @param index L'index de la note à supprimer.
 * @returns Le tableau mis à jour des notes.
 */
export const deleteNote = (key: string, index: number): string[] => {
  try {
    const existingNotes = getNotes(key);
    if (index >= 0 && index < existingNotes.length) {
      const updatedNotes = existingNotes.filter((_, i) => i !== index);
      localStorage.setItem(key, JSON.stringify(updatedNotes));
      return updatedNotes;
    }
    return existingNotes; // Retourne l'état inchangé si l'index est invalide
  } catch (error) {
    console.error("Erreur lors de la suppression de la note du localStorage:", error);
    return getNotes(key);
  }
};

// --- Fonctions pour la vue globale des notes ---

interface ParsedNoteKey {
  entityType: EntityType;
  entityId: string;
  moduleIndex?: number;
  sectionIndex?: number; // Ajout de sectionIndex
}

export interface AggregatedNote {
  key: string;
  context: string; // Ex: "Cours: Introduction à l'IA", "Module: Réseaux de Neurones (Cours: Introduction à l'IA)", "Section: Définition et Histoire (Module: Qu'est-ce que l'IA? - Cours: Introduction à l'IA)"
  notes: string[];
}

/**
 * Analyse une clé de note pour extraire le type d'entité, l'ID et l'index du module/section.
 */
const parseNoteKey = (key: string): ParsedNoteKey | null => {
  const parts = key.split('_');
  if (parts[0] !== 'notes' || parts.length < 3) {
    return null;
  }
  const entityType = parts[1] as EntityType;
  const entityId = parts[2];
  let moduleIndex: number | undefined;
  let sectionIndex: number | undefined;

  if (entityType === 'module' && parts.length >= 4) {
    moduleIndex = parseInt(parts[3], 10);
  } else if (entityType === 'section' && parts.length >= 5) {
    moduleIndex = parseInt(parts[3], 10);
    sectionIndex = parseInt(parts[4], 10);
  }

  return { entityType, entityId, moduleIndex, sectionIndex };
};

/**
 * Récupère toutes les clés de note du localStorage.
 */
export const getAllNoteKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('notes_')) {
      keys.push(key);
    }
  }
  return keys;
};

interface ModuleSection {
  title: string;
  content: string;
  type?: 'text' | 'quiz' | 'video';
}

interface Module {
  title: string;
  sections: ModuleSection[];
  isCompleted: boolean;
  level?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
}

// Données fictives des cours (doit être cohérent avec CourseDetail.tsx et ModuleDetail.tsx)
// En production, ces données proviendraient d'un état global ou d'une API.
const dummyCourses: Course[] = [
  {
    id: '1',
    title: "Introduction à l'IA",
    description: "Découvrez les fondements de l'intelligence artificielle, ses applications et son impact sur le monde moderne.",
    modules: [
      {
        title: "Module 1: Qu'est-ce que l'IA ?",
        sections: [
          { title: "Définition et Histoire", content: "L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Cela inclut l'apprentissage, la résolution de problèmes, la reconnaissance de la parole et la prise de décision. Son histoire remonte aux années 1950 avec des pionniers comme Alan Turing. Aujourd'hui, l'IA se manifeste sous diverses formes, de l'IA faible (spécialisée) à l'IA forte (générale)." },
          { title: "Types d'IA", content: "On distingue principalement l'IA faible (ANI - Artificial Narrow Intelligence), conçue pour une tâche spécifique (ex: reconnaissance faciale), et l'IA forte (AGI - Artificial General Intelligence), capable de comprendre, apprendre et appliquer l'intelligence à n'importe quel problème, comme un être humain. L'ASI (Artificial Super Intelligence) est une IA hypothétique surpassant l'intelligence humaine." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Apprentissage Automatique (Intro)",
        sections: [
          { title: "Principes Fondamentaux", content: "Le Machine Learning est une branche de l'IA qui permet aux systèmes d'apprendre à partir de données sans être explicitement programmés. Ce module couvre les concepts fondamentaux, les types d'apprentissage (supervisé, non supervisé, par renforcement) et les algorithmes courants comme la régression linéaire et la classification." },
          { title: "Apprentissage Supervisé", content: "L'apprentissage supervisé utilise des données étiquetées pour entraîner des modèles. Nous explorerons des algorithmes tels que les machines à vecteurs de support (SVM), les arbres de décision et les forêts aléatoires, ainsi que les métriques d'évaluation associées." },
          { title: "Apprentissage Non-Supervisé", content: "L'apprentissage non supervisé trouve des motifs dans des données non étiquetées. Ce module aborde le clustering (K-means, DBSCAN) et la réduction de dimensionnalité (PCA), des techniques essentielles pour l'exploration de données." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Réseaux de Neurones et Deep Learning",
        sections: [
          { title: "Introduction aux Réseaux de Neurones", content: "Les réseaux de neurones sont des modèles inspirés du cerveau humain, composés de couches de 'neurones' interconnectés. Chaque neurone reçoit des entrées, effectue un calcul et transmet une sortie. L'apprentissage se fait par ajustement des poids des connexions." },
          { title: "Deep Learning", content: "Le Deep Learning, une sous-catégorie du Machine Learning, utilise des réseaux de neurones profonds (avec de nombreuses couches) pour apprendre des représentations complexes des données. Cela a révolutionné des domaines comme la vision par ordinateur et le traitement du langage naturel." },
          { title: "Types de Réseaux", content: "Nous aborderons les réseaux de neurones convolutifs (CNN) pour l'image, les réseaux de neurones récurrents (RNN) pour les séquences, et les transformeurs pour le traitement du langage naturel." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Applications de l'IA",
        sections: [
          { title: "Vision par Ordinateur", content: "La vision par ordinateur permet aux machines de 'voir' et d'interpréter des images et des vidéos. Applications : reconnaissance faciale, détection d'objets, voitures autonomes, diagnostics médicaux par imagerie." },
          { title: "Traitement du Langage Naturel (NLP)", content: "Le NLP permet aux machines de comprendre, interpréter et générer du langage humain. Applications : assistants vocaux, traduction automatique, analyse de sentiments, chatbots." },
          { title: "Systèmes de Recommandation", content: "L'IA est utilisée pour recommander des produits, des films, de la musique, etc., en analysant les préférences et le comportement des utilisateurs. Exemples : Netflix, Amazon, Spotify." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Comprendre l'IA", "Maîtriser le ML", "Appliquer le Deep Learning", "Analyser les données"]
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      {
        title: "Module 1: Les bases de React",
        sections: [
          { title: "Qu'est-ce que React ?", content: "React est une bibliothèque JavaScript déclarative, efficace et flexible pour construire des interfaces utilisateur. Elle permet de créer des composants UI réutilisables." },
          { title: "Composants et JSX", content: "Les composants sont les blocs de construction fondamentaux de React. JSX est une extension syntaxique qui permet d'écrire du HTML-like code directement dans JavaScript, facilitant la création d'éléments React." },
          { title: "Props et État", content: "Les props (propriétés) sont des données passées des composants parents aux enfants, rendant les composants réutilisables. L'état gère les données internes d'un composant qui peuvent changer au fil du temps, déclenchant un re-rendu de l'UI." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Hooks et gestion d'état",
        sections: [
          { title: "Introduction aux Hooks", content: "Les Hooks sont des fonctions qui vous permettent d'utiliser l'état et d'autres fonctionnalités de React sans écrire de classes. Ils ont été introduits dans React 16.8." },
          { title: "useState et useEffect", content: "`useState` est le Hook le plus fondamental pour ajouter l'état local à un composant fonctionnel. `useEffect` vous permet d'effectuer des effets secondaires (comme les requêtes de données, les abonnements ou la modification directe du DOM) dans les composants fonctionnels." },
          { title: "useContext et useReducer", content: "`useContext` permet de partager des données entre composants sans passer les props manuellement à chaque niveau. `useReducer` est une alternative à `useState` pour la gestion d'état plus complexe, souvent utilisée avec un `reducer` pour des logiques de transition d'état." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 3: Routage avec React Router",
        sections: [
          { title: "Principes du Routage Client-Side", content: "React Router est une bibliothèque standard pour le routage côté client dans les applications React. Elle permet de créer des applications à page unique (SPA) avec plusieurs vues, où l'URL change sans recharger la page entière." },
          { title: "Configuration des Routes", content: "Vous apprendrez à définir des routes en utilisant les composants `<BrowserRouter>`, `<Routes>` et `<Route>`, en associant des chemins d'URL à des composants React spécifiques." },
          { title: "Navigation Programmatic", content: "Utilisation du hook `useNavigate` pour la navigation programmatique, permettant de rediriger les utilisateurs après une action (ex: soumission de formulaire)." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Requêtes API et cycle de vie",
        sections: [
          { title: "Fetching de Données avec useEffect", content: "Dans React, vous utilisez généralement `useEffect` pour effectuer des requêtes API lorsque le composant est monté ou lorsque certaines dépendances changent. Il est crucial de gérer les états de chargement et d'erreur." },
          { title: "Gestion des États de Chargement et d'Erreur", content: "Implémentation de logiques pour afficher des indicateurs de chargement et des messages d'erreur, améliorant l'expérience utilisateur lors des interactions asynchrones." },
          { title: "Nettoyage des Effets", content: "Apprenez à nettoyer les effets secondaires (ex: annuler des requêtes, désabonner des écouteurs) en retournant une fonction de nettoyage dans `useEffect` pour éviter les fuites de mémoire." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Développer avec React", "Gérer l'état", "Naviguer avec React Router", "Intégrer des APIs"]
  },
  {
    id: '3',
    title: "Algorithmes Avancés",
    description: "Maîtrisez les structures de données complexes et les algorithmes efficaces pour résoudre des problèmes informatiques avancés.",
    modules: [
      {
        title: "Module 1: Structures de données avancées",
        sections: [
          { title: "Arbres et Graphes", content: "Ce module explore les structures de données complexes telles que les arbres (binaires, AVL, B-trees), les graphes (représentations, parcours) et les tables de hachage. Comprendre leur fonctionnement est crucial pour optimiser les performances de vos applications." },
          { title: "Tables de Hachage", content: "Les tables de hachage offrent un accès rapide aux données. Nous étudierons leur fonctionnement interne, les collisions et les stratégies de résolution, ainsi que leurs applications pratiques." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 2: Algorithmes de tri et de recherche",
        sections: [
          { title: "Tris Efficaces", content: "Plongez dans les algorithmes de tri efficaces comme Quicksort, Mergesort et Heapsort, ainsi que les techniques de recherche avancées telles que la recherche binaire et la recherche par interpolation. Nous analyserons leur complexité temporelle et spatiale." },
          { title: "Recherche Avancée", content: "Au-delà de la recherche binaire, nous explorerons des techniques pour des structures de données spécifiques et des scénarios de recherche plus complexes." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Programmation dynamique",
        sections: [
          { title: "Principes de la PD", content: "La programmation dynamique est une méthode puissante pour résoudre des problèmes complexes en les décomposant en sous-problèmes plus petits. Ce module vous enseignera les principes de la PD, y compris la mémorisation et la tabulation, à travers des exemples classiques." },
          { title: "Exemples Classiques", content: "Nous étudierons des problèmes comme la suite de Fibonacci, le problème du sac à dos, et le plus long sous-séquence commune pour illustrer l'application de la programmation dynamique." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Algorithmes de graphes",
        sections: [
          { title: "Parcours de Graphes", content: "Découvrez les algorithmes fondamentaux sur les graphes, essentiels pour la modélisation de réseaux et de relations. Nous couvrirons les parcours en largeur (BFS) et en profondeur (DFS)." },
          { title: "Plus Courts Chemins et Arbres Couvrants", content: "Nous aborderons l'algorithme de Dijkstra pour les plus courts chemins et l'algorithme de Kruskal pour les arbres couvrants minimaux, avec des applications concrètes." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Maîtriser les structures de données", "Optimiser les algorithmes", "Résoudre des problèmes complexes", "Analyser les graphes"]
  },
  {
    id: '4',
    title: "Développement Web Fullstack",
    description: "Apprenez à construire des applications web complètes, du frontend au backend, avec les technologies modernes.",
    modules: [
      {
        title: "Module 1: Introduction au Web",
        sections: [
          { title: "Historique et Fondamentaux", content: "Ce module couvre l'historique du web, les principes fondamentaux de HTML pour la structure, CSS pour le style, et JavaScript pour l'interactivité. Vous comprendrez comment ces trois piliers fonctionnent ensemble pour créer des pages web dynamiques." },
          { title: "Fonctionnement Client-Serveur", content: "Comprenez comment les navigateurs (clients) interagissent avec les serveurs web pour récupérer et afficher le contenu, y compris les requêtes HTTP et les réponses." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Frontend avec React",
        sections: [
          { title: "Composants et Props", content: "Plongez dans le développement frontend avec React. Vous apprendrez à créer des composants réutilisables et à utiliser les props pour la communication entre composants." },
          { title: "Gestion de l'État avec Hooks", content: "Maîtrisez la gestion de l'état de votre application avec des hooks comme `useState` et `useEffect` pour créer des interfaces dynamiques et réactives." },
          { title: "Gestion des formulaires et Validation", content: "Maîtrisez la création et la validation de formulaires complexes en React. Ce sous-module se concentre sur l'utilisation de `React Hook Form` pour une gestion efficace des entrées utilisateur et `Zod` pour la validation de schéma, garantissant la robustesse de vos formulaires." },
          { title: "Styles avec Tailwind CSS", content: "Découvrez Tailwind CSS, un framework CSS utilitaire-first qui vous permet de construire des designs personnalisés directement dans votre balisage HTML. Apprenez à styliser rapidement et efficacement vos composants React sans quitter votre fichier JavaScript." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Backend avec Node.js",
        sections: [
          { title: "API RESTful avec Express.js", content: "Passez au développement backend avec Node.js et Express.js. Ce module vous enseignera comment construire des API RESTful, gérer les requêtes HTTP, et structurer votre application côté serveur pour une performance optimale." },
          { title: "Bases de données SQL avec PostgreSQL", content: "Explorez les bases de données relationnelles avec PostgreSQL. Vous apprendrez les concepts SQL, la conception de schémas de base de données, et l'utilisation d'un ORM (Object-Relational Mapper) pour interagir avec votre base de données depuis Node.js." },
          { title: "Authentification et Sécurité", content: "Implémentez des systèmes d'authentification sécurisés pour vos applications web. Ce sous-module couvre les concepts de JWT (JSON Web Tokens), la gestion des sessions, et les meilleures pratiques pour protéger les routes et les données de vos utilisateurs." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Déploiement et Maintenance",
        sections: [
          { title: "Préparation pour la Production", content: "Ce module vous guide à travers le processus de déploiement de vos applications fullstack. Vous apprendrez à préparer votre code pour la production (optimisation, minification)." },
          { title: "Plateformes d'Hébergement", content: "Choisissez des plateformes d'hébergement adaptées (comme Vercel ou Netlify pour le frontend, Heroku ou Render pour le backend) et comprenez leurs spécificités." },
          { title: "CI/CD et Monitoring", content: "Mettez en place des pipelines CI/CD (Intégration Continue/Déploiement Continu) pour des déploiements automatisés et des systèmes de monitoring pour assurer la performance continue et la maintenance de vos applications." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Développer Frontend", "Développer Backend", "Gérer les bases de données", "Déployer des applications"]
  },
  {
    id: '5',
    title: "Fondamentaux de la Science des Données",
    description: "Explorez les concepts clés de la science des données, de la collecte à l'analyse et la visualisation.",
    modules: [
      {
        title: "Module 1: Introduction aux Données",
        sections: [
          { title: "Définition et Rôle", content: "Ce module définit la science des données, son rôle croissant dans l'industrie, et les compétences clés requises. Vous comprendrez le cycle de vie des données, de la collecte à l'interprétation." },
          { title: "Éthique des Données", content: "L'importance de l'éthique des données, de la confidentialité et de la partialité dans les algorithmes d'IA." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Collecte et Préparation des Données",
        sections: [
          { title: "Techniques de Collecte", content: "Apprenez les techniques de collecte de données à partir de diverses sources (API, bases de données, web scraping)." },
          { title: "Nettoyage et Transformation", content: "Ce module couvre également les étapes cruciales de nettoyage, de transformation et de gestion des données manquantes pour préparer vos ensembles de données à l'analyse." },
          { title: "Exploration des Données (EDA)", content: "L'EDA est une étape essentielle pour comprendre vos données. Ce sous-module vous enseignera comment utiliser des statistiques descriptives et des techniques de visualisation (histogrammes, nuages de points, boîtes à moustaches) pour découvrir des motifs, des anomalies et des relations." },
          { title: "Ingénierie des Caractéristiques", content: "L'ingénierie des caractéristiques est l'art de créer de nouvelles variables à partir de données brutes pour améliorer la performance des modèles. Ce module explore des techniques comme l'encodage catégoriel, la normalisation, la standardisation et la création de caractéristiques polynomiales." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Modélisation Prédictive",
        sections: [
          { title: "Concepts de Modélisation", content: "Introduction aux concepts de la modélisation prédictive. Ce module couvre les algorithmes de régression (linéaire, logistique) et de classification (k-NN, arbres de décision), en expliquant comment construire et entraîner des modèles pour faire des prédictions." },
          { title: "Évaluation des Modèles", content: "Apprenez à évaluer la performance de vos modèles prédictifs. Ce sous-module aborde des métriques clés comme la précision, le rappel, le score F1, l'AUC-ROC, et les techniques pour détecter et prévenir le surapprentissage et le sous-apprentissage." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Déploiement et Maintien",
        sections: [
          { title: "Mise en Production", content: "Ce module traite de la mise en production des modèles de science des données. Vous apprendrez à déployer vos modèles en tant qu'API et à les intégrer dans des applications existantes." },
          { title: "Monitoring et Maintenance", content: "Mettez en place des systèmes de monitoring pour assurer leur performance continue et leur maintenance, y compris la détection de la dérive des données et le réentraînement des modèles." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Collecte de données", "Analyse statistique", "Modélisation ML", "Visualisation"]
  },
];

/**
 * Retrieves all notes from localStorage and aggregates them with context.
 */
export const getAllNotesData = (): AggregatedNote[] => {
  const allKeys = getAllNoteKeys();
  const aggregatedNotes: AggregatedNote[] = [];

  allKeys.forEach(key => {
    const parsedKey = parseNoteKey(key);
    if (parsedKey) {
      const notes = getNotes(key);
      if (notes.length > 0) {
        let context = '';
        const course = dummyCourses.find(c => c.id === parsedKey.entityId);

        if (course) {
          if (parsedKey.entityType === 'course') {
            context = `Cours: ${course.title}`;
          } else if (parsedKey.entityType === 'module' && parsedKey.moduleIndex !== undefined) {
            const module = course.modules[parsedKey.moduleIndex];
            if (module) {
              context = `Module: ${module.title} (Cours: ${course.title})`;
            }
          } else if (parsedKey.entityType === 'section' && parsedKey.moduleIndex !== undefined && parsedKey.sectionIndex !== undefined) {
            const module = course.modules[parsedKey.moduleIndex];
            if (module) {
              const section = module.sections[parsedKey.sectionIndex];
              if (section) {
                context = `Section: ${section.title} (Module: ${module.title} - Cours: ${course.title})`;
              }
            }
          }
        }

        if (context) {
          aggregatedNotes.push({ key, context, notes });
        }
      }
    }
  });

  return aggregatedNotes;
};