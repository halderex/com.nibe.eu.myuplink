# Homey App Skill — Repo Publishing Prep

**Date:** 2026-03-10
**Status:** Approved

## Goal

Prepare the `dvflw/homey-app-skill` repository for public publishing to the Vercel Skills ecosystem and broader Agent Skills standard. Make it professional, welcoming to contributors, and easy to install.

## Context

- Repo contains `SKILL.md` (Homey app development skill, 288 lines) and `homey-app.skill` (compiled binary)
- No commits yet, remote at `https://github.com/dvflw/homey-app-skill.git`
- Target audience: both experienced Homey developers and newcomers using AI-assisted development
- Distribution: `npx skills add dvflw/homey-app-skill` (works across Claude Code, Cursor, Copilot, 30+ agents)

## Decisions

- **License:** MIT, copyright dvflw
- **Contributions:** Open — accept PRs for new patterns, fixes, improvements
- **Issue templates:** YAML form templates (bug report, feature request, improvement)
- **Code of Conduct:** Contributor Covenant v2.1, contact conduct@dvflw.co
- **No CI/CD, changelog, or PR templates** — unnecessary for a skill repo at this stage

## Files to Create

### README.md
- Title with badges (license, Agent Skills compatibility)
- One-liner description
- Install command front and center
- What it does (bullet list of capabilities)
- Compatibility list (Claude Code, Cursor, Copilot, etc.)
- Usage / trigger words
- What's inside overview
- Contributing link
- License section

### LICENSE
- Standard MIT, copyright 2026 dvflw

### CONTRIBUTING.md
- Welcome message
- Ways to contribute (issues, content improvements, new patterns, error fixes)
- PR workflow (fork, branch, edit, PR)
- Content guidelines (concise, accurate, cite official docs, match formatting)
- Review process

### CODE_OF_CONDUCT.md
- Contributor Covenant v2.1, unmodified
- Contact: conduct@dvflw.co

### .github/ISSUE_TEMPLATE/bug-report.yml
- Fields: agent used, incorrect guidance description, expected behavior, docs links
- Duplicate check checkbox

### .github/ISSUE_TEMPLATE/feature-request.yml
- Fields: topic/capability, use case, docs links, priority level
- Duplicate check checkbox

### .github/ISSUE_TEMPLATE/improvement.yml
- Fields: section reference, what's wrong, suggested improvement, docs links
- Duplicate check checkbox

### .github/ISSUE_TEMPLATE/config.yml
- Disables blank issues

### .gitignore
- OS files (.DS_Store, Thumbs.db)
- Editor files (.vscode/, .idea/, *.swp)
- Node.js basics (node_modules/, .env)
