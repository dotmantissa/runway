import { z } from "zod";
import {
  date,
  name,
  positiveAtomic,
} from "../../../../../packages/contracts/src/index.js";
import { parseMoney } from "../../../../../packages/domain/src/index.js";
import { AppError } from "../../services/state.js";

export const parserInput = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("text"),
      text: z.string().trim().min(10).max(20000),
    })
    .strict(),
  z
    .object({
      kind: z.literal("pdf"),
      mime: z.literal("application/pdf"),
      base64: z.string().min(8).max(2796204),
    })
    .strict(),
]);
export const invoiceDraft = z
  .object({
    clientAlias: name,
    invoiceReference: name,
    amountAtomic: positiveAtomic,
    dueDate: date,
    provider: z.literal("structured_text"),
    warnings: z.array(z.string().max(200)).max(5),
  })
  .strict();
export type InvoiceDraft = z.infer<typeof invoiceDraft>;

export async function extractInvoiceText(input: z.infer<typeof parserInput>) {
  if (input.kind === "text") return input.text;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.base64))
    throw new AppError(
      422,
      "INVALID_PDF",
      "Choose a PDF file or paste the invoice text.",
    );
  const bytes = Buffer.from(input.base64, "base64");
  if (
    bytes.length > 2 * 1024 * 1024 ||
    bytes.subarray(0, 5).toString() !== "%PDF-"
  )
    throw new AppError(422, "INVALID_PDF", "Choose a PDF no larger than 2 MB.");
  // No URL inputs, OCR, JavaScript execution, attachments, or network font loading.
  const { getDocumentProxy } = await import("unpdf");
  let document: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;
  try {
    document = await getDocumentProxy(new Uint8Array(bytes), {
      useSystemFonts: false,
      disableFontFace: true,
      stopAtErrors: true,
    });
    if (document.numPages > 10) throw new Error("Page limit");
    let text = "";
    const deadline = Date.now() + 10000;
    for (let page = 1; page <= document.numPages; page++) {
      if (Date.now() > deadline) throw new Error("Extraction timeout");
      const content = await (await document.getPage(page)).getTextContent();
      for (const item of content.items)
        if ("str" in item) text += item.str + (item.hasEOL ? "\n" : " ");
      text += "\n";
      if (text.length > 20000) throw new Error("Text limit");
    }
    if (text.trim().length < 10) throw new Error("No text");
    return text.trim();
  } catch {
    throw new AppError(
      422,
      "UNSUPPORTED_PDF",
      "This PDF could not be read. Use an unencrypted PDF with selectable text, up to 10 pages, or paste the text.",
    );
  } finally {
    await document?.loadingTask.destroy();
  }
}

/** Bounded extraction agent. Document text is data, never executable instructions.
 * Ambiguous fields fail for manual review rather than guessing a financial fact.
 */
export function parseInvoiceText(text: string): InvoiceDraft {
  if (text.length > 20000)
    throw new AppError(
      422,
      "TEXT_LIMIT",
      "Use no more than 20,000 characters.",
    );
  const one = (pattern: RegExp, field: string) => {
    const values = [
      ...new Set([...text.matchAll(pattern)].map((m) => m[1].trim())),
    ];
    if (values.length !== 1)
      throw new AppError(
        422,
        "PARSER_REVIEW",
        `The ${field} is missing or ambiguous. Use a clearly labelled field or enter the invoice manually.`,
      );
    return values[0];
  };
  const clientAlias = one(
    /(?:^|\n)\s*(?:client|bill\s+to)\s*:\s*([^\n\r]{1,80})/gim,
    "client name",
  );
  const invoiceReference = one(
    /(?:^|\n)\s*invoice(?:\s+(?:number|reference|no\.?))?\s*[:#]\s*([^\n\r]{1,80})/gim,
    "invoice reference",
  );
  const dueDate = one(
    /(?:^|\n)\s*(?:due(?:\s+date)?|payment\s+date)\s*:\s*(\d{4}-\d{2}-\d{2})\s*(?=\n|\r|$)/gim,
    "ISO payment date",
  );
  const amount = one(
    /(?:^|\n)\s*(?:total(?:\s+due)?|amount(?:\s+due)?)\s*:\s*(?:USDC\s+)?(\d+(?:,\d{3})*(?:\.\d{1,6})?)\s*USDC\s*(?=\n|\r|$)/gim,
    "USDC total",
  );
  const draft = invoiceDraft.safeParse({
    clientAlias,
    invoiceReference,
    dueDate,
    amountAtomic: parseMoney(amount.replaceAll(",", "")),
    provider: "structured_text",
    warnings: [
      "Check every extracted field before saving. This is an invoice expectation, not confirmed income.",
    ],
  });
  if (!draft.success)
    throw new AppError(
      422,
      "PARSER_REVIEW",
      "The invoice fields need review. Use an ISO date and a positive native-USDC amount, or enter the invoice manually.",
    );
  return draft.data;
}
