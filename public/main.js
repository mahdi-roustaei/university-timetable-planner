/**
 * Einstiegspunkt der Anwendung: lädt Kurse und initialisiert alle UI-Module.
 */
import { loadCourses } from './scripts/api.js';
import { renderCourses } from './scripts/sidebar.js';
import { setupCalendarModal, renderEvents } from './scripts/calendar.js';
import { initExport } from './scripts/export.js';
import { search } from './scripts/search.js';
import { filter } from './scripts/filter.js';

document.addEventListener('DOMContentLoaded', async () => {
    const kurse = await loadCourses();

    if (kurse && kurse.length > 0) {
        renderCourses(kurse);
    } else {
        document.querySelector('.sidebar-list').innerHTML =
            '<p style="padding: 1rem;">Keine Kurse verfügbar.</p>';
    }

    setupCalendarModal();
    renderEvents();
    initExport();
    search();
    filter();
});
