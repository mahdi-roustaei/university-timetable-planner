/**
 * Studiengang-Filter: schränkt die Sidebar-Kurse per Modal ein.
 */
import { renderCourses } from "./sidebar.js";

/** Lokale Kopie, damit Filter ohne erneuten API-Call arbeiten kann. */
let courses = [];

const filterModal = document.querySelector("#filter-modal");
const filterButton = document.querySelector("#filter-btn");
const closeFilterButton = document.querySelector("#close-filter");
const applyFilterButton = document.querySelector("#apply-filter");
const resetFilterButton = document.querySelector("#reset-filter");

async function loadCourses() {
  try {
    const response = await fetch("/api/kurse");
    courses = await response.json();
  } catch (error) {
    console.error("Fehler beim Laden der Kurse:", error);
  }
}

function openFilter() {
  filterModal?.classList.add("active");
}

function closeFilter() {
  filterModal?.classList.remove("active");
}

function getSelectedFilters() {
  return [...document.querySelectorAll("#filter-modal input:checked")].map(
    (input) => input.value,
  );
}

function applyFilters() {
  const selectedFilters = getSelectedFilters();

  if (selectedFilters.length === 0) {
    renderCourses(courses);
  } else {
    const filteredCourses = courses.filter((course) =>
      selectedFilters.some((filter) => course.studiengang.includes(filter)),
    );
    renderCourses(filteredCourses);
  }

  closeFilter();
}

function resetFilters() {
  document
    .querySelectorAll('#filter-modal input[type="checkbox"]')
    .forEach((input) => {
      input.checked = false;
    });
  renderCourses(courses);
  closeFilter();
}

/** Registriert Event-Listener für das Filter-Modal. */
export async function filter() {
  await loadCourses();

  filterButton?.addEventListener("click", openFilter);
  closeFilterButton?.addEventListener("click", closeFilter);
  applyFilterButton?.addEventListener("click", applyFilters);
  resetFilterButton?.addEventListener("click", resetFilters);

  filterModal?.addEventListener("click", (e) => {
    if (e.target === filterModal) closeFilter();
  });
}
