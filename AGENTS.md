# AGENTS.md

This file is a human/LLM-facing rendering of the governance policy.

The source of truth is under `governance/`. If this file conflicts with policy or capability definitions, policy wins.

## Core rule

Do not ask for trust. Stay inside your granted capabilities.

## Working rules

- One task has one primary domain.
- Write only inside the paths granted by your task contract.
- Do not edit shared code without explicit approval.
- Do not add or modify dependencies without explicit approval.
- Do not cross domains without an explicit capability grant.
- Do not edit generated files unless explicitly granted.
- If the task cannot be completed inside scope, request escalation instead of editing wider.

## Completion

Do not claim completion based on intention.

A completion claim must be supported by observable facts:

- changed files are inside the granted write scope;
- forbidden paths are untouched;
- required checks were run or explicitly reported as not run;
- any required escalation was requested instead of bypassed.

## Verdicts

- `PASS`: allowed.
- `BLOCK`: fix before review.
- `SPLIT`: split into smaller tasks or PRs.
- `HUMAN_DECISION`: wait for explicit human approval.
