/**
 * Frontend ↔ API wiring for Atari.
 *
 * Base: https://atari.runasp.net  (override with VITE_API_URL)
 * QR guest URL: /order?token=<guid>
 *
 * Pages stay mock until you swap local state for these calls:
 *
 *   import { api, connectOrdersHub, guestTokenFromUrl, toStaffRoom } from "./api";
 *
 * Admin  `/`        → api.login → api.dashboard(branchId) → connectOrdersHub
 * Staff  `/staff`   → api.login → api.rooms / pending / start / checkout / pay
 * Guest  `/order`   → api.qrMenu(token) → api.placeOrder({ token, items })
 */

export const API_BASE = String(
  import.meta.env.VITE_API_URL || "https://atari.runasp.net",
).replace(/\/$/, "");

const TOKEN_KEY = "atari.token";
const USER_KEY = "atari.user";

export class ApiError extends Error {
  constructor(status, body) {
    const message =
      body?.error || body?.title || body?.message || `HTTP ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(auth) {
  if (auth?.token) localStorage.setItem(TOKEN_KEY, auth.token);
  if (auth?.user) localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function guestTokenFromUrl(search = window.location.search) {
  return new URLSearchParams(search).get("token");
}

async function request(path, { method = "GET", body, auth = true, headers, timeoutMs = 20000 } = {}) {
  const token = getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ApiError(408, { error: "Request timed out" });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new ApiError(res.status, data);
  }

  return data;
}

const qs = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const s = search.toString();
  return s ? `?${s}` : "";
};

/** Map API room → StaffDashboard local shape (idle / active). */
export function toStaffRoom(room) {
  const active = String(room.status).toLowerCase() === "occupied";
  return {
    id: room.id,
    name: room.name,
    status: active ? "active" : "idle",
    startTime: room.startTime ?? null,
    elapsed: room.elapsed ?? 0,
    roomOrders: room.roomOrders ?? [],
    isCheckingOut: room.isCheckingOut ?? false,
    selectedMode: (room.selectedMode || "single").toLowerCase(),
    currentRate: room.currentRate ?? 20,
    qrToken: room.qrToken,
    branchId: room.branchId,
    user: room.user,
    time: room.time,
    price: room.price,
  };
}

/** Map GET /api/qr/{token} → CustomerPage { Drinks: [...], ... } */
export function menuToTabs(menu) {
  const tabs = {};
  for (const category of menu?.categories ?? []) {
    tabs[category.name] = (category.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      emoji: item.emoji,
      color: item.color,
      stock: item.stock,
    }));
  }
  return tabs;
}

export const api = {
  login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    }).then((auth) => {
      setSession(auth);
      return auth;
    });
  },

  logout: clearSession,

  branches: () => request("/api/branches"),
  dashboard: (branchId) => request(`/api/dashboard${qs({ branchId })}`),
  settings: (branchId) => request(`/api/settings${qs({ branchId })}`),
  updateSettings: (branchId, body) =>
    request(`/api/settings${qs({ branchId })}`, { method: "PUT", body }),

  rooms: (branchId) => request(`/api/rooms${qs({ branchId })}`),
  room: (id) => request(`/api/rooms/${id}`),
  createRoom: (name, branchId) =>
    request("/api/rooms", { method: "POST", body: { name, branchId } }),
  updateRoom: (id, body) => request(`/api/rooms/${id}`, { method: "PUT", body }),
  deleteRoom: (id) => request(`/api/rooms/${id}`, { method: "DELETE" }),
  startRoom: (id, selectedMode = "single") =>
    request(`/api/rooms/${id}/start`, { method: "POST", body: { selectedMode } }),
  checkoutRoom: (id) => request(`/api/rooms/${id}/checkout`, { method: "POST" }),
  payRoom: (id, amount, paymentMethod = "Cash") =>
    request(`/api/rooms/${id}/pay`, {
      method: "POST",
      body: { amount, paymentMethod },
    }),
  roomQrUrl: (id) => `${API_BASE}/api/rooms/${id}/qr.png`,
  async roomQrBlob(id) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/rooms/${id}/qr.png`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, { error: "QR download failed" });
    return res.blob();
  },

  qrMenu: (token) => request(`/api/qr/${token}`, { auth: false }),
  placeOrder: (token, items) =>
    request("/api/orders", {
      method: "POST",
      auth: false,
      body: {
        token,
        items: items.map((item) => ({
          productId: item.productId ?? item.id,
          qty: item.qty ?? item.quantity ?? 1,
        })),
      },
    }),

  orders: (branchId, status) =>
    request(`/api/orders${qs({ branchId, status })}`),
  pendingOrders: (branchId) =>
    request(`/api/orders/pending${qs({ branchId })}`),
  acceptOrder: (id) => request(`/api/orders/${id}/accept`, { method: "POST" }),
  rejectOrder: (id) => request(`/api/orders/${id}/reject`, { method: "POST" }),
  patchOrderStatus: (id, status) =>
    request(`/api/orders/${id}/status`, { method: "PATCH", body: { status } }),

  sessions: (branchId, active = true) =>
    request(`/api/sessions${qs({ branchId, active })}`),
  endSession: (id) => request(`/api/sessions/${id}/end`, { method: "POST" }),
  transactions: (branchId) => request(`/api/transactions${qs({ branchId })}`),

  products: (branchId) => request(`/api/products${qs({ branchId })}`),
  createProduct: (body) => request("/api/products", { method: "POST", body }),
  updateProduct: (id, body) =>
    request(`/api/products/${id}`, { method: "PUT", body }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  patchStock: (id, body) =>
    request(`/api/products/${id}/stock`, { method: "PATCH", body }),

  categories: (branchId) => request(`/api/categories${qs({ branchId })}`),
  createCategory: (name, branchId) =>
    request("/api/categories", { method: "POST", body: { name, branchId } }),
  deleteCategory: (id) =>
    request(`/api/categories/${id}`, { method: "DELETE" }),

  customers: (branchId) => request(`/api/customers${qs({ branchId })}`),
  createCustomer: (body) => request("/api/customers", { method: "POST", body }),
  updateCustomer: (id, body) =>
    request(`/api/customers/${id}`, { method: "PUT", body }),
  deleteCustomer: (id) => request(`/api/customers/${id}`, { method: "DELETE" }),

  staff: () => request("/api/staff"),
  createStaff: (body) => request("/api/staff", { method: "POST", body }),
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  updateStaff: (id, body) => request(`/api/staff/${id}`, { method: "PUT", body }),
  deleteStaff: (id) => request(`/api/staff/${id}`, { method: "DELETE" }),

  revenue: (branchId) => request(`/api/reports/revenue${qs({ branchId })}`),
  payments: (branchId) => request(`/api/reports/payments${qs({ branchId })}`),
  topProducts: (branchId) =>
    request(`/api/reports/top-products${qs({ branchId })}`),
};

let signalRLoading = null;

function loadSignalR() {
  if (window.signalR) return Promise.resolve(window.signalR);
  if (signalRLoading) return signalRLoading;
  signalRLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.7/dist/browser/signalr.min.js";
    script.onload = () => resolve(window.signalR);
    script.onerror = () => reject(new Error("Failed to load SignalR"));
    document.head.appendChild(script);
  });
  return signalRLoading;
}

/**
 * Live admin/staff socket. Events:
 *   OrderCreated  { admin, staffPending }
 *   OrderUpdated  AdminOrderDto
 *   RoomUpdated   RoomDto
 *   SessionEnded  { roomId }
 */
export async function connectOrdersHub(handlers = {}) {
  const token = getToken();
  if (!token) throw new Error("Login first — SignalR requires a JWT.");

  const signalR = await loadSignalR();
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/orders`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build();

  if (handlers.onOrderCreated) connection.on("OrderCreated", handlers.onOrderCreated);
  if (handlers.onOrderUpdated) connection.on("OrderUpdated", handlers.onOrderUpdated);
  if (handlers.onRoomUpdated) connection.on("RoomUpdated", handlers.onRoomUpdated);
  if (handlers.onSessionEnded) connection.on("SessionEnded", handlers.onSessionEnded);

  await connection.start();
  return connection;
}
