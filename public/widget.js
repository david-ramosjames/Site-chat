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

  // Attribution capture. Persists landing page + first-touch UTM/GCLID into
  // sessionStorage so the values survive multi-page navigation. Each call
  // returns the merged snapshot plus the current page URL/referrer.
  var ATTR_KEY = "rjl_chat_attribution";
  function captureAttribution() {
    var params = qs();
    var stored = {};
    try {
      var raw = sessionStorage.getItem(ATTR_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {}

    function pickFirst() {
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i]) return arguments[i];
      }
      return null;
    }

    var snapshot = {
      utmSource: pickFirst(params.utm_source, stored.utmSource),
      utmMedium: pickFirst(params.utm_medium, stored.utmMedium),
      utmCampaign: pickFirst(params.utm_campaign, stored.utmCampaign),
      utmTerm: pickFirst(params.utm_term, stored.utmTerm),
      utmContent: pickFirst(params.utm_content, stored.utmContent),
      gclid: pickFirst(params.gclid, stored.gclid),
      msclkid: pickFirst(params.msclkid, stored.msclkid),
      fbclid: pickFirst(params.fbclid, stored.fbclid),
      ttclid: pickFirst(params.ttclid, stored.ttclid),
      wbraid: pickFirst(params.wbraid, stored.wbraid),
      gbraid: pickFirst(params.gbraid, stored.gbraid),
      ndclid: pickFirst(params.ndclid, stored.ndclid),
      landingPage: stored.landingPage || (window.location && window.location.href) || null,
    };

    try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(snapshot)); } catch (e) {}

    return {
      utmSource: snapshot.utmSource,
      utmMedium: snapshot.utmMedium,
      utmCampaign: snapshot.utmCampaign,
      utmTerm: snapshot.utmTerm,
      utmContent: snapshot.utmContent,
      gclid: snapshot.gclid,
      msclkid: snapshot.msclkid,
      fbclid: snapshot.fbclid,
      ttclid: snapshot.ttclid,
      wbraid: snapshot.wbraid,
      gbraid: snapshot.gbraid,
      ndclid: snapshot.ndclid,
      landingPage: snapshot.landingPage,
      currentPage: (window.location && window.location.href) || null,
      referrer: document.referrer || null,
    };
  }

  // Read CallRail's session ID. swap.js exposes window.CallTrk; older
  // installs expose window._crqs. Both ways are best-effort — null is OK.
  function getCallRailSessionId() {
    try {
      if (window.CallTrk && typeof window.CallTrk.session === "function") {
        var s = window.CallTrk.session();
        if (s && typeof s === "string") return s;
        if (s && s.session_id) return s.session_id;
      }
    } catch (e) {}
    try {
      var match = document.cookie.match(/(?:^|;\s*)__ctmid=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    } catch (e) {}
    return null;
  }

  // Pull the swap-replaced phone from the host page. Returns the digits-only
  // E.164-ish number (whatever's in tel:href) or null.
  function getDynamicPhone(selector) {
    try {
      var sel = (selector && selector.trim()) ||
        'a[data-cr-id][href^="tel:"], a[data-numberswapper][href^="tel:"], a[href^="tel:"]';
      var el = document.querySelector(sel);
      if (!el) return null;
      var href = el.getAttribute("href") || "";
      var num = href.replace(/^tel:/i, "").trim();
      return num || null;
    } catch (e) { return null; }
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
      ".bubble{display:inline-flex;align-items:center;gap:8px;background:" + primary + ";color:#fff;border:none;border-radius:999px;padding:13px 20px;font-weight:600;font-size:15px;box-shadow:0 8px 24px rgba(15,23,42,.18);cursor:pointer;}" +
      ".bubble:hover{filter:brightness(1.05);}" +
      ".bubble .dot{width:8px;height:8px;background:#22c55e;border-radius:999px;}" +
      ".avatar-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}" +
      ".root.left .avatar-wrap{align-items:flex-start;}" +
      ".tooltip{position:relative;background:#fff;color:#0b1220;border:1px solid #e2e8f0;padding:11px 34px 11px 16px;border-radius:18px;font-size:15px;font-weight:500;max-width:260px;box-shadow:0 8px 24px rgba(15,23,42,.18);transform-origin:100% 100%;animation:tc-fanout .55s cubic-bezier(.34,1.56,.64,1) .5s both,tc-fanout-glow 3.2s ease-in-out 1.4s infinite;}" +
      ".root.left .tooltip{transform-origin:0% 100%;}" +
      ".tooltip .x{position:absolute;top:6px;right:8px;background:transparent;border:none;cursor:pointer;color:#94a3b8;font-size:14px;line-height:1;padding:2px;}" +
      ".tooltip .x:hover{color:#0b1220;}" +
      "@keyframes tc-fanout{0%{transform:scale(.55) translateY(8px);opacity:0;}55%{transform:scale(1.06) translateY(-1px);opacity:1;}80%{transform:scale(.98);}100%{transform:scale(1);opacity:1;}}" +
      "@keyframes tc-fanout-glow{0%,100%{box-shadow:0 8px 24px rgba(15,23,42,.18),0 0 0 0 " + primary + "33;}50%{box-shadow:0 8px 24px rgba(15,23,42,.18),0 0 0 6px " + primary + "00;}}" +
      ".avatar-btn{width:80px;height:80px;border-radius:999px;border:3px solid " + primary + ";background:#fff;cursor:pointer;padding:0;overflow:visible;box-shadow:0 8px 24px rgba(15,23,42,.18);position:relative;animation:tc-pulse 2.6s ease-in-out infinite;}" +
      ".avatar-btn:hover{transform:scale(1.04);transition:transform .15s ease;}" +
      ".avatar-img{width:100%;height:100%;border-radius:999px;overflow:hidden;}" +
      ".avatar-img img,.avatar-img video{width:100%;height:100%;object-fit:cover;display:block;}" +
      ".avatar-btn img,.avatar-btn video{width:100%;height:100%;object-fit:cover;display:block;}" +
      ".avatar-online{position:absolute;bottom:0;right:0;width:18px;height:18px;border-radius:999px;background:#22c55e;border:3px solid #fff;box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:tc-online-pulse 2s ease-in-out infinite;z-index:2;}" +
      "@keyframes tc-online-pulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.55);}50%{box-shadow:0 0 0 7px rgba(34,197,94,0);}}" +
      ".avatar-btn .play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.18);color:#fff;font-size:20px;border-radius:999px;}" +
      "@keyframes tc-pulse{0%,100%{box-shadow:0 8px 24px rgba(15,23,42,.18),0 0 0 0 " + primary + "55;}50%{box-shadow:0 8px 24px rgba(15,23,42,.18),0 0 0 10px " + primary + "00;}}" +
      ".panel{position:fixed;bottom:88px;width:380px;max-width:calc(100vw - 24px);height:600px;max-height:calc(100vh - 110px);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,.25);display:flex;flex-direction:column;}" +
      ".root.right .panel{right:16px;} .root.left .panel{left:16px;}" +
      ".header{background:" + primary + ";color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;}" +
      ".header img.logo{height:24px;max-width:110px;object-fit:contain;}" +
      ".brand-avatar{width:40px;height:40px;border-radius:999px;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,.18);}" +
      ".brand-avatar img,.brand-avatar video{width:100%;height:100%;object-fit:cover;display:block;}" +
      ".header .bname{font-weight:600;font-size:15px;}" +
      ".header .sub{font-size:13px;opacity:.85;}" +
      ".header .actions{margin-left:auto;display:flex;align-items:center;gap:6px;}" +
      ".header .lang{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:999px;padding:5px 11px;font-size:13px;font-weight:600;cursor:pointer;}" +
      ".header .lang:hover{background:rgba(255,255,255,.28);}" +
      ".header .expand{background:transparent;border:none;color:#fff;border-radius:999px;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s ease;}" +
      ".header .expand:hover{background:rgba(255,255,255,.18);}" +
      ".header .expand svg{width:16px;height:16px;}" +
      ".header .close{background:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.6);color:#fff;border-radius:999px;width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;transition:background .15s ease;}" +
      ".header .close:hover{background:rgba(255,255,255,.5);}" +
      // Centered modal mode for the panel.
      ".tc-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147482998;animation:tc-fade-in .25s ease both;}" +
      "@keyframes tc-fade-in{from{opacity:0;}to{opacity:1;}}" +
      ".panel.centered{position:fixed!important;top:50%!important;left:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(520px,calc(100vw - 40px))!important;height:min(720px,calc(100vh - 80px))!important;max-height:none;max-width:none;z-index:2147483001;}" +
      ".progress{height:4px;background:rgba(255,255,255,.25);}" +
      ".progress > span{display:block;height:100%;background:#fff;transition:width .3s ease;}" +
      ".intro{position:relative;background:#000;}" +
      ".intro video,.intro iframe{display:block;width:100%;height:200px;border:0;}" +
      ".intro .skip{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;}" +
      // Full-bleed background-video mode.
      ".intro-bg{position:absolute;inset:0;z-index:0;background:#000;cursor:pointer;}" +
      ".intro-bg video,.intro-bg iframe,.intro-bg img.end-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;pointer-events:none;}" +
      ".intro img.end-image{display:block;width:100%;height:200px;object-fit:cover;}" +
      ".intro-bg .play-overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35);color:#fff;font-size:48px;pointer-events:none;}" +
      ".intro-bg.is-paused .play-overlay{display:flex;}" +
      // Constrain the conversation to a fixed strip at the bottom of the panel
      // so the speaker stays visible. Body is a fixed height (not max-height)
      // and uses the margin-top:auto-on-first-child trick to keep messages
      // anchored to the bottom of the strip when content is small. When
      // content overflows, the strip scrolls internally.
      // Background-mode chat strip: anchored to the bottom of the panel as a
      // strip, but content inside the strip stacks top-to-bottom (newest at
      // the bottom) with auto-scroll suppressed so the welcome message
      // appears just below the speaker's face on initial load.
      // Body fills the entire space below the header so the scrollbar sits
      // along the entire right edge of the panel. A flex pseudo-spacer
      // reserves the top ~55% of the body so the speaker's face stays
      // uncovered: when content is short the spacer grows to push messages
      // toward the footer; when content is long the spacer holds its 55%
      // minimum and the body scrolls naturally.
      ".panel.video-bg .body{flex:1;height:auto;overflow-y:auto;position:relative;z-index:2;background:transparent;}" +
      ".panel.video-bg .body::before{content:\"\";display:block;flex:1 0 45%;}" +
      ".panel.video-bg .header{position:relative;z-index:3;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,0));}" +
      ".panel.video-bg .header .lang{background:rgba(0,0,0,.4);border-color:rgba(255,255,255,.55);}" +
      ".panel.video-bg .progress{position:relative;z-index:3;background:rgba(0,0,0,.35);}" +
      ".panel.video-bg .msg.bot{background:rgba(0,0,0,.55);color:#fff;border-color:rgba(255,255,255,.18);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}" +
      ".panel.video-bg .msg.user{background:rgba(255,255,255,.96);color:#0b1220;}" +
      ".panel.video-bg .footer{position:relative;z-index:3;background:linear-gradient(0deg,rgba(0,0,0,.55),rgba(0,0,0,0));border-top:none;}" +
      ".panel.video-bg .opt{background:rgba(0,0,0,.35);color:#fff;border-color:rgba(255,255,255,.7);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}" +
      ".panel.video-bg .opt:hover{background:rgba(255,255,255,.95);color:#0b1220;border-color:#fff;}" +
      ".panel.video-bg input.tc-input,.panel.video-bg textarea.tc-input{background:rgba(255,255,255,.95);}" +
      ".panel.video-bg .typing{background:rgba(0,0,0,.55);border-color:rgba(255,255,255,.18);}" +
      ".panel.video-bg .typing i{background:#cbd5e1;}" +
      ".panel.video-bg .brand-foot{position:relative;z-index:3;background:transparent;color:rgba(255,255,255,.85);border-top:none;}" +
      ".mute-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:4;background:rgba(0,0,0,.35);color:#fff;border:none;border-radius:999px;width:52px;height:52px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);transition:background .15s ease;}" +
      ".mute-btn:hover{background:rgba(0,0,0,.55);}" +
      ".mute-btn.muted{animation:tc-mute-pulse 1.8s ease-in-out infinite;}" +
      ".mute-btn .icon{display:flex;align-items:center;justify-content:center;}" +
      ".mute-btn .icon svg{width:24px;height:24px;}" +
      "@keyframes tc-mute-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.65);}50%{box-shadow:0 0 0 10px rgba(255,255,255,0);}}" +
      // Video control buttons (play/pause + restart).
      ".video-controls{position:absolute;top:60px;left:12px;z-index:4;display:flex;gap:8px;}" +
      ".video-ctrl{background:rgba(0,0,0,.35);color:#fff;border:none;border-radius:999px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);transition:background .15s ease;}" +
      ".video-ctrl:hover{background:rgba(0,0,0,.55);}" +
      ".video-ctrl svg{width:18px;height:18px;}" +
      // Scroll indicator pill.
      ".scroll-pill{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:5;background:rgba(255,255,255,.92);color:#0b1220;border:1px solid #e2e8f0;border-radius:999px;padding:5px 14px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;box-shadow:0 4px 12px rgba(15,23,42,.12);pointer-events:none;animation:tc-scroll-bounce 2s ease-in-out infinite;}" +
      ".scroll-pill svg{width:14px;height:14px;}" +
      "@keyframes tc-scroll-bounce{0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(-4px);}}" +
      // After the first answer the video shrinks to a small inline thumbnail
      // that sits at the top of the conversation (not overlaying it).
      ".panel.video-mini .intro-bg{position:relative;inset:auto;width:96px;height:140px;border-radius:14px;overflow:hidden;background:#000;align-self:flex-start;flex-shrink:0;box-shadow:0 6px 18px rgba(0,0,0,.18);}" +
      ".panel.video-mini .intro-bg .play-overlay{font-size:28px;}" +
      ".panel.video-mini .intro-bg .mute-btn{top:auto;left:auto;bottom:6px;right:6px;transform:none;width:32px;height:32px;}" +
      ".panel.video-mini .intro-bg .mute-btn .icon svg{width:16px;height:16px;}" +
      ".panel.video-mini .intro-bg .video-controls{top:6px;left:6px;}" +
      ".panel.video-mini .intro-bg .video-ctrl{width:28px;height:28px;}" +
      ".panel.video-mini .intro-bg .video-ctrl svg{width:14px;height:14px;}" +
      ".body{flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;gap:10px;}" +
      ".msg{max-width:85%;padding:11px 15px;border-radius:16px;font-size:15px;line-height:1.4;white-space:pre-wrap;}" +
      ".msg.bot{background:#fff;color:#0b1220;border:1px solid #e2e8f0;border-top-left-radius:4px;align-self:flex-start;}" +
      ".msg.user{background:" + primary + ";color:#fff;border-top-right-radius:4px;align-self:flex-end;}" +
      ".bot-row{display:flex;gap:8px;align-items:flex-end;align-self:flex-start;max-width:90%;}" +
      ".bot-row .msg{max-width:100%;align-self:auto;}" +
      ".chat-avatar{width:32px;height:32px;border-radius:999px;overflow:hidden;flex-shrink:0;background:#e2e8f0;}" +
      ".chat-avatar img,.chat-avatar video{width:100%;height:100%;object-fit:cover;display:block;}" +
      ".typing{display:inline-flex;gap:4px;align-self:flex-start;padding:11px 15px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;border-top-left-radius:4px;}" +
      ".typing i{width:6px;height:6px;border-radius:999px;background:#94a3b8;animation:tc-bounce 1s infinite;}" +
      ".typing i:nth-child(2){animation-delay:.15s;} .typing i:nth-child(3){animation-delay:.3s;}" +
      "@keyframes tc-bounce{0%,80%,100%{transform:translateY(0);opacity:.5;}40%{transform:translateY(-4px);opacity:1;}}" +
      ".media{margin:6px 0;border-radius:12px;overflow:hidden;background:#000;max-width:90%;align-self:flex-start;}" +
      ".media img,.media video,.media iframe{display:block;width:100%;max-height:180px;object-fit:cover;border:0;}" +
      ".footer{border-top:1px solid #e2e8f0;padding:11px 13px;background:#fff;display:flex;flex-direction:column;gap:8px;}" +
      ".options{display:flex;flex-wrap:wrap;gap:6px;}" +
      ".opt{background:#fff;color:" + primary + ";border:1px solid " + primary + ";border-radius:999px;padding:7px 14px;font-size:14px;font-weight:600;cursor:pointer;}" +
      ".opt:hover{background:" + primary + ";color:#fff;}" +
      ".undo-row{display:flex;align-self:flex-end;align-items:center;gap:6px;margin-top:-4px;}" +
      ".undo-btn{background:#fff;color:" + primary + ";border:1px solid " + primary + ";border-radius:999px;padding:4px 11px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;}" +
      ".undo-btn:hover{background:" + primary + ";color:#fff;}" +
      ".panel.video-bg .undo-btn{background:rgba(0,0,0,.55);color:#fff;border-color:rgba(255,255,255,.7);}" +
      ".panel.video-bg .undo-btn:hover{background:rgba(255,255,255,.95);color:#0b1220;}" +
      ".input-row{display:flex;gap:8px;align-items:stretch;}" +
      "input.tc-input,textarea.tc-input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:11px 13px;font-size:15px;outline:none;background:#fff;color:#0b1220;}" +
      "input.tc-input:focus,textarea.tc-input:focus{border-color:" + primary + ";box-shadow:0 0 0 3px " + primary + "33;}" +
      "textarea.tc-input{resize:none;min-height:46px;max-height:120px;}" +
      "button.send{background:" + accent + ";color:#fff;border:none;border-radius:10px;padding:0 15px;font-size:15px;font-weight:600;cursor:pointer;}" +
      "button.send:disabled{opacity:.5;cursor:not-allowed;}" +
      ".success{display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center;padding:24px;}" +
      ".success .check{width:52px;height:52px;border-radius:999px;background:" + primary + ";color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;}" +
      ".brand-foot{text-align:center;font-size:12px;color:#64748b;padding:9px;background:#fff;border-top:1px solid #e2e8f0;}" +
      // Side action buttons stack (Phone / SMS / Messenger / WhatsApp).
      ".side-stack{position:fixed;left:16px;z-index:2147482999;display:flex;flex-direction:column-reverse;gap:10px;}" +
      ".side-stack.bottom{bottom:16px;}" +
      ".side-stack.center{top:50%;transform:translateY(-50%);}" +
      ".side-btn{width:56px;height:56px;border-radius:999px;background:#fff;border:none;box-shadow:0 8px 22px rgba(15,23,42,.2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;text-decoration:none;color:#0b1220;transition:transform .15s ease;}" +
      ".side-btn:hover{transform:scale(1.06);}" +
      ".side-btn.phone{background:" + primary + ";color:#fff;}" +
      ".side-btn.sms{background:#0ea5e9;color:#fff;}" +
      ".side-btn.messenger{background:#0084ff;color:#fff;}" +
      ".side-btn.whatsapp{background:#25d366;color:#fff;}" +
      ".side-btn.custom{background:#fff;color:" + primary + ";border:1px solid " + primary + ";}" +
      // End-of-flow CTA buttons rendered on the success view.
      ".end-ctas{display:flex;flex-direction:column;gap:10px;width:100%;margin-top:18px;}" +
      ".end-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:" + primary + ";color:#fff;padding:13px 16px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;border:none;cursor:pointer;}" +
      ".end-cta:hover{filter:brightness(1.05);}" +
      ".end-cta.outline{background:#fff;color:" + primary + ";border:1px solid " + primary + ";}" +
      // Engaging two-line layout for Call/Text CTAs: prominent pulsing icon
      // on the left, centered label on top with the formatted phone number
      // below. Whole button gets a soft halo pulse to draw the eye.
      ".end-cta.phone{display:flex;align-items:center;justify-content:center;gap:14px;padding:16px 18px;text-align:center;animation:tc-cta-glow 2.2s ease-in-out infinite;}" +
      ".end-cta.phone .cta-icon{flex-shrink:0;width:42px;height:42px;border-radius:999px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:20px;animation:tc-call-pulse 2s ease-in-out infinite;}" +
      ".end-cta.phone.outline .cta-icon{background:" + primary + "1f;color:" + primary + ";}" +
      "@keyframes tc-call-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.55);}50%{box-shadow:0 0 0 9px rgba(255,255,255,0);}}" +
      "@keyframes tc-cta-glow{0%,100%{box-shadow:0 0 0 0 " + primary + "55, 0 6px 14px rgba(15,23,42,.18);}50%{box-shadow:0 0 0 12px " + primary + "00, 0 6px 14px rgba(15,23,42,.18);}}" +
      ".end-cta.phone .cta-text{display:flex;flex-direction:column;align-items:center;line-height:1.2;text-align:center;}" +
      ".end-cta.phone .cta-label{font-size:16px;font-weight:700;letter-spacing:.2px;}" +
      ".end-cta.phone .cta-sub{font-size:14px;font-weight:600;opacity:.95;letter-spacing:.3px;margin-top:3px;}" +
      "@media (max-width:420px){.panel{width:calc(100vw - 16px);height:calc(100vh - 80px);bottom:80px;} .root.right .panel,.root.left .panel{right:8px;left:8px;} .side-stack{left:8px;gap:8px;} .side-stack.bottom{bottom:8px;} .side-btn{width:53px;height:53px;} .avatar-btn{width:84px;height:84px;}}"
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
      undo: "Undo",
      unmute: "Tap for sound",
      langSwitch: "Español",
      declineTitle: "Thanks for reaching out",
      declineBody: "Unfortunately we're not able to take this case at this time. We wish you the best of luck.",
      placeholders: {
        phone: "(555) 555-0100",
        phoneMX: "55 1234 5678",
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
      undo: "Deshacer",
      unmute: "Toca para sonido",
      langSwitch: "English",
      declineTitle: "Gracias por escribirnos",
      declineBody: "Lamentablemente no podemos ayudarte con este caso. Te deseamos lo mejor.",
      placeholders: {
        phone: "(555) 555-0100",
        phoneMX: "55 1234 5678",
        email: "tu@ejemplo.com",
        zip: "78704",
        textarea: "Escribe tu respuesta…",
        text: "Escribe tu respuesta…",
      },
    },
  };

  function isVideoUrl(url) {
    return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url || "");
  }

  // Renders a still image, animated GIF, or muted-looping video for use as
  // the floating bubble or the panel header avatar. Returns a node or null.
  function renderAvatarMedia(url, alt) {
    if (!url) return null;
    if (isVideoUrl(url)) {
      var v = el("video", {
        autoplay: "true",
        loop: "true",
        playsinline: "true",
        "webkit-playsinline": "true",
        "aria-hidden": "true",
      });
      v.muted = true; // attribute alone won't satisfy iOS Safari autoplay
      v.appendChild(el("source", { src: url }));
      return v;
    }
    return el("img", { src: url, alt: alt || "" });
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

  function detectInitialLocale(translations) {
    if (!translations || !translations.es) return "en";
    try {
      // 1. URL contains an "/es" path segment.
      var path = window.location.pathname || "";
      if (/(^|\/)es(\/|$)/i.test(path)) return "es";
      // 2. ?lang=es or ?locale=es in query string.
      if (/[?&](lang|locale)=es\b/i.test(window.location.search || "")) return "es";
      // 3. <html lang="es"> on the host page.
      var docLang = (document.documentElement.lang || "").toLowerCase();
      if (docLang.indexOf("es") === 0) return "es";
    } catch (_e) {}
    return "en";
  }

  function isMobileViewport() {
    try { return window.matchMedia("(max-width: 768px)").matches; } catch (_e) {}
    return false;
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
    var sideStackHost = null;
    var secondWelcomeTimer = null;
    var currentLocale = detectInitialLocale(config.widget && config.widget.translations);
    var currentStepInputState = null; // { step } so we can rerender on locale change
    var introCleared = false;
    var introBgEl = null;        // .intro-bg wrapper for background-mode video
    var introVideoEl = null;     // the underlying <video> element (null for iframes)
    var muteBtn = null;          // mute toggle anchored to the panel
    var historyStack = [];       // [{ step, userRow, botRow, undoEl, prevBotMsgEl }]
    var miniMode = false;        // true once first answer transitioned us out of full bg
    var askVersion = 0;          // bumped on every askNext + on undo to cancel pending typing
    var centeredMode = false;    // panel centered as a modal vs. anchored in the corner
    var backdropEl = null;
    var endingMode = "success";  // "success" (default + CTAs) or "decline" (no CTAs)
    var inBodyOptionsEl = null;  // option pills appended into body for the current step
    var hasStartedFlow = false;  // toggled true after the visitor's first answer
    var sessionId = (function () {
      try {
        var key = "rjlChatSession:" + config.clientId;
        var existing = sessionStorage.getItem(key);
        if (existing) return existing;
        var fresh = "s_" + Date.now().toString(36) + "_" +
          Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(key, fresh);
        return fresh;
      } catch (e) {
        return "s_" + Date.now().toString(36) + "_" +
          Math.random().toString(36).slice(2, 10);
      }
    })();

    function trackEvent(type, source) {
      try {
        var attr = (function () { try { return captureAttribution(); } catch (e) { return {}; } })();
        var collectPage = !config.features || config.features.collectPageUrl !== false;
        var collectRef = !config.features || config.features.collectReferrer !== false;
        fetch(apiUrl("/api/events"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            clientId: config.clientId,
            sessionId: sessionId,
            type: type,
            source: source || null,
            sourceUrl: collectPage ? (attr.currentPage || null) : null,
            referrer: collectRef ? (attr.referrer || null) : null,
            userAgent: navigator.userAgent,
          }),
        }).catch(function () {});
      } catch (e) {}
    }

    var translationsAvailable =
      !!(config.widget && config.widget.enableTranslation &&
         config.widget.translations && config.widget.translations.es);

    function strings() { return STRINGS[currentLocale] || STRINGS.en; }

    function introVideoUrl() {
      return (currentLocale === "es" && config.widget.introVideoUrlEs) ||
        config.widget.introVideoUrl ||
        "";
    }
    function introPosterUrl() {
      return (currentLocale === "es" && config.widget.introPosterUrlEs) ||
        config.widget.introPosterUrl ||
        "";
    }
    function introEndImageUrl() {
      return (currentLocale === "es" && config.widget.introVideoEndImageUrlEs) ||
        config.widget.introVideoEndImageUrl ||
        "";
    }

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
    function tDeclineHeadline() {
      var es = config.widget.translations && config.widget.translations.es;
      if (currentLocale === "es" && es && es.declineHeadline) return es.declineHeadline;
      return config.widget.declineHeadline || strings().declineTitle;
    }
    function tDeclineMessage() {
      var es = config.widget.translations && config.widget.translations.es;
      if (currentLocale === "es" && es && es.declineMessage) return es.declineMessage;
      return config.widget.declineMessage || strings().declineBody;
    }
    function tSuccessHeadline() {
      var es = config.widget.translations && config.widget.translations.es;
      if (currentLocale === "es" && es && es.successHeadline) return es.successHeadline;
      return config.widget.successHeadline || strings().successTitle;
    }
    function tSuccessMessage() {
      var es = config.widget.translations && config.widget.translations.es;
      if (currentLocale === "es" && es && es.successMessage) return es.successMessage;
      return config.widget.successMessage || strings().successBody(config.business.name);
    }
    function tHeaderSubtitle() {
      if (currentLocale === "es" && config.widget.headerSubtitleEs) return config.widget.headerSubtitleEs;
      return config.widget.headerSubtitle || strings().sub;
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

      // Auto-open is desktop-only — on mobile we keep the floating bubble
      // so visitors aren't smacked with a full-screen panel uninvited.
      var willAutoOpen = !!(config.widget.openOnLoad && !isMobileViewport());

      if (!willAutoOpen) {
        renderBubble();
        scheduleSecondWelcome();
      }
      renderSideButtons();

      // Snapshot attribution into sessionStorage immediately so we don't
      // lose first-touch UTM/GCLID if the visitor navigates before opening
      // the chat. Subsequent submits read the persisted snapshot.
      try { captureAttribution(); } catch (e) {}

      if (willAutoOpen) {
        // Skip the floating bubble entirely; go straight to the panel.
        // If the visitor closes the panel they'll get the avatar after.
        setTimeout(function () {
          if (!isOpen) open("auto");
        }, 100);
      }
    }

    function renderSideButtons() {
      var list = config.widget.sideButtons || [];
      if (!list.length) return;
      var mobile = isMobileViewport();
      var locale = currentLocale;
      var visible = list.filter(function (b) {
        if (!b || !b.destination) return false;
        if (mobile && !b.showOnMobile) return false;
        if (!mobile && !b.showOnDesktop) return false;
        if (locale === "es" && !b.showInSpanish) return false;
        if (locale === "en" && !b.showInEnglish) return false;
        return true;
      });
      if (!visible.length) return;
      sideStackHost = document.createElement("div");
      sideStackHost.setAttribute("data-rjl-side-stack", "");
      var sideShadow = sideStackHost.attachShadow({ mode: "open" });
      var s = document.createElement("style");
      s.textContent = buildStyles(config.widget.primaryColor, config.widget.accentColor);
      sideShadow.appendChild(s);
      var posClass = config.widget.sideButtonsPosition === "center" ? "center" : "bottom";
      var stack = el("div", { className: "side-stack " + posClass });
      visible.forEach(function (b) {
        var href = sideButtonHref(b);
        var icon = sideButtonIcon(b.type);
        var title = b.label || sideButtonDefaultLabel(b.type);
        var node = el("a", {
          className: "side-btn " + b.type,
          href: href,
          target: b.type === "messenger" || b.type === "custom" ? "_blank" : undefined,
          rel: "noopener",
          "aria-label": title,
          title: title,
        }, [icon]);
        stack.appendChild(node);
      });
      sideShadow.appendChild(stack);
      document.body.appendChild(sideStackHost);
    }

    function sideButtonHref(b) {
      var raw = (b.destination || "").trim();
      var dest = phoneShapedTypes[b.type] ? resolvePhone(raw) : raw;
      switch (b.type) {
        case "phone":
          return "tel:" + dest.replace(/[^+\d]/g, "");
        case "sms":
          return "sms:" + dest.replace(/[^+\d]/g, "");
        case "whatsapp":
          if (/^https?:\/\//i.test(dest)) return dest;
          return "https://wa.me/" + dest.replace(/[^+\d]/g, "").replace(/^\+/, "");
        case "messenger":
          if (/^https?:\/\//i.test(raw)) return raw;
          return "https://m.me/" + raw;
        case "custom":
        default:
          return raw;
      }
    }

    var phoneShapedTypes = { phone: true, sms: true, whatsapp: true };

    // When the dynamic-number toggle is on AND swap.js gave us a number,
    // prefer that over the admin-configured phone. Fall back to configured
    // when CallRail isn't ready yet (or never loaded).
    function resolvePhone(configured) {
      if (!config.widget.callRailUseDynamicNumber) return configured;
      var dyn = getDynamicPhone(config.widget.callRailDynamicNumberSelector);
      return dyn || configured;
    }

    function sideButtonIcon(type) {
      // Minimal inline SVGs so the icons render the same on every platform
      // (vs. emoji which can look very different across OS/browsers).
      var SVG_NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", "22");
      svg.setAttribute("height", "22");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "currentColor");
      svg.setAttribute("aria-hidden", "true");
      var d;
      switch (type) {
        case "phone":
          d = "M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z";
          break;
        case "sms":
          d = "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z";
          break;
        case "messenger":
          d = "M12 2C6.48 2 2 6.16 2 11.13c0 2.84 1.45 5.36 3.7 7l-.04 4.07 3.84-2.1c.79.22 1.62.34 2.5.34 5.52 0 10-4.16 10-9.31C22 6.16 17.52 2 12 2zm1.16 12.13l-2.59-2.74-4.95 2.74 5.45-5.78 2.65 2.74 4.89-2.74-5.45 5.78z";
          break;
        case "whatsapp":
          d = "M17.6 14.5c-.3-.15-1.7-.83-1.95-.93-.27-.1-.46-.15-.65.15-.2.3-.75.93-.92 1.12-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.13-.13.3-.34.45-.51.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.65-1.58-.9-2.17-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.5.07-.77.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.22 5.1 4.51.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2.0-1.43.25-.7.25-1.31.18-1.43-.07-.13-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.45 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02C17.18 3.03 14.69 2 12.04 2z";
          break;
        default:
          d = "M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM5 5h4V3H3v18h18v-6h-2v4H5V5z";
      }
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
      return svg;
    }

    function sideButtonDefaultLabel(type) {
      switch (type) {
        case "phone": return currentLocale === "es" ? "Llamar" : "Call us";
        case "sms": return currentLocale === "es" ? "Mensaje" : "Text us";
        case "messenger": return "Messenger";
        case "whatsapp": return "WhatsApp";
        default: return "Link";
      }
    }

    function scheduleSecondWelcome() {
      var msg = currentLocale === "es"
        && config.widget.translations
        && config.widget.translations.es
        && config.widget.translations.es.secondWelcomeMessage
          ? config.widget.translations.es.secondWelcomeMessage
          : config.widget.secondWelcomeMessage;
      if (!msg || isOpen) return;
      var delaySec = Number(config.widget.secondWelcomeDelaySec) || 30;
      secondWelcomeTimer = setTimeout(function () {
        if (isOpen) return;
        // Replace the existing tooltip with a fresh node so the fan-out
        // animation fires again — re-engagement should feel like a new
        // message arrived.
        var imgUrl = config.widget.bubbleImageUrl;
        if (!imgUrl || !root) return;
        var wrap = openBtn;
        if (!wrap) return;
        // Strip any existing tooltip first.
        if (tooltipNode && tooltipNode.parentNode) {
          tooltipNode.parentNode.removeChild(tooltipNode);
          tooltipNode = null;
        }
        tooltipNode = el("div", { className: "tooltip" }, [
          msg,
          el("button", {
            className: "x",
            type: "button",
            "aria-label": "Dismiss",
            onClick: function (e) {
              e.stopPropagation();
              if (tooltipNode && tooltipNode.parentNode) {
                tooltipNode.parentNode.removeChild(tooltipNode);
              }
              tooltipNode = null;
            },
          }, ["×"]),
        ]);
        applyTooltipColors(tooltipNode, true);
        if (wrap.firstChild) wrap.insertBefore(tooltipNode, wrap.firstChild);
        else wrap.appendChild(tooltipNode);
      }, delaySec * 1000);
    }

    // Override the tooltip's default white-bg / dark-text styling with the
    // admin-configured colors. The second welcome message can pick its own
    // bg/text — when blank, it falls back to the regular tooltip colors.
    function applyTooltipColors(node, isSecondWelcome) {
      if (!node) return;
      var w = config.widget || {};
      var bg = (isSecondWelcome ? w.secondWelcomeBgColor : null) || w.bubbleTooltipBgColor;
      var fg = (isSecondWelcome ? w.secondWelcomeTextColor : null) || w.bubbleTooltipTextColor;
      if (bg) {
        node.style.background = bg;
        node.style.borderColor = bg;
      }
      if (fg) {
        node.style.color = fg;
        var x = node.querySelector(".x");
        if (x) x.style.color = fg;
      }
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
          applyTooltipColors(tooltipNode, false);
          wrap.appendChild(tooltipNode);
        }
        // The image/video lives inside an inner wrapper that clips to the
        // circle; the button itself has overflow:visible so the green
        // online dot can sit half-outside the avatar bounds.
        var imgWrap = el("div", { className: "avatar-img" }, [
          renderAvatarMedia(imgUrl, config.business.name),
        ]);
        var avatar = el("button", {
          className: "avatar-btn",
          type: "button",
          "aria-label": "Open chat",
          onClick: open,
        }, [imgWrap]);
        // Pulsing green "online" badge so the avatar reads as live.
        avatar.appendChild(el("span", { className: "avatar-online", "aria-hidden": "true" }));
        // Subtle "play" overlay only when the bubble itself is a still image
        // and an intro video is configured — gives a hint without doubling up.
        if (
          !isVideoUrl(imgUrl) &&
          config.widget.introVideoEnabled &&
          introVideoUrl()
        ) {
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

    function open(openSource) {
      if (isOpen) return;
      isOpen = true;
      trackEvent("opened", openSource === "auto" ? "auto" : "click");
      if (secondWelcomeTimer) {
        clearTimeout(secondWelcomeTimer);
        secondWelcomeTimer = null;
      }
      if (openBtn) openBtn.style.display = "none";
      renderPanel();
      maybeRenderIntroVideo();
      greet();
    }

    function close() {
      isOpen = false;
      if (backdropEl && backdropEl.parentNode) backdropEl.parentNode.removeChild(backdropEl);
      backdropEl = null;
      centeredMode = false;
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null;
      // After auto-open the avatar may not yet exist; create it now so the
      // visitor can re-open the chat. Otherwise just unhide the existing one.
      if (!openBtn || !openBtn.parentNode) renderBubble();
      else openBtn.style.display = "";
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
      var hbc = config.widget.headerButtonColor;
      var expandBtn = el("button", {
        className: "expand",
        type: "button",
        "aria-label": centeredMode ? "Shrink to corner" : "Expand to center",
        title: centeredMode ? "Back to corner" : "Expand to center",
        onClick: toggleCentered,
      }, [expandIcon(centeredMode)]);
      actions.appendChild(expandBtn);
      var closeBtn = el("button", {
        className: "close",
        type: "button",
        "aria-label": "Close",
        onClick: close,
      }, ["×"]);
      if (hbc) { closeBtn.style.background = hbc; closeBtn.style.borderColor = hbc; }
      actions.appendChild(closeBtn);

      // Header is the company brand. Logo first, then a colored initial.
      var brandNode = config.widget.logoUrl
        ? el("img", {
            className: "logo",
            src: config.widget.logoUrl,
            alt: config.business.name,
          })
        : el("div", {
            style: {
              width: "28px", height: "28px", borderRadius: "999px",
              background: "rgba(255,255,255,.2)", display: "flex",
              alignItems: "center", justifyContent: "center", fontWeight: "600",
            },
          }, [config.business.name.slice(0, 1)]);

      return el("div", { className: "header" }, [
        brandNode,
        el("div", {}, [
          el("div", { className: "bname" }, [config.business.name]),
          el("div", { className: "sub" }, [tHeaderSubtitle()]),
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
      body.addEventListener("scroll", checkScrollPill);
      panel.appendChild(body);

      footer = el("div", { className: "footer" });
      panel.appendChild(footer);

      // Branding footer at the very bottom of the chat panel. Admins can
      // disable it entirely or replace the copy with their own line.
      var w = config.widget || {};
      if (w.brandingFooterEnabled !== false) {
        var brandText = (w.brandingFooterText && String(w.brandingFooterText).trim())
          || "Powered by RJL-Chat";
        panel.appendChild(el("div", { className: "brand-foot" }, [brandText]));
      }
      root.appendChild(panel);
    }

    function buildIntroVideoNode(opts) {
      // opts: { background: bool }. Returns { node, video } where `video` is
      // the underlying <video> element (or null if it's an iframe embed).
      var url = introVideoUrl();
      var isYouTube = /youtube\.com\/embed/.test(url);
      var isVimeo = /player\.vimeo\.com/.test(url);
      var isEmbed = isYouTube || isVimeo;
      if (isEmbed) {
        var src = url;
        var join = src.indexOf("?") === -1 ? "?" : "&";
        // Plays once. No loop params on either YouTube or Vimeo.
        if (opts.background) {
          src += join + "autoplay=1&mute=1&controls=0&playsinline=1&modestbranding=1&showinfo=0&rel=0";
          if (isVimeo) src += "&background=1";
        } else {
          src += join + "autoplay=1&playsinline=1&rel=0";
        }
        var iframe = el("iframe", {
          src: src,
          allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
          frameborder: "0",
        });
        return { node: iframe, video: null };
      }
      var v = el("video", {
        autoplay: "true",
        playsinline: "true",
        "webkit-playsinline": "true",
        poster: introPosterUrl() || undefined,
      });
      // Plays once. controls only in "top" mode where the user expects them.
      if (!opts.background) v.setAttribute("controls", "true");
      v.muted = true; // browsers require muted for autoplay
      v.appendChild(el("source", { src: url }));
      return { node: v, video: v };
    }

    function maybeRenderIntroVideo() {
      if (!config.widget.introVideoEnabled || !introVideoUrl()) return;
      var style = config.widget.introVideoStyle || "top";

      if (style === "background") {
        if (panel.className.indexOf("video-bg") === -1) panel.className += " video-bg";
        var built = buildIntroVideoNode({ background: true });
        var overlay = el("span", { className: "play-overlay" }, ["▶"]);
        introBgEl = el("div", { className: "intro-bg" }, [built.node, overlay]);
        introVideoEl = built.video;
        // Click the video to toggle play/pause (HTML5 only; iframe embeds
        // don't expose controls without postMessage).
        if (introVideoEl) {
          introBgEl.addEventListener("click", togglePlayPause);
          introVideoEl.addEventListener("pause", function () {
            introBgEl.classList.add("is-paused");
          });
          introVideoEl.addEventListener("play", function () {
            introBgEl.classList.remove("is-paused");
          });
          introVideoEl.addEventListener("ended", function () {
            swapVideoForEndImage(introBgEl);
          });
        }
        panel.insertBefore(introBgEl, panel.firstChild);
        renderMuteButton();
        renderVideoControls();
        return;
      }

      // Default "top" mode: a 200px-tall block above the conversation, with a Skip button.
      var wrap = el("div", { className: "intro" });
      var topBuilt = buildIntroVideoNode({ background: false });
      wrap.appendChild(topBuilt.node);
      if (topBuilt.video) {
        topBuilt.video.addEventListener("ended", function () {
          swapVideoForEndImage(wrap);
        });
      }
      wrap.appendChild(
        el("button", {
          className: "skip",
          type: "button",
          onClick: function () {
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            introCleared = true;
          },
        }, [currentLocale === "es" ? "Saltar" : "Skip"])
      );
      panel.insertBefore(wrap, body);
    }

    function swapVideoForEndImage(container) {
      var endUrl = introEndImageUrl();
      if (!container) return;
      if (introBgEl && introBgEl.classList) introBgEl.classList.remove("is-paused");
      // Hide the mute button — no audio once video is gone.
      if (muteBtn && muteBtn.parentNode) {
        muteBtn.parentNode.removeChild(muteBtn);
        muteBtn = null;
      }
      // Keep videoControlsEl visible so the user can hit restart.
      // introVideoEl stays set so restart can seek + play again.
      if (endUrl) {
        var img = el("img", {
          className: "end-image",
          src: endUrl,
          alt: "",
        });
        // Hide the video instead of removing it so restart can bring it back.
        var video = container.querySelector ? container.querySelector("video") : null;
        if (video) video.style.display = "none";
        if (container.firstChild) container.insertBefore(img, container.firstChild);
        else container.appendChild(img);
      }
    }

    function togglePlayPause() {
      if (!introVideoEl) return;
      if (introVideoEl.paused) introVideoEl.play(); else introVideoEl.pause();
    }

    function expandIcon(isCentered) {
      var SVG_NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "currentColor");
      svg.setAttribute("aria-hidden", "true");
      var path = document.createElementNS(SVG_NS, "path");
      // Four-arrows-out when shrunk, four-arrows-in when expanded.
      var d = isCentered
        ? "M9 9H5v2h6V5H9v4zm6 0V5h-2v6h6V9h-4zM5 13v2h4v4h2v-6H5zm10 0v6h2v-4h4v-2h-6z"
        : "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z";
      path.setAttribute("d", d);
      svg.appendChild(path);
      return svg;
    }

    function toggleCentered() {
      if (!panel) return;
      centeredMode = !centeredMode;
      if (centeredMode) {
        panel.classList.add("centered");
        if (!backdropEl) {
          backdropEl = el("div", { className: "tc-backdrop", onClick: toggleCentered });
          // Insert into the same Shadow DOM as the panel so it inherits the styles.
          if (panel.parentNode) panel.parentNode.insertBefore(backdropEl, panel);
        }
      } else {
        panel.classList.remove("centered");
        if (backdropEl && backdropEl.parentNode) backdropEl.parentNode.removeChild(backdropEl);
        backdropEl = null;
      }
      // Rebuild header so the expand icon flips and aria-label updates.
      if (header && header.parentNode) {
        var newHeader = buildHeader();
        header.parentNode.replaceChild(newHeader, header);
        header = newHeader;
      }
    }

    function renderMuteButton() {
      if (!introVideoEl) return; // iframe embeds: no mute control (handled by their own UI)
      muteBtn = el("button", {
        className: "mute-btn muted",
        type: "button",
        "aria-label": "Toggle sound",
        onClick: function (e) {
          e.stopPropagation();
          if (!introVideoEl) return;
          introVideoEl.muted = !introVideoEl.muted;
          updateMuteIcon();
        },
      }, []);
      panel.appendChild(muteBtn);
      updateMuteIcon();
    }

    function muteIconSvg(muted) {
      var SVG_NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "currentColor");
      svg.setAttribute("aria-hidden", "true");
      var path = document.createElementNS(SVG_NS, "path");
      if (muted) {
        path.setAttribute("d", "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z");
      } else {
        path.setAttribute("d", "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z");
      }
      svg.appendChild(path);
      return svg;
    }

    function updateMuteIcon() {
      if (!muteBtn || !introVideoEl) return;
      while (muteBtn.firstChild) muteBtn.removeChild(muteBtn.firstChild);
      var muted = introVideoEl.muted;
      var iconWrap = el("span", { className: "icon" });
      iconWrap.appendChild(muteIconSvg(muted));
      muteBtn.appendChild(iconWrap);
      if (muted) {
        muteBtn.classList.add("muted");
      } else {
        muteBtn.classList.remove("muted");
      }
    }

    var videoControlsEl = null;

    function renderVideoControls() {
      if (!introVideoEl || !config.widget.showVideoControls) return;
      var SVG_NS = "http://www.w3.org/2000/svg";

      function makeSvg(d) {
        var svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "currentColor");
        svg.setAttribute("aria-hidden", "true");
        var path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
        return svg;
      }

      var playPauseBtn = el("button", {
        className: "video-ctrl",
        type: "button",
        "aria-label": "Play / Pause",
        onClick: function (e) {
          e.stopPropagation();
          if (!introVideoEl) return;
          if (introVideoEl.paused) introVideoEl.play(); else introVideoEl.pause();
        },
      });

      function updatePlayPauseIcon() {
        while (playPauseBtn.firstChild) playPauseBtn.removeChild(playPauseBtn.firstChild);
        if (introVideoEl && introVideoEl.paused) {
          playPauseBtn.appendChild(makeSvg("M8 5v14l11-7z"));
        } else {
          playPauseBtn.appendChild(makeSvg("M6 19h4V5H6v14zm8-14v14h4V5h-4z"));
        }
      }
      updatePlayPauseIcon();

      if (introVideoEl) {
        introVideoEl.addEventListener("play", updatePlayPauseIcon);
        introVideoEl.addEventListener("pause", updatePlayPauseIcon);
      }

      var restartBtn = el("button", {
        className: "video-ctrl",
        type: "button",
        "aria-label": "Restart video",
        onClick: function (e) {
          e.stopPropagation();
          if (!introVideoEl) return;
          // If end-image is showing, remove it and unhide the video.
          var container = introBgEl || panel;
          var endImg = container.querySelector ? container.querySelector("img.end-image") : null;
          if (endImg && endImg.parentNode) endImg.parentNode.removeChild(endImg);
          introVideoEl.style.display = "";
          introVideoEl.currentTime = 0;
          introVideoEl.play();
          // Re-render mute button if it was removed.
          if (!muteBtn) renderMuteButton();
        },
      }, [makeSvg("M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z")]);

      videoControlsEl = el("div", { className: "video-controls" }, [playPauseBtn, restartBtn]);
      panel.appendChild(videoControlsEl);
    }

    function transitionToMiniVideo() {
      if (miniMode) return;
      if (!introBgEl || !panel || !body) return;
      if (config.widget.introVideoStyle !== "background") return;
      miniMode = true;
      panel.classList.remove("video-bg");
      panel.classList.add("video-mini");
      // Move the video out of its full-bleed slot and into the conversation
      // as a small inline thumbnail at the top.
      if (introBgEl.parentNode) introBgEl.parentNode.removeChild(introBgEl);
      body.insertBefore(introBgEl, body.firstChild);
      // Move the mute button onto the thumbnail so it stays accessible.
      if (muteBtn) {
        if (muteBtn.parentNode) muteBtn.parentNode.removeChild(muteBtn);
        introBgEl.appendChild(muteBtn);
      }
      if (videoControlsEl) {
        if (videoControlsEl.parentNode) videoControlsEl.parentNode.removeChild(videoControlsEl);
        introBgEl.appendChild(videoControlsEl);
      }
      // Click the mini thumbnail to expand back to full-bleed.
      introBgEl.style.cursor = "pointer";
      introBgEl.addEventListener("click", expandFromMini);
    }

    function expandFromMini() {
      if (!miniMode || !introBgEl || !panel) return;
      miniMode = false;
      panel.classList.remove("video-mini");
      panel.classList.add("video-bg");
      // Move the video wrapper back to the panel root (behind everything).
      if (introBgEl.parentNode) introBgEl.parentNode.removeChild(introBgEl);
      panel.insertBefore(introBgEl, panel.firstChild);
      introBgEl.style.cursor = "";
      // Move mute + controls back to the panel level.
      if (muteBtn) {
        if (muteBtn.parentNode) muteBtn.parentNode.removeChild(muteBtn);
        panel.appendChild(muteBtn);
      }
      if (videoControlsEl) {
        if (videoControlsEl.parentNode) videoControlsEl.parentNode.removeChild(videoControlsEl);
        panel.appendChild(videoControlsEl);
      }
      // Restart playback if the video has ended.
      if (introVideoEl && introVideoEl.ended) {
        var endImg = introBgEl.querySelector ? introBgEl.querySelector("img.end-image") : null;
        if (endImg && endImg.parentNode) endImg.parentNode.removeChild(endImg);
        introVideoEl.style.display = "";
        introVideoEl.currentTime = 0;
        introVideoEl.play();
        if (!muteBtn) renderMuteButton();
      }
    }

    var scrollPill = null;

    function checkScrollPill() {
      if (!body) return;
      var hasOverflow = body.scrollHeight > body.clientHeight + 20;
      var nearBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 30;
      if (hasOverflow && !nearBottom) {
        if (!scrollPill) {
          var SVG_NS = "http://www.w3.org/2000/svg";
          var svg = document.createElementNS(SVG_NS, "svg");
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.setAttribute("fill", "currentColor");
          svg.setAttribute("aria-hidden", "true");
          var path = document.createElementNS(SVG_NS, "path");
          path.setAttribute("d", "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z");
          svg.appendChild(path);
          scrollPill = el("div", { className: "scroll-pill" }, [
            svg,
            currentLocale === "es" ? "Desplazar" : "Scroll",
          ]);
          body.style.position = "relative";
          body.appendChild(scrollPill);
        }
      } else {
        if (scrollPill && scrollPill.parentNode) {
          scrollPill.parentNode.removeChild(scrollPill);
          scrollPill = null;
        }
      }
    }

    function autoScrollToLatest() {
      if (!body) return;
      // In background-video mode the spacer at the top of the body keeps
      // the speaker's face uncovered. Auto-scrolling to the newest message
      // would yank that spacer out of view and slide the welcome message
      // back up onto the face, so we leave the scroll pinned at the top.
      // Visitors scroll manually to reach content that falls below the fold;
      // once they answer the first question, video-mini takes over and
      // normal auto-scroll behavior resumes.
      if (panel && panel.classList.contains("video-bg")) return;
      body.scrollTop = body.scrollHeight;
    }

    // Returns { msg, container } where container is the outer DOM node
    // appended to body (the bot-row when an avatar is shown, otherwise the
    // msg itself). Caller can hold container to remove the whole entry later.
    function addMsg(role, text) {
      transcript.push({ role: role, text: text });
      var msg = el("div", { className: "msg " + role }, [text]);
      var container = msg;
      if (role === "bot" && config.widget.chatAvatarUrl) {
        var av = el("div", { className: "chat-avatar" }, [
          renderAvatarMedia(config.widget.chatAvatarUrl, config.business.name),
        ]);
        container = el("div", { className: "bot-row" }, [av, msg]);
      }
      body.appendChild(container);
      autoScrollToLatest();
      setTimeout(checkScrollPill, 100);
      return { msg: msg, container: container };
    }

    function addMedia(step) {
      var node = buildMediaNode(step);
      if (!node) return;
      body.appendChild(node);
      autoScrollToLatest();
    }

    function showTyping() {
      var bubble = el("div", { className: "typing" }, [el("i"), el("i"), el("i")]);
      var node;
      if (config.widget.chatAvatarUrl) {
        var av = el("div", { className: "chat-avatar" }, [
          renderAvatarMedia(config.widget.chatAvatarUrl, ""),
        ]);
        node = el("div", { className: "bot-row" }, [av, bubble]);
      } else {
        node = bubble;
      }
      body.appendChild(node);
      autoScrollToLatest();
      return node;
    }

    var lastBotMsgEl = null;
    var lastBotContainer = null;
    function greet() {
      var t = showTyping();
      setTimeout(function () {
        t.remove();
        var greeted = addMsg("bot", tWelcome());
        lastBotMsgEl = greeted.msg;
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

      var myVersion = ++askVersion;
      var t = showTyping();
      setTimeout(function () {
        if (myVersion !== askVersion) {
          // Undo (or another askNext) invalidated this in-flight question.
          if (t && t.parentNode) t.parentNode.removeChild(t);
          return;
        }
        if (t && t.parentNode) t.parentNode.removeChild(t);
        var asked = addMsg("bot", tStepQuestion(step));
        lastBotMsgEl = asked.msg;
        lastBotContainer = asked.container;
        if (mediaAllowed && step.mediaDisplayStyle === "below") addMedia(step);
        renderInputFor(step);
      }, 350);
    }

    function clearFooter() {
      while (footer.firstChild) footer.removeChild(footer.firstChild);
      if (inBodyOptionsEl && inBodyOptionsEl.parentNode) {
        inBodyOptionsEl.parentNode.removeChild(inBodyOptionsEl);
      }
      inBodyOptionsEl = null;
    }

    function accept(step, value, displayText) {
      if (!hasStartedFlow) {
        hasStartedFlow = true;
        trackEvent("started");
      }
      var prevAnswer = Object.prototype.hasOwnProperty.call(answers, step.stepKey)
        ? answers[step.stepKey]
        : undefined;
      answers[step.stepKey] = value;

      var added = addMsg("user", displayText != null ? displayText : String(value));
      var undoBtn = el("button", {
        className: "undo-btn",
        type: "button",
        title: strings().undo,
        onClick: function () { undoLast(); },
      }, ["↩ " + strings().undo]);
      var undoRow = el("div", { className: "undo-row" }, [undoBtn]);
      body.appendChild(undoRow);
      autoScrollToLatest();

      var prevStepIndex = stepIndex;
      // Snapshot enough state to fully undo this answer (including the
      // step pointer in case branching jumped us elsewhere).
      historyStack.push({
        step: step,
        prevAnswer: prevAnswer,
        prevStepIndex: prevStepIndex,
        userContainer: added.container,
        botContainer: lastBotContainer,
        undoRow: undoRow,
      });

      // Drop "Undo" from the previous turn so only the latest is undoable.
      if (historyStack.length >= 2) {
        var prev = historyStack[historyStack.length - 2];
        if (prev.undoRow && prev.undoRow.parentNode) {
          prev.undoRow.parentNode.removeChild(prev.undoRow);
        }
        prev.undoRow = null;
      }

      // Default linear advance, then apply branching overrides.
      stepIndex = prevStepIndex + 1;
      var branched = resolveBranchTarget(step, value);
      if (branched.end) {
        stepIndex = steps.length; // forces askNext to submit
        endingMode = branched.decline ? "decline" : "success";
      } else if (branched.targetIndex >= 0) {
        stepIndex = branched.targetIndex;
      }

      currentStepInputState = null;
      clearFooter();
      // First answer in background mode collapses the video into a thumbnail.
      transitionToMiniVideo();
      askNext();
    }

    function resolveBranchTarget(step, value) {
      var nl = step && step.nextLogic;
      if (!nl) return { end: false, decline: false, targetIndex: -1 };
      var rule = (nl.byOption && nl.byOption[value]) || nl.default || null;
      if (!rule) return { end: false, decline: false, targetIndex: -1 };
      if (rule === "__end") return { end: true, decline: false, targetIndex: -1 };
      if (rule === "__decline") return { end: true, decline: true, targetIndex: -1 };
      for (var k = 0; k < steps.length; k++) {
        if (steps[k].stepKey === rule) return { end: false, decline: false, targetIndex: k };
      }
      return { end: false, decline: false, targetIndex: -1 };
    }

    function undoLast() {
      var entry = historyStack.pop();
      if (!entry) return;
      // Cancel any pending askNext typing animation so a new bot question
      // doesn't appear after we've reverted to a prior step.
      askVersion++;
      // Remove the bot question we just asked (if any) AND any leftover footer
      // input rows we appended afterwards.
      if (lastBotContainer && lastBotContainer.parentNode && lastBotContainer !== entry.botContainer) {
        lastBotContainer.parentNode.removeChild(lastBotContainer);
      }
      // Also drop any typing indicator currently in flight.
      var typingNodes = body.querySelectorAll(".typing");
      for (var i = 0; i < typingNodes.length; i++) {
        if (typingNodes[i].parentNode) typingNodes[i].parentNode.removeChild(typingNodes[i]);
      }
      if (entry.undoRow && entry.undoRow.parentNode) {
        entry.undoRow.parentNode.removeChild(entry.undoRow);
      }
      if (entry.userContainer && entry.userContainer.parentNode) {
        entry.userContainer.parentNode.removeChild(entry.userContainer);
      }
      // Trim the transcript array to drop the bot question + user answer.
      // Pop until the user answer is removed.
      while (transcript.length) {
        var t = transcript.pop();
        if (t.role === "user") break;
      }
      // Restore prior answer state.
      if (entry.prevAnswer === undefined) {
        delete answers[entry.step.stepKey];
      } else {
        answers[entry.step.stepKey] = entry.prevAnswer;
      }
      // Re-anchor lastBotMsg to the previous bot question (entry.botContainer is
      // that question's container; its `.msg` child is the bubble).
      lastBotContainer = entry.botContainer;
      if (entry.botContainer) {
        var bubble = entry.botContainer.classList && entry.botContainer.classList.contains("bot-row")
          ? entry.botContainer.querySelector(".msg.bot")
          : entry.botContainer;
        lastBotMsgEl = bubble || null;
      }
      // Roll the step pointer back to where it was when the answered step
      // was on screen (handles branching where the next step wasn't N+1).
      stepIndex = typeof entry.prevStepIndex === "number"
        ? entry.prevStepIndex
        : Math.max(0, stepIndex - 1);
      clearFooter();
      currentStepInputState = { step: entry.step };
      renderInputFor(entry.step);
      // Restore the prior turn's Undo so the user can keep walking back.
      if (historyStack.length) {
        var prevEntry = historyStack[historyStack.length - 1];
        if (!prevEntry.undoRow || !prevEntry.undoRow.parentNode) {
          var btn = el("button", {
            className: "undo-btn",
            type: "button",
            onClick: function () { undoLast(); },
          }, ["↩ " + strings().undo]);
          prevEntry.undoRow = el("div", { className: "undo-row" }, [btn]);
          // Insert just after the previous user message.
          if (prevEntry.userContainer && prevEntry.userContainer.parentNode) {
            prevEntry.userContainer.parentNode.insertBefore(
              prevEntry.undoRow,
              prevEntry.userContainer.nextSibling
            );
          }
        }
      }
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
        // Append the pills inline at the end of the conversation so they
        // scroll together with the messages (single scroll), not as a
        // sticky footer that grows and pushes the chat around.
        body.appendChild(wrap);
        inBodyOptionsEl = wrap;
        scrollBodyToBottomSoon();
        setTimeout(checkScrollPill, 100);
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
      scrollBodyToBottomSoon();
    }

    // After the footer changes height (new options pile, multi-line input),
    // body shrinks and the previously-visible latest bubble can be hidden
    // under the footer. Re-scroll once the layout has settled.
    //
    // Skipped in background-video mode — same reason as autoScrollToLatest:
    // we want the welcome message anchored below the face, not pulled up
    // to the top of the body when new options arrive.
    function scrollBodyToBottomSoon() {
      if (!body) return;
      if (panel && panel.classList.contains("video-bg")) return;
      var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
      raf(function () {
        if (body) body.scrollTop = body.scrollHeight;
      });
    }

    function phoneCountry() {
      var c = config.widget && config.widget.defaultPhoneCountry;
      return c === "MX" ? "MX" : "US";
    }

    function placeholderFor(step) {
      var p = strings().placeholders;
      switch (step.inputType) {
        case "phone": return phoneCountry() === "MX" ? p.phoneMX : p.phone;
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

    // Phone validation is country-aware so a US site doesn't accept a
    // 9-digit MX local number and vice versa. Both modes still allow
    // an explicit +CC prefix (≥10 digits) so visitors can type the
    // canonical international form regardless of the configured
    // default country.
    function validate(type, value) {
      if (type === "email") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
      if (type === "phone") {
        var digits = (value || "").replace(/\D/g, "");
        if (value && value.charAt(0) === "+") {
          return digits.length >= 10 && digits.length <= 15;
        }
        if (phoneCountry() === "MX") {
          // MX mobiles are 10 digits; 12 digits when prefixed with 52.
          return digits.length === 10 || (digits.length === 12 && digits.indexOf("52") === 0);
        }
        // US: 10 digits, or 11 digits starting with 1.
        return digits.length === 10 || (digits.length === 11 && digits.charAt(0) === "1");
      }
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
      // Side buttons may have locale-specific visibility; rebuild them.
      if (sideStackHost && sideStackHost.parentNode) {
        sideStackHost.parentNode.removeChild(sideStackHost);
        sideStackHost = null;
      }
      renderSideButtons();
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
        var attr = captureAttribution();
        var collectPage = !config.features || config.features.collectPageUrl !== false;
        var collectRef = !config.features || config.features.collectReferrer !== false;
        var collectUtm = !config.features || config.features.collectUtm !== false;
        fetchJson(apiUrl("/api/leads"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            clientId: config.clientId,
            answers: answers,
            transcript: transcript,
            sourceUrl: collectPage ? attr.currentPage : null,
            referrer: collectRef ? attr.referrer : null,
            utm: collectUtm
              ? {
                  source: attr.utmSource,
                  medium: attr.utmMedium,
                  campaign: attr.utmCampaign,
                  term: attr.utmTerm,
                  content: attr.utmContent,
                }
              : null,
            gclid: attr.gclid,
            msclkid: attr.msclkid,
            fbclid: attr.fbclid,
            ttclid: attr.ttclid,
            wbraid: attr.wbraid,
            gbraid: attr.gbraid,
            ndclid: attr.ndclid,
            landingPageUrl: collectPage ? attr.landingPage : null,
            callrailSessionId: getCallRailSessionId(),
            userAgent: navigator.userAgent,
          }),
        }).then(function () {
          if (endingMode === "decline") renderDecline();
          else renderSuccess();
        }).catch(function () {
          addMsg("bot", strings().networkBot);
        });
      }, 400);
    }

    function renderSuccess() {
      fireConversion();
      trackEvent("completed_success");
      clearFooter();
      while (body.firstChild) body.removeChild(body.firstChild);
      var ctas = (config.widget.endCtas || []).filter(function (c) {
        return c && c.label && c.destination;
      });

      var children = [
        el("div", { className: "check" }, ["✓"]),
        el("div", { style: { fontWeight: "600", fontSize: "20px" } }, [tSuccessHeadline()]),
      ];

      if (ctas.length) {
        var ctaWrap = el("div", { className: "end-ctas" });
        ctas.forEach(function (c, idx) {
          var label = (currentLocale === "es" && c.labelEs) ? c.labelEs : c.label;
          var outline = idx === 0 ? "" : " outline";
          var attrs = {
            href: endCtaHref(c),
            target: c.type === "schedule" || c.type === "link" ? "_blank" : undefined,
            rel: "noopener",
          };
          attrs.onClick = (function (ctaType) {
            return function () { trackEvent("cta_click", ctaType); };
          })(c.type);
          if (c.type === "call" || c.type === "text") {
            // Two-line engaging layout with pulsing icon and formatted number.
            var displayedNumber = resolvePhone(c.destination);
            var iconWrap = el("span", { className: "cta-icon" }, [endCtaIcon(c.type)]);
            var textWrap = el("span", { className: "cta-text" }, [
              el("span", { className: "cta-label" }, [label]),
              el("span", { className: "cta-sub" }, [formatPhoneDisplay(displayedNumber)]),
            ]);
            attrs.className = "end-cta phone" + outline;
            ctaWrap.appendChild(el("a", attrs, [iconWrap, textWrap]));
          } else {
            attrs.className = "end-cta" + outline;
            ctaWrap.appendChild(el("a", attrs, [endCtaIcon(c.type) + "  " + label]));
          }
        });
        children.push(ctaWrap);
      }

      // Supporting message reads as "or call us… we'll reach out shortly"
      // when it sits below the CTA, so it stays at the bottom.
      children.push(
        el("div", { style: { fontSize: "15px", color: "#475569", lineHeight: "1.45", marginTop: "4px" } }, [
          tSuccessMessage(),
        ])
      );

      var wrap = el("div", { className: "success" }, children);
      body.appendChild(wrap);
      if (progressBar) progressBar.style.width = "100%";
    }

    function renderDecline() {
      trackEvent("completed_decline");
      clearFooter();
      while (body.firstChild) body.removeChild(body.firstChild);
      var wrap = el("div", { className: "success" }, [
        el("div", { style: { fontWeight: "600", fontSize: "18px" } }, [tDeclineHeadline()]),
        el("div", { style: { fontSize: "15px", color: "#475569", lineHeight: "1.45" } }, [
          tDeclineMessage(),
        ]),
      ]);
      body.appendChild(wrap);
      if (progressBar) progressBar.style.width = "100%";
    }

    function endCtaHref(c) {
      var dest = (c.destination || "").trim();
      if (c.type === "call") return "tel:" + resolvePhone(dest).replace(/[^+\d]/g, "");
      if (c.type === "text") return "sms:" + resolvePhone(dest).replace(/[^+\d]/g, "");
      return dest;
    }
    function formatPhoneDisplay(raw) {
      var digits = String(raw || "").replace(/[^\d]/g, "");
      if (digits.length === 10) {
        return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
      }
      if (digits.length === 11 && digits.charAt(0) === "1") {
        return "+1 (" + digits.slice(1, 4) + ") " + digits.slice(4, 7) + "-" + digits.slice(7);
      }
      return String(raw || "").trim();
    }
    function endCtaIcon(type) {
      switch (type) {
        case "call": return "📞";
        case "text": return "💬";
        case "schedule": return "📅";
        default: return "↗";
      }
    }

    // Fire conversion / analytics events on the host page when a lead lands
    // on the success state. Both Google Ads (gtag) and Google Tag Manager
    // (dataLayer) are supported — admins choose either or both based on how
    // their site is set up.
    function fireConversion() {
      var w = config.widget || {};
      var id = (w.googleAdsConversionId || "").trim();
      var label = (w.googleAdsConversionLabel || "").trim();

      if (id && label && typeof window.gtag === "function") {
        try {
          window.gtag("event", "conversion", {
            send_to: id + "/" + label,
          });
        } catch (e) {
          console.warn("[RJL-Chat] gtag conversion failed:", e);
        }
      }

      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "rjl_chat_lead_submitted",
          clientId: config.clientId,
          businessName: config.business && config.business.name,
        });
      } catch (e) {
        // dataLayer push is best-effort; never block the success render.
      }
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
