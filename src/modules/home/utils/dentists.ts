import type { DentistSpecialty, JobDentist } from '../api'
import { formatProfessionalType } from './formatters'

export type DentistLegendIcon = {
  code: string
  label: string
}

/**
 * Monta uma linha unica de endereco com os campos disponiveis do dentista.
 */
export function getDentistAddress(dentist: JobDentist): string {
  return [dentist.logradouro, dentist.bairro, `${dentist.cidade}, ${dentist.uf}`]
    .filter((value) => Boolean(value))
    .join(' • ')
}

/**
 * Seleciona os destaques curtos exibidos nos chips de informacoes do card.
 */
export function buildDentistHighlights(dentist: JobDentist): string[] {
  return [
    dentist.cro ? `CRO ${dentist.cro}` : null,
    formatProfessionalType(dentist.tipoPessoa),
    dentist.tipoPrestador,
  ].filter((value): value is string => Boolean(value))
}

/**
 * Converte flags de qualificacao em legendas compactas para o card do dentista.
 */
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

/**
 * Normaliza especialidades que podem chegar como texto ou objeto da API.
 */
export function normalizeSpecialtyLabel(specialty: DentistSpecialty): string {
  if (typeof specialty === 'string') {
    return specialty
  }

  return specialty.descricaoEspecialidade ?? ''
}

/**
 * Retorna apenas especialidades preenchidas, ja normalizadas para exibicao.
 */
export function getDentistSpecialties(dentist: JobDentist): string[] {
  return dentist.especialidades
    .map((specialty) => normalizeSpecialtyLabel(specialty))
    .filter((value): value is string => Boolean(value))
}

/**
 * Divide a lista textual de areas do profissional em itens individuais.
 */
export function getDentistAreas(dentist: JobDentist): string[] {
  return String(dentist.area ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is string => Boolean(value))
}

/**
 * Indica se o card deve renderizar a secao de informacoes complementares.
 */
export function hasDentistMetadata(dentist: JobDentist): boolean {
  return buildDentistHighlights(dentist).length > 0 || dentist.acessibilidadeCadeirante
}

/**
 * Indica se ha legendas de qualificacao para exibir no card do dentista.
 */
export function hasDentistQualificationLegends(dentist: JobDentist): boolean {
  return buildDentistLegendIcons(dentist).length > 0
}
