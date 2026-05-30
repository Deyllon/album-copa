import Constants from "expo-constants";

const FALLBACK_API_BASE = "http://127.0.0.1:3000";

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBase() {
  const runtimeGlobal = globalThis as typeof globalThis & { API_BASE?: string };
  const extra = Constants.expoConfig?.extra as
    | { apiBaseUrl?: string }
    | undefined;

  return normalizeApiBaseUrl(
    runtimeGlobal.API_BASE || extra?.apiBaseUrl || FALLBACK_API_BASE,
  );
}

let authToken: string | null = null;
export function setAuthToken(token?: string | null) {
  authToken = token ?? null;
}

async function request(path: string, opts: RequestInit = {}) {
  const headers = (opts.headers as Record<string, string> | undefined) ?? {};
  if (!headers.Authorization && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const res = await fetch(`${getApiBase()}${path}`, { ...opts, headers });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch (err) {
    return { status: res.status, data: text };
  }
}

export async function postJSON(path: string, body: any, token?: string) {
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function getJSON(path: string, token?: string) {
  return request(path, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

export async function patchJSON(path: string, body: any, token?: string) {
  return request(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function login(username: string, password: string) {
  console.log("api.login: calling /auth/login", { username });
  const res = await postJSON("/auth/login", { username, password });
  console.log("api.login: response", res);
  return res;
}

export async function register(username: string, password: string) {
  console.log("api.register: calling /auth/register", { username });
  const res = await postJSON("/auth/register", { username, password });
  console.log("api.register: response", res);
  return res;
}

export async function tradeCompare(identifier: string, token?: string) {
  return getJSON(`/trades/compare/${encodeURIComponent(identifier)}`, token);
}

export async function getMyAlbum(token?: string) {
  return getJSON("/album/me", token);
}

export async function updateMySticker(
  code: string,
  payload: { owned?: boolean; duplicateDelta?: number; duplicateCount?: number },
  token?: string,
) {
  return patchJSON(`/album/${encodeURIComponent(code)}`, payload, token);
}

export async function getPublicProfile(identifier: string, token?: string) {
  return getJSON(`/users/${encodeURIComponent(identifier)}`, token);
}

export async function getFriends(token?: string) {
  return getJSON("/friends", token);
}

export async function addFriend(identifier: string, token?: string) {
  return postJSON("/friends", { identifier }, token);
}

export async function sendProposal(
  payload: { toPublicCode: string; offered: string[]; requested: string[] },
  token?: string,
) {
  return postJSON("/trades/proposals", payload, token);
}

export async function executeTrade(
  payload: { toPublicCode: string; offered: string[]; requested: string[] },
  token?: string,
) {
  return postJSON("/trades/execute", payload, token);
}

export async function sendScanImage(payload: { imageBase64: string; mimeType?: string; mode?: string }) {
  console.log("api.sendScanImage: calling /scans/image");
  return postJSON("/scans/image", payload);
}

export async function sendScanCommit(
  payload: { items: Array<{ code: string; action: string }> },
  token?: string,
) {
  return postJSON("/scans/commit", payload, token);
}
