import { describe, expect, it } from 'vitest'

import type { JobDentist } from '../../api'
import {
  buildDentistHighlights,
  buildDentistLegendIcons,
  getDentistAddress,
  getDentistAreas,
  getDentistSpecialties,
  hasDentistMetadata,
  hasDentistQualificationLegends,
} from '..'

const baseDentist: JobDentist = {
  provider: 'odontoprev',
  externalId: '1',
  nome: 'Dentista Teste',
  area: 'Norte, Sul',
  cro: '12345',
  nomeFantasia: 'Clinica Teste',
  email: null,
  telefone: null,
  whatsapp: null,
  atendeWhatsapp: false,
  tipoPessoa: 'J',
  tipoPrestador: 'Clinica',
  cnpj: null,
  logradouro: 'Rua Teste',
  bairro: 'Centro',
  cep: null,
  cidade: 'Barueri',
  uf: 'SP',
  latitude: null,
  longitude: null,
  especialidades: ['Clinico Geral', { descricaoEspecialidade: 'Ortodontia' }],
  possuiTituloEspecialidade: true,
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

describe('dentist helpers', () => {
  it('builds display address and specialties', () => {
    expect(getDentistAddress(baseDentist)).toBe('Rua Teste • Centro • Barueri, SP')
    expect(getDentistSpecialties(baseDentist)).toEqual(['Clinico Geral', 'Ortodontia'])
    expect(getDentistAreas(baseDentist)).toEqual(['Norte', 'Sul'])
  })

  it('builds highlights and qualification legends', () => {
    expect(buildDentistHighlights(baseDentist)).toEqual(['CRO 12345', 'Pessoa juridica', 'Clinica'])
    expect(buildDentistLegendIcons(baseDentist)).toEqual([{ code: 'E', label: 'Titulo de especialista' }])
    expect(hasDentistMetadata(baseDentist)).toBe(true)
    expect(hasDentistQualificationLegends(baseDentist)).toBe(true)
  })
})
