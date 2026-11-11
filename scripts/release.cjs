#!/usr/bin/env node
// Cut a release: bump package.json, commit, tag, push, watch CI.
//   npm run release:android 1.0.1        -> sets version 1.0.1
//   npm run release:android patch|minor  -> bumps from the current version
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const bump = (v, kind) => {
  const [maj, min, pat] = v.split('.').map(n => parseInt(n, 10) || 0);
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
};

const arg = process.argv[2] || 'patch';
const next = /^\d+\.\d+\.\d+$/.test(arg) ? arg : bump(pkg.version, arg);
if (next === pkg.version) {
  console.error(`version is already ${next}`);
  process.exit(1);
}

const run = (cmd, opts = {}) => execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });

// The tree must be clean: CI builds exactly what is pushed.
const dirty = execSync('git status --porcelain', { cwd: root }).toString().trim();
if (dirty) {
  console.error('Working tree is dirty — commit or stash first:\n' + dirty);
  process.exit(1);
}

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

run(`git add package.json`);
run(`git commit -m "chore: release v${next}"`);
run(`git tag v${next}`);
run(`git push origin HEAD --tags`);
console.log(`\nPushed v${next}. Watching the build…\n`);
try {
  run(`gh run watch --exit-status $(gh run list --workflow=android-release.yml --limit 1 --json databaseId --jq '.[0].databaseId')`);
} catch {
  console.error('Build failed — inspect with: gh run view --log-failed');
  process.exit(1);
}
run(`gh release view v${next}`);

// Mirror the APK onto the app's own origin so the archive card keeps working
// (https://nyx-app.atmr.workers.dev/nyx.apk is a stable download URL).
try {
  run(`gh release download v${next} --dir release --clobber`);
  const apk = `release/nyx-${next}.apk`;
  fs.copyFileSync(path.join(root, apk), path.resolve(root, '..', 'public', 'nyx.apk'));
  console.log('\nCopied the APK to ../public/nyx.apk — run: cd ../worker && npx wrangler deploy');
} catch {
  console.error('Could not mirror the APK to public/nyx.apk — do it by hand.');
}