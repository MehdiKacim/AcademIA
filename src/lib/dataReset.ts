import { resetCourses, resetCurricula, resetEstablishments, resetClasses, resetSubjects, resetClassSubjects, resetProfessorSubjectAssignments } from "./courseData";
import { resetProfiles, resetStudentCourseProgress, resetStudentClassEnrollments } from "./studentData"; // Import resetStudentClassEnrollments
import { resetNotes } from "./notes";

export const clearAllAppData = async () => {
  -- Call specific reset functions for each data type using Supabase
  await resetNotes();
  await resetStudentCourseProgress();
  await resetStudentClassEnrollments(); // New: Reset student class enrollments
  await resetProfessorSubjectAssignments(); // New: Reset professor subject assignments
  await resetClassSubjects(); // New: Reset class subjects
  await resetCourses();
  await resetCurricula();
  await resetClasses();
  await resetSubjects(); // New: Reset subjects
  await resetProfiles(); // Reset profiles last, as other tables might reference it
};