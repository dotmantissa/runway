import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("example save, reload, invoice and correction journey", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your client says Friday. Your history says Tuesday.",
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Try the example", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "A little room to plan ahead." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Plan", exact: true }).first().click();
  await expect(
    page.getByText("Reduce by 150 USDC", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review changes", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review these changes" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save these changes", exact: true })
    .click();
  await expect(
    page.getByText("Spending changes saved. No funds moved.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("No spending change is needed for this scenario."),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Invoices", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Add invoice", exact: true }).click();
  await page.getByLabel("Invoice reference").fill("CED-NEW");
  await page.getByLabel("Amount (USDC)", { exact: true }).fill("300");
  await page.getByLabel("Client's payment date").fill("2026-11-05");
  await page.getByRole("button", { name: "Save invoice", exact: true }).click();
  await expect(page.getByText("CED-NEW", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("CED-NEW", { exact: true })).toBeVisible();
  await page.goto("/app/invoices/cedar-oct");
  await page.getByRole("button", { name: "Correct record" }).first().click();
  await page
    .getByLabel("Reason for correction")
    .fill("Browser validation correction");
  await page.getByRole("button", { name: "Save correction" }).click();
  await expect(page.getByText("Superseded", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
for (const width of [1440, 390, 320])
  test(`responsive layout and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    for (const path of [
      "/",
      "/demo",
      "/app/plan",
      "/app/invoices",
      "/app/activity",
      "/app/settings",
      "/evidence",
      "/privacy",
    ]) {
      await page.goto(path);
      if (path === "/demo")
        await expect(
          page.getByRole("heading", { name: "A little room to plan ahead." }),
        ).toBeVisible();
      else await page.waitForTimeout(350);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path + " horizontal overflow",
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        path + " accessibility",
      ).toEqual([]);
    }
  });
test("motion pause and reduced-motion control", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(
    page.getByRole("button", { name: "Resume animation" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume animation" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Reduced motion enabled" }),
  ).toBeDisabled();
});
test("wallet sign-in module loads with an accessible fallback", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/signin");
  await expect(
    page.getByRole("heading", { name: "Your private workspace" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Choose a Mainnet Sui wallet, then sign the Runway message.",
    ),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
