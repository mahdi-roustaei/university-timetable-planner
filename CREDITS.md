# Credits and provenance

## Project authors

Paria Nourikhah, Zhina Bagheri, Mohammad Reza Gholijani, and Mahdi Roustaei Chamkakaei.

University group project for Webtechnologien, summer semester 2026. The original README identifies the team repository as https://gitlab.gwdg.de/paria.nourikhah/uni-schedule-builder. Access to that repository has not been verified.

## Third-party software and fonts

| Component | Use | Upstream source / license reference |
| --- | --- | --- |
| Express 5.2.1 | HTTP server and static files | [Express license](https://github.com/expressjs/express/blob/5.2.1/LICENSE) |
| html2canvas 1.4.1 | Calendar rendering to canvas | [Versioned source and license](https://github.com/niklasvh/html2canvas/tree/v1.4.1) |
| jsPDF 4.2.1 | PDF generation | [Versioned source](https://github.com/parallax/jsPDF/tree/v4.2.1), [release](https://github.com/parallax/jsPDF/releases/tag/v4.2.1) |
| DM Sans | Interface font | [Google Fonts license](https://github.com/google/fonts/blob/main/ofl/dmsans/OFL.txt) |
| DM Mono | Time labels | [Google Fonts license](https://github.com/google/fonts/blob/main/ofl/dmmono/OFL.txt) |

Fonts and export libraries are loaded from their existing external services; their binaries are not bundled in this repository. npm dependencies and their license files are installed by `npm ci`; exact resolved versions are recorded in `package-lock.json`.

The source includes inline SVG interface icons. No separate image or audio asset bundle was present. `docs/screenshot.png` is a screenshot of this application using demo labels and example events.

## Portfolio preparation

- Preserved the original four-person author attribution.
- Excluded Git history, author email metadata, editor settings, and generated dependencies.
- Replaced course-instructor and room identifiers with visibly marked demonstration labels.
- Added English project documentation and a screenshot; refreshed package naming and ignore rules.
- Escaped dynamic text in the calendar and catalog views.
- Updated the npm lockfile to compatible patched transitive dependencies and the jsPDF CDN reference to 4.2.1.

## Project license status

The supplied `package.json` declares `ISC`, but the archive did not include the full project license text. That existing declaration is preserved. This document records provenance and does not grant new rights on behalf of the team. Third-party components retain their own license terms.
