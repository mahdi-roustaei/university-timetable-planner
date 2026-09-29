/**
 * Zentrale Datenzugriffsschicht für Kursdaten vom Server.
 */

/**
 * Lädt alle Kurse vom Backend.
 * @returns {Promise<Array>} Kursliste oder leeres Array bei Fehler (UI bleibt nutzbar).
 */
export async function loadCourses() {
    try {
        const response = await fetch('/api/kurse');
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Laden der Kurse:', error);
        return [];
    }
}
