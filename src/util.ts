// util.ts – plain Node helpers + simple fuzzy matcher
import readline from 'readline';

export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m"
} as const;

export type ColorKey = keyof typeof colors;

// ---------- REPL helpers ---------------------------------

export function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, ans => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

export async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const ans = await ask(`${question} (${defaultYes ? 'Y/n' : 'y/N'}) `);
  if (!ans) return defaultYes;
  return /^(y|yes)$/i.test(ans);
}

// ---------- Simple fuzzy matcher ------------------------

function distance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function isCorrect(user: string, correct: string): boolean {
  const a = user.toLowerCase();
  const b = correct.toLowerCase();
  if (a === b) return true;
  const dist = distance(a, b);
  return dist <= Math.max(1, Math.floor(b.length * 0.2));
}

// ---------- Color helpers --------------------------------

export function col(text: string, c: ColorKey): string {
  return colors[c] + text + colors.reset;
}
