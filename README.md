# turkish-case

Turkish-correct case conversion, comparison, sorting and slugs for JavaScript
and TypeScript. Zero dependencies, no ICU or locale data required.

```js
'istanbul'.toUpperCase()   // 'ISTANBUL'   ✗
toUpper('istanbul')        // 'İSTANBUL'   ✓

'IŞIK'.toLowerCase()       // 'işik'       ✗
toLower('IŞIK')            // 'ışık'       ✓

'İ'.toLowerCase().length   // 2  (i + U+0307 combining dot)  ✗
toLower('İ').length        // 1  ✓
```

## Why

Turkish has two i's: dotted **i / İ** and dotless **ı / I**. The built-in
`toUpperCase()` / `toLowerCase()` map them the English way, which turns words
into different words (`ışık` "light" vs `işik`, not a word). The usual fix,
`toLocaleUpperCase('tr')`, depends on the runtime shipping full ICU data;
small-icu Node builds and some mobile/embedded engines silently fall back to
the English rules. This library does the mapping itself, so the result is the
same everywhere.

## Install

```bash
npm install turkish-case
```

## API

```js
import {
  toUpper, toLower, capitalize, toTitle,
  equalsIgnoreCase, includesIgnoreCase,
  compare, toAscii, slugify,
} from 'turkish-case'

toUpper('iğne')                          // 'İĞNE'
toLower('İZMİR')                         // 'izmir'
capitalize('ırmak')                      // 'Irmak'
toTitle("istanbul'da ilk gün")           // "İstanbul'da İlk Gün"

equalsIgnoreCase('IŞIK', 'ışık')         // true
includesIgnoreCase('KIRMIZI', 'ırmız')   // true

['zeytin', 'çay', 'can', 'ılık', 'iğne'].sort(compare)
// ['can', 'çay', 'ılık', 'iğne', 'zeytin']

toAscii('Şişli Çarşı')                   // 'Sisli Carsi'
slugify("Çağrı'nın Günlüğü")             // 'cagrinin-gunlugu'
```

| function | what it does |
|---|---|
| `toUpper(text)` | uppercase with i → İ, ı → I |
| `toLower(text)` | lowercase with İ → i, I → ı; also folds a decomposed `I + U+0307` into `i` |
| `capitalize(text)` | first letter upper, rest lower |
| `toTitle(text)` | capitalize each word; text after an apostrophe stays lower (`İstanbul'da`) |
| `equalsIgnoreCase(a, b)` | case-insensitive equality under Turkish rules |
| `includesIgnoreCase(text, part)` | case-insensitive `includes` |
| `compare(a, b)` | Turkish alphabetical order, case-insensitive; pass to `Array.prototype.sort` |
| `toAscii(text)` | ç ğ ı ö ş ü â î û → c g i o s u a i u, keeping case |
| `slugify(text)` | lowercase ASCII slug joined with `-` |

Sorting follows the 29-letter Turkish alphabet (`a b c ç d e f g ğ h ı i j k l
m n o ö p r s ş t u ü v y z`), with q, w, x in their Latin positions.
Circumflex vowels sort with their base letter and only break ties
(`hala` before `hâlâ`).

## License

MIT
