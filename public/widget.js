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
      ".root.right{right:16px;}" +
      ".root.left{left:16px;}" +
      ".bubble{display:inline-flex;align-items:center;gap:8px;background:" + primary + ";color:#fff;border:none;border-radius:999px;padding:12px 18px;font-weight:600;font-size:14px;box-shadow:0 8px 24px rgba(15,23,42,.18);cursor:pointer;}" +
      ".bubble:hover{filter:brightness(1.05);}" +
      ".bubble .dot{width:8px;height:8px;background:#22c55e;border-radius:999px;}" +
      ".panel{position:fixed;bottom:72px;width:360px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 96px);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,.25);display:flex;flex-direction:column;}" +
      ".root.right .panel{right:16px;} .root.left .panel{left:16px;}" +
      ".header{background:" + primary + ";color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;}" +
      ".header img{height:22px;max-width:100px;object-fit:contain;}" +
      ".header .bname{font-weight:600;font-size:14px;}" +
      ".header .sub{font-size:12px;opacity:.85;}" +
      ".header .close{margin-left:auto;background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;}" +
      ".progress{height:4px;background:rgba(255,255,255,.25);}" +
      ".progress > span{display:block;height:100%;background:#fff;transition:width .3s ease;}" +
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
      "@media (max-width:420px){.panel{width:calc(100vw - 16px);height:calc(100vh - 80px);bottom:64px;} .root.right .panel,.root.left .panel{right:8px;left:8px;}}"
    );
  }

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
    var host, root, body, footer, progressBar;
    var closeBtn, openBtn;
    var isOpen = false;

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
      openBtn = el("button", { className: "bubble", type: "button", onClick: open }, [
        el("span", { className: "dot" }),
        config.widget.bubbleText || "Chat with us",
      ]);
      root.appendChild(openBtn);
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      if (openBtn) openBtn.style.display = "none";
      renderPanel();
      greet();
    }

    function close() {
      isOpen = false;
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null;
      if (openBtn) openBtn.style.display = "";
    }

    var panel = null;
    function renderPanel() {
      panel = el("div", { className: "panel", role: "dialog", "aria-label": "Chat" });
      var header = el("div", { className: "header" }, [
        config.widget.logoUrl
          ? el("img", { src: config.widget.logoUrl, alt: config.business.name })
          : el("div", {
              style: {
                width: "28px", height: "28px", borderRadius: "999px",
                background: "rgba(255,255,255,.2)", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: "600",
              },
            }, [config.business.name.slice(0, 1)]),
        el("div", {}, [
          el("div", { className: "bname" }, [config.business.name]),
          el("div", { className: "sub" }, ["Usually replies in a few minutes"]),
        ]),
        (closeBtn = el("button", { className: "close", type: "button", "aria-label": "Close", onClick: close }, ["×"])),
      ]);
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

    function addMsg(role, text) {
      transcript.push({ role: role, text: text });
      var msg = el("div", { className: "msg " + role }, [text]);
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
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

    function greet() {
      var welcome = config.widget.welcomeMessage || "Hi! How can we help?";
      var t = showTyping();
      setTimeout(function () {
        t.remove();
        addMsg("bot", welcome);
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
        addMsg("bot", step.question);
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
      clearFooter();
      askNext();
    }

    function renderInputFor(step) {
      clearFooter();
      if (step.inputType === "multiple_choice" || step.inputType === "yes_no") {
        var options = step.inputType === "yes_no"
          ? [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]
          : (step.options || []);
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
          addMsg("bot", "Hmm, that doesn't look quite right. Could you try again?");
          return;
        }
        accept(step, value);
      }

      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitValue(); }
      });

      var row = el("div", { className: "input-row" }, [
        input,
        el("button", { className: "send", type: "button", onClick: submitValue }, ["Send"]),
      ]);

      if (!step.isRequired) {
        var skip = el("button", {
          type: "button",
          className: "opt",
          style: { alignSelf: "flex-start", marginTop: "4px" },
          onClick: function () { accept(step, "", "(skipped)"); },
        }, ["Skip"]);
        footer.appendChild(row);
        footer.appendChild(skip);
      } else {
        footer.appendChild(row);
      }

      setTimeout(function () { input.focus(); }, 50);
    }

    function placeholderFor(step) {
      switch (step.inputType) {
        case "phone": return "(555) 555-0100";
        case "email": return "you@example.com";
        case "zip": return "78704";
        case "date": return "";
        case "textarea": return "Type your answer…";
        default: return "Type your answer…";
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
          addMsg("bot", "Something went wrong sending that. Please try again in a moment.");
        });
      }, 400);
    }

    function renderSuccess() {
      clearFooter();
      while (body.firstChild) body.removeChild(body.firstChild);
      var wrap = el("div", { className: "success" }, [
        el("div", { className: "check" }, ["✓"]),
        el("div", { style: { fontWeight: "600", fontSize: "16px" } }, ["Thanks — we got it!"]),
        el("div", { style: { fontSize: "14px", color: "#475569" } }, [
          "The team at " + config.business.name + " will reach out shortly.",
        ]),
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
