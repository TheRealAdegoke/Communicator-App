const BASE_URL = "https://communicatorapi.onrender.com";

function getToken(): string | null {
  return sessionStorage.getItem("token");
}

function setToken(token: string) {
  sessionStorage.setItem("token", token);
}

function clearToken() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem(QUEUE_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(
      `[API Error] ${options.method ?? "GET"} ${path}`,
      res.status,
      body
    );
    let message: string;
    try {
      const json = JSON.parse(body);
      message = json.message || json.title || JSON.stringify(json);
    } catch {
      message = body || `Request failed with status ${res.status}`;
    }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export interface AuthResponse {
  token: string;
}

export async function login(username: string, password: string): Promise<void> {
  const data = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
}

export async function register(
  username: string,
  password: string
): Promise<void> {
  await request<void>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export interface UserDto {
  id: string;
  username: string;
}

export async function getUsers(): Promise<UserDto[]> {
  return request<UserDto[]>("/api/users");
}

export interface MessageDto {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

export async function getMessages(userId: string): Promise<MessageDto[]> {
  return request<MessageDto[]>(`/api/messages/${userId}`);
}

export async function sendMessage(
  receiverId: string,
  content: string
): Promise<MessageDto> {
  if (!receiverId)
    throw new Error("receiverId is missing — cannot send message.");
  if (!content.trim()) throw new Error("Message content cannot be empty.");

  return request<MessageDto>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ receiverId, content }),
  });
}

export function openMessageStream(
  onMessage: (msg: MessageDto) => void
): () => void {
  const token = getToken();
  if (!token) return () => {};

  const url = `${BASE_URL}/api/messages/stream?access_token=${encodeURIComponent(
    token
  )}`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const msg: MessageDto = JSON.parse(event.data);
      onMessage(msg);
    } catch {
      // Heartbeat or malformed frame — ignore
    }
  };

  es.onerror = () => {
    console.warn("[SSE] Connection lost, will retry automatically.");
  };

  return () => es.close();
}

interface QueuedMessage {
  receiverId: string;
  content: string;
}

const QUEUE_KEY = "messageQueue";

export function getOfflineQueue(): QueuedMessage[] {
  const raw = sessionStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addToOfflineQueue(msg: QueuedMessage) {
  const queue = getOfflineQueue();
  queue.push(msg);
  sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining: QueuedMessage[] = [];
  for (const msg of queue) {
    try {
      await sendMessage(msg.receiverId, msg.content);
    } catch {
      remaining.push(msg);
    }
  }
  sessionStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export { getToken, clearToken };
