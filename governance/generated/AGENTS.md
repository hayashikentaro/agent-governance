# AGENTS.md

This file is generated from governance policy files.

The source of truth is policy and capability definitions under `governance/`. If this file conflicts with policy, policy wins.

## Core principle

- **Govern agents by capability, not by obedience.**
  Do not ask agents to behave. Constrain what they can read, write, execute, and escalate.
- **Keep layer boundaries by default.**
  Horizontal layer boundaries are the default editing boundary because they limit implementation responsibility without introducing ambiguous product-boundary choices.
- **Use small named junctions for side-effect crossings.**
  Junctions are for unavoidable crossings where side effects meet and the coordination itself has meaning. They are controlled exceptions, not a general architecture style.
- **Prefer local duplication over premature shared abstraction.**
  Boilerplate is acceptable when it preserves capability boundaries. Shared abstractions are privileged because they widen future change scope.
- **Use verdicts for structural violations and scores for semantic suspicion.**
  Deterministic policy violations should produce verdicts. Heuristic smells should produce suspicion scores that route work to semantic review.

## Working rules

- Keep non-junction work inside one granted layer such as ui, app-flow, protocol, runtime, model, persistence, or docs.
- Keep the task inside its granted primary domain.
- Do not edit outside the write paths granted by your task contract.
- Import legality is structural policy. Use `governance/import-boundaries.yaml`; do not ask an LLM to decide import legality.
- Suspicious patterns are not guilt. Use `governance/suspicious-patterns.yaml` to score smells and route high-scoring diffs to semantic review.
- Do not edit shared code without explicit approval. Prefer local duplication when the alternative is premature shared abstraction.
- Do not add, remove, or modify dependencies without explicit approval.
- Do not edit generated files unless explicitly granted.
- If side effects meet and their ordering, failure semantics, retry, compensation, or observability matter, use a small named junction instead of widening a general actor.
- Do not use junction work as a reason to edit unrelated layers, domains, or shared abstractions.
- If the task cannot be completed inside scope, request escalation instead of editing wider.

## Review routing

- Structural violations use verdicts: `PASS`, `BLOCK`, `SPLIT`, or `HUMAN_DECISION`.
- Suspicion uses scores: `LOW`, `MEDIUM`, `NEEDS_SEMANTIC_REVIEW`, or `HIGH`.
- A high suspicion score is not proof of a bad change. It is a routing signal for heavier semantic review.

## Actor presets

Actors are capability presets, not personalities. Use the actor that matches the granted work.

### docs_writer

Documentation-only work.

- Capability profile: `docs_only`
- Default domain: `docs`

### ui_patcher

Small UI-only changes inside one granted domain.

- Capability profile: `ui_patch`
- Requires an explicit domain grant.

### domain_logic_patcher

Logic/model changes inside one granted domain.

- Capability profile: `domain_logic_patch`
- Requires an explicit domain grant.

### governance_editor

Edit governance definitions, generation scripts, and checker logic.

- Capability profile: `governance_patch`

### junction_integrator

Coordinate a small named junction across multiple domains when side effects meet and their coordination semantics matter.

- Capability profile: `junction_integration`
- Requires explicit human approval before execution.

### vertical_slice_worker

Cross-domain feature work with explicit human approval.

- Capability profile: `vertical_slice`
- Requires explicit human approval before execution.

## Completion

Do not claim completion based on intention. A completion claim must be supported by observable facts:

- changed files are inside the granted write scope;
- forbidden paths are untouched;
- required checks were run or explicitly reported as not run;
- import boundaries passed or violations were reported;
- suspicion score and routing level were reported when the suspicious-pattern checker ran;
- any required escalation was requested instead of bypassed.

## Verdicts

- `PASS`: Allowed.
- `BLOCK`: Must be fixed before review.
- `SPLIT`: Must be split into smaller tasks or PRs.
- `HUMAN_DECISION`: Requires explicit human approval.
