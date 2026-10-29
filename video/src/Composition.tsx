import {AbsoluteFill, Sequence, staticFile, useVideoConfig} from "remotion";
import {Audio, Video} from "@remotion/media";
import {BasicCaptions} from "./basic-captions";
export const RunwayDemo = () => {
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{backgroundColor:"#172c23"}}>
      <Sequence name="Consumer Finance Apps" from={Math.round(0 * fps)} trimBefore={Math.round(0.1 * fps)} durationInFrames={Math.round(12.454 * fps) - Math.round(0 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-01.wav")} from={Math.round(0.25 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / Consumer Finance Apps / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "Let me show you Runway, built for the",
    "startMs": 250,
    "endMs": 3510,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Consumer Finance track. When you freelance for stablecoins,",
    "startMs": 3510,
    "endMs": 6769,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "a late invoice can leave rent uncovered, even",
    "startMs": 6769,
    "endMs": 10029,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "when your expected income looks healthy.",
    "startMs": 10029,
    "endMs": 12474,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="Signed Sui wallet" from={Math.round(12.454 * fps)} trimBefore={Math.round(13.075 * fps)} durationInFrames={Math.round(23.066666666666666 * fps) - Math.round(12.454 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-02.wav")} from={Math.round(13.325 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / Signed Sui wallet / Live wallet / Sui Mainnet</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "I am connecting the supplied Sui wallet and",
    "startMs": 13325,
    "endMs": 16902,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "signing Runway’s login message. This opens a private",
    "startMs": 16902,
    "endMs": 20478,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "workspace. The signature does not transfer funds.",
    "startMs": 20478,
    "endMs": 23608,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="Live Tatum balance" from={Math.round(23.066666666666666 * fps)} trimBefore={Math.round(24.208 * fps)} durationInFrames={Math.round(31.97266666666667 * fps) - Math.round(23.066666666666666 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-03.wav")} from={Math.round(24.458 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / Live Tatum balance / Live wallet / Sui Mainnet</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "Here I refresh the wallet through Tatum on",
    "startMs": 24458,
    "endMs": 27317,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Sui Mainnet. This is the actual balance, separate",
    "startMs": 27317,
    "endMs": 30175,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "from the example we are about to run.",
    "startMs": 30175,
    "endMs": 33034,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="A late invoice, a fixed bill" from={Math.round(31.97266666666667 * fps)} trimBefore={Math.round(33.633 * fps)} durationInFrames={Math.round(45.550666666666665 * fps) - Math.round(31.97266666666667 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-04.wav")} from={Math.round(33.883 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / A late invoice, a fixed bill / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "Now let’s open the labelled example. Eight hundred",
    "startMs": 33883,
    "endMs": 37668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "USDC is confirmed. Twelve hundred is still expected.",
    "startMs": 37668,
    "endMs": 41453,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "We have a Saturday purchase, Monday rent, and",
    "startMs": 41453,
    "endMs": 45238,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "a hundred USDC reserve.",
    "startMs": 45238,
    "endMs": 47131,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="A promise is not cash" from={Math.round(45.550666666666665 * fps)} trimBefore={Math.round(47.733 * fps)} durationInFrames={Math.round(55.99266666666666 * fps) - Math.round(45.550666666666665 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-05.wav")} from={Math.round(47.983 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / A promise is not cash / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "On the client’s promised Friday, the projection covers",
    "startMs": 47983,
    "endMs": 51354,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "rent. But an unpaid invoice is still a",
    "startMs": 51354,
    "endMs": 54724,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "promise. It never increases the money available now.",
    "startMs": 54724,
    "endMs": 58095,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="History changes the decision" from={Math.round(55.99266666666666 * fps)} trimBefore={Math.round(58.696 * fps)} durationInFrames={Math.round(72.32266666666666 * fps) - Math.round(55.99266666666666 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-06.wav")} from={Math.round(58.946 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / History changes the decision / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "Switch to past payments. Four invoices arrived three,",
    "startMs": 58946,
    "endMs": 62502,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "four, four, and five days late. That moves",
    "startMs": 62502,
    "endMs": 66057,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "Friday to Tuesday, after rent. The smallest permitted",
    "startMs": 66057,
    "endMs": 69613,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "fix is reducing the flexible purchase by a",
    "startMs": 69613,
    "endMs": 73168,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "hundred and fifty USDC.",
    "startMs": 73168,
    "endMs": 74946,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="An inspectable reason" from={Math.round(72.32266666666666 * fps)} trimBefore={Math.round(75.547 * fps)} durationInFrames={Math.round(83.57533333333333 * fps) - Math.round(72.32266666666666 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-07.wav")} from={Math.round(75.797 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / An inspectable reason / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "Here is the evidence behind that decision: which",
    "startMs": 75797,
    "endMs": 78918,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "past payments were used, the observed range, and",
    "startMs": 78918,
    "endMs": 82039,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "the median delay. You can inspect the reason",
    "startMs": 82039,
    "endMs": 85159,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "before accepting the plan.",
    "startMs": 85159,
    "endMs": 86720,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="Protect rent and the reserve" from={Math.round(83.57533333333333 * fps)} trimBefore={Math.round(87.32 * fps)} durationInFrames={Math.round(93.868 * fps) - Math.round(83.57533333333333 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-08.wav")} from={Math.round(87.57 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / Protect rent and the reserve / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "The no-payment stress test checks the downside too.",
    "startMs": 87570,
    "endMs": 90635,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "I review the change: the purchase drops from",
    "startMs": 90635,
    "endMs": 93701,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "two hundred and fifty to one hundred. Rent",
    "startMs": 93701,
    "endMs": 96766,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "stays fixed.",
    "startMs": 96766,
    "endMs": 97533,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="Save and return" from={Math.round(93.868 * fps)} trimBefore={Math.round(98.133 * fps)} durationInFrames={Math.round(104.39533333333331 * fps) - Math.round(93.868 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-09.wav")} from={Math.round(98.383 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / Save and return / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "I save the plan and reload. The change",
    "startMs": 98383,
    "endMs": 101646,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "survives. We have preserved the reserve without treating",
    "startMs": 101646,
    "endMs": 104909,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "expected income as cash, and without moving any",
    "startMs": 104909,
    "endMs": 108172,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "funds.",
    "startMs": 108172,
    "endMs": 108580,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="Recall from Walrus, live" from={Math.round(104.39533333333331 * fps)} trimBefore={Math.round(109.182 * fps)} durationInFrames={Math.round(121.02399999999996 * fps) - Math.round(104.39533333333331 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-10.wav")} from={Math.round(109.432 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / Recall from Walrus, live / Live Mainnet recall / Synthetic records</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "Now I click Recall from Walrus. This makes",
    "startMs": 109432,
    "endMs": 113383,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "a real Mainnet request for the published synthetic",
    "startMs": 113383,
    "endMs": 117334,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "records. Their identifiers and content hashes must match.",
    "startMs": 117334,
    "endMs": 121286,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "The recalled history reproduces the same hundred-and-fifty USDC",
    "startMs": 121286,
    "endMs": 125237,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "decision.",
    "startMs": 125237,
    "endMs": 125731,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="Remember corrections too" from={Math.round(121.02399999999996 * fps)} trimBefore={Math.round(126.332 * fps)} durationInFrames={Math.round(138.35666666666663 * fps) - Math.round(121.02399999999996 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-11.wav")} from={Math.round(126.582 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / Remember corrections too / Live Mainnet recall / Synthetic records</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "Memory must also remember corrections. The recalled reserve",
    "startMs": 126582,
    "endMs": 130258,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "update changes the reduction to one hundred USDC.",
    "startMs": 130258,
    "endMs": 133935,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "A separate client correction removes the wrong payment",
    "startMs": 133935,
    "endMs": 137611,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "from that history, so an old fact cannot",
    "startMs": 137611,
    "endMs": 141287,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "quietly drive the next forecast.",
    "startMs": 141287,
    "endMs": 143585,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
      <Sequence name="A finance decision you can keep" from={Math.round(138.35666666666663 * fps)} trimBefore={Math.round(144.185 * fps)} durationInFrames={Math.round(156.28666666666663 * fps) - Math.round(138.35666666666663 * fps)}>
        <Video name="Actual app footage" src={staticFile("browser-capture-trimmed.webm")} muted style={{position:"absolute",left:56,top:40,width:1808,height:926.6}} />
        <Audio name="English male narration" src={staticFile("voiceover/scene-12.wav")} from={Math.round(144.435 * fps)} />
        <div style={{position:"absolute",top:11,left:56,fontFamily:"Arial, sans-serif",fontSize:18,color:"#c3d8c8"}}>Runway / A finance decision you can keep / Consumer Finance / Synthetic example</div>
        <div style={{position:"absolute",left:60,bottom:24,width:1800,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <BasicCaptions name="English captions" width={3000} combineTokensWithinMilliseconds={0} style={{scale:0.6,flexShrink:0}} captions={[
  {
    "text": "This is the Consumer Finance idea: separate cash",
    "startMs": 144435,
    "endMs": 148045,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "from promises, protect bills before a late payment,",
    "startMs": 148045,
    "endMs": 151656,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "and carry payment lessons between sessions. The replay",
    "startMs": 151656,
    "endMs": 155266,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "publishes its misses too. Runway gives freelancers a",
    "startMs": 155266,
    "endMs": 158876,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "decision they can inspect, review, and keep.",
    "startMs": 158876,
    "endMs": 162035,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]} />
        </div>
      </Sequence>
  </AbsoluteFill>;
};
