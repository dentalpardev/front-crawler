import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Base modular pronta para crescer',
  )
  await expect(page.getByText('src/modules/home')).toBeVisible()
})
