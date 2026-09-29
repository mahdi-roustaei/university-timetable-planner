/**
 * Live-Suche in der Kurs-Sidebar (filtert nach Kursname).
 */
import { renderCourses } from './sidebar.js';

let kurse = [];

const searchInput = document.querySelector(".sidebar-filter input");

async function loadCoursesForSearch() {
  try {
    const response = await fetch("/api/kurse");
    kurse = await response.json();
  } catch (error) {
    console.error("Fehler beim Laden der Kurse:", error);
  }
}

/**
 * Filtert Kurse nach Präfix – schneller als Volltextsuche und passend zur Autovervollständigung.
 */
function searchCourses(searchText) {
  const value = searchText.toLowerCase().trim();

  if (value === "") {
    renderCourses(kurse);
    return;
  }

  const filteredCourses = kurse.filter((kurs) =>
    kurs.name.toLowerCase().startsWith(value),
  );

  renderCourses(filteredCourses);
}

/** Startet die Suche bei jeder Eingabe im Suchfeld. */
export async function search() {
  await loadCoursesForSearch();

  searchInput.addEventListener("input", (event) => {
    searchCourses(event.target.value);
  });
}
