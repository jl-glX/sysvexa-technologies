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

for (const marker of ["Strict-Transport-Security", "https://forms.sysvexatechnologies.com"]) {
  if (!caddy.includes(marker)) {
    throw new Error(`Caddy no aplica el control de transporte requerido: ${marker}`);
  }
}
for (const marker of [
  "ssl_protocols TLSv1.2 TLSv1.3",
  "proxy_ssl_protocols TLSv1.2 TLSv1.3",
  "proxy_ssl_verify on",
  "proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt",
]) {
  if (!nginx.includes(marker)) {
    throw new Error(`Nginx no aplica el control de transporte requerido: ${marker}`);
  }
}

const perimeterMarkers = [
  ["@automated_probes", "Perfil de sondas"],
  ["@dangerous_methods", "Bloqueo de metodos peligrosos"],
  ["request_body", "Limite exterior de cuerpo"],
  ["wp-login", "Sondas de CMS"],
  ["phpmyadmin", "Sondas de paneles"],
  ["server-status", "Sondas de servidor"],
];
for (const [marker, label] of perimeterMarkers) {
  const nginxMarker = marker
    .replace("@automated_probes", "Perfil de sondas heredado")
    .replace("@dangerous_methods", "CONNECT|TRACE|TRACK")
    .replace("request_body", "client_max_body_size");
  if (!caddy.includes(marker) || !nginx.includes(nginxMarker)) {
    throw new Error(`${label} incompleto entre Caddy y Nginx`);
  }
}

for (const sensitiveSuffix of ["*.pem", "*.key", "*.sql", "*.backup"]) {
  if (!caddy.includes(sensitiveSuffix)) {
    throw new Error(`Caddy no bloquea el sufijo sensible ${sensitiveSuffix}`);
  }
}

const caddyRoute = caddy.indexOf("\troute {");
const caddyProbeResponse = caddy.indexOf("respond @automated_probes 404");
const caddyMethodResponse = caddy.indexOf("respond @dangerous_methods 405");
const caddySpaFallback = caddy.indexOf("try_files {path} /index.html");
if (
  caddyRoute === -1 ||
  caddyProbeResponse < caddyRoute ||
  caddyMethodResponse < caddyRoute ||
  caddyProbeResponse > caddySpaFallback ||
  caddyMethodResponse > caddySpaFallback
) {
  throw new Error(
    "Caddy debe bloquear sondas y metodos peligrosos dentro de route antes del fallback SPA",
  );
}

console.log(
  `Recursos de despliegue validados (${deploymentFiles.length} operativos y ${distFiles.length} publicos).`,
);
