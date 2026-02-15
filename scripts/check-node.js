/* eslint-disable no-console */
const major = Number.parseInt(String(process.versions.node).split('.')[0] ?? '0', 10);
// Vercel/Railway typically run Node 20/22. Locally we may be on Node 24;
// we allow it, but Next.js dev mode can be unstable on Windows + Node 24.
const allowed = new Set([20, 22, 24]);

if (process.env.MARTILLO_SKIP_NODE_CHECK === '1') {
  process.exit(0);
}

if (!allowed.has(major)) {
  console.error(
    `[martillo] Node.js no soportado: ${process.versions.node}. ` +
      `Usa Node 22 (recomendado) o 20 para mejor compatibilidad con Next.js.`,
  );
  process.exit(1);
}

if (major === 24) {
  // Keep this as a warning only. We still want `npm run build` to be usable locally.
  console.warn(
    `[martillo] Aviso: estas usando Node.js ${process.versions.node}. ` +
      `Si tienes fallos de Next dev en Windows (_next/static 404), usa Node 22 o ejecuta el frontend en modo build+start.`,
  );
}
