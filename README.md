# Agent Governance

Agent Governance is a capability-driven approach to AI agent development.

Instead of asking agents to behave, it constrains what agents can read, write, execute, and escalate. The goal is not to make agents more obedient, but to make unsafe, unreviewable, or out-of-scope behavior structurally impossible.

> Govern agents by capability, not by obedience.

## Core idea

AI agents are productive enough to generate useful code, documents, and changes. The bottleneck is no longer generation itself. The bottleneck is whether humans can safely inspect, accept, reject, split, or escalate the generated work.

This repository explores a governance layer for AI agents based on explicit capabilities:

- **Read capability**: what the agent may inspect.
- **Write capability**: what the agent may edit.
- **Execute capability**: which commands the agent may run.
- **Escalation capability**: which operations require human approval.

The preferred design is not:

```text
Tell the agent not to cross boundaries.
```

The preferred design is:

```text
Give the agent a workspace where crossing boundaries is impossible or immediately rejected.
```

## Policy, capability, and AGENTS.md

`policy` is the source of truth. It should be machine-readable and enforceable by checkers, CI, wrappers, or filesystem guards.

`AGENTS.md` is not the source of truth. It is a human/LLM-facing rendering of the policy: a set of short behavioral slogans and instructions derived from the real rules.

```text
policy / capabilities
  -> checker / gate / CI
  -> generated AGENTS.md
  -> task contracts
```

In legal terms:

- `policy` is the law and enforcement rules.
- `capabilities` are granted permissions.
- `AGENTS.md` is the readable code of conduct.
- `checker` is the enforcement mechanism.
- human approval is the exception court.

## Capability-driven repository design

To make capabilities enforceable, domain boundaries should be reflected in the directory structure.

A task should normally grant write access to one primary domain only.

```text
apps/web/src/domains/attention/**
apps/web/src/domains/task-list/**
apps/server/src/domains/attention/**
packages/core/src/domains/attention/**
```

If a task needs to edit outside its granted domain, it should not silently expand. It should request capability escalation.

```text
inside granted domain -> continue
outside granted domain -> BLOCK or HUMAN_DECISION
cross-domain change -> declared capability required
shared change -> approval required
```

## Initial governance rules

The first useful rules should be strict and mechanical:

1. One task, one primary domain.
2. Write only inside the granted domain.
3. Shared changes require approval.
4. Dependency changes require approval.
5. Cross-domain changes require a declared capability.
6. Generated files are read-only unless explicitly granted.
7. If the task cannot be completed inside scope, request escalation instead of editing wider.

## Verdicts

A checker should return only a small set of verdicts:

- `PASS`: allowed.
- `BLOCK`: clear violation; fix before review.
- `SPLIT`: change is too broad; split into smaller tasks or PRs.
- `HUMAN_DECISION`: explicit approval required.

## Principle

Do not rely on an agent's goodwill, obedience, or self-report.

Constrain its capabilities, observe its diff, and reject work that exceeds the granted scope.
