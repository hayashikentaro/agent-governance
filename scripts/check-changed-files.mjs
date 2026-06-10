import fs from 'node:fs';
import path from 'node:path';
import { minimatch } from 'minimatch';

const repoRoot = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function parseArgs(argv) {
  const args = {
    files: [],
    primaryDomain: process.env.AG_PRIMARY_DOMAIN ?? null,
    capability: process.env.AG_CAPABILITY ?? null,
    allowHumanDecision: process.env.AG_ALLOW_HUMAN_DECISION === 'true'
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--files-from') {
      args.filesFrom = argv[++i];
    } else if (arg === '--primary-domain') {
      args.primaryDomain = argv[++i];
    } else if (arg === '--capability') {
      args.capability = argv[++i];
    } else if (arg === '--allow-human-decision') {
      args.allowHumanDecision = true;
    } else if (!arg.startsWith('--')) {
      args.files.push(arg);
    }
  }

  if (args.filesFrom) {
    const fileList = fs.readFileSync(args.filesFrom, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    args.files.push(...fileList);
  }

  return args;
}

function matchesAny(file, patterns = []) {
  return patterns.some((pattern) => minimatch(file, pattern, { dot: true }));
}

function findDomains(file, checkerPolicy) {
  const result = [];

  for (const [domainName, domain] of Object.entries(checkerPolicy.domains ?? {})) {
    if (matchesAny(file, domain.paths ?? [])) {
      result.push(domainName);
    }
  }

  for (const [domainName, domain] of Object.entries(checkerPolicy.protectedDomains ?? {})) {
    if (matchesAny(file, domain.paths ?? [])) {
      result.push(domainName);
    }
  }

  return result;
}

function check({ files, checkerPolicy, primaryDomain, capability, allowHumanDecision }) {
  const findings = [];
  const touchedDomains = new Set();

  for (const file of files) {
    const domains = findDomains(file, checkerPolicy);
    for (const domain of domains) touchedDomains.add(domain);

    for (const rule of checkerPolicy.rules ?? []) {
      if (rule.type === 'path_match' && matchesAny(file, rule.paths ?? [])) {
        findings.push({
          verdict: rule.verdict,
          rule: rule.id,
          file,
          message: `${file} matches protected path rule ${rule.id}`
        });
      }

      if (rule.type === 'protected_domain') {
        const protectedDomains = rule.domains ?? [];
        const hitProtectedDomain = domains.find((domain) => protectedDomains.includes(domain));
        if (hitProtectedDomain) {
          findings.push({
            verdict: rule.verdict,
            rule: rule.id,
            file,
            message: `${file} is inside protected domain ${hitProtectedDomain}`
          });
        }
      }
    }
  }

  const domainList = [...touchedDomains].filter((domain) => domain !== 'docs');
  const primaryDomainViolations = primaryDomain
    ? files.filter((file) => {
        const domains = findDomains(file, checkerPolicy).filter((domain) => domain !== 'docs');
        return domains.length > 0 && !domains.includes(primaryDomain);
      })
    : [];

  if (primaryDomain && primaryDomainViolations.length > 0) {
    for (const file of primaryDomainViolations) {
      findings.push({
        verdict: 'BLOCK',
        rule: 'granted_write_scope_only',
        file,
        message: `${file} is outside granted primary domain ${primaryDomain}`
      });
    }
  }

  const domainCountRule = (checkerPolicy.rules ?? []).find((rule) => rule.type === 'domain_count');
  const allowedCrossDomainCapability = capability && domainCountRule?.exceptions?.includes(capability);
  if (domainCountRule && domainList.length > (domainCountRule.maxDomains ?? 1) && !allowedCrossDomainCapability) {
    findings.push({
      verdict: domainCountRule.verdict ?? 'SPLIT',
      rule: domainCountRule.id,
      message: `changed files touch ${domainList.length} domains: ${domainList.join(', ')}`
    });
  }

  const order = ['PASS', 'HUMAN_DECISION', 'SPLIT', 'BLOCK'];
  let verdict = 'PASS';
  for (const finding of findings) {
    if (order.indexOf(finding.verdict) > order.indexOf(verdict)) {
      verdict = finding.verdict;
    }
  }

  if (verdict === 'HUMAN_DECISION' && allowHumanDecision) {
    verdict = 'PASS';
  }

  return { verdict, touchedDomains: domainList, findings };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checkerPolicy = readJson('governance/generated/checker-policy.json');
  const result = check({
    files: args.files,
    checkerPolicy,
    primaryDomain: args.primaryDomain,
    capability: args.capability,
    allowHumanDecision: args.allowHumanDecision
  });

  console.log(JSON.stringify(result, null, 2));

  if (result.verdict !== 'PASS') {
    process.exitCode = 1;
  }
}

main();
