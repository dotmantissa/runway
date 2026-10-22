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
test("invoice assistant reviews a synthetic draft before saving", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "A little room to plan ahead." }),
  ).toBeVisible();
  await page.goto("/app/invoices");
  await page
    .getByRole("button", { name: "Invoice assistant", exact: true })
    .click();
  await page.getByRole("button", { name: "Try a sample invoice" }).click();
  await expect(
    page.getByText("No payment was made.", { exact: false }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Review sample draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Review the extracted invoice" }),
  ).toBeVisible();
  await expect(page.getByLabel("Invoice reference")).toHaveValue("CEDAR-105");
  await expect(page.getByLabel("Amount (USDC)", { exact: true })).toHaveValue(
    "1200",
  );
  await page.getByLabel("Invoice reference").fill("REVIEWED-SAMPLE");
  await page.getByLabel("Amount (USDC)", { exact: true }).fill("1199");
  await page.getByRole("button", { name: "Save invoice", exact: true }).click();
  await expect(
    page.getByText("REVIEWED-SAMPLE", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("REVIEWED-SAMPLE", { exact: true }),
  ).toBeVisible();
});
test("paid assistant requires explicit purchase approval and draft review", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const orderId = "11111111-1111-4111-8111-111111111111";
  const recipient = "0x" + "9".repeat(64),
    wallet = "0x" + "2".repeat(64);
  let status = "quoted",
    approved = false,
    confirmed = false;
  const result = {
    clientAlias: "New review client",
    invoiceReference: "PAID-DRAFT",
    amountAtomic: "1200000000",
    dueDate: "2026-10-30",
    provider: "structured_text",
    warnings: [],
  };
  const order = () => ({
    id: orderId,
    status,
    amount_atomic: "10000",
    gas_budget: "5000000",
    service_url: "https://parser.example/invoice",
    recipient,
    wallet_address: wallet,
    network: "sui:mainnet",
    result: status === "result_ready" ? result : null,
    payment_digest: approved ? "injected-browser-payment" : null,
  });
  // Inject only the paid-service UI responses. This is browser workflow evidence,
  // separate from the backend tests of actual MPP credentials and budget locks.
  await page.route("**/api/v1/tools/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/config"))
      return route.fulfill({
        json: {
          available: true,
          policy: {
            enabled: true,
            perCallAtomic: "10000",
            dailyAtomic: "200000",
          },
          amountAtomic: "10000",
          recipient,
          walletAddress: wallet,
          serviceUrl: "https://parser.example/invoice",
          maxGasMist: "5000000",
          dailyGasMist: "20000000",
        },
      });
    if (path.endsWith("/quote"))
      return route.fulfill({ json: { order: order() } });
    if (path.endsWith("/invoice-parse/orders")) {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        approvedAmountAtomic: "10000",
        approvedMaxGasMist: "5000000",
        recipient,
        network: "sui:mainnet",
        consentToShare: true,
      });
      approved = true;
      status = "result_ready";
      return route.fulfill({
        status: 202,
        json: { orderId, jobId: "injected-job" },
      });
    }
    if (path.endsWith("/confirm")) {
      confirmed = true;
      return route.abort();
    }
    if (path.endsWith(orderId))
      return route.fulfill({ json: { order: order() } });
    return route.continue();
  });
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "A little room to plan ahead." }),
  ).toBeVisible();
  await page.goto("/app/invoices");
  await page
    .getByRole("button", { name: "Invoice assistant", exact: true })
    .click();
  await page
    .getByLabel("Invoice text", { exact: true })
    .fill(
      "Client: New review client\nInvoice: PAID-DRAFT\nTotal: 1200 USDC\nDue date: 2026-10-30",
    );
  await page.getByRole("button", { name: "Get a parser quote" }).click();
  const purchase = page.getByRole("button", {
    name: "Approve 0.01 USDC and parse",
  });
  await expect(purchase).toBeDisabled();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(approved).toBe(false);
  await page
    .getByRole("checkbox", {
      name: "I approve this 0.01 USDC purchase",
      exact: false,
    })
    .check();
  await purchase.click();
  await page.getByRole("button", { name: "Review extracted draft" }).click();
  await expect(page.getByLabel("New client name")).toHaveValue(
    "New review client",
  );
  await expect(page.getByLabel("Invoice reference")).toHaveValue("PAID-DRAFT");
  expect(approved).toBe(true);
  expect(confirmed).toBe(false);
});
