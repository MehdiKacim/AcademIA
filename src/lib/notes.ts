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