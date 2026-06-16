import { expect, test } from '@playwright/test';

/** Fills the onboarding demo with valid values (personal account — taxId stays hidden). */
async function fillRequiredOnboardingFields(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('#fullName').fill('Jane Doe');
  await page.locator('#email').fill('jane@example.com');
  await page.locator('#birthDate').fill('1990-06-15');

  await page.locator('#address\\.street').fill('42 Main St');
  await page.locator('#address\\.city').fill('Springfield');
  await page.locator('#address\\.zip').fill('12345');

  await page.locator('#emergencyContacts\\.0\\.name').fill('John Doe');
  await page.locator('#emergencyContacts\\.0\\.phone').fill('+1 555 0100');

  // Custom star-rating field — ensure at least one star is selected
  await page.locator('.star-rating-stars .star-btn').nth(2).click();
}

test.describe('Showcase smoke', () => {
  test('loads the demo and shows the onboarding form', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Reactive Forms Supercharger' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Onboarding Form' })).toBeVisible();
    await expect(page.locator('#fullName')).toBeVisible();
    await expect(page.locator('#address\\.street')).toBeVisible();
  });

  test('updates live JSON as the user types', async ({ page }) => {
    await page.goto('/');

    const liveOutput = page.locator('.showcase__layout .showcase__code--model code').first();
    await page.locator('#fullName').fill('Live JSON Test');

    await expect(liveOutput).toContainText('"fullName": "Live JSON Test"');
    await expect(liveOutput).toContainText('"address"');
    await expect(liveOutput).toContainText('"street"');
  });

  test('submits after filling required fields and shows payload', async ({ page }) => {
    await page.goto('/');

    await fillRequiredOnboardingFields(page);

    const submit = page.getByRole('button', { name: 'Complete Onboarding' });
    await expect(submit).toBeEnabled({ timeout: 10_000 });

    await submit.click();

    await expect(page.getByRole('status')).toContainText('Form submitted successfully');
    const submittedJson = page.locator('.showcase__code--submitted code');
    await expect(submittedJson).toContainText('"fullName": "Jane Doe"');
    await expect(submittedJson).toContainText('"street": "42 Main St"');
    await expect(submittedJson).toContainText('"email": "jane@example.com"');
  });

  test('keeps taxId hidden for personal accounts', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#accountType')).toHaveValue('personal');
    await expect(page.locator('#taxId')).toHaveCount(0);

    await fillRequiredOnboardingFields(page);
    await page.getByRole('button', { name: 'Complete Onboarding' }).click();

    await expect(page.getByRole('status')).toContainText('Form submitted successfully');
    const submittedJson = page.locator('.showcase__code--submitted code');
    await expect(submittedJson).toContainText('"accountType": "personal"');
    await expect(submittedJson).toContainText('"taxId": ""');
  });
});
