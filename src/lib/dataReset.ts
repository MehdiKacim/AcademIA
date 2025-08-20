export const clearAllAppData = () => {
  const keysToClear = [
    'academia_courses',
    'academia_curricula',
    'academia_establishments',
    'academia_classes',
    'academia_students',
  ];

  keysToClear.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear all notes (keys starting with 'notes_')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('notes_')) {
      localStorage.removeItem(key);
    }
  }
};