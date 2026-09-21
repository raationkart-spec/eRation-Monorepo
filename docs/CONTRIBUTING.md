# QuickCart — Contributor & Engineering Guide

> **Single Source of Truth**: This document details branch management rules, working-tree safety protocols, mandatory documentation maintenance policies, local build verification gates, and pull request standards.

---

## 1. Working-Tree Safety & Branch Management

### 🛡️ Dirty-Worktree Safety Protocol
> [!CAUTION]
> **Never Discard Unstaged Changes**:
> The QuickCart repository frequently contains pre-existing, uncommitted working-tree modifications (such as pending mobile auth adjustments, cancellation handlers, or layout refinements).
> - **Prohibited Commands**: Do NOT run `git checkout .`, `git restore .`, `git clean -fd`, or `git reset --hard` without explicit, written confirmation from the repository owner.
> - **Always Check Working-Tree Status**: Before beginning work, run:
>   ```bash
>   git status
>   git diff --stat
>   ```
> - **Isolation**: If work must be performed without interfering with uncommitted modifications, create a temporary stash or worktree:
>   ```bash
>   git stash push -m "WIP: Pre-existing uncommitted changes"
>   # ... perform work ...
>   git stash pop
>   ```

### Branching Conventions
- `feature/<ticket-or-feature-name>`: New consumer, admin, or API capabilities.
- `fix/<bug-description>`: Defect repairs and calculation patches.
- `docs/<doc-scope>`: Documentation updates, architectural guides, or specifications.
- `chore/<maintenance>`: Dependency upgrades, CI/CD pipeline tweaks, or asset optimizations.

---

## 2. Mandatory Documentation Maintenance Rule

> [!IMPORTANT]
> **The Documentation Maintenance Rule**:
> Any pull request or commit that modifies product features, data models, API endpoints, environment variables, or operational workflows **MUST update the relevant documentation files under `docs/` and append an entry to `docs/CHANGELOG.md` in the exact same change**.
>
> Changes submitted without accompanying documentation updates will be rejected during review.

### Documentation Mapping Matrix

| If You Change... | You MUST Update... |
| :--- | :--- |
| Prisma Schema (`prisma/schema.prisma`) | `docs/DATA_MODEL.md` & `docs/CHANGELOG.md` |
| REST API endpoints (`app/api/*`) | `docs/ARCHITECTURE.md` & `docs/SECURITY.md` & `docs/CHANGELOG.md` |
| Mobile app screens or native SDKs (`Mobile-app/`) | `docs/MOBILE_WEB_PARITY.md` & `docs/CHANGELOG.md` |
| Admin dashboard, forms, or order flows (`app/admin/*`) | `docs/ADMIN_GUIDE.md` & `docs/CHANGELOG.md` |
| Authentication, rate limiting, or file upload logic | `docs/SECURITY.md` & `docs/CHANGELOG.md` |
| Testing commands, scripts, or QA checklists | `docs/TESTING.md` & `docs/CHANGELOG.md` |
| POS Excel import or barcode handling | `docs/EXCEL_IMPORT_SPEC.md` & `docs/CHANGELOG.md` |

---

## 3. Local Build & Test Verification Gates

Before pushing changes or submitting a PR, execute and pass all verification gates:

### Gate 1: Web Application Verification
```bash
# 1. TypeScript Static Analysis (must exit with 0 errors)
npx tsc --noEmit

# 2. Next.js ESLint Check
npm run lint

# 3. Prisma Schema Integrity
npx prisma validate

# 4. Production Next.js Build
npm run build
```

### Gate 2: Mobile Application Verification
```bash
cd Mobile-app

# 1. Mobile TypeScript Analysis (must exit with 0 errors)
npm run lint    # runs tsc --noEmit

# 2. Expo Diagnostics
npx expo doctor
```

---

## 4. Secret & Environment Hygiene

1. **Zero Secret Policy**: Never commit real passwords, API secrets, private keys, database URLs, or OAuth secret keys to Git.
2. **Safe Placeholders**: When adding new environment variables, provide safe dummy placeholders in `.env.example` and document the variable in `docs/SECURITY.md`.
3. **Android Keystores & Credentials**: Keystores and Google services files must be managed via GitHub Secrets (`RELEASE_KEYSTORE_PASSWORD`, `GOOGLE_SERVICES_JSON_B64`) and decoded strictly during build time.

---

## 5. Pull Request (PR) Checklist

Every pull request must fulfill the following criteria:

- [ ] **Clean Branch**: Branch is branched off latest `main` with a descriptive name (`feature/*`, `fix/*`, `docs/*`).
- [ ] **Working-Tree Integrity**: No unintended files modified, deleted, or left unstaged.
- [ ] **Type Safety**: `npx tsc --noEmit` passes with 0 errors in both root and `Mobile-app`.
- [ ] **Linter**: `npm run lint` passes without errors.
- [ ] **Build Check**: `npm run build` compiles successfully.
- [ ] **Paise Currency Integrity**: All monetary values are strictly represented and calculated as integer paise (₹1 = 100 paise).
- [ ] **Signed Stock Integrity**: Inventory quantities must accommodate signed integers (negative stock represents shortage/oversold states and is never coerced to 0).
- [ ] **Docs Synchronized**: All relevant documentation files in `docs/` have been updated.
- [ ] **Changelog Updated**: An entry adhering to the Keep a Changelog standard has been added under `[Unreleased]` in `docs/CHANGELOG.md`.

---

## 6. Documentation Maintenance Rule

> [!IMPORTANT]
> **Documentation Maintenance Rule**:
> This contributing guide is a living document. Any changes to engineering workflows, verification scripts, branch policies, or PR requirements must be reflected in this file immediately.
