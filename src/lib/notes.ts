export type EntityType = 'course' | 'module';

/**
 * Génère une clé unique pour stocker les notes dans le localStorage.
 * @param entityType Le type d'entité (cours ou module).
 * @param entityId L'ID du cours.
 * @param moduleIndex L'index du module (optionnel, pour les notes de module).
 * @returns La clé unique pour le localStorage.
 */
export const generateNoteKey = (entityType: EntityType, entityId: string, moduleIndex?: number): string => {
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

// --- Fonctions pour la vue globale des notes ---

interface ParsedNoteKey {
  entityType: EntityType;
  entityId: string;
  moduleIndex?: number;
}

export interface AggregatedNote {
  key: string;
  context: string; // Ex: "Cours: Introduction à l'IA", "Module: Réseaux de Neurones (Cours: Introduction à l'IA)"
  notes: string[];
}

/**
 * Analyse une clé de note pour extraire le type d'entité, l'ID et l'index du module.
 */
const parseNoteKey = (key: string): ParsedNoteKey | null => {
  const parts = key.split('_');
  if (parts[0] !== 'notes' || parts.length < 3) {
    return null;
  }
  const entityType = parts[1] as EntityType;
  const entityId = parts[2];
  const moduleIndex = parts.length === 4 ? parseInt(parts[3], 10) : undefined;

  return { entityType, entityId, moduleIndex };
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

// Données fictives des cours (doit être cohérent avec CourseDetail.tsx et ModuleDetail.tsx)
// En production, ces données proviendraient d'un état global ou d'une API.
const dummyCourses = [
  {
    id: '1',
    title: "Introduction à l'IA",
    description: "Découvrez les fondements de l'intelligence artificielle, ses applications et son impact sur le monde moderne.",
    modules: [
      { title: "Module 1: Qu'est-ce que l'IA ?", content: "Définition, histoire et types d'IA.", isCompleted: true, level: 0 },
      { title: "Module 2: Apprentissage Automatique (Intro)", content: "Concepts de base du Machine Learning.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Apprentissage Supervisé", content: "Détails sur les modèles supervisés.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Apprentissage Non-Supervisé", content: "Détails sur les modèles non-supervisés.", isCompleted: false, level: 1 },
      { title: "Module 3: Réseaux de Neurones", content: "Introduction aux réseaux de neurones et au Deep Learning.", isCompleted: false, level: 0 },
      { title: "Module 4: Applications de l'IA", content: "Exemples concrets : vision par ordinateur, traitement du langage naturel.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Comprendre l'IA", "Maîtriser le ML", "Appliquer le Deep Learning", "Analyser les données"]
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      { title: "Module 1: Les bases de React", content: "Composants, JSX, props et état.", isCompleted: true, level: 0 },
      { title: "Module 2: Hooks et gestion d'état", content: "useState, useEffect, useContext et Reducers.", isCompleted: true, level: 0 },
      { title: "Module 3: Routage avec React Router", content: "Navigation entre les pages de votre application.", isCompleted: false, level: 0 },
      { title: "Module 4: Requêtes API et cycle de vie", content: "Fetching de données et gestion des effets secondaires.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Développer avec React", "Gérer l'état", "Naviguer avec React Router", "Intégrer des APIs"]
  },
  {
    id: '3',
    title: "Algorithmes Avancés",
    description: "Maîtrisez les structures de données complexes et les algorithmes efficaces pour résoudre des problèmes informatiques avancés.",
    modules: [
      { title: "Module 1: Structures de données avancées", content: "Arbres, graphes, tables de hachage.", isCompleted: false, level: 0 },
      { title: "Module 2: Algorithmes de tri et de recherche", content: "Quicksort, Mergesort, recherche binaire.", isCompleted: false, level: 0 },
      { title: "Module 3: Programmation dynamique", content: "Optimisation de problèmes complexes.", isCompleted: false, level: 0 },
      { title: "Module 4: Algorithmes de graphes", content: "Dijkstra, BFS, DFS.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Maîtriser les structures de données", "Optimiser les algorithmes", "Résoudre des problèmes complexes", "Analyser les graphes"]
  },
  {
    id: '4',
    title: "Développement Web Fullstack",
    description: "Apprenez à construire des applications web complètes, du frontend au backend, avec les technologies modernes.",
    modules: [
      { title: "Module 1: Introduction au Web", content: "Historique, HTML, CSS, JavaScript.", isCompleted: true, level: 0 },
      { title: "Module 2: Frontend avec React", content: "Composants, état, props.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Gestion des formulaires", content: "React Hook Form et validation.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Styles avec Tailwind CSS", content: "Utility-first CSS.", isCompleted: false, level: 1 },
      { title: "Module 3: Backend avec Node.js", content: "Express.js, API REST.", isCompleted: false, level: 0 },
      { title: "Module 3.1: Bases de données SQL", content: "PostgreSQL et ORM.", isCompleted: false, level: 1 },
      { title: "Module 3.2: Authentification", content: "JWT et sessions.", isCompleted: false, level: 1 },
      { title: "Module 4: Déploiement", content: "Hébergement et CI/CD.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Développer Frontend", "Développer Backend", "Gérer les bases de données", "Déployer des applications"]
  },
  {
    id: '5',
    title: "Fondamentaux de la Science des Données",
    description: "Explorez les concepts clés de la science des données, de la collecte à l'analyse et la visualisation.",
    modules: [
      { title: "Module 1: Introduction aux Données", content: "Qu'est-ce que la science des données, son importance.", isCompleted: true, level: 0 },
      { title: "Module 2: Collecte et Préparation des Données", content: "Sources de données, nettoyage, transformation.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Exploration des Données (EDA)", content: "Statistiques descriptives, visualisation.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Ingénierie des Caractéristiques", content: "Création de nouvelles variables.", isCompleted: false, level: 1 },
      { title: "Module 3: Modélisation Prédictive", content: "Introduction aux modèles, régression, classification.", isCompleted: false, level: 0 },
      { title: "Module 3.1: Évaluation des Modèles", content: "Métriques de performance, surapprentissage.", isCompleted: false, level: 1 },
      { title: "Module 4: Déploiement et Maintien", content: "Mise en production, monitoring.", isCompleted: false, level: 0 },
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