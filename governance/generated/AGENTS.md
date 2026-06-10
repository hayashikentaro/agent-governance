# AGENTS.md

This file is generated from `governance/policy.yaml`.

The source of truth is policy and capability definitions under `governance/`. If this file conflicts with policy, policy wins.

## Core principle

- **Govern agents by capability, not by obedience.**
  Do not ask agents to behave. Constrain what they can read, write, execute, and escalate.

## Working rules

- Keep the task inside its granted primary domain.
- Do not edit outside the write paths granted by your task contract.
- Do not edit shared code without explicit approval.
- Do not add, remove, or modify dependencies without explicit approval.
- Do not edit generated files unless explicitly granted.
- If the task cannot be completed inside scope, request escalation instead of editing wider.

## Completion

Do not claim completion based on intention. A completion claim must be supported by observable facts:

- changed files are inside the granted write scope;
- forbidden paths are untouched;
- required checks were run or explicitly reported as not run;
- any required escalation was requested instead of bypassed.

## Verdicts

- `PASS`: Allowed.
- `BLOCK`: Must be fixed before review.
- `SPLIT`: Must be split into smaller tasks or PRs.
- `HUMAN_DECISION`: Requires explicit human approval.
