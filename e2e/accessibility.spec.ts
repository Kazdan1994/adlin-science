import { addDays, parisTodayYmd } from '@adlin/shared'
import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

const bookButtons = (page: Page): Locator => page.getByRole('button', { name: /^Book / })

async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let presses = 0; presses < 60; presses += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}

async function seriousViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test('searches and books with the keyboard only', async ({ page }) => {
  await page.goto('/')
  await expect(bookButtons(page).first()).toBeVisible()

  await tabTo(page, page.getByRole('button', { name: 'Search' }))
  await page.keyboard.press('Enter')

  await tabTo(page, page.getByRole('button', { name: 'Book Salle #1' }))
  await page.keyboard.press('Space')
  await expect(page.getByRole('dialog').getByLabel('Your name')).toBeFocused()
  await page.keyboard.type('Keyboard User')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeFocused()

  const nextRoom = page.getByRole('button', { name: 'Book Salle #2' })
  await tabTo(page, nextRoom)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(nextRoom).toBeFocused()
})

test('has no serious or critical axe violations on the page or the open dialog (SC-007)', async ({ page }) => {
  await page.goto('/')
  await expect(bookButtons(page).first()).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])

  await bookButtons(page).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])
})

test('fits a 360 px viewport without horizontal scrolling (FR-019)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  await expect(bookButtons(page).first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)

  await bookButtons(page).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('shows the confirmation without any running animation (FR-012)', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Date').fill(addDays(parisTodayYmd(new Date()), 3))
    await page.getByLabel('Start', { exact: true }).selectOption('13:00')
    await page.getByLabel('End', { exact: true }).selectOption('14:00')
    await page.getByRole('button', { name: 'Search' }).click()

    await page.getByRole('button', { name: 'Book Salle nulle' }).click()
    await page.getByRole('dialog').getByLabel('Your name').fill('Alice Martin')
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm booking' }).click()

    await expect(page.getByRole('region', { name: 'Booking confirmed' })).toBeVisible()
    const running = await page.evaluate(
      () => document.getAnimations().filter((animation) => animation.playState === 'running').length,
    )
    expect(running).toBe(0)
  })
})
