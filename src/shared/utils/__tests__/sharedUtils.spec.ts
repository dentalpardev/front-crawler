import { describe, expect, it } from 'vitest'

import { formatBoolean, formatCnpj, trimValue } from '..'

describe('shared utils', () => {
  it('trims string values', () => {
    expect(trimValue('  Barueri  ')).toBe('Barueri')
  })

  it('formats nullable booleans for Portuguese CSV output', () => {
    expect(formatBoolean(true)).toBe('Sim')
    expect(formatBoolean(false)).toBe('Nao')
    expect(formatBoolean(null)).toBe('Nao')
    expect(formatBoolean(undefined)).toBe('Nao')
  })

  it('formats CNPJ values when they have fourteen digits', () => {
    expect(formatCnpj('12345678000190')).toBe('12.345.678/0001-90')
    expect(formatCnpj('12.345.678/0001-90')).toBe('12.345.678/0001-90')
    expect(formatCnpj('123')).toBe('123')
    expect(formatCnpj(null)).toBe('')
  })
})
