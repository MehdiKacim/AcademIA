import { Course, Note } from "./dataModels"; // Import Course and Note interfaces
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { getActiveSchoolYear } from "./courseData"; // Import getActiveSchoolYear

/**
 * Génère une clé unique pour stocker les notes.
 * Cette clé sera utilisée comme 'note_key' dans la table Supabase 'notes'.
 * @param entityType Le type d'entité (cours, module ou section).
 * @param entityId L'ID du cours.
 * @param moduleIndex L'index du module (optionnel, pour les notes de module ou section).
 * @param sectionIndex L'index de la section (optionnel, pour les notes de section).
 * @returns La clé unique.
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
 * Récupère les notes pour une clé donnée et un utilisateur depuis Supabase.
 * @param userId L'ID de l'utilisateur actuel.
 * @param noteKey La clé des notes.
 * @returns Un tableau de chaînes de caractères représentant les notes.
 */
export const getNotes = async (userId: string, noteKey: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('content')
    .eq('user_id', userId)
    .eq('note_key', noteKey)
    .order('created_at', { ascending: true }); // Order to maintain consistency
  if (error) {
    // console.error("Erreur lors de la récupération des notes de Supabase:", error);
    return [];
  }
  return data.map(note => note.content);
};

/**
 * Ajoute une nouvelle note pour une clé donnée et un utilisateur dans Supabase.
 * @param userId L'ID de l'utilisateur actuel.
 * @param noteKey La clé des notes.
 * @param content Le contenu de la note à ajouter.
 * @returns Le tableau mis à jour des notes.
 */
export const addNote = async (userId: string, noteKey: string, content: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, note_key: noteKey, content: content })
    .select('content')
    .single(); // Select the content of the newly inserted note
  if (error) {
    // console.error("Erreur lors de l'ajout de la note à Supabase:", error);
    throw error;
  }
  // Re-fetch all notes for the key to ensure the list is up-to-date
  return getNotes(userId, noteKey);
};

/**
 * Met à jour une note existante pour une clé donnée et un utilisateur dans Supabase.
 * Note: Cette fonction est simplifiée. Dans un cas réel, vous auriez besoin d'un ID unique pour chaque note
 * ou d'une logique plus complexe pour identifier la note à mettre à jour si vous n'avez que l'index.
 * Pour l'instant, nous allons récupérer toutes les notes, modifier celle à l'index, puis la mettre à jour.
 * C'est moins efficace mais fonctionnel avec la structure actuelle.
 * @param userId L'ID de l'utilisateur actuel.
 * @param noteKey La clé des notes.
 * @param index L'index de la note à mettre à jour.
 * @param newContent Le nouveau contenu de la note.
 * @returns Le tableau mis à jour des notes.
 */
export const updateNote = async (userId: string, noteKey: string, index: number, newContent: string): Promise<string[]> => {
  const { data: existingNotesData, error: fetchError } = await supabase
    .from('notes')
    .select('id, content')
    .eq('user_id', userId)
    .eq('note_key', noteKey)
    .order('created_at', { ascending: true });

  if (fetchError) {
    // console.error("Erreur lors de la récupération des notes pour la mise à jour:", fetchError);
    throw fetchError;
  }

  if (index >= 0 && index < existingNotesData.length) {
    const noteToUpdateId = existingNotesData[index].id;
    const { error: updateError } = await supabase
      .from('notes')
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq('id', noteToUpdateId);

    if (updateError) {
      // console.error("Erreur lors de la mise à jour de la note dans Supabase:", updateError);
      throw updateError;
    }
  } else {
    // console.warn("Index de note invalide pour la mise à jour.");
  }
  return getNotes(userId, noteKey); // Re-fetch all notes to ensure consistency
};

/**
 * Supprime une note pour une clé donnée et un utilisateur dans Supabase.
 * Comme pour updateNote, cette fonction est simplifiée et supprime par index.
 * @param userId L'ID de l'utilisateur actuel.
 * @param noteKey La clé des notes.
 * @param index L'index de la note à supprimer.
 * @returns Le tableau mis à jour des notes.
 */
export const deleteNote = async (userId: string, noteKey: string, index: number): Promise<string[]> => {
  const { data: existingNotesData, error: fetchError } = await supabase
    .from('notes')
    .select('id')
    .eq('user_id', userId)
    .eq('note_key', noteKey)
    .order('created_at', { ascending: true });

  if (fetchError) {
    // console.error("Erreur lors de la récupération des notes pour la suppression:", fetchError);
    throw fetchError;
  }

  if (index >= 0 && index < existingNotesData.length) {
    const noteToDeleteId = existingNotesData[index].id;
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteToDeleteId);

    if (deleteError) {
      // console.error("Erreur lors de la suppression de la note de Supabase:", deleteError);
      throw deleteError;
    }
  } else {
    // console.warn("Index de note invalide pour la suppression.");
  }
  return getNotes(userId, noteKey); // Re-fetch all notes to ensure consistency
};

// --- Fonctions pour la vue globale des notes ---

interface ParsedNoteKey {
  entityType: EntityType;
  entityId: string;
  moduleIndex?: number;
  sectionIndex?: number;
}

export interface AggregatedNote {
  key: string;
  context: string;
  notes: string[];
}

type EntityType = 'course' | 'module' | 'section'; // Re-declare or import if not already globally available

/**
 * Analyse une clé de note pour extraire le type d'entité, l'ID et l'index du module/section.
 */
export const parseNoteKey = (key: string): ParsedNoteKey | null => {
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
 * Récupère toutes les clés de note pour un utilisateur depuis Supabase.
 */
export const getAllNoteKeys = async (userId: string): Promise<string[]> => {
  const { data, error } = await (supabase
    .from('notes')
    .select('note_key')
    .eq('user_id', userId) as any) // Cast to any to allow distinct
    .distinct('note_key'); 
  if (error) {
    // console.error("Erreur lors de la récupération de toutes les clés de note de Supabase:", error);
    return [];
  }
  return data.map(row => row.note_key);
};

/**
 * Retrieves all notes from Supabase for a given user and aggregates them with context.
 * @param userId The ID of the current user.
 * @param courses The list of all courses to resolve context titles.
 */
export const getAllNotesData = async (userId: string, courses: Course[]): Promise<AggregatedNote[]> => {
  const allKeys = await getAllNoteKeys(userId);
  const aggregatedNotes: AggregatedNote[] = [];

  for (const key of allKeys) {
    const parsedKey = parseNoteKey(key);
    if (parsedKey) {
      const notes = await getNotes(userId, key); // Fetch notes for each key
      if (notes.length > 0) {
        let context = '';
        const course = courses.find(c => c.id === parsedKey.entityId);

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
  }
  return aggregatedNotes;
};

// Reset function for notes (for development/testing)
export const resetNotes = async () => {
  const { error } = await supabase.from('notes').delete();
  if (error) {} // console.error("Error resetting notes:", error);
};