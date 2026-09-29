/**
 * Export des Stundenplans als PDF oder JPG (Screenshot via html2canvas).
 */

export function initExport() {
    const btn = document.querySelector('.btn-sm-outline');
    if (!btn) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;display:inline-block;';
    btn.parentNode.insertBefore(wrapper, btn);
    wrapper.appendChild(btn);

    const dropdown = document.createElement('div');
    dropdown.innerHTML = `
    <button data-type="pdf">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Als PDF speichern
    </button>
    <button data-type="jpg">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      Als JPG speichern
    </button>
  `;
    dropdown.style.cssText = `
    display:none;position:absolute;right:0;top:calc(100% + 6px);
    background:#fff;border:1px solid rgba(76,86,106,0.18);
    border-radius:9px;box-shadow:0 8px 24px rgba(46,52,64,0.14);
    overflow:hidden;z-index:999;min-width:190px;
  `;
    [...dropdown.querySelectorAll('button')].forEach(b => {
        b.style.cssText = `
      display:flex;align-items:center;gap:0.5rem;width:100%;
      padding:0.65rem 1rem;border:none;background:transparent;
      font-family:'DM Sans',sans-serif;font-size:0.83rem;
      color:#2E3440;cursor:pointer;text-align:left;
    `;
        b.onmouseenter = () => b.style.background = '#ECEFF4';
        b.onmouseleave = () => b.style.background = 'transparent';
    });
    wrapper.appendChild(dropdown);

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => { dropdown.style.display = 'none'; });

    dropdown.addEventListener('click', async (e) => {
        const type = e.target.closest('button')?.dataset.type;
        if (!type) return;
        dropdown.style.display = 'none';
        if (type === 'pdf') await exportAsPDF();
        if (type === 'jpg') await exportAsJPG();
    });
}

/**
 * Erstellt ein Canvas vom sichtbaren Kalender.
 * Overflow wird kurz aufgehoben, damit auch abgeschnittene Zeilen im Export landen.
 */
async function captureFullGrid() {
    if (!window.html2canvas) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }

    const target = document.querySelector('.schedule-shell') || document.querySelector('.calendar-wrapper') || document.querySelector('.main-area');

    const wrapper = document.querySelector('.calendar-wrapper');
    const prevOverflow = wrapper ? wrapper.style.overflow : null;
    const prevHeight   = wrapper ? wrapper.style.height   : null;
    const prevMaxH     = wrapper ? wrapper.style.maxHeight : null;

    if (wrapper) {
        wrapper.style.overflow  = 'visible';
        wrapper.style.height    = 'auto';
        wrapper.style.maxHeight = 'none';
    }

    await new Promise(r => setTimeout(r, 50));

    const canvas = await window.html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        scrollY: -window.scrollY,
        windowHeight: target.scrollHeight + 100,
    });

    if (wrapper) {
        wrapper.style.overflow  = prevOverflow  ?? '';
        wrapper.style.height    = prevHeight    ?? '';
        wrapper.style.maxHeight = prevMaxH      ?? '';
    }

    return canvas;
}

async function exportAsPDF() {
    const toast = showToast('PDF wird erstellt…');
    try {
        if (!window.html2canvas) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
        if (!window.jspdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js');
        }

        const canvas = await captureFullGrid();

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();

        const imgW = canvas.width;
        const imgH = canvas.height;
        const ratio = Math.min(pageW / imgW, pageH / imgH);
        const drawW = imgW * ratio;
        const drawH = imgH * ratio;
        const offsetX = (pageW - drawW) / 2;
        const offsetY = (pageH - drawH) / 2;

        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);
        pdf.save(`stundenplan_${timestamp()}.pdf`);

        toast.setText('✓ PDF gespeichert!');
        setTimeout(() => toast.remove(), 2000);
    } catch (err) {
        console.error(err);
        toast.setText('Fehler beim Erstellen der PDF.');
        setTimeout(() => toast.remove(), 3000);
    }
}

async function exportAsJPG() {
    const toast = showToast('Bild wird erstellt…');
    try {
        const canvas = await captureFullGrid();

        const link = document.createElement('a');
        link.download = `stundenplan_${timestamp()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();

        toast.setText('✓ Gespeichert!');
        setTimeout(() => toast.remove(), 2000);
    } catch (err) {
        console.error(err);
        toast.setText('Fehler beim Erstellen des Bildes.');
        setTimeout(() => toast.remove(), 3000);
    }
}

/** Lädt externe Bibliotheken nur bei Bedarf (kleinere initiale Ladezeit). */
function loadScript(src) {
    return new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
    });
}

function timestamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function showToast(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
    position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
    background:#2E3440;color:#fff;padding:0.7rem 1.2rem;
    border-radius:9px;font-family:'DM Sans',sans-serif;font-size:0.85rem;
    box-shadow:0 4px 16px rgba(46,52,64,0.25);transition:opacity .3s;
  `;
    document.body.appendChild(el);
    return {
        setText(t) { el.textContent = t; },
        remove() { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
    };
}
