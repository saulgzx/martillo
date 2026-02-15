/* eslint-disable no-console */
// This file intentionally duplicates the root `scripts/check-node.js`.
// Railway builds the backend with `rootDirectory=apps/backend`, so the root
// scripts folder is not included in the build context.
const major = Number.parseInt(String(process.versions.node).split('.')[0] ?? '0', 10);
const allowed = new Set([20, 22, 24]);

if (process.env.MARTILLO_SKIP_NODE_CHECK === '1') {
  process.exit(0);
}

if (!allowed.has(major)) {
  console.error(
    `[martillo] Node.js no soportado: ${process.versions.node}. ` +
      `Usa Node 22 (recomendado) o 20 para mejor compatibilidad.`,
  );
  process.exit(1);
}

if (major === 24) {
  console.warn(
    `[martillo] Aviso: estas usando Node.js ${process.versions.node}. ` +
      `Si tienes fallos en Windows, usa Node 22 o ejecuta el frontend en modo build+start.`,
  );
}

