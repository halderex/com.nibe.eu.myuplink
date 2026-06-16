# Repo Publishing Prep Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the homey-app-skill repo for professional public publishing with README, license, contribution guidelines, issue templates, and community standards.

**Architecture:** Create 9 new files — community/legal files at root, issue templates under `.github/ISSUE_TEMPLATE/`. No existing files are modified.

**Tech Stack:** Markdown, YAML (GitHub issue form templates)

---

## Chunk 1: Initial Commit & Foundation

### Task 1: Commit existing skill files

This must be the first commit so the skill content is the foundation of the repo history.

**Files:**
- Existing: `SKILL.md`
- Existing: `homey-app.skill`

- [ ] **Step 1: Stage and commit SKILL.md and homey-app.skill**

```bash
git add SKILL.md homey-app.skill
git commit -m "feat: add homey-app skill for Homey smart home platform"
```

### Task 2: Create .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Node.js
node_modules/
.env
.env.local
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

### Task 3: Create LICENSE

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Create MIT license file**

```
MIT License

Copyright (c) 2026 dvflw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Commit**

```bash
git add LICENSE
git commit -m "chore: add MIT license"
```

### Task 4: Create CODE_OF_CONDUCT.md

**Files:**
- Create: `CODE_OF_CONDUCT.md`

- [ ] **Step 1: Create Contributor Covenant v2.1**

Fetch the canonical text from https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md and save as `CODE_OF_CONDUCT.md`. Replace the `[INSERT CONTACT METHOD]` placeholder with `conduct@dvflw.co`.

- [ ] **Step 2: Commit**

```bash
git add CODE_OF_CONDUCT.md
git commit -m "chore: add Contributor Covenant code of conduct"
```

## Chunk 2: Contributing Guide & README

### Task 5: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Create contributing guide**

```markdown
# Contributing to homey-app-skill

Thanks for your interest in improving this skill! Whether you're fixing an error, adding new patterns, or suggesting improvements, your contributions help the entire Homey developer community.

## Ways to Contribute

- **Report issues** — found incorrect guidance? [Open a bug report](https://github.com/dvflw/homey-app-skill/issues/new?template=bug-report.yml)
- **Request features** — want the skill to cover a new topic? [Submit a feature request](https://github.com/dvflw/homey-app-skill/issues/new?template=feature-request.yml)
- **Suggest improvements** — know a better way to explain something? [Propose an improvement](https://github.com/dvflw/homey-app-skill/issues/new?template=improvement.yml)
- **Submit a PR** — fix errors, add patterns, improve examples

## Submitting Changes

1. Fork the repository
2. Create a branch (`git checkout -b my-improvement`)
3. Make your changes
4. Commit with a clear message (`git commit -m "fix: correct driver pairing example"`)
5. Push to your fork (`git push origin my-improvement`)
6. Open a Pull Request

Keep PRs focused on a single change. Smaller PRs are easier to review and merge faster.

## Content Guidelines

- Keep instructions concise and actionable
- Test guidance against actual Homey SDK v3 behavior
- Cite [official Homey documentation](https://apps.developer.homey.app/) where possible
- Follow existing formatting patterns in SKILL.md
- Use code examples that actually work
- Maintain compatibility with the [Agent Skills](https://agentskills.io) standard

## Review Process

A maintainer will review your PR for accuracy and style. We may request changes or suggest edits. We aim for quick turnaround on reviews.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add contributing guide"
```

### Task 6: Create README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

```markdown
# homey-app-skill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-compatible-blue)](https://agentskills.io)

An AI skill that helps you build apps for the Homey smart home platform.

## Install

```sh
npx skills add dvflw/homey-app-skill
```

## What It Does

This skill gives your AI agent deep knowledge of Homey app development:

- Scaffolds new Homey apps with the correct project structure
- Creates drivers, devices, and capabilities
- Generates Flow cards (triggers, conditions, actions)
- Handles Homey Compose build system configuration
- Enforces Homey Apps SDK v3 best practices and critical rules
- Guides widget development with frontend and API patterns
- Covers differences between Homey Pro and Homey Cloud

## Compatibility

Works with any agent that supports the [Agent Skills](https://agentskills.io) standard:

- Claude Code
- Cursor
- GitHub Copilot
- Gemini CLI
- Goose
- Roo Code
- And [many more](https://agentskills.io)

## Usage

The skill activates automatically when you mention Homey-related topics in your prompts. Try things like:

- "Create a new Homey app for controlling my LED strip"
- "Add a driver for a Zigbee temperature sensor"
- "Set up Flow cards for my custom device"
- "What's the difference between Homey Pro and Cloud for app development?"

## What's Inside

The skill covers the full Homey app development lifecycle:

- **SDK v3 patterns** — App, Driver, and Device class usage
- **Homey CLI** — commands for creating, running, and publishing apps
- **Project structure** — Homey Compose directory layout and conventions
- **Scaffolding templates** — minimal working examples for all core classes
- **Critical rules** — common pitfalls and how to avoid them
- **Cloud considerations** — multi-tenancy, Docker, and API differences
- **Common patterns** — polling, capabilities, Flow triggers, discovery

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
```

Note: The inner code fence for the install command should use `sh` language tag and be properly nested. The implementing agent should handle markdown escaping correctly.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

## Chunk 3: GitHub Issue Templates

### Task 7: Create bug report issue template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug-report.yml`

- [ ] **Step 1: Create bug report template**

```yaml
name: Bug Report
description: The skill gave incorrect or harmful guidance
title: "[Bug]: "
labels: ["bug"]
body:
  - type: checkboxes
    id: duplicate-check
    attributes:
      label: Pre-submission checklist
      options:
        - label: I've searched existing issues and this hasn't been reported
          required: true
  - type: dropdown
    id: agent
    attributes:
      label: AI Agent
      description: Which AI agent were you using?
      options:
        - Claude Code
        - Cursor
        - GitHub Copilot
        - Gemini CLI
        - Goose
        - Roo Code
        - Other
    validations:
      required: true
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: What incorrect guidance did the skill provide?
      placeholder: "The skill suggested using X, but..."
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: What should it say instead?
      description: What is the correct guidance?
    validations:
      required: true
  - type: textarea
    id: docs
    attributes:
      label: Relevant Homey documentation
      description: Links to official docs that support the correction
      placeholder: "https://apps.developer.homey.app/..."
```

- [ ] **Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/bug-report.yml
git commit -m "chore: add bug report issue template"
```

### Task 8: Create feature request issue template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/feature-request.yml`

- [ ] **Step 1: Create feature request template**

```yaml
name: Feature Request
description: Suggest a topic or capability the skill should cover
title: "[Feature]: "
labels: ["enhancement"]
body:
  - type: checkboxes
    id: duplicate-check
    attributes:
      label: Pre-submission checklist
      options:
        - label: I've searched existing issues and this hasn't been requested
          required: true
  - type: textarea
    id: topic
    attributes:
      label: What should the skill cover?
      description: Describe the topic or capability you'd like added
      placeholder: "The skill should help with..."
    validations:
      required: true
  - type: textarea
    id: use-case
    attributes:
      label: Use case
      description: Why is this useful? What are you trying to build?
    validations:
      required: true
  - type: dropdown
    id: priority
    attributes:
      label: How important is this to you?
      options:
        - Nice to have
        - Would significantly improve my workflow
        - Blocking my workflow
    validations:
      required: true
  - type: textarea
    id: docs
    attributes:
      label: Relevant Homey documentation
      description: Links to official docs for the requested topic
      placeholder: "https://apps.developer.homey.app/..."
```

- [ ] **Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/feature-request.yml
git commit -m "chore: add feature request issue template"
```

### Task 9: Create improvement issue template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/improvement.yml`

- [ ] **Step 1: Create improvement template**

```yaml
name: Improvement
description: Suggest an improvement to existing skill content
title: "[Improvement]: "
labels: ["improvement"]
body:
  - type: checkboxes
    id: duplicate-check
    attributes:
      label: Pre-submission checklist
      options:
        - label: I've searched existing issues and this hasn't been suggested
          required: true
  - type: textarea
    id: section
    attributes:
      label: Which section needs improvement?
      description: Reference the section of SKILL.md that could be better
      placeholder: "The 'Critical Rules' section..."
    validations:
      required: true
  - type: textarea
    id: problem
    attributes:
      label: What's wrong or unclear?
      description: Describe what could be improved
    validations:
      required: true
  - type: textarea
    id: suggestion
    attributes:
      label: Suggested improvement
      description: How would you improve it?
  - type: textarea
    id: docs
    attributes:
      label: Relevant Homey documentation
      description: Links to official docs that support the improvement
      placeholder: "https://apps.developer.homey.app/..."
```

- [ ] **Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/improvement.yml
git commit -m "chore: add improvement issue template"
```

### Task 10: Create issue template config

**Files:**
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create config to disable blank issues**

```yaml
blank_issues_enabled: false
```

- [ ] **Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/config.yml
git commit -m "chore: add issue template config"
```

## Chunk 4: Final Commit

### Task 11: Commit design and plan docs

This is the last commit — after all other files are created and committed.

**Files:**
- Existing: `docs/superpowers/specs/2026-03-10-repo-publishing-prep-design.md`
- Existing: `docs/superpowers/plans/2026-03-10-repo-publishing-prep.md`

- [ ] **Step 1: Stage and commit docs**

```bash
git add docs/
git commit -m "docs: add design spec and implementation plan"
```
