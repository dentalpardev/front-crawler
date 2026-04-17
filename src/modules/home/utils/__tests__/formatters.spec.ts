import { describe, expect, it } from 'vitest'

import {
  formatDentistCount,
  formatProfessionalType,
  formatProviderLabel,
  formatStatusLabel,
} from '..'

describe('home formatters', () => {
  it('formats crawl status labels', () => {
    expect(formatStatusLabel('queued')).toBe('Na fila')
    expect(formatStatusLabel('running')).toBe('Coletando...')
    expect(formatStatusLabel('done')).toBe('Concluida')
    expect(formatStatusLabel('failed')).toBe('Falhou')
    expect(formatStatusLabel('partial_failed')).toBe('Parcialmente concluida')
    expect(formatStatusLabel(null)).toBe('Sem coleta')
  })

  it('formats dentist counts', () => {
    expect(formatDentistCount(null)).toBe('Contagem pendente')
    expect(formatDentistCount(0)).toBe('0 dentistas')
    expect(formatDentistCount(1)).toBe('1 dentista')
    expect(formatDentistCount(2)).toBe('2 dentistas')
  })

  it('formats provider labels', () => {
    expect(formatProviderLabel('odontoprev')).toBe('OdontoPrev')
    expect(formatProviderLabel('hapvida')).toBe('Hapvida')
    expect(formatProviderLabel('amil')).toBe('Amil')
    expect(formatProviderLabel('sulamerica')).toBe('SulAmerica')
    expect(formatProviderLabel('custom')).toBe('custom')
  })

  it('formats professional type labels', () => {
    expect(formatProfessionalType('F')).toBe('Pessoa fisica')
    expect(formatProfessionalType('J')).toBe('Pessoa juridica')
    expect(formatProfessionalType('Outro')).toBe('Outro')
    expect(formatProfessionalType(null)).toBe('')
  })
})
