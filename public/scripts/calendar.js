import { escapeHtml } from './text.js';

/**
 * Stundenplan-Kalender: eigene Termine, Darstellung und Überlappungslogik.
 * Persistenz über localStorage (Schlüssel: myEvents).
 */

const GRID_START_MIN = 8 * 60;
const GRID_END_MIN = 24 * 60;
/** 15-Minuten-Raster: exakte Höhe statt voller 2-Stunden-Blöcke. */
const GRID_STEP_MIN = 15;
/** Zeile 1 = Header, ab Zeile 2 beginnt der Tagesbereich. */
const FIRST_SLOT_ROW = 2;

let currentEditId = null;

function parseTimeMinutes(timeStr) {
  if (!timeStr) return GRID_START_MIN;
  const [h, m] = timeStr.split(":").map(Number);
  if (h === 0 && m === 0) return GRID_END_MIN;
  return h * 60 + m;
}

function timeToRow(timeStr) {
  const mins = Math.max(
    GRID_START_MIN,
    Math.min(parseTimeMinutes(timeStr), GRID_END_MIN),
  );
  return Math.floor((mins - GRID_START_MIN) / GRID_STEP_MIN) + FIRST_SLOT_ROW;
}

function timeToRowEnd(timeStr) {
  const mins = Math.max(
    GRID_START_MIN + GRID_STEP_MIN,
    Math.min(parseTimeMinutes(timeStr), GRID_END_MIN),
  );
  const endRow = Math.ceil((mins - GRID_START_MIN) / GRID_STEP_MIN) + FIRST_SLOT_ROW;
  return Math.max(timeToRow(timeStr) + 1, endRow);
}

function eventDurationMinutes(event) {
  return parseTimeMinutes(event.endTime) - parseTimeMinutes(event.startTime);
}

function isCustomEvent(event) {
  return event.isCustom === true || event.typ === "custom";
}

function resolveTypeClass(event) {
  if (event.cssClass) return event.cssClass;
  if (event.typ === "Vorlesung") return "event-vl";
  if (event.typ === "Übung") return "event-ue";
  if (event.typ === "Tutorium") return "event-tut";
  return "event-vl";
}

/** Modal für eigene Termine: anlegen, bearbeiten, löschen. */
export function setupCalendarModal() {
  const btnOpenTask = document.getElementById("btn-open-task");
  const btnCloseTask = document.getElementById("btn-close-task");
  const btnCancelTask = document.getElementById("btn-cancel-task");
  const btnDeleteTask = document.getElementById("btn-delete-task");
  const modalOverlay = document.getElementById("task-modal");
  const form = document.getElementById("custom-task-form");

  if (btnOpenTask) {
    btnOpenTask.addEventListener("click", () => {
      currentEditId = null;
      form?.reset();
      if (btnDeleteTask) btnDeleteTask.style.display = "none";
      modalOverlay?.classList.add("active");
    });
  }

  const closeModal = () => modalOverlay?.classList.remove("active");
  if (btnCloseTask) btnCloseTask.addEventListener("click", closeModal);
  if (btnCancelTask) btnCancelTask.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  if (btnDeleteTask) {
    btnDeleteTask.addEventListener("click", () => {
      if (currentEditId) {
        removeEvent(currentEditId);
        closeModal();
      }
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const title = document.getElementById("title").value;
      const desc = document.getElementById("description").value;
      const start = document.getElementById("start").value;
      const end = document.getElementById("end").value;
      const colorType =
        document.getElementById("color-select-input")?.value ||
        "event-custom-green";

      const checkboxes = document.querySelectorAll(
        '.days-grid input[type="checkbox"]',
      );
      const selectedColumns = [];
      checkboxes.forEach((box, i) => {
        if (box.checked) selectedColumns.push(i + 2); // +2: Grid-Spalte 1 = Uhrzeit
      });

      const newEvent = {
        id: currentEditId || Date.now(),
        title,
        typ: "custom",
        roomOrDesc: desc,
        startTime: start,
        endTime: end,
        days: selectedColumns,
        cssClass: colorType,
        isCustom: true,
      };

      let myEvents = JSON.parse(localStorage.getItem("myEvents")) || [];

      if (currentEditId) {
        const index = myEvents.findIndex(
          (ev) => String(ev.id) === String(currentEditId),
        );
        if (index > -1) myEvents[index] = newEvent;
      } else {
        myEvents.push(newEvent);
      }

      localStorage.setItem("myEvents", JSON.stringify(myEvents));
      renderEvents();
      closeModal();
      form.reset();
      currentEditId = null;
      if (btnDeleteTask) btnDeleteTask.style.display = "none";
    });
  }

  document.addEventListener("re-render-events", () => renderEvents());
}

function openEditModal(eventData) {
  if (!isCustomEvent(eventData)) return;

  currentEditId = eventData.id;

  document.getElementById("title").value = eventData.title;
  document.getElementById("description").value = eventData.roomOrDesc || "";
  document.getElementById("start").value = eventData.startTime;
  document.getElementById("end").value = eventData.endTime;
  document.getElementById("color-select-input").value =
    eventData.cssClass || "event-custom-green";

  const checkboxes = document.querySelectorAll(
    '.days-grid input[type="checkbox"]',
  );
  checkboxes.forEach((box, index) => {
    box.checked = eventData.days.includes(index + 2);
  });

  document.getElementById("btn-delete-task").style.display = "block";
  document.getElementById("task-modal").classList.add("active");
}

export function renderEvents() {
  const grid = document.querySelector(".schedule-grid");
  if (!grid) return;

  document
    .querySelectorAll(".schedule-item.dynamic")
    .forEach((el) => el.remove());

  const myEvents = JSON.parse(localStorage.getItem("myEvents")) || [];

  let eventInstances = [];
  myEvents.forEach((event) => {
    const startRow = timeToRow(event.startTime);
    const endRow = timeToRowEnd(event.endTime);
    const safeEnd = endRow > startRow ? endRow : startRow + 1;
    event.days.forEach((col) => {
      eventInstances.push({ ...event, startRow, endRow: safeEnd, col });
    });
  });

  for (let col = 2; col <= 6; col++) {
    let colEvents = eventInstances.filter((e) => e.col === col);
    colEvents.sort((a, b) => a.startRow - b.startRow);

    // Überlappende Termine werden gruppiert und nebeneinander platziert
    let groups = [];
    let currentGroup = [];
    let groupEndRow = -1;

    colEvents.forEach((ev) => {
      if (ev.startRow >= groupEndRow && currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push(ev);
      groupEndRow = Math.max(groupEndRow, ev.endRow);
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    groups.forEach((group) => {
      let columns = [];
      group.forEach((ev) => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          let overlap = columns[i].some(
            (other) => ev.startRow < other.endRow && ev.endRow > other.startRow,
          );
          if (!overlap) {
            columns[i].push(ev);
            ev.overlapIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([ev]);
          ev.overlapIndex = columns.length - 1;
        }
      });

      const maxConcurrent = columns.length;

      group.forEach((ev) => {
        const block = document.createElement("div");
        const duration = eventDurationMinutes(ev);
        const isCompact = duration > 0 && duration < 120; // unter 2 h: kompakte Darstellung

        block.className = `schedule-item dynamic ${resolveTypeClass(ev)}${isCompact ? " schedule-item--compact" : ""}`;

        block.style.gridArea = `${ev.startRow} / ${ev.col} / ${ev.endRow} / ${ev.col + 1}`;
        block.style.alignSelf = "stretch";
        block.style.justifySelf = "start";
        block.style.width = `calc(${100 / maxConcurrent}% - 8px)`;
        block.style.margin = "2px 4px";
        block.style.marginLeft = `calc(${(100 / maxConcurrent) * ev.overlapIndex}% + 4px)`;
        block.style.zIndex = ev.overlapIndex + 10;

        const typLabel =
          !isCustomEvent(ev) && !isCompact
            ? `<span class="event-typ-label">${escapeHtml(ev.typ)}</span>`
            : "";

        if (isCompact) {
          block.innerHTML = `
                    <strong>${escapeHtml(ev.title)}</strong>
                    <span class="event-time">${escapeHtml(ev.startTime)} – ${escapeHtml(ev.endTime)}</span>
                `;
        } else {
          block.innerHTML = `
                    <strong>${escapeHtml(ev.title)}</strong>
                    ${typLabel}
                    <span class="event-room">${escapeHtml(ev.roomOrDesc || "")}</span>
                    <span class="event-time">${escapeHtml(ev.startTime)} – ${escapeHtml(ev.endTime)}</span>
                `;
        }

        if (isCustomEvent(ev)) {
          block.style.cursor = "pointer";
          block.addEventListener("click", (e) => {
            e.stopPropagation();
            openEditModal(ev);
          });
        } else {
          block.addEventListener("click", (e) => {
            e.stopPropagation();
            showEventDetail(ev, block);
          });
        }

        block.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          removeEvent(ev.id);
        });

        grid.appendChild(block);
      });
    });
  }
}

/** Detail-Popup für Kurs-Termine */
function showEventDetail(event, anchor) {
  document.querySelector(".event-detail-popup")?.remove();

  const popup = document.createElement("div");
  popup.className = "event-detail-popup";

  const headerClass = resolveTypeClass(event);

  popup.innerHTML = `
        <div class="edp-header ${escapeHtml(headerClass)}">
            <span class="edp-typ">${escapeHtml(event.typ ?? "Termin")}</span>
            <button class="edp-close">&times;</button>
        </div>
        <div class="edp-body">
            <h3>${escapeHtml(event.title)}</h3>
            <p>🕐 ${escapeHtml(event.startTime)} – ${escapeHtml(event.endTime)}</p>
            ${event.roomOrDesc ? `<p>📍 ${escapeHtml(event.roomOrDesc)}</p>` : ""}
            <button class="edp-remove">Aus Stundenplan entfernen</button>
        </div>
    `;

  document.body.appendChild(popup);

  const rect = anchor.getBoundingClientRect();
  const popupH = popup.offsetHeight;
  const popupW = popup.offsetWidth;
  let top = rect.top + window.scrollY;
  let left = rect.right + window.scrollX + 8;

  if (rect.top + popupH > window.innerHeight)
    top = rect.bottom + window.scrollY - popupH;
  if (rect.right + popupW > window.innerWidth)
    left = rect.left + window.scrollX - popupW - 8;

  popup.style.top = `${Math.max(0, top)}px`;
  popup.style.left = `${Math.max(0, left)}px`;

  popup
    .querySelector(".edp-close")
    .addEventListener("click", () => popup.remove());
  popup.querySelector(".edp-remove").addEventListener("click", () => {
    removeEvent(event.id);
    popup.remove();
  });

  setTimeout(() => {
    const handler = (e) => {
      if (!popup.contains(e.target) && !anchor.contains(e.target)) {
        popup.remove();
        document.removeEventListener("click", handler);
      }
    };
    document.addEventListener("click", handler);
  }, 10);
}

function removeEvent(id) {
  let myEvents = JSON.parse(localStorage.getItem("myEvents")) || [];
  myEvents = myEvents.filter((e) => String(e.id) !== String(id));
  localStorage.setItem("myEvents", JSON.stringify(myEvents));
  renderEvents();
}
