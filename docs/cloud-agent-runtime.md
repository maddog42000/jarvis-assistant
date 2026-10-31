# Jarvis Cloud Agent Runtime — Implementation Plan

## Goal
Evolve the existing Jarvis Assistant Android app into a cloud-connected personal assistant with a durable, auditable task runner. The Android app remains the command center; the server owns orchestration and long-running work.

## Existing foundation (verified from this repository)
- Expo SDK 54 / React Native Android app.
- tRPC server and optional server-side assistant completion route.
- User-configured provider support (Gemini, OpenAI-compatible, Anthropic-compatible).
- Local chat history, TTS, offline commands, and allowlisted action workflows.
- GitHub Actions validation workflow.

This document is a plan, not a claim that cloud agents are already deployed.

## User-facing capabilities and implementation

| Capability | Planned implementation | Release stage |
|---|---|---|
| Chat and project context | Authenticated server-side conversations, persisted project notes, user-controlled memory/context | Foundation |
| Research | Read-only web/document connectors with source links and untrusted-content handling | First tools |
| Project work | GitHub repository inspection, issue planning, patch proposals, CI/test results | First tools |
| Specialist agents | Jarvis coordinator delegates typed tasks to research, engineering, testing, security, and recovery roles | Mission engine |
| Verification | Workers run available checks; independent verification step records actual results | Mission engine |
| Mission dashboard | Android screen for task timeline, status, approvals, cancellation, and results | Android phase |
| Voice | Reuse existing TTS/voice capabilities; add voice mission submission after permissions and UX are tested | Android phase |
| Scheduling and notifications | Durable scheduled jobs and Android notifications with opt-in permissions | Later phase |
| Device actions | Explicitly permissioned, narrowly scoped Android actions; no silent access to private device data | Later phase |

## Target architecture
1. Android client — submits a mission, shows status, requests approval, and presents results.
2. Authenticated mission API — validates the owner, input size, quotas, and allowed tools.
3. Mission store — persists mission, task, event, and approval records in the configured database.
4. Orchestrator (Jarvis) — decomposes a request into bounded tasks, assigns specialist roles, enforces dependencies, and stops on budget/time limits.
5. Specialist workers — research, engineering, testing, security, and recovery roles. Workers are logical roles initially; parallel independent workers can be added after queue reliability is proven.
6. Tool gateway — explicit allowlist for read-only research and approved integrations. No arbitrary shell, unrestricted browser actions, or access to private device data.
7. Approval gate — external actions (sending messages, purchases, publishing, deleting, changing accounts, or modifying production systems) require explicit user approval.
8. Audit and observability — append-only event history, token/cost accounting, retries, cancellation, and clear failure states.

## Example mission
User: "Jarvis, inspect my Godot toolkit repository, identify reusable systems and duplicates, improve the documentation, run available checks, and prepare changes for review."

Expected flow:
1. Jarvis creates a mission and breaks it into repository inventory, duplicate analysis, documentation review, proposed edits, and verification.
2. Read-only workers inspect files and report evidence.
3. Jarvis prepares a bounded change plan and identifies any write operations.
4. User approval is requested before repository writes.
5. Approved changes are applied through the scoped GitHub integration.
6. Available tests/CI are run; results and limitations are recorded.
7. Jarvis reports changed files, test outcomes, and remaining work.

## Execution lifecycle
queued -> planning -> awaiting_approval (if needed) -> running -> verifying -> completed

Terminal alternatives: failed, cancelled, timed_out, budget_exceeded.
Every task must have an owner role, input, expected output, dependency list, timeout, retry limit, and verification rule. A worker must never mark its own unverified output as verified.

## Safety and reliability requirements
- Never expose provider keys to the Android client or commit them to Git.
- Store cloud provider credentials only in the deployment secret manager.
- Authenticate every mission and enforce per-user quotas and request-size limits.
- Use idempotency keys so retries cannot duplicate external actions.
- Keep external actions disabled until an approval record is present.
- Set hard limits for wall-clock time, model tokens, tool calls, and concurrent jobs.
- Treat retrieved web pages and files as untrusted data, never as instructions.
- Log tool name, arguments (redacted), outcome, duration, and approval reference.
- Support cancellation and safe recovery after worker/server restarts.
- Do not describe scheduled or queued work as completed until a result is persisted and verified.

## Recommended deployment sequence
### Phase 1 — secure cloud foundation
- Select a host for the existing Node server (for example, a managed Node application host).
- Provision a managed database and configure the existing DATABASE_URL.
- Configure the server's required authentication and cookie secrets.
- Configure one provider credential in the host's secret manager.
- Deploy behind HTTPS; verify authentication, health checks, rate limits, and logs.

### Phase 2 — durable mission queue
- Add database tables for missions, tasks, events, and approvals.
- Add authenticated tRPC procedures to create, inspect, cancel, and approve missions.
- Add a bounded worker loop with leases, heartbeats, retries, and stale-job recovery.
- Start with sequential task execution; enable parallelism only for independent tasks.

### Phase 3 — specialist roles and tools
- Add role prompts and typed input/output schemas.
- Add read-only research tools first.
- Add repository inspection and patch proposals next.
- Require approval before writing to repositories or invoking any external side effect.
- Run tests and security review on every proposed code change.

### Phase 4 — Android command center
- Add a Missions screen with queued/running/approval-needed/completed/failed states.
- Add task timeline, cancellation, cost limits, and approval details.
- Add notifications only after permission and delivery behavior are tested.

### Phase 5 — proactive assistance
- Add user-configured schedules, recurring project checks, and opt-in notifications.
- Add narrowly scoped integrations only when their permissions and audit trail are clear.

## Required deployment secrets
Names and exact values must be configured in the hosting provider, never committed:
- Existing server variables documented in .env.example.
- One chosen model-provider API key (provider-specific).
- Any database credentials supplied by the managed database provider.

Do not add GitHub personal access tokens or broad cloud credentials to the mobile app. If repository automation is later enabled, use a narrowly scoped GitHub App or fine-grained token stored server-side, with approval before writes.

## First acceptance tests
1. Unauthenticated clients cannot create or inspect missions.
2. A harmless read-only mission can complete and persist its full event history.
3. A worker crash results in lease expiry and safe retry, not duplicate side effects.
4. A mission can be cancelled and stops issuing new tool calls.
5. A mission over its token/time/tool budget stops with budget_exceeded or timed_out.
6. An external action cannot execute without a matching approval record.
7. Provider keys and authorization headers never appear in logs or client responses.
8. Android can reconnect and display the persisted mission state after app restart.

## Current status
Architecture, capability map, and deployment sequence documented. No cloud host, database, provider secret, queue worker, or independently running agent has been provisioned by this commit. The existing app remains usable in its current offline/local-provider modes.
