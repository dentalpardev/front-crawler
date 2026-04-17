import { downloadTextFile, formatBoolean, formatCnpj, trimValue } from '@/shared/utils'
import type { CrawlProvider } from '@/shared/types'
import type { JobDentist } from '../api'
import { getDentistSpecialties } from './dentists'
import { formatProfessionalType, formatProviderLabel } from './formatters'

const dentistCsvHeaders = [
  'provider',
  'nome',
  'nome_fantasia',
  'cro',
  'cnpj',
  'tipo_pessoa',
  'tipo_prestador',
  'area',
  'telefone',
  'whatsapp',
  'atende_whatsapp',
  'email',
  'perfil_url',
  'logradouro',
  'bairro',
  'cep',
  'cidade',
  'uf',
  'latitude',
  'longitude',
  'especialidades',
  'titulo_especialista',
  'pos_graduacao',
  'mestrado',
  'doutorado',
  'residencia',
  'qualidade_monitorada',
  'programa_acreditacao',
  'certificacao_iso9001',
  'certificacoes_entidades_gestoras',
  'comunicacao_eventos_adversos',
  'acessibilidade_cadeirante',
]

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function buildDentistsCsv(dentists: JobDentist[]): string {
  const rows = dentists.map((dentist) =>
    [
      formatProviderLabel(dentist.provider),
      dentist.nome,
      dentist.nomeFantasia,
      dentist.cro,
      formatCnpj(dentist.cnpj),
      formatProfessionalType(dentist.tipoPessoa),
      dentist.tipoPrestador,
      dentist.area,
      dentist.telefone,
      dentist.whatsapp,
      formatBoolean(dentist.atendeWhatsapp),
      dentist.email,
      dentist.boaconsultaUrl,
      dentist.logradouro,
      dentist.bairro,
      dentist.cep,
      dentist.cidade,
      dentist.uf,
      dentist.latitude,
      dentist.longitude,
      getDentistSpecialties(dentist).join(' | '),
      formatBoolean(dentist.tituloEspecialista || dentist.possuiTituloEspecialidade),
      formatBoolean(dentist.posGraduadoLatoSenso),
      formatBoolean(dentist.mestrado),
      formatBoolean(dentist.doutoradoPosGraduacao),
      formatBoolean(dentist.residencia),
      formatBoolean(dentist.qualidadeMonitorada),
      formatBoolean(dentist.programaAcreditacao),
      formatBoolean(dentist.certificacaoIso9001),
      formatBoolean(dentist.certificacoesEntidadesGestoras),
      formatBoolean(dentist.comunicacaoEventosAdversos),
      formatBoolean(dentist.acessibilidadeCadeirante),
    ]
      .map(escapeCsvValue)
      .join(','),
  )

  return [dentistCsvHeaders.join(','), ...rows].join('\n')
}

export function buildDentistsCsvFileName(providers: CrawlProvider[], city: string): string {
  const normalizedCity = trimValue(city).toLowerCase().replace(/\s+/g, '-') || 'busca'

  return `dentistas-${providers.join('-')}-${normalizedCity}.csv`
}

export function exportDentistsAsCsv(params: {
  dentists: JobDentist[]
  providers: CrawlProvider[]
  city: string
}): void {
  if (params.dentists.length === 0) {
    return
  }

  downloadTextFile(
    buildDentistsCsv(params.dentists),
    buildDentistsCsvFileName(params.providers, params.city),
    'text/csv;charset=utf-8;',
  )
}
