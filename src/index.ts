/**
 * Turkish-correct case conversion, comparison and slugs, with no dependency
 * on ICU or the runtime's locale data.
 *
 * Why not just `toLocaleUpperCase('tr')`? It is right when the runtime ships
 * full ICU, but silently falls back to the root locale when it doesn't
 * (small-icu Node builds, some embedded/mobile JS engines, older Hermes), and
 * the plain `toUpperCase()` / `toLowerCase()` that people reach for first are
 * always wrong for Turkish:
 *
 *   'i'.toUpperCase()  -> 'I'   (should be 'İ')
 *   'ı'.toUpperCase()  -> 'I'   (correct, but 'I'.toLowerCase() -> 'i', not 'ı')
 *   'İ'.toLowerCase()  -> 'i̇'   (i + U+0307 COMBINING DOT ABOVE, two code points)
 *
 * The last one is the nastiest: the string looks right on screen but has a
 * different length and fails `===` against a typed 'i'.
 */

const DOT_ABOVE = '̇'

/** Uppercase a string using Turkish rules: i → İ, ı → I. */
export function toUpper(text: string): string {
  let out = ''
  for (const ch of text) {
    if (ch === 'i') out += 'İ'
    else if (ch === 'ı') out += 'I'
    else out += ch.toUpperCase()
  }
  return out
}

/** Lowercase a string using Turkish rules: İ → i, I → ı. */
export function toLower(text: string): string {
  let out = ''
  // A decomposed "I + combining dot above" is a capital dotted İ that went
  // through NFD; it must become a single 'i', not 'ı' followed by a dot.
  const chars = Array.from(text)
  for (let k = 0; k < chars.length; k++) {
    const ch = chars[k]
    if (ch === 'I' && chars[k + 1] === DOT_ABOVE) {
      out += 'i'
      k++
    } else if (ch === 'İ') out += 'i'
    else if (ch === 'I') out += 'ı'
    else out += ch.toLowerCase()
  }
  return out
}

/** First letter uppercase, the rest lowercase: "İSTANBUL" → "İstanbul". */
export function capitalize(text: string): string {
  const [first = '', ...rest] = Array.from(text)
  return toUpper(first) + toLower(rest.join(''))
}

/**
 * Capitalize each word. Words split on whitespace and hyphens. Text after an
 * apostrophe stays lowercase, because in Turkish it is a suffix on a proper
 * noun: "istanbul'da" → "İstanbul'da", not "İstanbul'Da".
 */
export function toTitle(text: string): string {
  return text.replace(/[^\s-]+/gu, (word) => {
    const cut = word.search(/['’]/u)
    if (cut < 0) return capitalize(word)
    return capitalize(word.slice(0, cut)) + toLower(word.slice(cut))
  })
}

/** Case-insensitive equality under Turkish rules ("IŞIK" equals "ışık"). */
export function equalsIgnoreCase(a: string, b: string): boolean {
  return toLower(a) === toLower(b)
}

/** Case-insensitive `includes` under Turkish rules. */
export function includesIgnoreCase(haystack: string, needle: string): boolean {
  return toLower(haystack).includes(toLower(needle))
}

// The Turkish alphabet (29 letters), with q, w, x placed where they fall in
// the Latin alphabet so foreign words still sort sensibly.
const ALPHABET = 'abcçdefgğhıijklmnoöpqrsştuüvwxyz'
const RANK = new Map(Array.from(ALPHABET, (ch, k) => [ch, k]))
// Circumflex vowels (â, î, û) sort with their base letter; they only break
// ties, as in Turkish dictionaries ("hala" before "hâlâ").
const BASE: Record<string, string> = { â: 'a', î: 'i', û: 'u' }

function sortKey(ch: string): number {
  const rank = RANK.get(BASE[ch] ?? ch)
  // Digits, punctuation and other scripts go after letters, by code point.
  return rank ?? ALPHABET.length + (ch.codePointAt(0) ?? 0)
}

/**
 * Compare two strings in Turkish alphabetical order, ignoring case. Usable
 * directly with `Array.prototype.sort`: `words.sort(compare)`.
 * Returns a negative number, zero, or a positive number.
 */
export function compare(a: string, b: string): number {
  const x = Array.from(toLower(a))
  const y = Array.from(toLower(b))
  const n = Math.min(x.length, y.length)
  for (let k = 0; k < n; k++) {
    const d = sortKey(x[k]) - sortKey(y[k])
    if (d !== 0) return d
  }
  if (x.length !== y.length) return x.length - y.length
  // Same letters: plain before circumflex, then lowercase before uppercase,
  // so the order is total and stable across runs.
  for (let k = 0; k < n; k++) {
    if (x[k] !== y[k]) return x[k] in BASE ? 1 : -1
  }
  return a < b ? 1 : a > b ? -1 : 0
}

const ASCII: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
}

/** Replace Turkish letters with their closest ASCII letter: "Şişli" → "Sisli". */
export function toAscii(text: string): string {
  let out = ''
  for (const ch of text) {
    const lower = toLower(ch)
    const mapped = ASCII[lower]
    if (mapped === undefined) out += ch === 'İ' ? 'I' : ch
    else out += lower === ch ? mapped : mapped.toUpperCase()
  }
  return out
}

/** URL-safe slug: "Çağrı'nın Günlüğü" → "cagrinin-gunlugu". */
export function slugify(text: string): string {
  return toAscii(toLower(text))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
