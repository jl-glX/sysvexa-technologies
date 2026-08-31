import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const forbiddenDirectoryNames = new Set([".git", ".hg", ".svn", ".ssh"]);
const forbiddenFileExtensions = new Set([
  ".db",
  ".key",
  ".p12",
  ".pem",
  ".pfx",
  ".sql",
  ".sqlite",
  ".sqlite3",
]);
const forbiddenFileNames = new Set([".npmrc", ".yarnrc", "id_rsa", "id_ed25519"]);

async function collectFiles(directory, relative = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativeEntry = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (forbiddenDirectoryNames.has(entry.name.toLowerCase())) {
        throw new Error(`Directorio prohibido en despliegue: ${relativeEntry}`);
      }
      files.push(...(await collectFiles(path.join(directory, entry.name), relativeEntry)));
    } else if (entry.isFile()) {
      files.push(relativeEntry);
    }
  }
  return files;
}

const deploymentFiles = await collectFiles(path.join(root, "deploy"));
const distFiles = await collectFiles(path.join(root, "dist"));
const violations = deploymentFiles.filter((relativeFile) => {
  const fileName = path.basename(relativeFile).toLowerCase();
  if (fileName.startsWith(".env") && !fileName.endsWith(".template")) return true;
  return (
    forbiddenFileNames.has(fileName) ||
    forbiddenFileExtensions.has(path.extname(fileName))
  );
});

if (violations.length > 0) {
  throw new Error(`Los recursos de despliegue contienen archivos sensibles:\n${violations.join("\n")}`);
}

const requiredDeploymentFiles = [
  "Caddyfile",
  "nginx.conf",
  "activate-release.sh",
  "auto-update.sh",
  "check-linux-readiness.sh",
  "disable-automatic-updates.sh",
  "install-updater.sh",
  "rollback-release.sh",
  "sysvexa-update.env.template",
  "sysvexa-update.service",
  "sysvexa-update.timer",
];
for (const requiredFile of requiredDeploymentFiles) {
  const platformPath = requiredFile.split("/").join(path.sep);
  if (!deploymentFiles.includes(platformPath)) {
    throw new Error(`Despliegue incompleto: falta deploy/${requiredFile}`);
  }
}
if (!distFiles.includes("index.html")) {
  throw new Error("Despliegue incompleto: falta dist/index.html");
}

const caddy = await readFile(path.join(root, "deploy", "Caddyfile"), "utf8");
const nginx = await readFile(path.join(root, "deploy", "nginx.conf"), "utf8");
const sharedRoot = "/var/www/sysvexa/current";
if (!caddy.includes(sharedRoot) || !nginx.includes(sharedRoot)) {
  throw new Error("Caddy y Nginx deben servir el mismo enlace current");
}
const formsUpstream = "forms.sysvexatechnologies.com";
if (!caddy.includes(formsUpstream) || !nginx.includes(formsUpstream)) {
  throw new Error("Caddy y Nginx deben dirigir el formulario al Worker dedicado");
}

console.log(
  `Recursos de despliegue validados (${deploymentFiles.length} operativos y ${distFiles.length} publicos).`,
);
