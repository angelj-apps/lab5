/** n-th order Markov chain over discrete tokens (monophonic pitch). */
export class MarkovChain {
  /** @param {number} order */
  constructor(order = 2) {
    this.order = Math.max(1, order);
    /** @type {Map<string, Map<number, number>>} */
    this.transitions = new Map();
    /** @type {Map<number, number>} */
    this.globalCounts = new Map();
    /** @type {number[][]} */
    this.contexts = [];
    this.trained = false;
  }

  /** @param {number[]} tokens */
  train(tokens) {
    if (tokens.length <= this.order) {
      throw new Error(
        `Need more than ${this.order} tokens to train order-${this.order} chain (got ${tokens.length}).`
      );
    }

    this.transitions = new Map();
    this.globalCounts = new Map();
    this.contexts = [];

    for (let i = 0; i < tokens.length - this.order; i++) {
      const context = tokens.slice(i, i + this.order);
      const next = tokens[i + this.order];
      if (next === undefined || !Number.isFinite(next)) continue;
      this.#record(context, next);
    }

    this.trained = true;
    return this;
  }

  /** @param {number[]} context @param {number} token */
  #record(context, token) {
    const key = contextKey(context);
    if (!this.transitions.has(key)) {
      this.transitions.set(key, new Map());
      this.contexts.push([...context]);
    }
    const row = this.transitions.get(key);
    row.set(token, (row.get(token) ?? 0) + 1);
    this.globalCounts.set(token, (this.globalCounts.get(token) ?? 0) + 1);
  }

  /** @param {number} length @param {number[]|null} seed @param {number} temperature */
  generate(length, seed = null, temperature = 1) {
    if (!this.trained) {
      throw new Error('Train the chain before generating.');
    }
    if (length <= 0) return [];

    const context = this.#resolveSeed(seed);
    const output = [...context];

    while (output.length < this.order + length) {
      const window = output.slice(-this.order);
      const next = this.#sample(window, temperature);
      output.push(next);
    }

    return output.slice(this.order);
  }

  /** @param {number[]|null} seed */
  #resolveSeed(seed) {
    if (seed && seed.length >= this.order) {
      return seed.slice(-this.order);
    }
    if (this.contexts.length === 0) {
      throw new Error('No contexts available for seeding.');
    }
    const pick = this.contexts[Math.floor(Math.random() * this.contexts.length)];
    return [...pick];
  }

  /** @param {Map<number, number>} counts @param {number} temperature */
  #sampleFromCounts(counts, temperature) {
    const filtered = new Map(
      [...counts.entries()].filter(([token]) => Number.isFinite(token))
    );
    if (filtered.size === 0) {
      throw new Error('No valid pitch transitions available.');
    }
    return weightedSample(filtered, temperature);
  }

  /** @param {number[]} context @param {number} temperature */
  #sample(context, temperature) {
    let row = this.#lookup(context);

    if (!row || row.size === 0) {
      row = this.#fallbackRow(context);
    }
    if (!row || row.size === 0) {
      row = this.globalCounts;
    }

    return this.#sampleFromCounts(row, temperature);
  }

  /** @param {number[]} context */
  #lookup(context) {
    return this.transitions.get(contextKey(context)) ?? null;
  }

  /** @param {number[]} context */
  #fallbackRow(context) {
    for (let o = context.length - 1; o >= 1; o--) {
      const sub = context.slice(context.length - o);
      const row = this.#lookup(sub);
      if (row && row.size > 0) return row;
    }
    return null;
  }

  getContextCount() {
    return this.transitions.size;
  }

  /** Last trained context window (for UI display). @param {number[]} tokens */
  defaultSeed(tokens) {
    return tokens.slice(-this.order);
  }
}

/** @param {number[]} context */
function contextKey(context) {
  return context.join(',');
}

/** @param {Map<number, number>} counts @param {number} temperature */
function weightedSample(counts, temperature) {
  const entries = [...counts.entries()];
  if (entries.length === 0) {
    throw new Error('Cannot sample from empty distribution.');
  }

  const temp = Math.max(0, temperature);
  if (temp === 0) {
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  const weights = entries.map(([, c]) => Math.pow(c, 1 / temp));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;

  for (let i = 0; i < entries.length; i++) {
    r -= weights[i];
    if (r <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

export { contextKey, weightedSample };
