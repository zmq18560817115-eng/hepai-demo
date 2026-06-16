---
name: ai-native-onboarding
description: |
  AI Native team onboarding guide for small teams (3-5 people).
  Use when: new employee setup, learning team workflows, understanding AI collaboration culture, setting up development environment, establishing coding standards, or asking about team conventions.
  Activation triggers: onboarding, new team member, getting started, setup guide, 新员工, 快速上手, 入职, 团队规范
---

# AI Native Onboarding

This skill provides comprehensive onboarding guidance for new team members joining AI-native organizations. The philosophy centers on three pillars: Learn by Doing, Taste in the Loop, and Work Smart not Hard.

## Quick Navigation

| Resource | Purpose |
|----------|---------|
| [PROJECT.md](PROJECT.md) | Xiaoming project overview: audio-haptic bridge architecture and workflows |
| [ai-tool-setup.md](references/ai-tool-setup.md) | VPN, accounts, API access, AI tools ecosystem, Agent Skills |
| [essential-skills-guide.md](references/essential-skills-guide.md) | Core skills checklist and learning paths |
| [global-agent-instructions.md](references/global-agent-instructions.md) | Universal Agent.md template for all AI assistants |
| [ai-constitution.md](references/ai-constitution.md) | Team AI principles and decision-making framework |
| [problem_solving_framework.md](references/problem_solving_framework.md) | Problem decomposition and resolution patterns |

## Core Concepts

**Agent Skill**: Packaged capability extension for AI agents. Combines SOP, accumulated experience, reference documents, and utility scripts into a cohesive, reusable unit. Skills are team digital assets—invoke via `/skill-name`, no pre-installation required. See [ai-tool-setup.md](references/ai-tool-setup.md) for recommended skills.

## Philosophy

**Paradigm Shift**: The mobile internet era required Feature Teams (PM → UX → UI → Dev → QA → iterate). AI-native work is All-in-one: Git → Markdown requirements → AI → Python validation → AI implementation → Push → Design polish. One person with AI replaces the assembly line. We value interdisciplinary generalists who connect dots across domains, not specialists trapped in job title silos.

**Learn by Doing**: Theory supports practice, not the other way around. Start building immediately, let questions emerge from real work.

**Taste in the Loop**: Human judgment remains the final arbiter. AI accelerates execution; humans ensure quality and direction. Critical decisions must be human-led.

**Work Smart not Hard**: Leverage the best models, tools, and information sources. Proactive AI communication is encouraged, but independent thinking remains paramount.

**Agent Autonomy**: Within defined constraints, give agents maximum flexibility. Favor lightweight, elegant solutions—over-engineering invites displacement by smarter models.

**Five-Step Method**: Always eliminate false requirements first. The goal is to cross the swamp, not to fight every crocodile along the way.

**Principles over Procedures**: Deeply understand agent logic through practice. Leverage LLM reasoning to establish inferable principles—not mechanical steps, details, or examples.

**Model as OS**: Strong models orchestrate a layered architecture: Global Rules → Project Instructions → Agent.md (constraints and memory) → Skills (domain-specific playbooks) → references, scripts, assets. Each folder is a project; each project is a self-contained context for the agent.

## First Week Roadmap

**Day 1-2: Environment Setup**
Complete the checklist in [ai-tool-setup.md](references/ai-tool-setup.md):
- VPN configuration
- Gmail account
- US Apple ID (for subscriptions)
- Mac development environment
- API access (AIHUBMIX or Openrouter)

**Day 3-5: Standards and Culture**
Review team conventions:
- [ai-constitution.md](references/ai-constitution.md) for decision-making principles
- [global-agent-instructions.md](references/global-agent-instructions.md) for AI collaboration patterns
- [essential-skills-guide.md](references/essential-skills-guide.md) for skill acquisition priorities

## Collaboration Conventions

**Development Workflow**: Use intelligent IDEs (Claude Code, Cursor Agent) for daily collaboration. Github handles version control and security. Continuous iteration is the norm.

**Document Design**: Distinguish between Agent-facing and human-facing sections. Most documents are mixed, with different sections targeting different audiences.

**Full Context Principle**: Every document should clarify background, audience, objectives, constraints, confirmed decisions, and caveats.

**Format Standards**:
- Markdown for documentation
- JSON for data structures
- Low-noise CSV for tabular data

**Python Data Pipelines**: Use Python scripts with JSON mock data for rapid validation. Let algorithms govern data processing.

**Web Grounding**: Fact-check claims and verify logical consistency before finalizing documents.

**Plan Mode Protocol**: For serious discussions and project kickoffs, activate Plan mode. Use the best reasoning models (Opus 4.5, Gemini 3.0 Pro).

**Folder Structure**:
- `docs/` for requirements, context, and active work
- `scripts/` for stable data pipelines and processing logic
- `archive/` for resolved issues and historical references
- `Agent.md` for project-specific constraints and memory (Claude Code uses CLAUDE.md)
- `README.md` for project overview
- `todo.md` for milestones and priorities
- `.gitignore` for untracked temps and sensitive files
- `.env.local` for secrets (never commit)

**Convergence Discipline**: Counter LLM tendencies toward over-design. Ship core logic first; optimize only when evidence demands.

## Documentation Tools

**Github**: Version control, collaboration, and security. The primary source of truth for all technical artifacts.

**Notion**: Structured knowledge management. Use for team wikis, project documentation, and cross-functional collaboration.

**Feishu**: For China-market customers and domestic team coordination. Supports document sync and workflow automation.

## Essential Skills Matrix

The complete skills guide lives in [essential-skills-guide.md](references/essential-skills-guide.md). Key categories:

**Foundational Literacy**: Markdown, Mermaid diagrams, CSV, JSON, structured prompts

**Documentation**: Technical writing, fact verification, knowledge base contributions

**Version Control**: Git fundamentals, branching strategies, collaborative workflows

**Automation**: Python scripting for data processing and repetitive tasks

**AI Collaboration**: Writing clear Agent.md instructions, effective prompting patterns
