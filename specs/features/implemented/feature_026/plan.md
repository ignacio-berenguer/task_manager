# Implementation Plan — feature_026: Move Architecture Docs to specs/architecture/

## Step 1: Create directory and move files

1. Create `specs/architecture/` directory
2. `git mv specs/architecture_management.md specs/architecture/`
3. `git mv specs/architecture_backend.md specs/architecture/`
4. `git mv specs/architecture_frontend.md specs/architecture/`

## Step 2: Update CLAUDE.md

- Update directory tree to show `specs/architecture/` subfolder
- Update post-implementation instructions path reference
- Update development notes path reference

## Step 3: Update README.md

- Update directory tree to show `specs/architecture/` subfolder
- Update documentation table paths

## Step 4: Update create_feature skill template

- Update `.claude/skills/create_feature/SKILL.md` template to reference new paths

## Step 5: Verification

- `git status` confirms only expected files changed
- No broken references in active files

## File Changes

| Action | File |
|--------|------|
| MOVE | `specs/architecture_management.md` → `specs/architecture/` |
| MOVE | `specs/architecture_backend.md` → `specs/architecture/` |
| MOVE | `specs/architecture_frontend.md` → `specs/architecture/` |
| MODIFY | `CLAUDE.md` |
| MODIFY | `README.md` |
| MODIFY | `.claude/skills/create_feature/SKILL.md` |
