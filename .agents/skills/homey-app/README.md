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
