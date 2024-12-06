import test, { expect } from "@playwright/test";

// Workaroudn for: https://github.com/microsoft/playwright/issues/33866
test.beforeEach(async ({ page, colorScheme }) => {
    await page.goto("");
    await page.emulateMedia({
        colorScheme: colorScheme,
    });
});

test("home", async ({ page }) => {
    await page.goto("");
    await expect(page).toHaveScreenshot({
        fullPage: true,
        mask: [
            page.locator("//input[@name='time-time']"),
            page.locator("//input[@name='time-date']"),
        ]
    });
});

test("history", async ({ page }) => {
    await page.goto("history");
    // Results start loading on page load
    await expect(page.locator("tbody")).toBeEmpty();
    await expect(page).toHaveScreenshot({
        fullPage: true,
    });
});