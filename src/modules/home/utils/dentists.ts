import type { DentistSpecialty, JobDentist } from '../api'
import { formatProfessionalType } from './formatters'

export type DentistLegendIcon = {
  code: string
  label: string
}

export function getDentistAddress(dentist: JobDentist): string {
  return [dentist.logradouro, dentist.bairro, `${dentist.cidade}, ${dentist.uf}`]
    .filter((value) => Boolean(value))
    .join(' • ')
}

export function buildDentistHighlights(dentist: JobDentist): string[] {
  return [
    dentist.cro ? `CRO ${dentist.cro}` : null,
    formatProfessionalType(dentist.tipoPessoa),
    dentist.tipoPrestador,
  ].filter((value): value is string => Boolean(value))
}

export function buildDentistLegendIcons(dentist: JobDentist): DentistLegendIcon[] {
  return [
    dentist.comunicacaoEventosAdversos
      ? {
          code: 'N',
          label: 'Comunicacao de eventos adversos',
        }
      : null,
    dentist.posGraduadoLatoSenso
      ? {
          code: 'P',
          label: 'Profissional com especializacao',
        }
      : null,
    dentist.residencia
      ? {
          code: 'R',
          label: 'Profissional com residencia',
        }
      : null,
    dentist.tituloEspecialista || dentist.possuiTituloEspecialidade
      ? {
          code: 'E',
          label: 'Titulo de especialista',
        }
      : null,
    dentist.qualidadeMonitorada
      ? {
          code: 'Q',
          label: 'Qualidade monitorada',
        }
      : null,
    dentist.programaAcreditacao
      ? {
          code: 'A',
          label: 'Programa de acreditacao',
        }
      : null,
    dentist.certificacoesEntidadesGestoras
      ? {
          code: 'G',
          label: 'Certificacoes de entidades gestoras',
        }
      : null,
    dentist.certificacaoIso9001
      ? {
          code: 'I',
          label: 'Certificacao ISO 9001',
        }
      : null,
    dentist.doutoradoPosGraduacao
      ? {
          code: 'D',
          label: 'Profissional com doutorado ou pos-doutorado',
        }
      : null,
  ].filter((value): value is DentistLegendIcon => Boolean(value))
}

export function normalizeSpecialtyLabel(specialty: DentistSpecialty): string {
  if (typeof specialty === 'string') {
    return specialty
  }

  return specialty.descricaoEspecialidade ?? ''
}

export function getDentistSpecialties(dentist: JobDentist): string[] {
  return dentist.especialidades
    .map((specialty) => normalizeSpecialtyLabel(specialty))
    .filter((value): value is string => Boolean(value))
}

export function getDentistAreas(dentist: JobDentist): string[] {
  return String(dentist.area ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is string => Boolean(value))
}

export function hasDentistMetadata(dentist: JobDentist): boolean {
  return buildDentistHighlights(dentist).length > 0 || dentist.acessibilidadeCadeirante
}

export function hasDentistQualificationLegends(dentist: JobDentist): boolean {
  return buildDentistLegendIcons(dentist).length > 0
}
