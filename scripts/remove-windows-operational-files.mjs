import { readdir, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const operationalRoots = [".github", ".vscode", "deploy", "scripts"];
const windowsOnlyExtensions = new Set([".bat", ".cmd", ".ps1"]);
const removed = [];

async function cleanDirectory(relativeDirectory) {
  const absoluteDirectory = path.join(projectRoot, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const relativeEntry = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      await cleanDirectory(relativeEntry);
      continue;
    }
    if (
      entry.isFile() &&
      windowsOnlyExtensions.has(path.extname(entry.name).toLowerCase())
    ) {
      await rm(path.join(projectRoot, relativeEntry));
      removed.push(relativeEntry);
    }
  }
}

for (const operationalRoot of operationalRoots) {
  await cleanDirectory(operationalRoot);
}

if (removed.length === 0) {
  console.log("No hay envoltorios operativos exclusivos de Windows.");
} else {
  console.log("Se eliminaron envoltorios operativos exclusivos de Windows:");
  for (const relativeFile of removed) console.log(`- ${relativeFile}`);
}
