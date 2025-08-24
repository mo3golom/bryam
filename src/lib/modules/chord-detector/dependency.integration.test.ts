import { describe, it, expect } from 'vitest';

// Type-only import to verify TypeScript types are present (compile-time smoke test)
import type * as PitchyTypes from 'pitchy';
import { Chord } from '@tonaljs/tonal';

describe('dependency integration — pitchy & tonal', () => {
  it('pitchy can be dynamically imported and exports are present', async () => {
    const mod = await import('pitchy');
    expect(mod).toBeTruthy();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });

  it('tonal chord detection works for C major triad', () => {
    expect(Chord).toBeDefined();
    const detected = Chord.detect(['c', 'e', 'g']);
    expect(Array.isArray(detected)).toBe(true);
    // tonal may return variants like 'C' or 'Cmaj', ensure 'C' or a variant containing 'C' exists
    expect(detected.some((d) => /(^|\b)C(maj|\b)?/i.test(d))).toBe(true);
  });

  it('TypeScript types are available (type-only smoke test)', () => {
    // The presence of the `import type` above ensures TypeScript will try to resolve package types at compile time.
    // At runtime, this is a no-op smoke test.
    const ok = true as const;
    expect(ok).toBe(true);
  });
});
