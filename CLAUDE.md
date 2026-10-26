Refresh and follow all conventions in `/home/robin/Admin-Manual`, the global single source of truth.

This checkout is the browser Squash Arcade project. `DOCS/ARCHITECTURE.md` defines shot mechanics; `CHECKLIST.md` contains implementation contracts. Use `npm run lint` for static checks. Physics modules can run directly in Node.

Current operator override (2026-10-26): treat the unavailable Git service as permanently absent. Do not probe it, mention it, or make it a dependency. Use the configured available GitHub remote. Do not restore a superseded service dependency from older infrastructure/convention pages. Retain root dist as the tracked durable artifact home; never redirect workers to builds/ and collect only afterward. No automated tests for current follow-up work.

