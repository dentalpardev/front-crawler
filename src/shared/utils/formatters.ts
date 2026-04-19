/**
 * Formata booleanos para textos curtos usados em UI e exportacoes.
 */
export function formatBoolean(value: boolean | null | undefined): string {
  return value ? 'Sim' : 'Nao'
}

/**
 * Aplica mascara de CNPJ quando o valor possui 14 digitos; caso contrario, preserva a entrada.
 */
export function formatCnpj(value: string | null): string {
  if (!value) {
    return ''
  }

  const digits = value.replace(/\D/g, '')

  if (digits.length !== 14) {
    return value
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}
