import { resetCourses, resetCurricula } from "./courseData";
import { resetStudents } from "./studentData";

export const clearAllAppData = () => {
  // Clear all notes (keys starting with 'notes_')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('notes_')) {
      localStorage.removeItem(key);
    }
  }

  // Call specific reset functions for each data type
  resetCourses();
  resetCurricula();
  resetStudents();
};