<div align="center">

# 🔐 Laboratorio 13 — Desarrollo de Aplicaciones Web Avanzado

### Autenticación y Seguridad — NextAuth.js con Google, GitHub y Credenciales propias

![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth.js-v4-7C3AED?style=for-the-badge)
![Status](https://img.shields.io/badge/status-completado-brightgreen?style=for-the-badge)

*Tecsup · Diseño y Desarrollo de Software · 5 - C24 - Sección A-B*

</div>

---

## 📖 Tabla de contenidos

- [Descripción general](#-descripción-general)
- [Stack técnico](#-stack-técnico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Flujo de autenticación](#-flujo-de-autenticación)
- [Rutas protegidas](#-rutas-protegidas)
- [Tarea — Credenciales propias, registro, bloqueo y GitHub](#-tarea--credenciales-propias-registro-bloqueo-y-github)
- [Configuración y ejecución](#-configuración-y-ejecución)
- [Despliegue](#-despliegue)
- [Conclusiones](#-conclusiones)
- [Autor](#-autor)

---

## 📌 Descripción general

Aplicación Next.js que implementa autenticación completa con **NextAuth.js**, combinando tres estrategias distintas bajo un mismo sistema de sesión: **OAuth con Google**, **OAuth con GitHub**, y un **proveedor de credenciales propio** (correo + contraseña) con registro de usuarios, cifrado de contraseñas con bcrypt y bloqueo temporal tras múltiples intentos fallidos. Las rutas sensibles (`/dashboard`, `/profile`) están protegidas con un middleware que verifica la sesión antes de renderizar cualquier contenido.

---

## 🧰 Stack técnico

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![NextAuth](https://img.shields.io/badge/NextAuth.js-7C3AED?style=flat-square)
![Tailwind](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcryptjs-cifrado-FF6B6B?style=flat-square)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 🗂 Estructura del proyecto

```
next-auth-app/
├── src/
│   ├── middleware.ts                      # Protege /dashboard y /profile vía JWT (getToken)
│   ├── lib/
│   │   └── users.ts                        # Almacén en memoria + bcrypt + bloqueo por intentos
│   ├── components/
│   │   ├── LogoutButton.tsx
│   │   └── SessionProvider.tsx
│   └── app/
│       ├── layout.tsx                       # Navbar con sesión + Provider de NextAuth
│       ├── page.tsx                         # Redirect a /dashboard
│       ├── api/
│       │   ├── auth/
│       │   │   └── [...nextauth]/route.ts    # Google + GitHub + Credentials
│       │   └── register/route.ts             # Registro de usuarios propios
│       ├── signIn/page.tsx                  # Login: credenciales + Google + GitHub
│       ├── register/page.tsx                # Formulario de registro
│       ├── dashboard/page.tsx               # Ruta protegida
│       └── profile/page.tsx                 # Ruta protegida
│
├── next.config.ts                          # remotePatterns: Google + GitHub avatars
└── .env.local                              # Credenciales (no se sube)
```

---

## 🔑 Flujo de autenticación

| Proveedor | Tipo | Dónde se configura |
|---|---|---|
| **Google** | OAuth 2.0 | Google Cloud Console → `GoogleProvider` |
| **GitHub** | OAuth 2.0 | GitHub OAuth Apps → `GitHubProvider` |
| **Credenciales propias** | Correo + contraseña | `CredentialsProvider` + `src/lib/users.ts` |

Las tres estrategias conviven en el mismo `authOptions`, y todas terminan generando el mismo tipo de sesión JWT — por eso `/dashboard` y `/profile` no necesitan saber con qué proveedor entró el usuario, solo si hay una sesión válida.

---

## 🛡️ Rutas protegidas

`src/middleware.ts` verifica el token de sesión directamente con `getToken` (en vez del wrapper `withAuth` de next-auth, incompatible con el sistema de middleware/proxy de Next.js 16+) y redirige a `/signIn` si no hay sesión:

```typescript
export const config = {
  matcher: ["/dashboard", "/profile"],
};
```

---

## 🎯 Tarea — Credenciales propias, registro, bloqueo y GitHub

### 1. Registro de usuarios (`POST /api/register`)

Crea un usuario nuevo con contraseña hasheada (`bcrypt.hash`, 10 salt rounds). Rechaza correos duplicados y contraseñas de menos de 6 caracteres.

### 2. Inicio de sesión con credenciales (`CredentialsProvider`)

El `authorize()` valida contra el hash guardado con `bcrypt.compare` — la contraseña en texto plano nunca se almacena ni se compara directamente.

### 3. Bloqueo tras intentos fallidos

Cada correo lleva un contador de intentos fallidos. Al llegar a **5 intentos**, el login queda bloqueado por **2 minutos**, con un mensaje que indica cuánto falta para poder reintentar. Un inicio de sesión exitoso reinicia el contador.

### 4. Autenticación con GitHub (`GitHubProvider`)

Mismo patrón que Google: OAuth App registrada en GitHub, credenciales en `.env.local`, botón "Continue with GitHub" en `/signIn`.

---

## ⚙️ Configuración y ejecución

```bash
git clone https://github.com/diegoninam-ship-it/Lab13-DAWA.git
cd Lab13-DAWA
npm install
```

Crea `.env.local` en la raíz:

```dotenv
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# NextAuth
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=
```

```bash
npm run dev
```

Visita `http://localhost:3005`.

> **Nota:** las credenciales OAuth de Google y GitHub deben tener registrada la URL de callback correspondiente (`/api/auth/callback/google` y `/api/auth/callback/github`) para el dominio exacto donde corra la app — localhost en desarrollo, el dominio de Vercel en producción.

---

## 🚀 Despliegue

**Repositorio:** https://github.com/diegoninam-ship-it/Lab13-DAWA.git

**Aplicación en Vercel:** _pendiente_

Al desplegar, recuerda:
1. Configurar las mismas variables de entorno (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_SECRET`) en el panel de Vercel.
2. Actualizar `NEXTAUTH_URL` al dominio real de producción.
3. Agregar esa misma URL como callback autorizado en Google Cloud Console y en la OAuth App de GitHub.

---

## 📝 Conclusiones

_Pendiente._

---

## 👤 Autor

**Diego Nina Malqui** — Estudiante de Diseño y Desarrollo de Software, Tecsup
📍 Laboratorio 13 · Desarrollo de Aplicaciones Web Avanzado

<div align="center">

⭐ *Si este repo te sirvió de guía, no olvides dejar una estrella* ⭐

</div>