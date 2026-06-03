# Holistic Student Marketability — PRD

## Original Problem Statement
Migrate a full-stack web application from a mock `localStorage` implementation
to a live production environment using an **Oracle SQL database** connected via
**Netlify Serverless Functions**.

## Architecture
- **Frontend:** Static HTML/CSS/JavaScript (Bootstrap 5 dark theme)
- **Backend:** Netlify Serverless Functions (Node.js) using `oracledb` driver
- **Database:** Oracle SQL (10-table relational schema, unchanged)
- **Transformation Layer (Option B):** Server-side data translators between
  frontend format and Oracle schema constraints

## File Structure
```
/app/
├── index.html, about.html, admin.html, dashboard.html, logging.html
├── assets/
│   ├── app.js (global window.App, async)
│   ├── admin.js, dashboard.js, logging.js, index.js
│   └── styles.css
├── netlify/
│   ├── functions/
│   │   ├── _shared/{db.js, transformers.js}
│   │   ├── get-state.js
│   │   ├── manage-students.js
│   │   ├── manage-courses.js
│   │   ├── manage-learning-outcomes.js
│   │   ├── manage-enrollments.js
│   │   ├── manage-cocurriculum.js
│   │   └── package.json (oracledb)
└── netlify.toml
```

## Implementation Status — COMPLETED

### Backend (Netlify Functions)
- ✅ `get-state.js` — Universal data fetcher, returns full app state from Oracle
- ✅ `manage-students.js` — POST endpoint for student creation
- ✅ `manage-courses.js` — POST endpoint for course CRUD
- ✅ `manage-learning-outcomes.js` — POST/DELETE for LOs (auto-assigns default course_id)
- ✅ `manage-enrollments.js` — POST/DELETE for enrollments
- ✅ `manage-cocurriculum.js` — POST/DELETE for activities, mappings, participation
- ✅ `_shared/db.js` — Secure Oracle connection using `process.env.ORACLE_*`
- ✅ `_shared/transformers.js` — Option B translation layer

### Frontend (Static Pages)
- ✅ `index.html` — Landing with live DB connectivity check (no seed/reset)
- ✅ `admin.html` — Admin panel with **NEW Student Account form** + LO CRUD
- ✅ `dashboard.html` — Live radar chart + Marketability Index (handles empty state)
- ✅ `logging.html` — Staff & Student modules with async form handlers
- ✅ `about.html` — Project documentation page
- ✅ `assets/app.js` — Refactored async `App.get()` + entity managers
- ✅ All seed/reset/localStorage code completely removed

### Data Translation Rules (Option B) — IMPLEMENTED
| Field | Frontend | Oracle | Direction |
|-------|----------|--------|-----------|
| course_type | Core | Academic | both |
| enrollment status | In Progress | Active | both |
| knowledge_type | Hard/Soft/Professional | Academic Knowledge / Technical Skills / Marketability Values | both |
| skill_type | Cognitive / Soft Skill / Professional | same Oracle values | both |
| mapping_strength | 0.0–1.0 (number) | Low / Medium / High | both |
| achievement | 0.0–1.0 (number) | VARCHAR2 string | both |
| LO course_id | (not provided) | auto-assigned to "General" | toOracle only |
| is_credit_bearing | true/false | 1/0 | both |
| LO domain | Academic / Co-curricular | Knowledge / Skills / Values | both |

## Required Environment Variables (Netlify)
- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONN_STRING`

## Admin Credentials
- Username: `admin`
- Password: `admin123`
- Stored in `sessionStorage` (only auth uses session storage)

## User Personas
1. **Administrator** — Manages student accounts and learning outcomes
2. **Staff** — Adds courses, activities, and skill mappings
3. **Student** — Registers enrollments and co-curricular participation
4. **Viewer** — Browses the dashboard for Marketability Index visualization

## Core Requirements (Static)
- Live Oracle DB integration via Netlify Functions
- Zero localStorage usage for application data
- No seed/demo/reset functionality
- Graceful empty database handling
- Bootstrap UI styling preserved
- Server-side data transformation (Option B)
- Secure credentials via `process.env.*`

## Completed Tasks (Jun 2026)
- 2026-06-03: Initial migration from localStorage to Oracle/Netlify
- 2026-06-03: Created 6 Netlify serverless functions with transformer layer
- 2026-06-03: Refactored all 5 HTML pages and 5 JS files
- 2026-06-03: Added new "Add New Student Account" panel in admin
- 2026-06-03: Removed all seed/reset/localStorage references
- 2026-06-03: Verified UI renders correctly with empty database (screenshots)
- 2026-06-03: All JS files lint-clean
- 2026-06-03: **P1 Implementation**: Added Programs & Skills CRUD functions and admin UI
- 2026-06-03: **Analytics Dashboard**: Added admin analytics with tier distribution, top students leaderboard, avg MI by program
- 2026-06-03: **Packaged**: Created downloadable zip at `/app/ccs3402-marketability.zip` with QUICKSTART.md, .env.example, .gitignore

## Backlog / Future Enhancements
### P1
- Add CRUD for Programs (currently no UI to create programs)
- Add CRUD for Employability Skills (currently no UI to create skills)
- Add CRUD for SKILL_MAPPING (LO ↔ Skill mappings)

### P2
- Add bulk import (CSV) for students and courses
- Add search/filter on logging tables
- Add pagination for large datasets
- Add export to PDF for student dashboards

### P3
- Multi-admin support with role-based access control
- Audit log for all database mutations
- Real-time updates via WebSockets

## Next Action Items
- **User must set Netlify environment variables** before deployment:
  - `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONN_STRING`
- **User must deploy** to Netlify via GitHub integration
- Consider adding CRUD UIs for Programs and Employability Skills (currently no
  frontend way to create them — must be inserted directly into Oracle)
