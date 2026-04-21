import { describe, expect, it } from 'vitest'

import type { JobDentist } from '../../api'
import { buildDentistsCsv, buildDentistsCsvFileName } from '..'

const dentist: JobDentist = {
  provider: 'odontoprev',
  externalId: '1',
  nome: 'Dentista "Teste"',
  area: null,
  cro: '12345',
  nomeFantasia: 'Clinica Teste',
  email: 'contato@example.com',
  telefone: '11 1111-1111',
  whatsapp: null,
  atendeWhatsapp: true,
  tipoPessoa: 'F',
  tipoPrestador: 'Consultorio',
  cnpj: '12345678000190',
  logradouro: 'Rua Teste',
  bairro: 'Centro',
  cep: '00000-000',
  cidade: 'Barueri',
  uf: 'SP',
  latitude: null,
  longitude: null,
  especialidades: ['Clinico Geral'],
  possuiTituloEspecialidade: false,
  programaAcreditacao: false,
  qualidadeMonitorada: false,
  posGraduadoLatoSenso: false,
  mestrado: false,
  comunicacaoEventosAdversos: false,
  certificacoesEntidadesGestoras: false,
  certificacaoIso9001: false,
  residencia: false,
  tituloEspecialista: false,
  doutoradoPosGraduacao: false,
  acessibilidadeCadeirante: false,
  boaconsultaUrl: null,
}

describe('dentists CSV export helpers', () => {
  it('builds CSV content with escaped values', () => {
    const csv = buildDentistsCsv([dentist])

    expect(csv.split('\n')[0]).toContain('provider,nome,nome_fantasia')
    expect(csv).toContain('"OdontoPrev","Dentista ""Teste"""')
    expect(csv).toContain('"12.345.678/0001-90"')
    expect(csv).toContain('"Sim"')
  })

  it('pads missing leading zeros when exporting malformed CNPJ values', () => {
    const csv = buildDentistsCsv([
      {
        ...dentist,
        cnpj: '9061782000143',
      },
    ])

    expect(csv).toContain('"09.061.782/0001-43"')
  })

  it('builds file names from selected providers and city', () => {
    expect(buildDentistsCsvFileName(['odontoprev', 'sulamerica'], 'Sao Paulo')).toBe(
      'dentistas-odontoprev-sulamerica-sao-paulo.csv',
    )
    expect(buildDentistsCsvFileName(['amil'], '   ')).toBe('dentistas-amil-busca.csv')
  })
})
