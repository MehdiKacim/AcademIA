export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export interface ModuleSection {
  title: string;
  content: string;
  type?: 'text' | 'quiz' | 'video' | 'image';
  url?: string;
  questions?: QuizQuestion[]; // Pour les sections de type 'quiz'
  isCompleted: boolean; // Nouvelle propriété pour la complétion de la section
  passingScore?: number; // Nouvelle propriété pour le score de réussite du quiz
  quizResult?: { score: number; total: number; passed: boolean }; // Pour stocker le dernier résultat du quiz
}

export interface Module {
  title: string;
  sections: ModuleSection[];
  isCompleted: boolean;
  level: number; // Correction: 'level' est maintenant requis pour correspondre au schéma Zod
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
  imageUrl?: string;
  category?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  prerequisiteCourseId?: string; // Nouveau: ID du cours prérequis pour débloquer celui-ci
}

export type EntityType = 'course' | 'module' | 'section';

const initialDummyCourses: Course[] = [
  {
    id: '1',
    title: "Introduction à l'IA",
    description: "Découvrez les fondements de l'intelligence artificielle, ses applications et son impact sur le monde moderne.",
    imageUrl: "https://images.unsplash.com/photo-1696258680345-f504585d7042?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    modules: [
      {
        title: "Module 1: Qu'est-ce que l'IA ?",
        sections: [
          { title: "Définition et Histoire", content: "L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Cela inclut l'apprentissage, la résolution de problèmes, la reconnaissance de la parole et la prise de décision. Son histoire remonte aux années 1950 avec des pionniers comme Alan Turing. Aujourd'hui, l'IA se manifeste sous diverses formes, de l'IA faible (spécialisée) à l'IA forte (générale).", isCompleted: true },
          { title: "Types d'IA", content: "On distingue principalement l'IA faible (ANI - Artificial Narrow Intelligence), conçue pour une tâche spécifique (ex: reconnaissance faciale), et l'IA forte (AGI - Artificial General Intelligence), capable de comprendre, apprendre et appliquer l'intelligence à n'importe quel problème, comme un être humain. L'ASI (Artificial Super Intelligence) est une IA hypothétique surpassant l'intelligence humaine.", isCompleted: true },
          { title: "Vidéo d'introduction à l'IA", content: "Regardez cette vidéo pour une introduction visuelle à l'IA.", type: "video", url: "https://www.youtube.com/embed/ad79nYk2keg", isCompleted: true },
          {
            title: "Quiz: Fondamentaux de l'IA",
            content: "Testez vos connaissances sur les bases de l'IA.",
            type: "quiz",
            questions: [
              {
                question: "Quel est le but principal de l'intelligence artificielle ?",
                options: [
                  { text: "Créer des robots humanoïdes", isCorrect: false },
                  { text: "Simuler l'intelligence humaine dans les machines", isCorrect: true },
                  { text: "Remplacer les humains dans toutes les tâches", isCorrect: false },
                  { text: "Développer des jeux vidéo plus complexes", isCorrect: false },
                ],
              },
              {
                question: "Quelle est la différence entre l'IA faible et l'IA forte ?",
                options: [
                  { text: "L'IA faible est plus rapide que l'IA forte", isCorrect: false },
                  { text: "L'IA faible est spécialisée, l'IA forte est générale", isCorrect: true },
                  { text: "L'IA faible est pour les débutants, l'IA forte pour les experts", isCorrect: false },
                  { text: "Il n'y a pas de différence, ce sont des synonymes", isCorrect: false },
                ],
              },
            ],
            isCompleted: true, // Marqué comme complété pour débloquer le suivant
            passingScore: 70, // 70% pour réussir
          },
        ],
        isCompleted: true, // Marqué comme complété pour débloquer le module suivant
        level: 0
      },
      {
        title: "Module 2: Apprentissage Automatique (Intro)",
        sections: [
          { title: "Principes Fondamentaux", content: "Le Machine Learning est une branche de l'IA qui permet aux systèmes d'apprendre à partir de données sans être explicitement programmés. Ce module couvre les concepts fondamentaux, les types d'apprentissage (supervisé, non supervisé, par renforcement) et les algorithmes courants comme la régression linéaire et la classification.", isCompleted: false },
          { title: "Apprentissage Supervisé", content: "L'apprentissage supervisé utilise des données étiquetées pour entraîner des modèles. Nous explorerons des algorithmes tels que les machines à vecteurs de support (SVM), les arbres de décision et les forêts aléatoires, ainsi que les métriques d'évaluation associées.", isCompleted: false },
          { title: "Apprentissage Non-Supervisé", content: "L'apprentissage non supervisé trouve des motifs dans des données non étiquetées. Ce module aborde le clustering (K-means, DBSCAN) et la réduction de dimensionnalité (PCA), des techniques essentielles pour l'exploration de données.", isCompleted: false },
          { title: "Image: Cycle de vie du ML", content: "Visualisez le cycle de vie typique d'un projet de Machine Learning.", type: "image", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Machine_Learning_Workflow.svg/1200px-Machine_Learning_Workflow.svg.png", isCompleted: false },
          {
            title: "Quiz: Types de Machine Learning",
            content: "Testez vos connaissances sur les différents types d'apprentissage automatique.",
            type: "quiz",
            questions: [
              {
                question: "Quel type d'apprentissage utilise des données étiquetées ?",
                options: [
                  { text: "Apprentissage non supervisé", isCorrect: false },
                  { text: "Apprentissage par renforcement", isCorrect: false },
                  { text: "Apprentissage supervisé", isCorrect: true },
                ],
              },
              {
                question: "Le clustering est une technique de quel type d'apprentissage ?",
                options: [
                  { text: "Apprentissage supervisé", isCorrect: false },
                  { text: "Apprentissage non supervisé", isCorrect: true },
                  { text: "Apprentissage par renforcement", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 60,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Réseaux de Neurones et Deep Learning",
        sections: [
          { title: "Introduction aux Réseaux de Neurones", content: "Les réseaux de neurones sont des modèles inspirés du cerveau humain, composés de couches de 'neurones' interconnectés. Chaque neurone reçoit des entrées, effectue un calcul et transmet une sortie. L'apprentissage se fait par ajustement des poids des connexions.", isCompleted: false },
          { title: "Deep Learning", content: "Le Deep Learning, une sous-catégorie du Machine Learning, utilise des réseaux de neurones profonds (avec de nombreuses couches) pour apprendre des représentations complexes des données. Cela a révolutionné des domaines comme la vision par ordinateur et le traitement du langage naturel.", isCompleted: false },
          { title: "Types de Réseaux", content: "Nous aborderons les réseaux de neurones convolutifs (CNN) pour l'image, les réseaux de neurones récurrents (RNN) pour les séquences, et les transformeurs pour le traitement du langage naturel.", isCompleted: false },
          {
            title: "Quiz: Réseaux de Neurones",
            content: "Testez vos connaissances sur les réseaux de neurones.",
            type: "quiz",
            questions: [
              {
                question: "Quel est le composant de base d'un réseau de neurones ?",
                options: [
                  { text: "Un transistor", isCorrect: false },
                  { text: "Un neurone", isCorrect: true },
                  { text: "Un bit", isCorrect: false },
                  { text: "Un algorithme", isCorrect: false },
                ],
              },
              {
                question: "Quel type de réseau de neurones est le mieux adapté pour le traitement d'images ?",
                options: [
                  { text: "RNN (Réseau de Neurones Récurrent)", isCorrect: false },
                  { text: "MLP (Perceptron Multi-Couches)", isCorrect: false },
                  { text: "CNN (Réseau de Neurones Convolutif)", isCorrect: true },
                  { text: "GAN (Réseau Antagoniste Génératif)", isCorrect: false },
                ],
              },
              {
                question: "Le Deep Learning est une sous-catégorie de quel domaine ?",
                options: [
                  { text: "La robotique", isCorrect: false },
                  { text: "Le Machine Learning", isCorrect: true },
                  { text: "La cryptographie", isCorrect: false },
                  { text: "La science des données", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 75,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Applications de l'IA",
        sections: [
          { title: "Vision par Ordinateur", content: "La vision par ordinateur permet aux machines de 'voir' et d'interpréter des images et des vidéos. Applications : reconnaissance faciale, détection d'objets, voitures autonomes, diagnostics médicaux par imagerie.", isCompleted: false },
          { title: "Traitement du Langage Naturel (NLP)", content: "Le NLP permet aux machines de comprendre, interpréter et générer du langage humain. Applications : assistants vocaux, traduction automatique, analyse de sentiments, chatbots.", isCompleted: false },
          { title: "Systèmes de Recommandation", content: "L'IA est utilisée pour recommander des produits, des films, de la musique, etc., en analysant les préférences et le comportement des utilisateurs. Exemples : Netflix, Amazon, Spotify.", isCompleted: false },
          {
            title: "Quiz: Applications de l'IA",
            content: "Testez vos connaissances sur les applications de l'IA.",
            type: "quiz",
            questions: [
              {
                question: "Quelle application de l'IA permet aux machines de 'voir' ?",
                options: [
                  { text: "Traitement du Langage Naturel", isCorrect: false },
                  { text: "Vision par Ordinateur", isCorrect: true },
                  { text: "Systèmes de Recommandation", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
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
    imageUrl: "https://images.unsplash.com/photo-1633356122544-cd3608a92e8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    prerequisiteCourseId: '1', // Ce cours nécessite le cours '1'
    modules: [
      {
        title: "Module 1: Les bases de React",
        sections: [
          { title: "Qu'est-ce que React ?", content: "React est une bibliothèque JavaScript déclarative, efficace et flexible pour construire des interfaces utilisateur. Elle permet de créer des composants UI réutilisables.", isCompleted: true },
          { title: "Composants et JSX", content: "Les composants sont les blocs de construction fondamentaux de React. JSX est une extension syntaxique qui permet d'écrire du HTML-like code directement dans JavaScript, facilitant la création d'éléments React.", isCompleted: true },
          { title: "Props et État", content: "Les props (propriétés) sont des données passées des composants parents aux enfants, rendant les composants réutilisables. L'état gère les données internes d'un composant qui peuvent changer au fil du temps, déclenchant un re-rendu de l'UI.", isCompleted: true },
          {
            title: "Quiz: Bases de React",
            content: "Testez vos connaissances sur les concepts fondamentaux de React.",
            type: "quiz",
            questions: [
              {
                question: "Quel est le rôle principal de JSX en React ?",
                options: [
                  { text: "Gérer l'état des composants", isCorrect: false },
                  { text: "Écrire du HTML directement dans JavaScript", isCorrect: true },
                  { text: "Effectuer des requêtes API", isCorrect: false },
                  { text: "Définir le style des composants", isCorrect: false },
                ],
              },
              {
                question: "Comment passe-t-on des données d'un composant parent à un composant enfant ?",
                options: [
                  { text: "Via l'état (state)", isCorrect: false },
                  { text: "Via les props (properties)", isCorrect: true },
                  { text: "Via des variables globales", isCorrect: false },
                  { text: "Via des événements", isCorrect: false },
                ],
              },
            ],
            isCompleted: true, // Marqué comme complété pour débloquer le suivant
            passingScore: 65,
          },
        ],
        isCompleted: true, // Marqué comme complété pour débloquer le module suivant
        level: 0
      },
      {
        title: "Module 2: Hooks et gestion d'état",
        sections: [
          { title: "Introduction aux Hooks", content: "Les Hooks sont des fonctions qui vous permettent d'utiliser l'état et d'autres fonctionnalités de React sans écrire de classes. Ils ont été introduits dans React 16.8.", isCompleted: false },
          { title: "useState et useEffect", content: "`useState` est le Hook le plus fondamental pour ajouter l'état local à un composant fonctionnel. `useEffect` vous permet d'effectuer des effets secondaires (comme les requêtes de données, les abonnements ou la modification directe du DOM) dans les composants fonctionnels.", isCompleted: false },
          { title: "useContext et useReducer", content: "`useContext` permet de partager des données entre composants sans passer les props manuellement à chaque niveau. `useReducer` est une alternative à `useState` pour la gestion d'état plus complexe, souvent utilisée avec un `reducer` pour des logiques de transition d'état.", isCompleted: false },
          {
            title: "Quiz: Hooks React",
            content: "Testez vos connaissances sur les Hooks React.",
            type: "quiz",
            questions: [
              {
                question: "Quel Hook est utilisé pour ajouter l'état local à un composant fonctionnel ?",
                options: [
                  { text: "useEffect", isCorrect: false },
                  { text: "useState", isCorrect: true },
                  { text: "useContext", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Routage avec React Router",
        sections: [
          { title: "Principes du Routage Client-Side", content: "React Router est une bibliothèque standard pour le routage côté client dans les applications React. Elle permet de créer des applications à page unique (SPA) avec plusieurs vues, où l'URL change sans recharger la page entière.", isCompleted: false },
          { title: "Configuration des Routes", content: "Vous apprendrez à définir des routes en utilisant les composants `<BrowserRouter>`, `<Routes>` et `<Route>`, en associant des chemins d'URL à des composants React spécifiques.", isCompleted: false },
          { title: "Navigation Programmatic", content: "Utilisation du hook `useNavigate` pour la navigation programmatique, permettant de rediriger les utilisateurs après une action (ex: soumission de formulaire).", isCompleted: false },
          {
            title: "Quiz: React Router",
            content: "Testez vos connaissances sur React Router.",
            type: "quiz",
            questions: [
              {
                question: "Quel composant est utilisé pour définir une route dans React Router ?",
                options: [
                  { text: "<Link>", isCorrect: false },
                  { text: "<Route>", isCorrect: true },
                  { text: "<Navigate>", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 75,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Requêtes API et cycle de vie",
        sections: [
          { title: "Fetching de Données avec useEffect", content: "Dans React, vous utilisez généralement `useEffect` pour effectuer des requêtes API lorsque le composant est monté ou lorsque certaines dépendances changent. Il est crucial de gérer les états de chargement et d'erreur.", isCompleted: false },
          { title: "Gestion des États de Chargement et d'Erreur", content: "Implémentation de logiques pour afficher des indicateurs de chargement et des messages d'erreur, améliorant l'expérience utilisateur lors des interactions asynchrones.", isCompleted: false },
          { title: "Nettoyage des Effets", content: "Apprenez à nettoyer les effets secondaires (ex: annuler des requêtes, désabonner des écouteurs) en retournant une fonction de nettoyage dans `useEffect` pour éviter les fuites de mémoire.", isCompleted: false },
          {
            title: "Quiz: API et Cycle de Vie",
            content: "Testez vos connaissances sur les requêtes API et le cycle de vie des composants.",
            type: "quiz",
            questions: [
              {
                question: "Quel Hook est couramment utilisé pour les requêtes API dans les composants fonctionnels ?",
                options: [
                  { text: "useState", isCorrect: false },
                  { text: "useEffect", isCorrect: true },
                  { text: "useCallback", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 60,
          },
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
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fd248f53?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    prerequisiteCourseId: '2', // Ce cours nécessite le cours '2'
    modules: [
      {
        title: "Module 1: Structures de données avancées",
        sections: [
          { title: "Arbres et Graphes", content: "Ce module explore les structures de données complexes telles que les arbres (binaires, AVL, B-trees), les graphes (représentations, parcours) et les tables de hachage. Comprendre leur fonctionnement est crucial pour optimiser les performances de vos applications.", isCompleted: false },
          { title: "Tables de Hachage", content: "Les tables de hachage offrent un accès rapide aux données. Nous étudierons leur fonctionnement interne, les collisions et les stratégies de résolution, ainsi que leurs applications pratiques.", isCompleted: false },
          {
            title: "Quiz: Structures de Données",
            content: "Testez vos connaissances sur les structures de données avancées.",
            type: "quiz",
            questions: [
              {
                question: "Quelle structure de données est la plus efficace pour la recherche rapide d'éléments ?",
                options: [
                  { text: "Liste chaînée", isCorrect: false },
                  { text: "Table de hachage", isCorrect: true },
                  { text: "Pile (Stack)", isCorrect: false },
                  { text: "File (Queue)", isCorrect: false },
                ],
              },
              {
                question: "Un arbre binaire de recherche (BST) garantit-il toujours un temps de recherche O(log n) ?",
                options: [
                  { text: "Oui, toujours", isCorrect: false },
                  { text: "Non, seulement s'il est équilibré", isCorrect: true },
                  { text: "Non, c'est toujours O(n)", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 2: Algorithmes de tri et de recherche",
        sections: [
          { title: "Tris Efficaces", content: "Plongez dans les algorithmes de tri efficaces comme Quicksort, Mergesort et Heapsort, ainsi que les techniques de recherche avancées telles que la recherche binaire et la recherche par interpolation. Nous analyserons leur complexité temporelle et spatiale.", isCompleted: false },
          { title: "Recherche Avancée", content: "Au-delà de la recherche binaire, nous explorerons des techniques pour des structures de données spécifiques et des scénarios de recherche plus complexes.", isCompleted: false },
          {
            title: "Quiz: Tris et Recherche",
            content: "Testez vos connaissances sur les algorithmes de tri et de recherche.",
            type: "quiz",
            questions: [
              {
                question: "Quel algorithme de tri a une complexité moyenne de O(n log n) ?",
                options: [
                  { text: "Bubble Sort", isCorrect: false },
                  { text: "Quick Sort", isCorrect: true },
                  { text: "Selection Sort", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 65,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Programmation dynamique",
        sections: [
          { title: "Principes de la PD", content: "La programmation dynamique est une méthode puissante pour résoudre des problèmes complexes en les décomposant en sous-problèmes plus petits. Ce module vous enseignera les principes de la PD, y compris la mémorisation et la tabulation, à travers des exemples classiques.", isCompleted: false },
          { title: "Exemples Classiques", content: "Nous étudierons des problèmes comme la suite de Fibonacci, le problème du sac à dos, et le plus long sous-séquence commune pour illustrer l'application de la programmation dynamique.", isCompleted: false },
          {
            title: "Quiz: Programmation Dynamique",
            content: "Testez vos connaissances sur la programmation dynamique.",
            type: "quiz",
            questions: [
              {
                question: "Quel est l'un des principes clés de la programmation dynamique ?",
                options: [
                  { text: "Diviser pour régner", isCorrect: false },
                  { text: "Mémorisation", isCorrect: true },
                  { text: "Force brute", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Algorithmes de graphes",
        sections: [
          { title: "Parcours de Graphes", content: "Découvrez les algorithmes fondamentaux sur les graphes, essentiels pour la modélisation de réseaux et de relations. Nous couvrirons les parcours en largeur (BFS) et en profondeur (DFS).", isCompleted: false },
          { title: "Plus Courts Chemins et Arbres Couvrants", content: "Nous aborderons l'algorithme de Dijkstra pour les plus courts chemins et l'algorithme de Kruskal pour les arbres couvrants minimaux, avec des applications concrètes.", isCompleted: false },
          {
            title: "Quiz: Algorithmes de Graphes",
            content: "Testez vos connaissances sur les algorithmes de graphes.",
            type: "quiz",
            questions: [
              {
                question: "Quel algorithme trouve le plus court chemin dans un graphe pondéré ?",
                options: [
                  { text: "BFS", isCorrect: false },
                  { text: "DFS", isCorrect: false },
                  { text: "Dijkstra", isCorrect: true },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 75,
          },
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
    imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    prerequisiteCourseId: '3', // Ce cours nécessite le cours '3'
    modules: [
      {
        title: "Module 1: Introduction au Web",
        sections: [
          { title: "Historique et Fondamentaux", content: "Ce module couvre l'historique du web, les principes fondamentaux de HTML pour la structure, CSS pour le style, et JavaScript pour l'interactivité. Vous comprendrez comment ces trois piliers fonctionnent ensemble pour créer des pages web dynamiques.", isCompleted: false },
          { title: "Fonctionnement Client-Serveur", content: "Comprenez comment les navigateurs (clients) interagissent avec les serveurs web pour récupérer et afficher le contenu, y compris les requêtes HTTP et les réponses.", isCompleted: false },
          {
            title: "Quiz: Fondamentaux du Web",
            content: "Testez vos connaissances sur l'introduction au développement web.",
            type: "quiz",
            questions: [
              {
                question: "Quel langage est utilisé pour structurer le contenu d'une page web ?",
                options: [
                  { text: "CSS", isCorrect: false },
                  { text: "JavaScript", isCorrect: false },
                  { text: "HTML", isCorrect: true },
                ],
              },
              {
                question: "Quel protocole est principalement utilisé pour la communication entre client et serveur sur le web ?",
                options: [
                  { text: "FTP", isCorrect: false },
                  { text: "SMTP", isCorrect: false },
                  { text: "HTTP", isCorrect: true },
                  { text: "TCP", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 80,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 2: Frontend avec React",
        sections: [
          { title: "Composants et Props", content: "Plongez dans le développement frontend avec React. Vous apprendrez à créer des composants réutilisables et à utiliser les props pour la communication entre composants.", isCompleted: false },
          { title: "Gestion de l'État avec Hooks", content: "Maîtrisez la gestion de l'état de votre application avec des hooks comme `useState` et `useEffect` pour créer des interfaces dynamiques et réactives.", isCompleted: false },
          { title: "Gestion des formulaires et Validation", content: "Maîtrisez la création et la validation de formulaires complexes en React. Ce sous-module se concentre sur l'utilisation de `React Hook Form` pour une gestion efficace des entrées utilisateur et `Zod` pour la validation de schéma, garantissant la robustesse de vos formulaires.", isCompleted: false },
          { title: "Styles avec Tailwind CSS", content: "Découvrez Tailwind CSS, un framework CSS utilitaire-first qui vous permet de construire des designs personnalisés directement dans votre balisage HTML. Apprenez à styliser rapidement et efficacement vos composants React sans quitter votre fichier JavaScript.", isCompleted: false },
          {
            title: "Quiz: Frontend React",
            content: "Testez vos connaissances sur le développement frontend avec React.",
            type: "quiz",
            questions: [
              {
                question: "Quel est le but principal de `useState` ?",
                options: [
                  { text: "Effectuer des effets secondaires", isCorrect: false },
                  { text: "Ajouter l'état local à un composant fonctionnel", isCorrect: true },
                  { text: "Optimiser les performances", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Backend avec Node.js",
        sections: [
          { title: "API RESTful avec Express.js", content: "Passez au développement backend avec Node.js et Express.js. Ce module vous enseignera comment construire des API RESTful, gérer les requêtes HTTP, et structurer votre application côté serveur pour une performance optimale.", isCompleted: false },
          { title: "Bases de données SQL avec PostgreSQL", content: "Explorez les bases de données relationnelles avec PostgreSQL. Vous apprendrez les concepts SQL, la conception de schémas de base de données, et l'utilisation d'un ORM (Object-Relational Mapper) pour interagir avec votre base de données depuis Node.js.", isCompleted: false },
          { title: "Authentification et Sécurité", content: "Implémentez des systèmes d'authentification sécurisés pour vos applications web. Ce sous-module couvre les concepts de JWT (JSON Web Tokens), la gestion des sessions, et les meilleures pratiques pour protéger les routes et les données de vos utilisateurs.", isCompleted: false },
          {
            title: "Quiz: Backend Node.js",
            content: "Testez vos connaissances sur le développement backend avec Node.js.",
            type: "quiz",
            questions: [
              {
                question: "Quel framework est couramment utilisé pour construire des API RESTful avec Node.js ?",
                options: [
                  { text: "React", isCorrect: false },
                  { text: "Express.js", isCorrect: true },
                  { text: "Angular", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 65,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Déploiement et Maintenance",
        sections: [
          { title: "Préparation pour la Production", content: "Ce module vous guide à travers le processus de déploiement de vos applications fullstack. Vous apprendrez à préparer votre code pour la production (optimisation, minification).", isCompleted: false },
          { title: "Plateformes d'Hébergement", content: "Choisissez des plateformes d'hébergement adaptées (comme Vercel ou Netlify pour le frontend, Heroku ou Render pour le backend) et comprenez leurs spécificités.", isCompleted: false },
          { title: "CI/CD et Monitoring", content: "Mettez en place des pipelines CI/CD (Intégration Continue/Déploiement Continu) pour des déploiements automatisés et des systèmes de monitoring pour assurer la performance continue et la maintenance de vos applications.", isCompleted: false },
          {
            title: "Quiz: Déploiement",
            content: "Testez vos connaissances sur le déploiement et la maintenance.",
            type: "quiz",
            questions: [
              {
                question: "Que signifie CI/CD ?",
                options: [
                  { text: "Code Integration / Code Delivery", isCorrect: false },
                  { text: "Continuous Integration / Continuous Deployment", isCorrect: true },
                  { text: "Client Interface / Cloud Deployment", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
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
    imageUrl: "https://images.unsplash.com/photo-1551288259-cd778e75d97b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    prerequisiteCourseId: '4', // Ce cours nécessite le cours '4'
    modules: [
      {
        title: "Module 1: Introduction aux Données",
        sections: [
          { title: "Définition et Rôle", content: "Ce module définit la science des données, son rôle croissant dans l'industrie, et les compétences clés requises. Vous comprendrez le cycle de vie des données, de la collecte à l'interprétation.", isCompleted: false },
          { title: "Éthique des Données", content: "L'importance de l'éthique des données, de la confidentialité et de la partialité dans les algorithmes d'IA.", isCompleted: false },
          {
            title: "Quiz: Introduction à la Science des Données",
            content: "Testez vos connaissances sur les concepts fondamentaux de la science des données.",
            type: "quiz",
            questions: [
              {
                question: "Quelle est la première étape du cycle de vie des données ?",
                options: [
                  { text: "Analyse", isCorrect: false },
                  { text: "Visualisation", isCorrect: false },
                  { text: "Collecte", isCorrect: true },
                  { text: "Modélisation", isCorrect: false },
                ],
              },
              {
                question: "Pourquoi l'éthique est-elle importante en science des données ?",
                options: [
                  { text: "Pour rendre les modèles plus rapides", isCorrect: false },
                  { text: "Pour assurer la confidentialité et éviter les biais", isCorrect: true },
                  { text: "Pour réduire les coûts de stockage", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 2: Collecte et Préparation des Données",
        sections: [
          { title: "Techniques de Collecte", content: "Apprenez les techniques de collecte de données à partir de diverses sources (API, bases de données, web scraping).", isCompleted: false },
          { title: "Nettoyage et Transformation", content: "Ce module couvre également les étapes cruciales de nettoyage, de transformation et de gestion des données manquantes pour préparer vos ensembles de données à l'analyse.", isCompleted: false },
          { title: "Exploration des Données (EDA)", content: "L'EDA est une étape essentielle pour comprendre vos données. Ce sous-module vous enseignera comment utiliser des statistiques descriptives et des techniques de visualisation (histogrammes, nuages de points, boîtes à moustaches) pour découvrir des motifs, des anomalies et des relations.", isCompleted: false },
          { title: "Ingénierie des Caractéristiques", content: "L'ingénierie des caractéristiques est l'art de créer de nouvelles variables à partir de données brutes pour améliorer la performance des modèles. Ce module explore des techniques comme l'encodage catégoriel, la normalisation, la standardisation et la création de caractéristiques polynomiales.", isCompleted: false },
          {
            title: "Quiz: Préparation des Données",
            content: "Testez vos connaissances sur la collecte et la préparation des données.",
            type: "quiz",
            questions: [
              {
                question: "Quelle est l'importance du nettoyage des données ?",
                options: [
                  { text: "Pour réduire la taille des fichiers", isCorrect: false },
                  { text: "Pour améliorer la qualité et la fiabilité de l'analyse", isCorrect: true },
                  { text: "Pour accélérer le chargement des données", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 60,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Modélisation Prédictive",
        sections: [
          { title: "Concepts de Modélisation", content: "Introduction aux concepts de la modélisation prédictive. Ce module couvre les algorithmes de régression (linéaire, logistique) et de classification (k-NN, arbres de décision), en expliquant comment construire et entraîner des modèles pour faire des prédictions.", isCompleted: false },
          { title: "Évaluation des Modèles", content: "Apprenez à évaluer la performance de vos modèles prédictifs. Ce sous-module aborde des métriques clés comme la précision, le rappel, le score F1, l'AUC-ROC, et les techniques pour détecter et prévenir le surapprentissage et le sous-apprentissage.", isCompleted: false },
          {
            title: "Quiz: Modélisation Prédictive",
            content: "Testez vos connaissances sur la modélisation prédictive.",
            type: "quiz",
            questions: [
              {
                question: "Quel type de problème la régression linéaire résout-elle ?",
                options: [
                  { text: "Classification", isCorrect: false },
                  { text: "Prédiction de valeurs continues", isCorrect: true },
                  { text: "Clustering", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 75,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Déploiement et Maintien",
        sections: [
          { title: "Mise en Production", content: "Ce module traite de la mise en production des modèles de science des données. Vous apprendrez à déployer vos modèles en tant qu'API et à les intégrer dans des applications existantes.", isCompleted: false },
          { title: "Monitoring et Maintenance", content: "Mettez en place des systèmes de monitoring pour assurer leur performance continue et leur maintenance, y compris la détection de la dérive des données et le réentraînement des modèles.", isCompleted: false },
          {
            title: "Quiz: Déploiement et Maintenance",
            content: "Testez vos connaissances sur le déploiement et la maintenance des modèles.",
            type: "quiz",
            questions: [
              {
                question: "Pourquoi est-il important de surveiller les modèles après le déploiement ?",
                options: [
                  { text: "Pour s'assurer qu'ils sont toujours pertinents et performants", isCorrect: true },
                  { text: "Pour augmenter leur vitesse d'exécution", isCorrect: false },
                  { text: "Pour réduire les coûts de calcul", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Collecte de données", "Analyse statistique", "Modélisation ML", "Visualisation"]
  },
  {
    id: '6',
    title: "Programmation en C#",
    description: "Apprenez les bases et les concepts avancés de la programmation en C#, un langage polyvalent pour le développement d'applications Windows, web et jeux.",
    imageUrl: "https://images.unsplash.com/photo-1629904853893-c2c6677973ad?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    prerequisiteCourseId: '5', // Ce cours nécessite le cours '5'
    modules: [
      {
        title: "Module 1: Introduction à C# et .NET",
        sections: [
          { title: "Qu'est-ce que C# ?", content: "C# (prononcé C sharp) est un langage de programmation orienté objet développé par Microsoft. Il est largement utilisé pour créer des applications Windows, des applications web avec ASP.NET, des jeux avec Unity, et bien plus encore. Il fait partie de l'écosystème .NET.", isCompleted: false },
          { title: "L'environnement .NET", content: "Le framework .NET est une plateforme de développement qui fournit un environnement d'exécution (CLR) et une vaste bibliothèque de classes (FCL) pour construire des applications. .NET Core est une version open-source et multiplateforme de .NET.", isCompleted: false },
          {
            title: "Quiz: Bases de C# et .NET",
            content: "Testez vos connaissances sur l'introduction à C# et l'environnement .NET.",
            type: "quiz",
            questions: [
              {
                question: "Qui a développé le langage C# ?",
                options: [
                  { text: "Google", isCorrect: false },
                  { text: "Apple", isCorrect: false },
                  { text: "Microsoft", isCorrect: true },
                  { text: "Oracle", isCorrect: false },
                ],
              },
              {
                question: "C# est principalement utilisé pour quel type de développement ?",
                options: [
                  { text: "Développement mobile iOS", isCorrect: false },
                  { text: "Développement de jeux avec Unity", isCorrect: true },
                  { text: "Développement de scripts shell", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 2: Syntaxe de base et types de données",
        sections: [
          { title: "Variables et Types", content: "Ce module couvre la syntaxe de base de C#, y compris la déclaration de variables, les types de données primitifs (int, float, bool, string) et la conversion de types. Vous apprendrez à écrire vos premières lignes de code C#.", isCompleted: false },
          { title: "Opérateurs et Expressions", content: "Découvrez les opérateurs arithmétiques, de comparaison, logiques et d'affectation. Comprenez comment construire des expressions pour effectuer des calculs et des évaluations.", isCompleted: false },
          {
            title: "Quiz: Syntaxe et Types",
            content: "Testez vos connaissances sur la syntaxe de base et les types de données en C#.",
            type: "quiz",
            questions: [
              {
                question: "Quel mot-clé est utilisé pour déclarer une variable entière en C# ?",
                options: [
                  { text: "string", isCorrect: false },
                  { text: "int", isCorrect: true },
                  { text: "var", isCorrect: false },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 65,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Structures de contrôle",
        sections: [
          { title: "Conditions (if, else if, else, switch)", content: "Apprenez à contrôler le flux d'exécution de votre programme avec les instructions conditionnelles. Vous utiliserez `if`, `else if`, `else` pour des décisions simples et `switch` pour des choix multiples.", isCompleted: false },
          { title: "Boucles (for, while, do-while, foreach)", content: "Maîtrisez les différentes boucles pour répéter des blocs de code. `for` pour un nombre connu d'itérations, `while` et `do-while` pour des conditions, et `foreach` pour parcourir des collections.", isCompleted: false },
          {
            title: "Quiz: Structures de Contrôle",
            content: "Testez vos connaissances sur les structures de contrôle en C#.",
            type: "quiz",
            questions: [
              {
                question: "Quelle boucle est la plus appropriée pour parcourir tous les éléments d'une liste ?",
                options: [
                  { text: "for", isCorrect: false },
                  { text: "while", isCorrect: false },
                  { text: "foreach", isCorrect: true },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 70,
          },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Programmation Orientée Objet (POO)",
        sections: [
          { title: "Classes et Objets", content: "Introduction aux concepts fondamentaux de la POO en C#: classes, objets, propriétés, méthodes et constructeurs. Vous apprendrez à modéliser des entités du monde réel dans votre code.", isCompleted: false },
          { title: "Héritage et Polymorphisme", content: "Explorez l'héritage pour créer des hiérarchies de classes et le polymorphisme pour traiter des objets de différentes classes de manière uniforme. Ces concepts sont clés pour un code réutilisable et extensible.", isCompleted: false },
          { title: "Interfaces et Abstraction", content: "Comprenez les interfaces pour définir des contrats et l'abstraction pour masquer les détails d'implémentation. Ces principes améliorent la flexibilité et la maintenabilité de votre code.", isCompleted: false },
          {
            title: "Quiz: POO en C#",
            content: "Testez vos connaissances sur la Programmation Orientée Objet en C#.",
            type: "quiz",
            questions: [
              {
                question: "Quel principe de la POO permet à une classe d'hériter des propriétés et méthodes d'une autre classe ?",
                options: [
                  { text: "Polymorphisme", isCorrect: false },
                  { text: "Encapsulation", isCorrect: false },
                  { text: "Héritage", isCorrect: true },
                ],
              },
            ],
            isCompleted: false,
            passingScore: 75,
          },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Programmation C#", "POO", ".NET Framework", "Développement d'applications"]
  },
];

const LOCAL_STORAGE_KEY = 'academia_courses';

// Fonction pour charger les cours depuis le localStorage
export const loadCourses = (): Course[] => {
  try {
    const storedCourses: Course[] = localStorage.getItem(LOCAL_STORAGE_KEY)
      ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)
      : [];

    // Créer une map pour une recherche rapide des cours stockés par ID
    const storedCoursesMap = new Map<string, Course>();
    storedCourses.forEach(course => storedCoursesMap.set(course.id, course));

    // Commencer avec les cours par défaut initiaux
    const combinedCourses: Course[] = [...initialDummyCourses];

    // Ajouter ou mettre à jour avec les cours du stockage local
    storedCourses.forEach(storedCourse => {
      const existingInitialCourse = combinedCourses.find(c => c.id === storedCourse.id);
      if (existingInitialCourse) {
        // Si un cours initial avec le même ID existe, le mettre à jour avec la version stockée
        // Cela garantit que le statut de complétion, etc., de la session de l'utilisateur est préservé
        Object.assign(existingInitialCourse, storedCourse);
      } else {
        // S'il s'agit d'un nouveau cours (non présent dans initialDummyCourses), l'ajouter
        combinedCourses.push(storedCourse);
      }
    });

    return combinedCourses;
  } catch (error) {
    console.error("Erreur lors du chargement des cours depuis le localStorage:", error);
    return initialDummyCourses; // Revenir aux cours initiaux en cas d'erreur
  }
};

// Fonction pour sauvegarder les cours dans le localStorage
export const saveCourses = (courses: Course[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(courses));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des cours dans le localStorage:", error);
  }
};

// Variable exportée qui sera utilisée dans l'application
export let dummyCourses: Course[] = loadCourses();

// Fonction pour mettre à jour un cours spécifique et le sauvegarder
export const updateCourseInStorage = (updatedCourse: Course) => {
  dummyCourses = dummyCourses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
  saveCourses(dummyCourses);
};

// Fonction pour ajouter un nouveau cours
export const addCourseToStorage = (newCourse: Course) => {
  dummyCourses = [...dummyCourses, newCourse];
  saveCourses(dummyCourses);
};