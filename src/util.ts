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

export function normalizeArray<T>(x: T | T[]): T {
  if (Array.isArray(x)) {
    return x[0];
  }

  return x;
}

export async function fetchJSON(url: string, data?: any, method: string = "POST") {
  const r = await fetch(url, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });

  try {
    return await r.json();
  } catch(e) {
    return r;
  }
}

export function openInMdbg(s: string) {
  open(`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${s}*`, "_blank");
}

export function speak(s: string) {
  const allVoices = speechSynthesis.getVoices();
  let vs = allVoices.filter((v) => /zh[-_]cn/i.test(v.lang));
  if (vs.length === 0) {
    vs = allVoices.filter((v) => /zh/i.test(v.lang));
  }

  if (vs.length > 0) {
    const u = new SpeechSynthesisUtterance(s);
    u.lang = vs[0].lang;
    u.rate = 0.8;
    speechSynthesis.speak(u);
  }
}