// util.js – plain Node helpers + simple fuzzy matcher

const readline = require('readline');
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m"
};

// ---------- REPL helpers ---------------------------------

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, ans => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function confirm(question, defaultYes = true) {
  const ans = await ask(`${question} (${defaultYes ? 'Y/n' : 'y/N'}) `);
  if (!ans) return defaultYes;
  return /^(y|yes)$/i.test(ans);
}

// ---------- Simple fuzzy matcher ------------------------

function distance(a, b) {
  // Levenshtein distance – O(|a|*|b|) but tiny.
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,     // deletion
        dp[i][j-1] + 1,     // insertion
        dp[i-1][j-1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

function isCorrect(user, correct) {
  const a = user.toLowerCase();
  const b = correct.toLowerCase();
  if (a === b) return true;
  const dist = distance(a, b);
  // allow a 1‑char error on words up to ~7 chars (≈ 20% of length)
  return dist <= Math.max(1, Math.floor(b.length * 0.2));
}

// ---------- Color helpers --------------------------------

function col(text, c) {
  return colors[c] + text + colors.reset;
}

module.exports = { ask, confirm, isCorrect, colors, col };