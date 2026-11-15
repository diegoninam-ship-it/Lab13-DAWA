import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface LoginAttemptInfo {
  count: number;
  lockedUntil: number | null;
}

// Igual que con Prisma: usamos globalThis para que el Map sobreviva
// al hot-reload de Next.js en desarrollo, en vez de reiniciarse en cada cambio de archivo.
declare global {
  // eslint-disable-next-line no-var
  var __usersStore: Map<string, StoredUser> | undefined;
  // eslint-disable-next-line no-var
  var __loginAttempts: Map<string, LoginAttemptInfo> | undefined;
}

const users = globalThis.__usersStore ?? new Map<string, StoredUser>();
const loginAttempts = globalThis.__loginAttempts ?? new Map<string, LoginAttemptInfo>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__usersStore = users;
  globalThis.__loginAttempts = loginAttempts;
}

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 2 * 60 * 1000; // 2 minutos bloqueado

export async function createUser(name: string, email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  if (users.has(normalizedEmail)) {
    throw new Error("Ya existe un usuario registrado con ese correo.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email: normalizedEmail,
    passwordHash,
  };

  users.set(normalizedEmail, user);
  return { id: user.id, name: user.name, email: user.email };
}

export function getLoginStatus(email: string) {
  const normalizedEmail = email.toLowerCase();
  const info = loginAttempts.get(normalizedEmail);

  if (!info) return { locked: false, remaining: MAX_ATTEMPTS };

  if (info.lockedUntil && info.lockedUntil > Date.now()) {
    return { locked: true, lockedUntil: info.lockedUntil };
  }

  if (info.lockedUntil && info.lockedUntil <= Date.now()) {
    loginAttempts.delete(normalizedEmail);
    return { locked: false, remaining: MAX_ATTEMPTS };
  }

  return { locked: false, remaining: MAX_ATTEMPTS - info.count };
}

export function registerFailedAttempt(email: string) {
  const normalizedEmail = email.toLowerCase();
  const info = loginAttempts.get(normalizedEmail) ?? { count: 0, lockedUntil: null };

  info.count += 1;
  if (info.count >= MAX_ATTEMPTS) {
    info.lockedUntil = Date.now() + LOCK_TIME_MS;
  }

  loginAttempts.set(normalizedEmail, info);
}

export function resetAttempts(email: string) {
  loginAttempts.delete(email.toLowerCase());
}

export async function validateCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  const user = users.get(normalizedEmail);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}