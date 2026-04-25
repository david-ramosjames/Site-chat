/* RJL-Chat embeddable widget.
   Loaded via: <script src="/widget.js" data-client-id="..." async></script>
   Everything lives in a Shadow DOM so host-site styles cannot leak in. */
(function () {
  "use strict";
  if (window.__rjlChatLoaded) return;
  window.__rjlChatLoaded = true;

  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        var s = scripts[i];
        if (s.src && s.src.indexOf("/widget.js") !== -1) return s;
      }
      return null;
    })();
  if (!currentScript) return;

  var clientId = currentScript.getAttribute("data-client-id");
  if (!clientId) {
    console.warn("[RJL-Chat] Missing data-client-id attribute on script tag.");
    return;
  }
  var scriptOrigin = (function () {
    try { return new URL(currentScript.src).origin; } catch (e) { return ""; }
  })();

  function apiUrl(path) {
    return (scriptOrigin || "") + path;
  }

  function qs() {
    var params = {};
    try {
      var search = window.location.search.replace(/^\?/, "");
      search.split("&").forEach(function (pair) {
        if (!pair) return;
        var parts = pair.split("=");
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || "");
      });
    } catch (e) {}
    return params;
  }

  function fetchJson(url, opts) {
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error("Network " + r.status);
      return r.json();
    });
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "style" && typeof attrs[k] === "object") {
          Object.assign(node.style, attrs[k]);
        } else if (k === "className") {
          node.className = attrs[k];
        } else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") {
          node.addEventListener(k.substring(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function buildStyles(primary, accent) {
    return (
      ":host{all:initial;}" +
      "*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}" +
      ".root{position:fixed;z-index:2147483000;bottom:16px;}" +
      ".root.right{right:16px;} .root.left{left:16px;}" +
      ".bubble{display:inline-flex;align-items:center;gap:8px;background:" + primary + ";color:#fff;border:none;border-radius:999px;padding:12px 18px;font-weight:600;font-size:14px;box-shadow:0 8px 24px rgba(15,23,42,.18);cursor:pointer;}" +
      ".bubble:hover{filter:brightness(1.05);}" +
      ".bubble .dot{width:8px;height:8px;background:#22c55e;border-radius:999px;}" +
      ".avatar-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}" +
      ".root.left .avatar-wrap{align-items:flex-start;}" +
      ".tooltip{position:relative;background:#fff;color:#0b1220;border:1px solid #e2e8f0;padding:10px 32px 10px 14px;border-radius:18px;font-size:14px;font-weight:500;max-width:240px;box-shadow:0 8px 24px rgba(15,23,42,.18);}" +
      ".tooltip .x{position:absolute;top:6px;right:8px;background:transparent;border:none;cursor:pointer;color:#94a3b8;font-size:14px;line-height:1;padding:2px;}" +
      ".tooltip .x:hover{color:#0b1220;}" +
      ".avatar-btn{width:64px;height:64px;border-radius:999px;border:3px solid " + primary + ";background:#fff;cursor:pointer;padding:0;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.18);position:relative;animation:tc-pulse 2.6s ease-in-out infinite;}" +
      ".avatar-btn:hover{transform:scale(1.04);transition:transform .15s ease;}" +
      ".avatar-btn img{width:100%;height:100%;object-fit:cover;display:block;}" +
      ".avatar-btn .play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.18);color:#fff;font-size:20px;}" +
      "@keyframes tc-pulse{0%,100%{box-shadow:0 8px 24px rgba(15,23,42,.18),0 0 0 0 " + primary + "55;}50%{box-shadow:0 8px 24px rgba(15,23,42,.18),0 0 0 10px " + primary + "00;}}" +
      ".panel{position:fixed;bottom:88px;width:380px;max-width:calc(100vw - 24px);height:600px;max-height:calc(100vh - 110px);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,.25);display:flex;flex-direction:column;}" +
      ".root.right .panel{right:16px;} .root.left .panel{left:16px;}" +
      ".header{background:" + primary + ";color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;}" +
      ".header img.logo{height:22px;max-width:100px;object-fit:contain;}" +
      ".header .bname{font-weight:600;font-size:14px;}" +
      ".header .sub{font-size:12px;opacity:.85;}" +
      ".header .actions{margin-left:auto;display:flex;align-items:center;gap:6px;}" +
      ".header .lang{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;}" +
      ".header .lang:hover{background:rgba(255,255,255,.28);}" +
      ".header .close{background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px 8px;line-height:1;}" +
      ".progress{height:4px;background:rgba(255,255,255,.25);}" +
      ".progress > span{display:block;height:100%;background:#fff;transition:width .3s ease;}" +
      ".intro{position:relative;background:#000;}" +
      ".intro video,.intro iframe{display:block;width:100%;height:200px;border:0;}" +
      ".intro .skip{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;}" +
      ".body{flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;gap:10px;}" +
      ".msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.35;white-space:pre-wrap;}" +
      ".msg.bot{background:#fff;color:#0b1220;border:1px solid #e2e8f0;border-top-left-radius:4px;align-self:flex-start;}" +
      ".msg.user{background:" + primary + ";color:#fff;border-top-right-radius:4px;align-self:flex-end;}" +
      ".typing{display:inline-flex;gap:4px;align-self:flex-start;padding:10px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;border-top-left-radius:4px;}" +
      ".typing i{width:6px;height:6px;border-radius:999px;background:#94a3b8;animation:tc-bounce 1s infinite;}" +
      ".typing i:nth-child(2){animation-delay:.15s;} .typing i:nth-child(3){animation-delay:.3s;}" +
      "@keyframes tc-bounce{0%,80%,100%{transform:translateY(0);opacity:.5;}40%{transform:translateY(-4px);opacity:1;}}" +
      ".media{margin:6px 0;border-radius:12px;overflow:hidden;background:#000;max-width:90%;align-self:flex-start;}" +
      ".media img,.media video,.media iframe{display:block;width:100%;max-height:180px;object-fit:cover;border:0;}" +
      ".footer{border-top:1px solid #e2e8f0;padding:10px 12px;background:#fff;display:flex;flex-direction:column;gap:8px;}" +
      ".options{display:flex;flex-wrap:wrap;gap:6px;}" +
      ".opt{background:#fff;color:" + primary + ";border:1px solid " + primary + ";border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;}" +
      ".opt:hover{background:" + primary + ";color:#fff;}" +
      ".input-row{display:flex;gap:8px;align-items:stretch;}" +
      "input.tc-input,textarea.tc-input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:14px;outline:none;background:#fff;color:#0b1220;}" +
      "input.tc-input:focus,textarea.tc-input:focus{border-color:" + primary + ";box-shadow:0 0 0 3px " + primary + "33;}" +
      "textarea.tc-input{resize:none;min-height:44px;max-height:120px;}" +
      "button.send{background:" + accent + ";color:#fff;border:none;border-radius:10px;padding:0 14px;font-weight:600;cursor:pointer;}" +
      "button.send:disabled{opacity:.5;cursor:not-allowed;}" +
      ".success{display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center;padding:24px;}" +
      ".success .check{width:48px;height:48px;border-radius:999px;background:" + primary + ";color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;}" +
      ".brand-foot{text-align:center;font-size:11px;color:#64748b;padding:8px;background:#fff;border-top:1px solid #e2e8f0;}" +
      "@media (max-width:420px){.panel{width:calc(100vw - 16px);height:calc(100vh - 80px);bottom:80px;} .root.right .panel,.root.left .panel{right:8px;left:8px;}}"
    );
  }

  // ---- i18n ----
  // Visible UI strings that come from us, not the client config.
  var STRINGS = {
    en: {
      sub: "Usually replies in a few minutes",
      successTitle: "Thanks — we got it!",
      successBody: function (name) { return "The team at " + name + " will reach out shortly."; },
      retryBot: "Hmm, that doesn't look quite right. Could you try again?",
      networkBot: "Something went wrong sending that. Please try again in a moment.",
      send: "Send",
      skip: "Skip",
      yes: "Yes",
      no: "No",
      langSwitch: "Español",
      placeholders: {
        phone: "(555) 555-0100",
        email: "you@example.com",
        zip: "78704",
        textarea: "Type your answer…",
        text: "Type your answer…",
      },
    },
    es: {
      sub: "Normalmente respondemos en unos minutos",
      successTitle: "¡Gracias — lo recibimos!",
      successBody: function (name) { return "El equipo de " + name + " se pondrá en contacto en breve."; },
      retryBot: "Eso no parece correcto. ¿Puedes intentarlo otra vez?",
      networkBot: "Hubo un problema al enviar eso. Inténtalo de nuevo en un momento.",
      send: "Enviar",
      skip: "Omitir",
      yes: "Sí",
      no: "No",
      langSwitch: "English",
      placeholders: {
        phone: "(555) 555-0100",
        email: "tu@ejemplo.com",
        zip: "78704",
        textarea: "Escribe tu respuesta…",
        text: "Escribe tu respuesta…",
      },
    },
  };

  function buildMediaNode(step) {
    if (!step.mediaType || step.mediaType === "none" || !step.mediaUrl) return null;
    var wrap = el("div", { className: "media" });
    if (step.mediaType === "image") {
      wrap.appendChild(el("img", { src: step.mediaUrl, alt: step.altText || "" }));
    } else {
      var isEmbed = /youtube\.com\/embed|player\.vimeo\.com/.test(step.mediaUrl);
      if (isEmbed) {
        wrap.appendChild(el("iframe", {
          src: step.mediaUrl,
          allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
          frameborder: "0",
          style: { height: "200px" },
        }));
      } else {
        var v = el("video", { controls: "true", playsinline: "true", poster: step.thumbnailUrl || undefined });
        v.appendChild(el("source", { src: step.mediaUrl }));
        wrap.appendChild(v);
      }
    }
    return wrap;
  }

  function ChatWidget(config) {
    var answers = {};
    var transcript = [];
    var stepIndex = 0;
    var steps = (config.flow || []).slice().sort(function (a, b) { return a.order - b.order; });
    var host, root, body, footer, progressBar, header;
    var openBtn, tooltipNode;
    var isOpen = false;
    var panel = null;
    var currentLocale = "en";
    var currentStepInputState = null; // { step } so we can rerender on locale change
    var introCleared = false;

    var translationsAvailable =
      !!(config.widget && config.widget.enableTranslation &&
         config.widget.translations && config.widget.translations.es);

    function strings() { return STRINGS[currentLocale] || STRINGS.en; }

    function tWelcome() {
      if (currentLocale === "es" && config.widget.translations && config.widget.translations.es && config.widget.translations.es.welcomeMessage) {
        return config.widget.translations.es.welcomeMessage;
      }
      return config.widget.welcomeMessage || "Hi! How can we help?";
    }
    function tBubbleText() {
      if (currentLocale === "es" && config.widget.translations && config.widget.translations.es && config.widget.translations.es.bubbleText) {
        return config.widget.translations.es.bubbleText;
      }
      return config.widget.bubbleText || "Chat with us";
    }
    function tBubbleTooltip() {
      if (currentLocale === "es" && config.widget.translations && config.widget.translations.es && config.widget.translations.es.bubbleTooltip) {
        return config.widget.translations.es.bubbleTooltip;
      }
      return config.widget.bubbleTooltip || "";
    }
    function tStepQuestion(step) {
      if (currentLocale === "es" && step.translations && step.translations.es && step.translations.es.question) {
        return step.translations.es.question;
      }
      return step.question;
    }
    function tStepOptions(step) {
      var base = step.options || [];
      if (currentLocale === "es" && step.translations && step.translations.es && Array.isArray(step.translations.es.options) && step.translations.es.options.length) {
        var byVal = {};
        step.translations.es.options.forEach(function (o) { byVal[o.value] = o.label; });
        return base.map(function (o) {
          return { value: o.value, label: byVal[o.value] || o.label };
        });
      }
      return base;
    }
    function tYesNoOptions() {
      return [
        { value: "yes", label: strings().yes },
        { value: "no", label: strings().no },
      ];
    }

    function mount() {
      host = document.createElement("div");
      host.setAttribute("data-rjl-chat", "");
      var shadow = host.attachShadow({ mode: "open" });
      var style = document.createElement("style");
      style.textContent = buildStyles(config.widget.primaryColor, config.widget.accentColor);
      shadow.appendChild(style);

      root = el("div", {
        className: "root " + (config.widget.widgetPosition === "bottom-left" ? "left" : "right"),
      });
      shadow.appendChild(root);
      document.body.appendChild(host);

      renderBubble();
    }

    function renderBubble() {
      if (openBtn && openBtn.parentNode) openBtn.parentNode.removeChild(openBtn);
      var imgUrl = config.widget.bubbleImageUrl;
      var tip = tBubbleTooltip();

      if (imgUrl) {
        // Avatar + speech-bubble tooltip pattern.
        var wrap = el("div", { className: "avatar-wrap" });
        if (tip) {
          tooltipNode = el("div", { className: "tooltip" }, [
            tip,
            el("button", {
              className: "x",
              type: "button",
              "aria-label": "Dismiss",
              onClick: function (e) {
                e.stopPropagation();
                if (tooltipNode && tooltipNode.parentNode) tooltipNode.parentNode.removeChild(tooltipNode);
                tooltipNode = null;
              },
            }, ["×"]),
          ]);
          wrap.appendChild(tooltipNode);
        }
        var avatar = el("button", {
          className: "avatar-btn",
          type: "button",
          "aria-label": "Open chat",
          onClick: open,
        }, [
          el("img", { src: imgUrl, alt: config.business.name }),
        ]);
        // Subtle "play" overlay if an intro video is configured.
        if (config.widget.introVideoEnabled && config.widget.introVideoUrl) {
          avatar.appendChild(el("span", { className: "play" }, ["▶"]));
        }
        wrap.appendChild(avatar);
        openBtn = wrap;
      } else {
        openBtn = el("button", { className: "bubble", type: "button", onClick: open }, [
          el("span", { className: "dot" }),
          tBubbleText(),
        ]);
      }
      root.appendChild(openBtn);
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      if (openBtn) openBtn.style.display = "none";
      renderPanel();
      maybeRenderIntroVideo();
      greet();
    }

    function close() {
      isOpen = false;
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null;
      if (openBtn) openBtn.style.display = "";
    }

    function buildHeader() {
      var actions = el("div", { className: "actions" });
      if (translationsAvailable) {
        var langBtn = el("button", {
          className: "lang",
          type: "button",
          onClick: toggleLocale,
        }, [strings().langSwitch]);
        actions.appendChild(langBtn);
      }
      actions.appendChild(el("button", {
        className: "close",
        type: "button",
        "aria-label": "Close",
        onClick: close,
      }, ["×"]));

      return el("div", { className: "header" }, [
        config.widget.logoUrl
          ? el("img", { className: "logo", src: config.widget.logoUrl, alt: config.business.name })
          : el("div", {
              style: {
                width: "28px", height: "28px", borderRadius: "999px",
                background: "rgba(255,255,255,.2)", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: "600",
              },
            }, [config.business.name.slice(0, 1)]),
        el("div", {}, [
          el("div", { className: "bname" }, [config.business.name]),
          el("div", { className: "sub" }, [strings().sub]),
        ]),
        actions,
      ]);
    }

    function renderPanel() {
      panel = el("div", { className: "panel", role: "dialog", "aria-label": "Chat" });
      header = buildHeader();
      panel.appendChild(header);

      if (config.features && config.features.showProgress) {
        var pWrap = el("div", { className: "progress" });
        progressBar = el("span", { style: { width: "0%" } });
        pWrap.appendChild(progressBar);
        panel.appendChild(pWrap);
      }

      body = el("div", { className: "body" });
      panel.appendChild(body);

      footer = el("div", { className: "footer" });
      panel.appendChild(footer);

      panel.appendChild(el("div", { className: "brand-foot" }, ["Powered by RJL-Chat"]));
      root.appendChild(panel);
    }

    function maybeRenderIntroVideo() {
      if (!config.widget.introVideoEnabled || !config.widget.introVideoUrl) return;
      var url = config.widget.introVideoUrl;
      var isEmbed = /youtube\.com\/embed|player\.vimeo\.com/.test(url);
      var wrap = el("div", { className: "intro" });
      var skipBtn = el("button", {
        className: "skip",
        type: "button",
        onClick: function () {
          if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
          introCleared = true;
        },
      }, [currentLocale === "es" ? "Saltar" : "Skip"]);
      if (isEmbed) {
        wrap.appendChild(el("iframe", {
          src: url + (url.indexOf("?") === -1 ? "?" : "&") + "rel=0&autoplay=1&playsinline=1",
          allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
          frameborder: "0",
        }));
      } else {
        var v = el("video", {
          autoplay: "true",
          playsinline: "true",
          controls: "true",
          poster: config.widget.introPosterUrl || undefined,
        });
        v.appendChild(el("source", { src: url }));
        wrap.appendChild(v);
      }
      wrap.appendChild(skipBtn);
      panel.insertBefore(wrap, body);
    }

    function addMsg(role, text) {
      transcript.push({ role: role, text: text });
      var msg = el("div", { className: "msg " + role }, [text]);
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
      return msg;
    }

    function addMedia(step) {
      var node = buildMediaNode(step);
      if (!node) return;
      body.appendChild(node);
      body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
      var t = el("div", { className: "typing" }, [el("i"), el("i"), el("i")]);
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
      return t;
    }

    var lastBotMsgEl = null;
    function greet() {
      var t = showTyping();
      setTimeout(function () {
        t.remove();
        lastBotMsgEl = addMsg("bot", tWelcome());
        askNext();
      }, 400);
    }

    function updateProgress() {
      if (!progressBar) return;
      var pct = steps.length ? Math.round((stepIndex / steps.length) * 100) : 0;
      progressBar.style.width = pct + "%";
    }

    function askNext() {
      updateProgress();
      if (stepIndex >= steps.length) return submit();

      var step = steps[stepIndex];
      var mediaAllowed = !config.features || config.features.enableMedia !== false;

      if (mediaAllowed && step.mediaDisplayStyle !== "below") addMedia(step);

      var t = showTyping();
      setTimeout(function () {
        t.remove();
        lastBotMsgEl = addMsg("bot", tStepQuestion(step));
        if (mediaAllowed && step.mediaDisplayStyle === "below") addMedia(step);
        renderInputFor(step);
      }, 350);
    }

    function clearFooter() {
      while (footer.firstChild) footer.removeChild(footer.firstChild);
    }

    function accept(step, value, displayText) {
      answers[step.stepKey] = value;
      addMsg("user", displayText != null ? displayText : String(value));
      stepIndex++;
      currentStepInputState = null;
      clearFooter();
      askNext();
    }

    function renderInputFor(step) {
      currentStepInputState = { step: step };
      clearFooter();
      if (step.inputType === "multiple_choice" || step.inputType === "yes_no") {
        var options = step.inputType === "yes_no" ? tYesNoOptions() : tStepOptions(step);
        var wrap = el("div", { className: "options" });
        options.forEach(function (opt) {
          wrap.appendChild(
            el("button", {
              className: "opt",
              type: "button",
              onClick: function () { accept(step, opt.value, opt.label); },
            }, [opt.label])
          );
        });
        footer.appendChild(wrap);
        return;
      }

      var input;
      if (step.inputType === "textarea") {
        input = el("textarea", { className: "tc-input", rows: "2", placeholder: placeholderFor(step) });
      } else {
        input = el("input", {
          className: "tc-input",
          type: htmlTypeFor(step.inputType),
          inputmode: inputModeFor(step.inputType),
          placeholder: placeholderFor(step),
          autocomplete: autocompleteFor(step.inputType),
        });
      }

      function submitValue() {
        var value = input.value.trim();
        if (!value && step.isRequired) { input.focus(); return; }
        if (!value && !step.isRequired) { accept(step, "", "(skipped)"); return; }
        if (!validate(step.inputType, value)) {
          addMsg("bot", strings().retryBot);
          return;
        }
        accept(step, value);
      }

      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitValue(); }
      });

      var row = el("div", { className: "input-row" }, [
        input,
        el("button", { className: "send", type: "button", onClick: submitValue }, [strings().send]),
      ]);

      if (!step.isRequired) {
        var skipBtn = el("button", {
          type: "button",
          className: "opt",
          style: { alignSelf: "flex-start", marginTop: "4px" },
          onClick: function () { accept(step, "", "(skipped)"); },
        }, [strings().skip]);
        footer.appendChild(row);
        footer.appendChild(skipBtn);
      } else {
        footer.appendChild(row);
      }

      setTimeout(function () { input.focus(); }, 50);
    }

    function placeholderFor(step) {
      var p = strings().placeholders;
      switch (step.inputType) {
        case "phone": return p.phone;
        case "email": return p.email;
        case "zip": return p.zip;
        case "date": return "";
        case "textarea": return p.textarea;
        default: return p.text;
      }
    }
    function htmlTypeFor(t) {
      if (t === "email") return "email";
      if (t === "phone") return "tel";
      if (t === "date") return "date";
      return "text";
    }
    function inputModeFor(t) {
      if (t === "phone") return "tel";
      if (t === "email") return "email";
      if (t === "zip") return "numeric";
      return "text";
    }
    function autocompleteFor(t) {
      if (t === "email") return "email";
      if (t === "phone") return "tel";
      if (t === "zip") return "postal-code";
      return "on";
    }

    function validate(type, value) {
      if (type === "email") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
      if (type === "phone") return /^[+()\-.\s\d]{7,}$/.test(value);
      if (type === "zip") return /^\d{4,10}$/.test(value);
      return true;
    }

    function toggleLocale() {
      currentLocale = currentLocale === "en" ? "es" : "en";
      // Rebuild header so the language button label flips.
      if (panel && header && header.parentNode) {
        var newHeader = buildHeader();
        header.parentNode.replaceChild(newHeader, header);
        header = newHeader;
      }
      // Retranslate the most recent bot message (current question) in place.
      if (lastBotMsgEl) {
        if (currentStepInputState && currentStepInputState.step) {
          lastBotMsgEl.textContent = tStepQuestion(currentStepInputState.step);
        } else {
          lastBotMsgEl.textContent = tWelcome();
        }
      }
      // Re-render the current input/options in the new locale.
      if (currentStepInputState && currentStepInputState.step) {
        renderInputFor(currentStepInputState.step);
      }
    }

    function submit() {
      clearFooter();
      var t = showTyping();
      setTimeout(function () {
        t.remove();
        var params = qs();
        fetchJson(apiUrl("/api/leads"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            clientId: config.clientId,
            answers: answers,
            transcript: transcript,
            sourceUrl: (config.features && config.features.collectPageUrl !== false) ? window.location.href : null,
            referrer: (config.features && config.features.collectReferrer !== false) ? document.referrer : null,
            utm: (config.features && config.features.collectUtm !== false) ? {
              source: params.utm_source || null,
              medium: params.utm_medium || null,
              campaign: params.utm_campaign || null,
            } : null,
            userAgent: navigator.userAgent,
          }),
        }).then(function () {
          renderSuccess();
        }).catch(function () {
          addMsg("bot", strings().networkBot);
        });
      }, 400);
    }

    function renderSuccess() {
      clearFooter();
      while (body.firstChild) body.removeChild(body.firstChild);
      var wrap = el("div", { className: "success" }, [
        el("div", { className: "check" }, ["✓"]),
        el("div", { style: { fontWeight: "600", fontSize: "16px" } }, [strings().successTitle]),
        el("div", { style: { fontSize: "14px", color: "#475569" } }, [strings().successBody(config.business.name)]),
      ]);
      body.appendChild(wrap);
      if (progressBar) progressBar.style.width = "100%";
    }

    mount();
  }

  function load() {
    fetchJson(apiUrl("/api/widget-config?clientId=" + encodeURIComponent(clientId)))
      .then(function (cfg) {
        if (!cfg || !cfg.active) return;
        if (!cfg.flow || cfg.flow.length === 0) return;
        ChatWidget(cfg);
      })
      .catch(function (err) {
        console.warn("[RJL-Chat] Failed to load:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
