import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const markdownFiles = [
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ...fs
    .readdirSync(path.join(repositoryRoot, "docs"))
    .filter((file) => file.endsWith(".md"))
    .map((file) => `docs/${file}`),
];

const isExternalLink = (target) =>
  /^(?:https?:|mailto:|#)/.test(target) || target.startsWith("tel:");

const unresolvedLinks = [];

for (const file of markdownFiles) {
  const absoluteFile = path.join(repositoryRoot, file);
  const source = fs.readFileSync(absoluteFile, "utf8");
  const links = source.matchAll(/\[[^\]]*]\(([^)]+)\)/g);

  for (const [, rawTarget] of links) {
    if (isExternalLink(rawTarget)) {
      continue;
    }

    const localPath = decodeURIComponent(rawTarget.split("#")[0]);
    if (!localPath) {
      continue;
    }

    const absoluteTarget = path.resolve(path.dirname(absoluteFile), localPath);
    if (!fs.existsSync(absoluteTarget)) {
      unresolvedLinks.push(`${file}: ${rawTarget}`);
    }
  }
}

if (unresolvedLinks.length > 0) {
  console.error("Unresolved local documentation links:");
  for (const link of unresolvedLinks) {
    console.error(`- ${link}`);
  }
  process.exit(1);
}

console.log(`Checked local links in ${markdownFiles.length} Markdown files.`);
