import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  toUpper, toLower, capitalize, toTitle, equalsIgnoreCase,
  includesIgnoreCase, compare, toAscii, slugify,
} from '../dist/index.js'

test('toUpper handles dotted and dotless i', () => {
  assert.equal(toUpper('istanbul'), 'İSTANBUL')
  assert.equal(toUpper('ılık'), 'ILIK')
  assert.equal(toUpper('çğöşü'), 'ÇĞÖŞÜ')
  // The bug this library exists for: the built-in gets it wrong.
  assert.notEqual('istanbul'.toUpperCase(), toUpper('istanbul'))
})

test('toLower handles dotted and dotless I', () => {
  assert.equal(toLower('İSTANBUL'), 'istanbul')
  assert.equal(toLower('IŞIK'), 'ışık')
  assert.equal(toLower('ÇĞÖŞÜ'), 'çğöşü')
})

test('toLower of İ is one code point, not i + combining dot', () => {
  assert.equal(toLower('İ').length, 1)
  assert.equal('İ'.toLowerCase().length, 2)
})

test('toLower folds a decomposed İ (NFD) into a plain i', () => {
  assert.equal(toLower('İ'.normalize('NFD')), 'i')
  assert.equal(toLower('İZMİR'.normalize('NFD')), 'izmir')
})

test('round trips stay Turkish', () => {
  for (const w of ['ışık', 'iğne', 'İzmir', 'ılgaz', 'kitap']) {
    assert.equal(toLower(toUpper(w)), toLower(w))
  }
})

test('capitalize and toTitle', () => {
  assert.equal(capitalize('İSTANBUL'), 'İstanbul')
  assert.equal(capitalize('ırmak'), 'Irmak')
  assert.equal(capitalize(''), '')
  assert.equal(toTitle("istanbul'da ilk gün"), "İstanbul'da İlk Gün")
  assert.equal(toTitle('ABDÜLHAK HÂMİT'), 'Abdülhak Hâmit')
  assert.equal(toTitle('kuzey-ırak'), 'Kuzey-Irak')
})

test('case-insensitive comparison', () => {
  assert.ok(equalsIgnoreCase('IŞIK', 'ışık'))
  assert.ok(equalsIgnoreCase('İzmir', 'izmir'))
  // Dotted and dotless are different letters, not case variants.
  assert.ok(!equalsIgnoreCase('ışık', 'işik'))
  assert.ok(includesIgnoreCase('KIRMIZI ELMA', 'ırmız'))
  assert.ok(!includesIgnoreCase('KIRMIZI ELMA', 'irmiz'))
})

test('compare sorts in Turkish alphabetical order', () => {
  const words = ['zeytin', 'ılık', 'çay', 'can', 'iğne', 'şeker', 'su', 'öğle', 'ot', 'ağaç', 'ağır']
  assert.deepEqual([...words].sort(compare),
    ['ağaç', 'ağır', 'can', 'çay', 'ılık', 'iğne', 'ot', 'öğle', 'su', 'şeker', 'zeytin'])
})

test('compare ignores case and orders shorter prefixes first', () => {
  assert.equal(compare('Işık', 'ışık') !== 0, true)
  assert.ok(compare('ışık', 'iğne') < 0)
  assert.ok(compare('IŞIK', 'iğne') < 0)
  assert.ok(compare('kitap', 'kitaplık') < 0)
  assert.equal(compare('elma', 'elma'), 0)
})

test('circumflex letters sort with their base letter', () => {
  assert.deepEqual(['hâlâ', 'hal', 'hala', 'halı'].sort(compare), ['hal', 'hala', 'hâlâ', 'halı'])
})

test('toAscii and slugify', () => {
  assert.equal(toAscii('Şişli Çarşı'), 'Sisli Carsi')
  assert.equal(toAscii('İĞDIR ÖĞÜT'), 'IGDIR OGUT')
  assert.equal(slugify("Çağrı'nın Günlüğü"), 'cagrinin-gunlugu')
  assert.equal(slugify('  İstanbul — 2026!  '), 'istanbul-2026')
  assert.equal(slugify('Hâlâ Kâğıt'), 'hala-kagit')
})
