# Technical Specification — feature_026: Move Architecture Docs to specs/architecture/

## 1. Overview

Move the three architecture documents from `specs/` to a dedicated `specs/architecture/` subfolder for better project organization. Update all active references throughout the codebase.

**Scope:** Documentation/project structure only. No code changes.

## 2. Files to Move

| Current Path | New Path |
|-------------|----------|
| `specs/architecture_management.md` | `specs/architecture/architecture_management.md` |
| `specs/architecture_backend.md` | `specs/architecture/architecture_backend.md` |
| `specs/architecture_frontend.md` | `specs/architecture/architecture_frontend.md` |

All moves use `git mv` to preserve history.

## 3. References to Update

Only **active files** (not historical implemented feature docs) need updating:

| File | References |
|------|-----------|
| `CLAUDE.md` | Directory tree (lines 128-130), post-implementation instructions (line 336), development notes (line 345) |
| `README.md` | Directory tree (lines 113-115), documentation table (lines 452-454) |
| `.claude/skills/create_feature/SKILL.md` | Template general requirements (2 occurrences of `specs/architecture_backend.md` and `specs/architecture_frontend.md`) |

**Implemented feature docs** (`specs/features/implemented/feature_*/`) contain historical references and will NOT be modified — they document what was true at the time of implementation.

## 4. Constraints

- Use `git mv` for all file moves
- No functional code changes
- Historical feature documentation left as-is
