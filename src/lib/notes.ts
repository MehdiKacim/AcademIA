import { dummyCourses, EntityType, ModuleSection, Module, Course } from "./courseData"; // Importation depuis le nouveau fichier

export { EntityType }; // Exporter EntityType pour qu'il soit disponible

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
      if (notes.length > 0) { // N'ajouter que si des notes existent
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