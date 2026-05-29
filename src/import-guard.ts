/**
 * Bootstrap Import Guard — Trinity Invariant #0
 *
 * Verifies all critical dependencies resolve before the app mounts.
 * If any import is missing or broken, renders a clear diagnostic
 * instead of a silent white screen / cryptic runtime error.
 *
 * This is the outermost invariant in the Trinity chain:
 *   Import Guard → Auth → Player → Favorites → Stations
 */

function checkImports(): string[] {
  const failures: string[] = [];
  const checks: [string, () => unknown][] = [];

  // Check that React globals are accessible
  checks.push(['React.createElement', () => (window as any).React?.createElement]);

  // Verify DOM exists
  checks.push(['document.getElementById', () => document.getElementById]);

  // Verify CSS loaded (Tailwind utility class)
  checks.push([
    'CSS (Tailwind)',
    () => {
      const el = document.createElement('div');
      el.className = 'hidden';
      document.body.appendChild(el);
      const style = window.getComputedStyle(el);
      const ok = style.display === 'none';
      document.body.removeChild(el);
      return ok;
    },
  ]);

  for (const [name, check] of checks) {
    try {
      const result = check();
      if (!result) {
        failures.push(`${name} — check returned falsy`);
      }
    } catch (e: unknown) {
      failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return failures;
}

function renderBlockScreen(failures: string[]): void {
  const root = document.getElementById('root');
  if (!root) return;

  const style = document.createElement('style');
  style.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0F0F23; color: #F8FAFC; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .gate { max-width: 640px; padding: 2rem; text-align: center; }
    .gate h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    .gate pre { background: #1E1B4B; padding: 1rem; border-radius: 8px; text-align: left; font-size: 0.8rem; overflow-x: auto; border: 1px solid #4338CA; margin-top: 1rem; }
    .gate a { color: #22C55E; }
  `;
  document.head.appendChild(style);

  root.innerHTML = `
    <div class="gate">
      <h1>⚠️ Import Guard — Bootstrap Blocked</h1>
      <p>The following critical dependencies failed to resolve:</p>
      <pre>${failures.map(f => `✗ ${f}`).join('\n')}</pre>
      <p style="margin-top:1rem;color:#818CF8;font-size:0.85rem;">
        Run <code>npm install</code> and verify all dependencies.
        <br>If the error persists, clear <code>node_modules</code> and reinstall.
      </p>
      <p style="margin-top:0.5rem;font-size:0.75rem;">
        <a href="https://github.com/sanot-tech/RadioFlow/issues">Report issue</a>
      </p>
    </div>
  `;
}

const failures = checkImports();

if (failures.length > 0) {
  renderBlockScreen(failures);
  throw new Error(
    `[ImportGuard] Bootstrap blocked — ${failures.length} critical check(s) failed:\n${failures.map(f => `  ✗ ${f}`).join('\n')}`
  );
}

export {};
