import { randomBytes } from 'crypto';

// Unicode character sets for alias generation
const GREEK = ['α','β','γ','δ','ε','ζ','η','θ','κ','λ','μ','ν','ξ','π','ρ','σ','τ','φ','χ','ψ','ω','Δ','Λ','Σ','Φ','Ψ','Ω'];
const MATH   = ['∞','∂','∫','√','≈','≠','≡','∑','∏','∇','∈','∉','∩','∪','⊂','⊃','±','×','÷','∧','∨'];
const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const SEPARATORS = ['•', '·', ':', '~'];

// Offensive alias blocklist (extend as needed)
const BLOCKED_PATTERNS = [
  /n[i1]gg/i, /f[a4]gg/i, /k[i1]k[e3]/i, /c[u0][n]t/i, /b[i1]tch/i,
  /ass/i, /sex/i, /porn/i, /slut/i, /rape/i, /kill/i, /die/i, /dead/i,
];

function isOffensive(alias: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(alias));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAlphaNum(len: number): string {
  let result = '';
  for (let i = 0; i < len; i++) {
    result += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return result;
}

/**
 * Generates a pseudorandom alias like: Δk•R7ψ2 or λ∞Gπ4·x
 * Format: [Greek/Math][alphanum][sep][alphanum][Greek][num][sep?][alphanum]
 */
export function generateAlias(): string {
  const MAX_ATTEMPTS = 50;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const parts: string[] = [];

    // Start with Greek or math symbol
    parts.push(pickRandom([...GREEK, ...MATH]));
    // 2 alphanum
    parts.push(randomAlphaNum(2));
    // separator
    parts.push(pickRandom(SEPARATORS));
    // Greek/math
    parts.push(pickRandom([...GREEK, ...MATH]));
    // 1-2 digit
    parts.push(String(Math.floor(Math.random() * 90) + 10));
    // 1-2 alphanum
    parts.push(randomAlphaNum(1 + Math.floor(Math.random() * 2)));

    const alias = parts.join('');

    if (!isOffensive(alias)) {
      return alias;
    }
  }

  // Fallback: purely random hex-like alias
  return `ζ${randomBytes(3).toString('hex')}`;
}

/**
 * Validate alias format (used for DB lookups)
 */
export function isValidAlias(alias: string): boolean {
  return typeof alias === 'string' && alias.length >= 4 && alias.length <= 20;
}
