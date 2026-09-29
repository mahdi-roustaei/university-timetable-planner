import { escapeHtml } from './text.js';

/**
 * Sidebar: Kurskarten rendern und Kurs-Termine in den Stundenplan übernehmen.
 */

/** Uni-Stundenplan-Blöcke (Blocknummer → Uhrzeiten laut Vorlesungsverzeichnis). */
const BLOCKS = {
    1: { start: '08:15', end: '09:45' },
    2: { start: '10:15', end: '11:45' },
    3: { start: '12:30', end: '14:00' },
    4: { start: '14:15', end: '15:45' },
    5: { start: '16:00', end: '17:30' },
    6: { start: '17:30', end: '19:00' },
};

/** Wochentag → CSS-Grid-Spalte (Spalte 1 = Uhrzeit). */
const TAG_TO_COL = {
    'Montag': 2, 'Dienstag': 3, 'Mittwoch': 4, 'Donnerstag': 5, 'Freitag': 6
};

const ACCENT_COLORS = ['ab-blue', 'ab-teal', 'ab-orange', 'ab-muted'];

export function renderCourses(kurse) {
    const sidebarList = document.querySelector('.sidebar-list');
    sidebarList.innerHTML = '';

    kurse.forEach(kurs => {
        const typen = [...new Set(kurs.termine.map(t => t.typ))];

        const tagsHtml = typen.map(typ => {
            let cssClass = 'tag-vl';
            if (typ === 'Übung')    cssClass = 'tag-ue';
            if (typ === 'Tutorium') cssClass = 'tag-sem';
            return `<span class="tag ${cssClass} tag-clickable" data-kurs-id="${escapeHtml(kurs.id)}" data-typ="${escapeHtml(typ)}">${escapeHtml(typ)}</span>`;
        }).join('');

        const accentColor = ACCENT_COLORS[kurs.id % ACCENT_COLORS.length];

        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-accent-bar ${accentColor}"></div>
            <div class="course-top">
                <span class="course-title">${escapeHtml(kurs.name)}</span>
                <span class="ects-badge">${escapeHtml(kurs.ects)} ECTS</span>
            </div>
            <div class="course-prof">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                ${escapeHtml(kurs.dozent)}
            </div>
            <div class="tag-row">${tagsHtml}</div>
            <p class="tag-hint">Auf Typ klicken zum Hinzufügen</p>
        `;

        sidebarList.appendChild(card);
    });

    document.querySelectorAll('.tag-clickable').forEach(tag => {
        tag.addEventListener('click', () => {
            const kursId = parseInt(tag.dataset.kursId);
            const typ    = tag.dataset.typ;
            const kurs   = kurse.find(k => k.id === kursId);
            if (!kurs) return;
            openTerminModal(kurs, typ);
        });
    });
}

/** Zeigt wählbare Termine eines Kurses, bevor er in den Plan übernommen wird. */
function openTerminModal(kurs, typ) {
    document.getElementById('termin-modal')?.remove();

    const termine = kurs.termine.filter(t => t.typ === typ);

    const itemsHtml = termine.map(t => {
        const block = BLOCKS[t.block];
        return `
            <div class="termin-item"
                 data-kurs-id="${escapeHtml(kurs.id)}"
                 data-typ="${escapeHtml(t.typ)}"
                 data-tag="${escapeHtml(t.tag)}"
                 data-block="${escapeHtml(t.block)}"
                 data-raum="${escapeHtml(t.raum)}">
                <div class="termin-item-left">
                    <span class="termin-tag">${escapeHtml(t.tag)}</span>
                    <span class="termin-time">${escapeHtml(block.start)} – ${escapeHtml(block.end)}</span>
                </div>
                <div class="termin-item-right">
                    <span class="termin-raum">📍 ${escapeHtml(t.raum)}</span>
                    <span class="termin-wiederholung">${escapeHtml(t.wiederholung)}</span>
                </div>
            </div>
        `;
    }).join('');

    const modal = document.createElement('div');
    modal.id = 'termin-modal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">${escapeHtml(kurs.name)}</h2>
                    <p class="modal-subtitle">${escapeHtml(typ)}e – Termin auswählen</p>
                </div>
                <button class="close-btn" id="termin-modal-close">&times;</button>
            </div>
            <div class="termin-list">${itemsHtml}</div>
            <p class="termin-hint">Klicke auf einen Termin, um ihn zum Stundenplan hinzuzufügen.</p>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('termin-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.termin-item').forEach(item => {
        item.addEventListener('click', () => {
            const block  = parseInt(item.dataset.block);
            const tag    = item.dataset.tag;
            const typ2   = item.dataset.typ;
            const raum   = item.dataset.raum;

            addTerminToCalendar(kurs, typ2, tag, block, raum);

            item.classList.add('selected');
            setTimeout(() => modal.remove(), 350);
        });
    });
}

function addTerminToCalendar(kurs, typ, tag, blockNr, raum) {
    const block = BLOCKS[blockNr];
    const col   = TAG_TO_COL[tag];
    if (!block || !col) return;

    let cssClass = 'event-vl';
    if (typ === 'Übung')    cssClass = 'event-ue';

    const event = {
        id:         `kurs_${kurs.id}_${typ}_${tag}_${blockNr}`,
        title:      kurs.name,
        typ:        typ,
        roomOrDesc: raum,
        startTime:  block.start,
        endTime:    block.end,
        days:       [col],
        cssClass: cssClass,
    };

    const myEvents = JSON.parse(localStorage.getItem('myEvents')) || [];

    const exists = myEvents.find(e => e.id === event.id);
    if (exists) return;

    myEvents.push(event);
    localStorage.setItem('myEvents', JSON.stringify(myEvents));

    document.dispatchEvent(new CustomEvent('re-render-events'));
}
