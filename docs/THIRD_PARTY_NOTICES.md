# Third-party notices

The Sui MPP payment-proof serialization in `apps/server/src/adapters/parser/payment.ts` follows the canonical field order of `packages/mpp/src/proof.ts` in [mission69b/suimpp](https://github.com/mission69b/suimpp), distributed with `@suimpp/mpp` 0.9.0. Dependencies retain their respective package licenses.

MIT License

Copyright (c) 2025 suimpp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The demo composition uses [Remotion](https://www.remotion.dev/license). Its `video/src/basic-captions.tsx` source is copied unchanged from the published [Basic Captions element](https://www.remotion.dev/elements/captions/basic-captions.md). Remotion and associated packages retain their own licenses.

The English male demo narration is generated locally using [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) and [Kokoro v1.0](https://huggingface.co/hexgrad/Kokoro-82M), with the `am_michael` voice. Model and voice weights are not bundled with the app or committed in this repository. Generated speech clips are provided so the demo can be re-rendered without a speech-service account.
