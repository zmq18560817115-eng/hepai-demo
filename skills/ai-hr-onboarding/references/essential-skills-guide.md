# Essential Skills Guide

Core competencies for AI-native team members. Each skill is chosen for a specific reason in the human-AI collaboration context.

## Skill Matrix


| Layer            | Skills                                                    | Timeline |
| ---------------- | --------------------------------------------------------- | -------- |
| Foundational     | Markdown, Mermaid, CSV, JSON, Structured Prompts          | Week 1   |
| Documentation    | Technical writing, Fact verification                      | Week 2   |
| Version Control  | Git                                                       | Week 2   |
| Automation       | Python scripting, Web prototyping                         | Month 1  |
| AI Collaboration | Agent.md authoring                                        | Month 1  |
| AI Tool Mastery  | Deep Research, AI Image Generation, Presentation Workflow | Month 2  |


## Guiding Principles

**Full Context in IDE, Not Scattered Chat**: Official Chatbox services handle casual coordination—daily logistics, quick questions, free-form brainstorming. Real work happens in the IDE with project-level Full Context. This environment is protected (version-controlled), traceable (every change logged), and grows with the project. More critically, AI operates with complete business visibility—understanding folder structures, referencing prior decisions, connecting dots across files. Fragmented chat produces fragmented thinking; integrated context produces coherent output.

**Embrace New Methods, Escape Path Dependency**: Familiar approaches feel safe but often perpetuate inefficiency. AI-native workflows demand willingness to abandon legacy habits when better patterns emerge. Question every "we've always done it this way." The cost of learning something new is temporary; the cost of clinging to obsolete methods compounds indefinitely.

### Agentic IDE Workflow

**Plan Mode for Complexity**: Judge when tasks require upfront planning versus direct execution. Multi-step tasks with dependencies, unfamiliar domains, or high-stakes changes warrant Plan Mode. Simple, well-understood operations proceed immediately. Develop this judgment through practice—over-planning wastes cycles; under-planning creates rework.

**One Session, One Requirement**: Each session serves a single focused objective. **Disable Agent's auto-compact.** Aim to solve the problem *before* the context window fills. If the context forces compaction, the session methodology is flawed. Complete one task, then reset. One session, one requirement.

**Define in Docs, Reference in Chat**: The chat box is for signals; documents are for content. Write detailed requirements in a Markdown file and reference it (`@[file]`) instead of typing into the sidebar. This converts ephemeral prompts into persistent, version-controlled assets. It forces structural thinking and provides the Agent with a stable source of truth.

**Human Leads, Agent Executes**: Requirements and insights originate from human judgment. Key decisions—scope, priorities, trade-offs—remain with decision-makers. Agent handles implementation, research, and mechanical work. This division preserves accountability while maximizing leverage. Write your requirements manually; let Agent turn them into reality.

**Learn Through Practice, Not Tutorials**: Build intuition by doing real work, not by consuming instruction. Tutorials describe; practice reveals. When something fails, investigate. When something succeeds, understand why. Direct experience compounds faster than secondhand knowledge.

## Foundational Literacy

### Markdown

**Why**: The most LLM-friendly markup format. LLMs are trained on massive amounts of Markdown content, making it their native language. For humans, rendering is instant across platforms without special tooling.

**Core Syntax**: Headers create hierarchy. Lists structure information. Code blocks preserve formatting. Tables enable comparison. Links connect resources.

### Mermaid

**Why**: The lightest-weight visualization solution. Text-based diagrams live inside Markdown files, version-controllable, diff-able. Notion, GitHub, and most modern tools render Mermaid natively. No export/import friction.

**When to Use**: Diagrams complement written content; they do not replace it. Use for process flows, system architecture, timelines.

**Reference**: [Mermaid Documentation](https://mermaid.js.org/)

### CSV

**Why**: Minimal noise for tabular data. No styling markup, no cell formatting, just data. LLMs parse CSV with near-perfect accuracy. Spreadsheet tools import/export without loss.

**Conventions**: Header row required. Consistent delimiters. Quote fields containing special characters.

### JSON

**Why**: Strong structural enforcement. Nested hierarchies, typed values, explicit relationships. When you need data integrity and machine-readability, JSON eliminates ambiguity.

**Team Convention**: JSON as prototype. Mock data in JSON validates logic before implementation. The structure becomes the specification. Use `.jsonc` when inline comments are needed for context or rationale.

### Structured Prompts

**Why**: Controllability. Unstructured requests yield unpredictable outputs. Structured prompts constrain the solution space, making AI responses reproducible.

**Components**:

- Task: Clear, specific requirements and objectives
- Full Context: Let folder structure carry context; Agent retrieves as needed
- Format: Specify only when output structure matters

**Philosophy**: Principles over details. Assume intelligence; skip common sense explanations.

## Documentation Skills

### Technical Writing

**Why**: Documentation serves two audiences simultaneously. Humans need narrative flow and conceptual grounding. AI agents need structured sections and explicit instructions.

**Full Context Principle**: Every document clarifies background, audience, objectives, constraints, confirmed decisions, and caveats. Context eliminates guesswork.

**Action Titles**: Lead with conclusions. McKinsey-style outcome-oriented headings let readers extract value without reading every word.

### Fact Verification

**Why**: LLMs hallucinate. Web grounding is the antidote. Every claim with real-world implications requires verification.

**Process**:

1. Identify verifiable claims
2. Search authoritative sources (English preferred, avoid low-quality aggregators)
3. Cross-reference multiple sources
4. Document confidence level
5. Flag unverifiable claims explicitly

**Unknowns Policy**: Missing key data? Stop guessing. Propose minimal test or acquisition path.

## Version Control

### Git

**Why**: Full traceability. Every change logged, every decision recoverable. Collaboration without chaos. AI-assisted work generates many iterations; Git ensures nothing is lost.

**Philosophy**: Make Git invisible. The goal is Dropbox-like simplicity with full version control power. Users focus on content; infrastructure handles itself.

**Setup**: Install [gh cli](https://cli.github.com/) and authenticate once. From this point forward, Agent handles all git operations through natural language—commit, push, pull, branch creation, conflict resolution. No command memorization required; patterns internalize through observation.

### Document Collaboration

For Markdown documentation and non-code content, simplicity trumps sophistication.

**Single Branch Model**: Everyone works on `main`. No feature branches, no merge ceremonies. Multi-branch workflows create cognitive overhead that exceeds their value for document work. When you see the latest file, that *is* the truth—this eliminates "where is my change" anxiety.

**Physical Isolation Prevents Conflicts**: Structure your repository so concurrent edits target different files. Split large documents by chapter, section, or owner. Git conflicts arise from simultaneous edits to the same lines; file-level separation makes conflicts structurally impossible.

**Async Sync Pattern**: For teams using editors like Obsidian with Git plugins, configure auto-commit (every 5 minutes) and auto-pull (on launch). The experience becomes indistinguishable from local editing—Git operates silently in the background.

**Fallback for Collisions**: When multiple people must edit one file, use primitive coordination: announce in chat before editing, confirm when done. In small teams, this "token ring" protocol outperforms conflict resolution by orders of magnitude.

### Development Workflow

Code repositories benefit from structured branching when team size or release cadence demands it.

**Single-Branch Parallel Development**: When directory boundaries align with role boundaries, `main` alone suffices for parallel work. Product edits `docs/`, engineering edits `src/`—file-level orthogonality eliminates merge conflicts structurally. `git pull --rebase` before push keeps history linear. Reserve branching for cases where multiple people modify the same directory concurrently.

**Branch When Necessary**: Feature branches isolate experimental work. The Bus model (version-based branches like `bus/7.0.12`) works well for release-oriented teams. Merge back to `main` with `--no-ff` to preserve topology.

**Tag Everything Released**: Production deployments must trace to Tags, never floating branch heads. Tags are immutable anchors for hotfixes—if version `7.0.12.0` needs a patch, branch from its Tag, not from current `main`.

### Agent-Assisted Operations

**Initial Hosting & Complexity**: Delegate the initial repository setup and complex operations to the Agent. **Default to Private**—we are not an open-source team; visibility should always be private. The Agent uses `gh cli` to handle authentication, repo creation, and tricky git scenarios efficiently.

**Manual Routine**: For daily work (subsequent commits), execute `commit` and `push` manually via the IDE's Source Control Tab. Do not delegate these routine sync points to the Agent. Manual clicking ensures deliberate review and prevents accidental state corruption.

Delegate the following to the Agent:


| Intent            | Say to Agent                                             |
| ----------------- | -------------------------------------------------------- |
| Initial Hosting   | "Initialize logic-app repo, private, and push"           |
| Experiment safely | "Create a branch for testing Y"                          |
| Recover           | "Show me the last 5 commits" or "Revert the last change" |
| Sync (Complex)    | "Resolve conflicts with remote"                          |


**Safety Net**: Technical leads absorb complexity. When timelines tangle (failed syncs, accidental overwrites), non-technical members stop and escalate. The lead uses `rebase`, `cherry-pick`, or `reflog` to restore order. Technical skill should shield teammates from complexity, not impose complex rules upon them.

**Good Habits**:

- Pull before starting work
- Commit on meaningful progress with descriptive messages (describe why, not what)
- Push to share progress
- Branch for experiments when outcomes are uncertain

## Problem Solving

See [problem_solving_framework.md](problem_solving_framework.md) for decomposition methods, fallback chains, and resolution patterns.

## Automation

### Python

**Why**: Ubiquitous, readable, and LLM-fluent. When you need to process data, automate repetition, or build quick prototypes, Python has the shortest path from idea to execution. AI assistants write Python with high accuracy.

**Common Use Cases**: Data transformation, API integration, file processing, report generation.

**Pattern**:

```python
# Load → Transform → Validate → Output
data = load_source(input_path)
processed = transform(data)
if validate(processed):
    save_output(processed, output_path)
```

### Web Scaffold

**Why**: Python validates data pipelines; the web stack builds high-definition prototypes that stakeholders can touch. A standardized scaffold eliminates per-project setup decisions and lets Agent generate production-grade UI from requirements documents.

**Stack**:


| Layer           | Choice                       | Rationale                                                      |
| --------------- | ---------------------------- | -------------------------------------------------------------- |
| Package Manager | pnpm                         | Disk-efficient, strict dependency resolution                   |
| Framework       | Next.js (App Router)         | File-based routing, server components, API routes              |
| UI Components   | shadcn/ui                    | Copy-paste components, fully ownable, no runtime dependency    |
| Styling         | Tailwind CSS                 | Utility-first, consistent with shadcn                          |
| Icons           | Lucide React                 | Tree-shakeable, consistent stroke style                        |
| Typography      | Inter via `next/font/google` | Default sans-serif, variable font, self-hosted at build time   |
| AI Integration  | AI SDK (Vercel)              | Unified interface for streaming, tool-calling across providers |


**Convention**: Agent handles scaffolding and component generation. Human defines requirements in docs, reviews output in browser. Local preview via `pnpm dev`; production build only when deploying.

## AI Collaboration

### Agent.md

**Why**: Persistent context. Instead of repeating instructions every conversation, Agent.md files define behavior once. The AI assistant carries these instructions across all interactions.

**Structure**:

```markdown
<role>
soul, traits, philosophy
</role>

<principles>
Decision-making guidelines
</principles>

<rules>
Behavioral constraints
</rules>

<negative>
Anti-patterns to avoid
</negative>
```

**Design Principles**: Inferable principles over exhaustive examples. Affirmative statements over prohibitions. Self-explanatory names. Negative constraints act as stabilizers—apply only when positive instruction alone cannot suppress drift.

**Reference**: See [global-agent-instructions.md](global-agent-instructions.md) for team template.

## AI Tool Mastery

Beyond Agent.md authoring lies tool-specific fluency. The goal is not memorizing interfaces, but internalizing the mental model behind each tool—understanding what it does well, where it fails, and how to frame requests for predictable results.

### Deep Research (Gemini)

**Why**: Traditional search retrieves pages; deep research synthesizes answers. Gemini Deep Research conducts multi-hop investigation, following citation trails and cross-referencing sources automatically. For complex topics requiring comprehensive coverage, it compresses hours of manual research into minutes.

**Essential**: Frame the question with precision (scope, depth, success criteria). State constraints explicitly. Treat outputs as drafts—verify critical claims against primary sources.

### AI Image Generation (Nano Banana Pro)

**Why**: Visual communication accelerates understanding. The bottleneck shifts from production to articulation—results depend entirely on how clearly you express your vision. The model interprets words literally; vague prompts yield generic images.

### Presentation Slides (NotebookLM)

**Why**: Slide (中文语境称为 PPT) creation is split-brain work—content strategy and visual layout compete for attention. NotebookLM separates these concerns, enforcing clarity of thought before visual execution.

**Segmented Workflow**: Step 1 — generate precise image prompts for all slides (content, layout, visual direction). Step 2 — execute generation in one pass. Quality mirrors prompt precision.

## Learning Path

**Day 0**: Environment setup. Install Homebrew, Node.js with pnpm, CleanShot X. These tools establish your development foundation and team visual standards.

**Week 1**: Markdown fluency, Mermaid basics, JSON/CSV literacy. These are your daily communication formats.

**Week 2**: Git workflow, documentation standards, fact verification habits. These ensure quality and traceability.

**Month 1**: Python scripting, Agent.md customization. These amplify your leverage.

**Month 2**: AI Tool Mastery and Skill Design. Deep Research for investigation, image generation for visual communication, NotebookLM for presentation production. Design one original Agent Skill—distill your SOP for a recurring problem, share with the team, and articulate your design rationale.

**Ongoing**: Learning emerges from doing. Apply skills in real projects; refinement follows naturally.