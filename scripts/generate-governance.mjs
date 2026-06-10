import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const repoRoot = process.cwd();
const governanceDir = path.join(repoRoot, 'governance');
const generatedDir = path.join(governanceDir, 'generated');

function readYaml(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  const content = fs.readFileSync(filePath, 'utf8');
  return YAML.parse(content);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeText(relativePath, content) {
  const filePath = path.join(repoRoot, relativePath);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function buildCheckerPolicy({ policy, domains, capabilities, actors }) {
  return {
    version: policy.version ?? 1,
    generatedFrom: [
      'governance/policy.yaml',
      'governance/domains.yaml',
      'governance/capabilities.yaml',
      'governance/actors.yaml'
    ],
    verdicts: policy.verdicts ?? capabilities.verdicts ?? {},
    principles: policy.principles ?? [],
    domains: domains.domains ?? {},
    protectedDomains: domains.protected_domains ?? {},
    capabilityProfiles: capabilities.capability_profiles ?? {},
    actors: actors.actors ?? {},
    rules: toArray(policy.rules).map((rule) => ({
      id: rule.id,
      title: rule.title,
      type: rule.type,
      verdict: rule.on_violation ?? rule.on_change,
      maxDomains: rule.max_domains,
      paths: rule.paths,
      domains: rule.domains,
      exceptions: rule.exceptions ?? []
    }))
  };
}

function renderAgentsMarkdown({ policy, actors }) {
  const principles = toArray(policy.principles);
  const rules = toArray(policy.rules);
  const verdicts = policy.verdicts ?? {};
  const actorEntries = Object.entries(actors.actors ?? {});

  const lines = [];
  lines.push('# AGENTS.md');
  lines.push('');
  lines.push('This file is generated from `governance/policy.yaml` and `governance/actors.yaml`.');
  lines.push('');
  lines.push('The source of truth is policy and capability definitions under `governance/`. If this file conflicts with policy, policy wins.');
  lines.push('');
  lines.push('## Core principle');
  lines.push('');

  for (const principle of principles) {
    lines.push(`- **${principle.title}**`);
    if (principle.description) {
      lines.push(`  ${principle.description}`);
    }
  }

  lines.push('');
  lines.push('## Working rules');
  lines.push('');

  for (const rule of rules) {
    const guidance = rule.agent_guidance ?? rule.title;
    lines.push(`- ${guidance}`);
  }

  if (actorEntries.length > 0) {
    lines.push('');
    lines.push('## Actor presets');
    lines.push('');
    lines.push('Actors are capability presets, not personalities. Use the actor that matches the granted work.');
    lines.push('');

    for (const [actorName, actor] of actorEntries) {
      lines.push(`### ${actorName}`);
      lines.push('');
      lines.push(actor.description ?? 'No description.');
      lines.push('');
      lines.push(`- Capability profile: \`${actor.capability_profile}\``);
      if (actor.requires_domain) {
        lines.push('- Requires an explicit domain grant.');
      }
      if (actor.requires_human_approval) {
        lines.push('- Requires explicit human approval before execution.');
      }
      if (actor.default_domain) {
        lines.push(`- Default domain: \`${actor.default_domain}\``);
      }
      lines.push('');
    }
  }

  lines.push('');
  lines.push('## Completion');
  lines.push('');
  lines.push('Do not claim completion based on intention. A completion claim must be supported by observable facts:');
  lines.push('');
  lines.push('- changed files are inside the granted write scope;');
  lines.push('- forbidden paths are untouched;');
  lines.push('- required checks were run or explicitly reported as not run;');
  lines.push('- any required escalation was requested instead of bypassed.');
  lines.push('');
  lines.push('## Verdicts');
  lines.push('');

  for (const [verdict, description] of Object.entries(verdicts)) {
    lines.push(`- \`${verdict}\`: ${description}`);
  }

  return lines.join('\n');
}

function main() {
  const policy = readYaml('governance/policy.yaml');
  const domains = readYaml('governance/domains.yaml');
  const capabilities = readYaml('governance/capabilities.yaml');
  const actors = readYaml('governance/actors.yaml');

  const checkerPolicy = buildCheckerPolicy({ policy, domains, capabilities, actors });
  const agentsMarkdown = renderAgentsMarkdown({ policy, actors });

  writeText('governance/generated/checker-policy.json', JSON.stringify(checkerPolicy, null, 2));
  writeText('governance/generated/AGENTS.md', agentsMarkdown);

  console.log('Generated governance/generated/checker-policy.json');
  console.log('Generated governance/generated/AGENTS.md');
}

main();
