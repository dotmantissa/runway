import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio, Video } from "@remotion/media";
import { BasicCaptions } from "./basic-captions";
export const RunwayDemo = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#172c23" }}>
      <Sequence
        name="Runway · Synthetic example"
        from={Math.round(0 * fps)}
        trimBefore={Math.round(2.0300000000000002 * fps)}
        durationInFrames={
          Math.round(12.347333333333331 * fps) - Math.round(0 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-01.wav")}
          from={Math.round(2.18 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Runway · Synthetic example / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "Let me show you Runway. If you're paid",
                startMs: 2180,
                endMs: 5209,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "in stablecoins, a promised invoice can make your",
                startMs: 5209,
                endMs: 8239,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "balance look safer than it is. Here, the",
                startMs: 8239,
                endMs: 11268,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "client says Friday, but their history says Tuesday.",
                startMs: 11268,
                endMs: 14297,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Confirmed funds"
        from={Math.round(12.347333333333331 * fps)}
        trimBefore={Math.round(14.899 * fps)}
        durationInFrames={
          Math.round(27.764666666666663 * fps) -
          Math.round(12.347333333333331 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-02.wav")}
          from={Math.round(17.351 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Confirmed funds / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "I'm opening the example. We have eight hundred",
                startMs: 17351,
                endMs: 20787,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "USDC confirmed, and twelve hundred still expected. Once",
                startMs: 20787,
                endMs: 24223,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "we account for rent and the reserve, there's",
                startMs: 24223,
                endMs: 27659,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "nothing available to spend right now.",
                startMs: 27659,
                endMs: 30236,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="The client's date"
        from={Math.round(27.764666666666663 * fps)}
        trimBefore={Math.round(30.838 * fps)}
        durationInFrames={
          Math.round(38.517999999999994 * fps) -
          Math.round(27.764666666666663 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-03.wav")}
          from={Math.round(32.53 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / The client's date / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "Let's look at the plan. On the client's",
                startMs: 32530,
                endMs: 35524,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "promised Friday, rent is covered. That's a possible",
                startMs: 35524,
                endMs: 38518,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "outcome, but the invoice hasn't been paid yet.",
                startMs: 38518,
                endMs: 41511,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Payment history"
        from={Math.round(38.517999999999994 * fps)}
        trimBefore={Math.round(42.113 * fps)}
        durationInFrames={
          Math.round(57.94 * fps) - Math.round(38.517999999999994 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-04.wav")}
          from={Math.round(43.151 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Payment history / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "Now I switch to past payments. This client's",
                startMs: 43151,
                endMs: 46723,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "last four invoices arrived three, four, four, and",
                startMs: 46723,
                endMs: 50294,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "five days late. The median moves this payment",
                startMs: 50294,
                endMs: 53866,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "to Tuesday, after Monday's rent. Runway suggests reducing",
                startMs: 53866,
                endMs: 57437,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "the flexible purchase by a hundred and fifty",
                startMs: 57437,
                endMs: 61009,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "USDC.",
                startMs: 61009,
                endMs: 61455,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="No-payment stress test"
        from={Math.round(57.94 * fps)}
        trimBefore={Math.round(62.059 * fps)}
        durationInFrames={
          Math.round(72.72566666666668 * fps) - Math.round(57.94 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-05.wav")}
          from={Math.round(66.93 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / No-payment stress test / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "We can also check what happens if nothing",
                startMs: 66930,
                endMs: 70351,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "arrives. The same reduction protects the reserve. The",
                startMs: 70351,
                endMs: 73772,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "history explains why this delay deserves attention.",
                startMs: 73772,
                endMs: 76765,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Review the change"
        from={Math.round(72.72566666666668 * fps)}
        trimBefore={Math.round(77.376 * fps)}
        durationInFrames={
          Math.round(85.42333333333335 * fps) -
          Math.round(72.72566666666668 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-06.wav")}
          from={Math.round(78.559 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Review the change / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "I'll review that change before saving. The purchase",
                startMs: 78559,
                endMs: 82077,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "goes from two hundred and fifty to one",
                startMs: 82077,
                endMs: 85596,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "hundred USDC. Rent stays fixed, and the reserve",
                startMs: 85596,
                endMs: 89114,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "stays protected.",
                startMs: 89114,
                endMs: 89994,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Save and reload"
        from={Math.round(85.42333333333335 * fps)}
        trimBefore={Math.round(90.607 * fps)}
        durationInFrames={
          Math.round(98.25766666666667 * fps) -
          Math.round(85.42333333333335 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-07.wav")}
          from={Math.round(93.676 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Save and reload / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "I'll save it, then reload the app. The",
                startMs: 93676,
                endMs: 96546,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "spending plan is still there. Saving changes the",
                startMs: 96546,
                endMs: 99415,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "plan; it doesn't move money or count the",
                startMs: 99415,
                endMs: 102285,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "invoice as cash.",
                startMs: 102285,
                endMs: 103361,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Invoice assistant · Free sample"
        from={Math.round(98.25766666666667 * fps)}
        trimBefore={Math.round(103.976 * fps)}
        durationInFrames={
          Math.round(113.14766666666668 * fps) -
          Math.round(98.25766666666667 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-08.wav")}
          from={Math.round(107.586 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Invoice assistant · Free sample / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "Next, let's add an invoice with the assistant.",
                startMs: 107586,
                endMs: 110476,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "I'm using the free sample. It extracts a",
                startMs: 110476,
                endMs: 113367,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "draft, then asks me to check the amount,",
                startMs: 113367,
                endMs: 116257,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "dates, and client before anything is saved.",
                startMs: 116257,
                endMs: 118786,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Confirm the invoice"
        from={Math.round(113.14766666666668 * fps)}
        trimBefore={Math.round(119.394 * fps)}
        durationInFrames={
          Math.round(129.23166666666668 * fps) -
          Math.round(113.14766666666668 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-09.wav")}
          from={Math.round(125.542 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Confirm the invoice / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "I'll edit the reference and save the reviewed",
                startMs: 125542,
                endMs: 128575,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "draft. The paid parser is optional. It needs",
                startMs: 128575,
                endMs: 131607,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "a separate tool wallet and explicit approval for",
                startMs: 131607,
                endMs: 134640,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "each purchase.",
                startMs: 134640,
                endMs: 135398,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Mainnet evidence"
        from={Math.round(129.23166666666668 * fps)}
        trimBefore={Math.round(136.002 * fps)}
        durationInFrames={
          Math.round(146.44533333333334 * fps) -
          Math.round(129.23166666666668 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-10.wav")}
          from={Math.round(137.41299999999998 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Mainnet evidence / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "Finally, here's the evidence page. Tatum verifies Sui",
                startMs: 137413,
                endMs: 141606,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "Mainnet reads. Walrus holds thirteen verified synthetic records,",
                startMs: 141606,
                endMs: 145798,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "including two corrections. A fresh process recalled the",
                startMs: 145798,
                endMs: 149991,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "history and reproduced the same calculation.",
                startMs: 149991,
                endMs: 153136,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="Corrections survive recall"
        from={Math.round(146.44533333333334 * fps)}
        trimBefore={Math.round(153.737 * fps)}
        durationInFrames={
          Math.round(159.82466666666667 * fps) -
          Math.round(146.44533333333334 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-11.wav")}
          from={Math.round(154.023 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / Corrections survive recall / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "Those corrections matter. Updating the reserve changes the",
                startMs: 154023,
                endMs: 157493,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "proposed reduction. Correcting a payment's client removes it",
                startMs: 157493,
                endMs: 160963,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "from the wrong history, so an old fact",
                startMs: 160963,
                endMs: 164434,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "can't quietly drive the next estimate.",
                startMs: 164434,
                endMs: 167036,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
      <Sequence
        name="What the results show"
        from={Math.round(159.82466666666667 * fps)}
        trimBefore={Math.round(167.643 * fps)}
        durationInFrames={
          Math.round(179.44033333333337 * fps) -
          Math.round(159.82466666666667 * fps)
        }
      >
        <Video
          name="Actual app footage"
          src={staticFile("browser-capture-trimmed.webm")}
          muted
          style={{
            position: "absolute",
            left: 56,
            top: 40,
            width: 1808,
            height: 926.6,
          }}
        />
        <Audio
          name="English male narration"
          src={staticFile("voiceover/scene-12.wav")}
          from={Math.round(168 * fps)}
        />
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 56,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c3d8c8",
          }}
        >
          Runway / What the results show / Synthetic example
        </div>
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 24,
            width: 1800,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BasicCaptions
            name="English captions"
            width={3000}
            combineTokensWithinMilliseconds={0}
            style={{ scale: 0.6, flexShrink: 0 }}
            captions={[
              {
                text: "We publish the misses too. This synthetic replay",
                startMs: 168000,
                endMs: 171653,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "had fewer reserve breaches, but worse timing accuracy",
                startMs: 171653,
                endMs: 175306,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "and some unnecessary reductions. Real user trials and",
                startMs: 175306,
                endMs: 178959,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "a funded parser purchase still need verification. That's",
                startMs: 178959,
                endMs: 182612,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "Runway: a clear decision you can inspect, review,",
                startMs: 182612,
                endMs: 186265,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
              {
                text: "and keep.",
                startMs: 186265,
                endMs: 187179,
                timestampMs: null,
                confidence: null,
                pageBreakAfter: true,
              },
            ]}
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
