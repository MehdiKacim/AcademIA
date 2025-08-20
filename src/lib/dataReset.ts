import { resetCourses, resetCurricula, resetEstablishments, resetClasses } from "./courseData";
import { resetProfiles, resetStudentCourseProgress } from "./studentData";
import { resetNotes } from "./notes";

export const clearAllAppData = async () => {
  // Call specific reset functions for each data type using Supabase
  await resetNotes();
  await resetStudentCourseProgress();
  await resetCourses();
  await resetCurricula();
  await resetEstablishments();
  await resetClasses();
  await resetProfiles(); // Reset profiles last, as other tables might reference it
};