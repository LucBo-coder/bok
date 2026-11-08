// Chế độ sandbox: chặn mọi lệnh gọi tới backend production để bản thử không chạm dữ liệu người chơi thật.
// Lớp chặn chính là CSP connect-src do build_mod.py chèn vào HTML; file này khiến game nhận lỗi êm và ghi lại số lần chặn.
(function () {
  "use strict";
  const blocked = (globalThis.__VK2_BLOCKED = []);
  const isExternal = (url) => {
    try {
      const u = new URL(url, location.href);
      if (u.origin !== location.origin) return true;
      return u.pathname.startsWith("/api/") && u.pathname !== "/api/version";
    } catch {
      return false;
    }
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || String(input);
    // Trang tĩnh không có API, nên tự trả lời kiểm tra phiên bản để game không báo cần tải lại.
    if (new URL(url, location.href).pathname.endsWith("/api/version")) {
      return Promise.resolve(new Response(JSON.stringify({ v: "34be145195c489cf3c9c6209841f479843348b00", now: Date.now() }), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (isExternal(url)) {
      blocked.push(url);
      return Promise.resolve(new Response(JSON.stringify({ message: "VK2 sandbox: offline" }), { status: 503, headers: { "Content-Type": "application/json" } }));
    }
    return realFetch.call(this, input, init);
  };
  const realBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
  if (realBeacon) {
    navigator.sendBeacon = (url, data) => {
      if (isExternal(url)) {
        blocked.push(url);
        return true;
      }
      return realBeacon(url, data);
    };
  }
  const RealWS = globalThis.WebSocket;
  if (RealWS) {
    globalThis.WebSocket = function (url, protocols) {
      if (isExternal(url)) {
        blocked.push(String(url));
        throw new Error("VK2 sandbox: WebSocket blocked");
      }
      return new RealWS(url, protocols);
    };
    Object.assign(globalThis.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
    globalThis.WebSocket.prototype = RealWS.prototype;
  }
  const realOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (isExternal(url)) {
      blocked.push(String(url));
      return realOpen.call(this, method, "/api/version", ...rest);
    }
    return realOpen.call(this, method, url, ...rest);
  };
})();
