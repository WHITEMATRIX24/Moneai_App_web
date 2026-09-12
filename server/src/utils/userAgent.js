export function parseUserAgent(uaString = "") {
  const ua = uaString || "";
  let browser = "Web Browser";
  let os = "Unknown OS";
  let deviceType = "desktop";
  let device = "Computer";

  // OS detection
  if (/Mac OS X|Macintosh/i.test(ua)) {
    os = "macOS";
    device = "Mac";
  } else if (/Windows NT/i.test(ua)) {
    os = "Windows";
    device = "Windows PC";
  } else if (/Android/i.test(ua)) {
    os = "Android";
    device = "Android Device";
    deviceType = /Mobile/i.test(ua) ? "mobile" : "tablet";
  } else if (/iPad/i.test(ua)) {
    os = "iPadOS";
    device = "iPad";
    deviceType = "tablet";
  } else if (/iPhone/i.test(ua)) {
    os = "iOS";
    device = "iPhone";
    deviceType = "mobile";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
    device = "Linux Workstation";
  }

  // Browser detection
  if (/Edg/i.test(ua)) {
    browser = "Edge";
  } else if (/Chrome/i.test(ua) && !/Chromium|Edg/i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua)) {
    browser = deviceType === "mobile" ? "Safari Mobile" : "Safari";
  } else if (/Firefox/i.test(ua)) {
    browser = "Firefox";
  }

  const deviceLabel = `${device} (${browser} on ${os})`;

  return {
    browser,
    os,
    deviceType,
    device: deviceLabel,
  };
}
