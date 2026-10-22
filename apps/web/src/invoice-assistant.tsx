import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { api } from "./api.js";
import { Button, ErrorNote, Field, Money } from "./components.js";
import { parseMoney, moneyInput } from "../../../packages/domain/src/index.js";
import type { InvoiceDraft } from "../../server/src/adapters/parser/index.js";

interface Settings {
  available: boolean;
  policy: { enabled: boolean; perCallAtomic: string; dailyAtomic: string };
  amountAtomic: string;
  serviceUrl: string;
  recipient: string | null;
  walletAddress: string | null;
  maxGasMist: string;
  dailyGasMist: string;
}
export default function InvoiceAssistant({
  workspaceId,
  stateVersion,
  onDraft,
}: {
  workspaceId: string;
  stateVersion: number;
  onDraft: (draft: InvoiceDraft, orderId?: string) => void;
}) {
  const config = useQuery<Settings>({
    queryKey: ["invoice-agent", workspaceId],
    queryFn: () => api("/tools/invoice-parse/config"),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  const [text, setText] = useState(""),
    [pdf, setPdf] = useState<{
      kind: "pdf";
      mime: "application/pdf";
      base64: string;
    } | null>(null);
  const [sample, setSample] = useState<{
    text: string;
    draft: InvoiceDraft;
  } | null>(null);
  const storageKey = "runway-invoice-order:" + workspaceId;
  const [orderId, setOrderId] = useState(
    () => sessionStorage.getItem(storageKey) || "",
  );
  const [approved, setApproved] = useState(false);
  const [perCall, setPerCall] = useState("0.01"),
    [daily, setDaily] = useState("0.20");
  useEffect(() => {
    if (config.data) {
      setPerCall(moneyInput(config.data.policy.perCallAtomic));
      setDaily(moneyInput(config.data.policy.dailyAtomic));
    }
  }, [config.data?.policy.perCallAtomic, config.data?.policy.dailyAtomic]);
  const orderQuery = useQuery({
    queryKey: ["invoice-order", workspaceId, orderId],
    queryFn: () => api("/tools/orders/" + orderId),
    enabled: !!orderId,
    refetchInterval: (q) =>
      q.state.data &&
      ![
        "quoted",
        "result_ready",
        "user_confirmed",
        "service_failed_paid",
        "needs_review",
        "failed",
        "cancelled",
        "expired",
      ].includes(q.state.data.order.status)
        ? 2000
        : false,
  });
  const order = orderQuery.data?.order;
  async function run(operation: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  function selectOrder(id: string) {
    setOrderId(id);
    sessionStorage.setItem(storageKey, id);
  }
  const input = pdf || { kind: "text", text };
  return (
    <div className="form invoice-assistant">
      <div className="assistant-note">
        <ShieldCheck size={20} />
        <p>
          The invoice assistant reads clearly labelled fields from text or a
          PDF. You review the client, amount and date before saving expected
          income.
        </p>
      </div>
      <p className="helper">
        Extraction uses structured text rules. Supported labels are Client,
        Invoice, Total in USDC, and Due date in YYYY-MM-DD format.
      </p>
      <Button
        secondary
        busy={busy}
        onClick={() =>
          void run(async () => {
            setSample(await api("/tools/invoice-parse/sample"));
          })
        }
      >
        <FileText size={17} />
        Try a sample invoice
      </Button>
      {sample ? (
        <section className="parser-panel">
          <h3>Synthetic example</h3>
          <pre>{sample.text}</pre>
          <p>
            No payment was made. Review the fields before adding this synthetic
            expectation to your workspace.
          </p>
          <Button secondary onClick={() => onDraft(sample.draft)}>
            Review sample draft <ArrowRight size={16} />
          </Button>
        </section>
      ) : null}
      {config.isPending ? (
        <p role="status">Checking invoice assistant availability</p>
      ) : null}
      {config.data && !config.data.available ? (
        <p className="helper">
          Paid parsing is not enabled for this workspace. The sample and manual
          invoice entry are available.
        </p>
      ) : null}
      {config.data?.available ? (
        <>
          <section className="parser-panel">
            <h3>Your tool allowance</h3>
            <p>
              The agent uses a separate tool wallet. Its funds are excluded from
              your cash-flow plan. Each purchase also needs your approval.
            </p>
            <Field
              label="Maximum per purchase (USDC)"
              name="tool-per-call"
              inputMode="decimal"
              value={perCall}
              onChange={(e) => setPerCall(e.target.value)}
            />
            <Field
              label="Daily allowance (USDC)"
              name="tool-daily"
              inputMode="decimal"
              value={daily}
              onChange={(e) => setDaily(e.target.value)}
            />
            <p className="helper">
              Maximum 0.05 USDC per purchase and 0.20 USDC per UTC day. Gas is
              counted separately, up to {config.data.maxGasMist} MIST per call
              and {config.data.dailyGasMist} MIST per day. The wallet balance is
              the financial boundary; these limits are enforced by Runway.
            </p>
            <p>
              Current limits: {moneyInput(config.data.policy.perCallAtomic)}{" "}
              USDC per call, {moneyInput(config.data.policy.dailyAtomic)} USDC
              per day. New spending is{" "}
              {config.data.policy.enabled ? "enabled" : "stopped"}.
            </p>
            <Button
              busy={busy}
              secondary
              onClick={() =>
                void run(async () => {
                  await api("/tools/policy", "PUT", {
                    enabled: true,
                    perCallAtomic: parseMoney(perCall),
                    dailyAtomic: parseMoney(daily),
                  });
                  await config.refetch();
                })
              }
            >
              Approve these limits
            </Button>
            {config.data.policy.enabled ? (
              <Button
                secondary
                busy={busy}
                onClick={() =>
                  void run(async () => {
                    await api("/tools/policy", "PUT", {
                      enabled: false,
                      perCallAtomic: config.data!.policy.perCallAtomic,
                      dailyAtomic: config.data!.policy.dailyAtomic,
                    });
                    await config.refetch();
                  })
                }
              >
                Stop new spending
              </Button>
            ) : null}
          </section>
          <Field label="Invoice text" name="parser-text">
            <textarea
              id="parser-text"
              value={text}
              maxLength={20000}
              rows={7}
              onChange={(e) => {
                setText(e.target.value);
                setPdf(null);
              }}
              placeholder={
                "Client: Cedar Studio\nInvoice: CEDAR-105\nTotal: 1200.00 USDC\nDue date: 2026-10-30"
              }
            />
          </Field>
          <Field label="Or choose a PDF" name="parser-pdf">
            <input
              id="parser-pdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setPdf(null);
                  return;
                }
                void run(async () => {
                  if (
                    file.type !== "application/pdf" ||
                    file.size > 2 * 1024 * 1024
                  )
                    throw new Error("Choose a PDF no larger than 2 MB.");
                  const base64 = await new Promise<string>(
                    (resolve, reject) => {
                      const reader = new FileReader();
                      reader.onerror = () =>
                        reject(new Error("The PDF could not be read."));
                      reader.onload = () =>
                        resolve(String(reader.result).split(",")[1]);
                      reader.readAsDataURL(file);
                    },
                  );
                  setPdf({ kind: "pdf", mime: "application/pdf", base64 });
                  setText("");
                });
              }}
            />
          </Field>
          <p className="helper">
            Up to 2 MB and 10 pages with selectable text. Encrypted and scanned
            PDFs need text or manual entry. The original PDF is processed in
            memory. Extracted text expires after one hour or when the result is
            ready and is never published to Walrus.
          </p>
          <Button
            busy={busy}
            disabled={!pdf && text.trim().length < 10}
            onClick={() =>
              void run(async () => {
                const result = await api(
                  "/tools/invoice-parse/quote",
                  "POST",
                  input,
                );
                selectOrder(result.order.id);
                setApproved(false);
              })
            }
          >
            Get a parser quote
          </Button>
        </>
      ) : null}
      {order ? (
        <section className="parser-panel" aria-live="polite">
          <h3>
            {order.status === "result_ready"
              ? "Your draft is ready"
              : order.status === "quoted"
                ? "Review the purchase"
                : "Existing parser order"}
          </h3>
          <p>
            Price: <Money value={String(order.amount_atomic)} />. Sui Mainnet,
            native USDC.
          </p>
          <p className="helper">
            Maximum gas for this purchase: {order.gas_budget} MIST.
          </p>
          <dl className="record-details">
            <dt>Service</dt>
            <dd>
              <code>{order.service_url}</code>
            </dd>
            <dt>Recipient</dt>
            <dd>
              <code>{order.recipient}</code>
            </dd>
            <dt>Tool wallet</dt>
            <dd>
              <code>{order.wallet_address}</code>
            </dd>
            <dt>Status</dt>
            <dd>{order.status.replaceAll("_", " ")}</dd>
            {order.payment_digest ? (
              <>
                <dt>Payment digest</dt>
                <dd>
                  <code>{order.payment_digest}</code>
                </dd>
              </>
            ) : null}
          </dl>
          {order.status === "quoted" ? (
            <>
              {order.input_preview ? (
                <details>
                  <summary>Review the extracted invoice text</summary>
                  <pre>{order.input_preview}</pre>
                </details>
              ) : null}
              <p>
                This is a builder-operated parser service. Payment can settle
                even if extraction later fails. A failed paid job retains its
                payment for retry.
              </p>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                />
                I approve this 0.01 USDC purchase, the gas limit above, and
                sending this invoice text to the named service.
              </label>
              <Button
                busy={busy}
                disabled={!approved || !config.data?.policy.enabled}
                onClick={() =>
                  void run(async () => {
                    await api("/tools/invoice-parse/orders", "POST", {
                      quoteId: order.id,
                      approvedAmountAtomic: "10000",
                      approvedMaxGasMist: String(order.gas_budget),
                      recipient: order.recipient,
                      network: "sui:mainnet",
                      consentToShare: true,
                      expectedStateVersion: stateVersion,
                    });
                    await orderQuery.refetch();
                  })
                }
              >
                Approve 0.01 USDC and parse
              </Button>
            </>
          ) : null}
          {order.error ? <p className="warning-text">{order.error}</p> : null}
          {[
            "service_failed_paid",
            "needs_review",
            "settlement_unknown",
          ].includes(order.status) ? (
            <>
              <p className="helper">
                Resume this order using its existing payment. If the input
                expired, choose the original invoice again above. Different
                content needs a new quote.
              </p>
              <Button
                secondary
                busy={busy}
                onClick={() =>
                  void run(async () => {
                    await api(
                      "/tools/orders/" + order.id + "/retry",
                      "POST",
                      pdf || text.trim() ? { input } : {},
                    );
                    await orderQuery.refetch();
                  })
                }
              >
                Resume existing job
              </Button>
            </>
          ) : null}
          {order.status === "result_ready" ? (
            <>
              <p>
                Payment is verified through Tatum. The extracted invoice has not
                been saved.
              </p>
              <Button onClick={() => onDraft(order.result, order.id)}>
                Review extracted draft <ArrowRight size={16} />
              </Button>
            </>
          ) : null}
          {order.status === "user_confirmed" ? (
            <p>
              Your reviewed invoice was saved. No expected income was added to
              confirmed funds.
            </p>
          ) : null}
        </section>
      ) : null}
      <ErrorNote error={error || config.error || orderQuery.error} />
    </div>
  );
}
