import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Encontre centros odontológicos')
  await expect(
    page.getByText('Pesquise por cidade e estado para encontrar profissionais credenciados perto de você.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible()
})

test('renders search results after selecting city and state', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Cidade').fill('São Paulo')
  await page.getByLabel('Estado').click()
  await page.getByRole('option', { name: 'SP' }).click()
  await page.getByRole('button', { name: 'Buscar' }).click()

  await expect(page.getByText('6 resultados em São Paulo, SP')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeVisible()
  await expect(page.getByText('OdontoCenter Santana')).toBeVisible()
  await expect(page.getByText('6 centros odontológicos encontrados')).toBeVisible()
})

test('renders mock results after searching by city and state', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Cidade').fill('São Paulo')
  await page.getByLabel('Estado').click()
  await page.getByRole('option', { name: 'SP' }).click()
  await page.getByRole('button', { name: 'Buscar' }).click()

  await expect(page.getByText('6 resultados em São Paulo, SP')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeVisible()
  await expect(page.getByText('OdontoCenter Santana')).toBeVisible()
  await expect(page.getByText('6 centros odontológicos encontrados')).toBeVisible()
})

test('renders the login page mockup', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Dentalpar Busca Odontológica',
  )
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await page.getByLabel('Ativar modo escuro').click()
  await expect(page.locator('html')).toHaveClass(/app-dark/)
})

test('redirects to the homepage after a valid login submit', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('E-mail').fill('user@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Encontre centros odontológicos')
  await expect(page.getByText('Login realizado com sucesso!')).toBeVisible()
})

test('renders the register page mockup', async ({ page }) => {
  await page.goto('/register')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Criar Conta')
  await expect(page.getByLabel('Nome completo')).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByPlaceholder('Digite sua senha')).toBeVisible()
  await expect(page.getByLabel('Confirmar senha')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Criar conta' })).toBeVisible()
})

test('renders the forgot password page mockup', async ({ page }) => {
  await page.goto('/forgot-password')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recuperar Senha')
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar link de recuperação' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Voltar para o login' })).toBeVisible()
})
