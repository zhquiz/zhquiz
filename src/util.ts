export function choice<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

/**
 * Shuffles array in place. ES6 version
 * @param {any[]} a items An array containing the items.
 */
export function shuffle(a: any[]) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randRange(n: number) {
  return Math.floor(Math.random() * n);
}

export function clone<T>(a: T): T {
  return JSON.parse(JSON.stringify(a));
}

export function normalizeArray(x: any): any {
  if (Array.isArray(x)) {
    return x[0];
  }

  return x;
}