/**
 * Formata booleanos para textos curtos usados em UI e exportacoes.
 */
export function formatBoolean(value: boolean | null | undefined): string {
  return value ? 'Sim' : 'Nao'
}

/**
 * Aplica mascara de CNPJ quando o valor possui 14 digitos ou parece ter perdido zeros a esquerda.
 */
export function formatCnpj(value: string | null): string {
  if (!value) {
    return ''
  }

  const digits = value.replace(/\D/g, '')
  const normalizedDigits =
    digits.length >= 12 && digits.length <= 14 ? digits.padStart(14, '0') : digits

  if (normalizedDigits.length !== 14) {
    return value
  }

  return `${normalizedDigits.slice(0, 2)}.${normalizedDigits.slice(2, 5)}.${normalizedDigits.slice(5, 8)}/${normalizedDigits.slice(8, 12)}-${normalizedDigits.slice(12)}`
}
