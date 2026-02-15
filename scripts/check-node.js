/* eslint-disable no-console */
const major = Number.parseInt(String(process.versions.node).split('.')[0] ?? '0', 10);
const allowed = new Set([20, 22]);

if (process.env.MARTILLO_SKIP_NODE_CHECK === '1') {
  process.exit(0);
}

if (!allowed.has(major)) {
  console.error(
    `[martillo] Node.js no soportado: ${process.versions.node}. ` +
      `Usa Node 22 (recomendado) o 20 para evitar fallos de Next dev (_next/static 404).`,
  );
  process.exit(1);
}
