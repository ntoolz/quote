
if ("serviceWorker" in navigator) {
    //window.addEventListener("load", function() {
      navigator.serviceWorker
        .register("sw.js")
        .then(res => console.log("service worker registered"))
        .catch(err => console.log("service worker not registered", err))
    //})
}

 // Resolve the script's root: a ShadowRoot when mounted via shadow
      // DOM, or `document` when this file is served standalone.
      const root = window.__demoRoot ?? document;
      const $ = (id) => root.getElementById(id);

      const canvas = $("canvas");
      const ctx = canvas.getContext("2d");
      const card = $("card");

      // Paint callback — drawElementImage() captures the entire HTML
      // card (gradients, custom fonts, layered shapes, everything) in
      // a single call. This is the native replacement for html2canvas.
      //
      // Reset + re-scale on every paint so the transform state is
      // deterministic. Previously the DPR scale lived in the
      // ResizeObserver, which meant the first frame (before any
      // resize) drew at 1x, producing a quarter-size image in the
      // top-left of the DPR=2 bitmap.
      function paintCard() {
        ctx.reset();
        ctx.drawElementImage(card, 0, 0);
      }
      canvas.onpaint = paintCard;

      // ResizeObserver: keep the canvas bitmap at its CSS pixel size
      // (not CSS × DPR). Chrome's <canvas layoutsubtree> uses the
      // canvas's bitmap width as the layout viewport for child
      // elements, so multiplying by DPR makes the children lay out
      // at 2× their intended width and overflow the bitmap. Keeping
      // the bitmap at CSS size means slightly less crisp text on
      // Retina, but the layout is correct.
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        canvas.requestPaint?.();
      }).observe(canvas);

      // ── Inputs → card mutations ──────────────────────────
      const inputTitle = $("input-title");
      const inputDesc = $("input-desc");
      const inputAuthor = $("input-author");
      const inputColor1 = $("input-color1");
      const inputColor2 = $("input-color2");
      const inputAngle = $("input-angle");
      const inputFormat = $("input-format");
      const inputQuality = $("input-quality");
      const qualityValue = $("quality-value");

      const inputFontColor1 = $("input-font-color1");
      const inputFontColor2 = $("input-font-color2");
      const inputFontAngle = $("input-font-angle");

      const cardTitle = $("card-title");
      const cardDesc = $("card-desc");
      const cardAuthorName = $("card-author-name");
      const cardDomain = $("card-domain");
      const cardAvatar = $("card-avatar");

      function getInitials(name) {
        return name
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }

      function requestRepaint() {
        canvas.requestPaint?.();
      }

      inputTitle.addEventListener("input", () => {
        cardTitle.innerHTML = inputTitle.value || "";
        requestRepaint();
      });

      inputDesc.addEventListener("input", () => {
        cardDesc.textContent = inputDesc.value;
        requestRepaint();
      });

      inputAuthor.addEventListener("input", () => {
        cardAuthorName.textContent = inputAuthor.value || "";
        cardAvatar.textContent = getInitials(inputAuthor.value || "??");
        cardDomain.textContent = cardAuthorName.textContent;
        requestRepaint();
      });

      function updateGradient() {
        card.style.setProperty("--gradient-start", inputColor1.value);
        card.style.setProperty("--gradient-end", inputColor2.value);
        card.style.setProperty("--gradient-angle", inputAngle.value + "deg");
        requestRepaint();
      }

      function updateFontGradient() {
        cardTitle.style.setProperty("--gradient-font-start", inputFontColor1.value);
        cardTitle.style.setProperty("--gradient-font-end", inputFontColor2.value);
        cardTitle.style.setProperty("--gradient-font-angle", inputFontAngle.value + "deg");
        cardDesc.style.setProperty("--desc-color", inputFontColor1.value);
        cardAvatar.style.setProperty("--desc-avatar-color",inputFontColor2.value)
        cardAuthorName.style.setProperty("--desc-author-color",inputFontColor2.value)
        requestRepaint();
      }

      inputColor1.addEventListener("input", updateGradient);
      inputColor2.addEventListener("input", updateGradient);
      inputAngle.addEventListener("input", updateGradient);

      inputFontColor1.addEventListener("input", updateFontGradient);
      inputFontColor2.addEventListener("input", updateFontGradient);
      inputFontAngle.addEventListener("input", updateFontGradient);

      const inputWidth = $("input-width");
      const inputHeight = $("input-height");

      // Setting both disables the CSS aspect-ratio; ResizeObserver repaints.
      function updateSize() {
        canvas.style.width = inputWidth.value + "px";
        canvas.style.height = inputHeight.value + "px";
      }

      inputWidth.addEventListener("input", updateSize);
      inputHeight.addEventListener("input", updateSize);

      // Show/hide quality slider based on format
      inputFormat.addEventListener("change", () => {
        const isJpeg = inputFormat.value === "image/jpeg";
        inputQuality.hidden = !isJpeg;
        qualityValue.hidden = !isJpeg;
      });

      inputQuality.addEventListener("input", () => {
        qualityValue.textContent = inputQuality.value + "%";
      });

      // Download — canvas.toBlob() captures the painted pixels.
      // Because drawElementImage() rendered real HTML into the canvas
      // moments ago, the resulting PNG/JPEG is pixel-perfect.
      $("btn-download").addEventListener("click", () => {
        const format = inputFormat.value;
        const quality =
          format === "image/jpeg"
            ? parseInt(inputQuality.value, 10) / 100
            : undefined;
        const ext = format === "image/jpeg" ? "jpg" : "png";

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "social-card." + ext;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          },
          format,
          quality,
        );
      });
