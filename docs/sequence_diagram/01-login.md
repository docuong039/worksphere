# Sequence Diagram 01: Đăng nhập (UC-01)

> **Use Case**: UC-01 - Đăng nhập  
> **Module**: Authentication  
> **Ngày**: 2026-01-16 (Updated from code review)

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, NextAuth Client, NextAuth Server, Prisma |
| **Source Files** | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| **Auth Method** | Credentials Provider với bcrypt |
| **Session** | JWT strategy |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Đăng nhập (UC-01)
footer Based on: src/lib/auth.ts

actor "User" as User
participant "Browser\n(LoginPage)" as Browser #LightBlue
participant "NextAuth\nClient" as NextAuthClient #LightGreen
participant "NextAuth\nCredentials\nProvider" as AuthProvider #Orange
database "Prisma\n(Database)" as DB #LightGray

== Render Login Page ==
User -> Browser: Navigate to /login
Browser -> Browser: Render LoginPage

== Submit Credentials ==
User -> Browser: Nhập email, password
User -> Browser: Click "Đăng nhập"

Browser -> NextAuthClient: signIn("credentials", {\n  email, password,\n  redirect: true,\n  callbackUrl: "/"\n})

NextAuthClient -> AuthProvider: POST /api/auth/callback/credentials
AuthProvider -> AuthProvider: authorize(credentials)

== Validate Input ==
AuthProvider -> AuthProvider: Check credentials exists
alt !credentials?.email || !credentials?.password
    AuthProvider --> NextAuthClient: null (unauthorized)
    NextAuthClient --> Browser: CredentialsSignin error
    Browser --> User: "Email hoặc mật khẩu không đúng"
end

== Find User ==
AuthProvider -> DB: SELECT * FROM User\nWHERE email = credentials.email
DB --> AuthProvider: user | null

alt User không tồn tại
    AuthProvider --> NextAuthClient: null
    NextAuthClient --> Browser: Error
    Browser --> User: "Email hoặc mật khẩu không đúng"
end

== Check Active ==
AuthProvider -> AuthProvider: Check user.isActive
alt !user.isActive
    AuthProvider --> NextAuthClient: null
    NextAuthClient --> Browser: Error
    Browser --> User: "Email hoặc mật khẩu không đúng"
    note right: Không tiết lộ account bị khóa
end

== Verify Password ==
AuthProvider -> AuthProvider: bcrypt.compare(\n  credentials.password,\n  user.password\n)
alt Password không khớp
    AuthProvider --> NextAuthClient: null
    NextAuthClient --> Browser: Error
    Browser --> User: "Email hoặc mật khẩu không đúng"
end

== Create Session ==
AuthProvider --> NextAuthClient: user object
note right of AuthProvider
  Return:
  - id
  - email
  - name
  - isAdministrator
end note

NextAuthClient -> NextAuthClient: JWT Callback
note right of NextAuthClient
  token.id = user.id
  token.isAdministrator = user.isAdministrator
end note

NextAuthClient -> NextAuthClient: Session Callback
note right of NextAuthClient
  session.user.id = token.id
  session.user.isAdministrator = token.isAdministrator
end note

NextAuthClient -> Browser: Set-Cookie: authjs.session-token
NextAuthClient --> Browser: redirect to callbackUrl

Browser --> User: Hiển thị Dashboard (/)

@enduml
```

---

## 3. Auth Configuration (từ code)

```typescript
// src/lib/auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.isActive) {
                    return null;
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isAdministrator: user.isAdministrator,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isAdministrator = user.isAdministrator;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.isAdministrator = token.isAdministrator as boolean;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
});
```

---

## 4. JWT Token Content

```json
{
  "id": "clxxxxx",
  "email": "user@example.com",
  "name": "User Name",
  "isAdministrator": false,
  "iat": 1705333200,
  "exp": 1707925200,
  "jti": "uuid"
}
```

---

## 5. Session Object

```typescript
// Accessible via auth() or useSession()
{
  user: {
    id: "clxxxxx",
    email: "user@example.com",
    name: "User Name",
    isAdministrator: false
  },
  expires: "2026-02-15T00:00:00.000Z"
}
```

---

## 6. Error Handling

| Scenario | Return | Displayed |
|----------|--------|-----------|
| Empty credentials | `null` | "Email hoặc mật khẩu không đúng" |
| User not found | `null` | "Email hoặc mật khẩu không đúng" |
| Account disabled | `null` | "Email hoặc mật khẩu không đúng" |
| Wrong password | `null` | "Email hoặc mật khẩu không đúng" |

> **Security Note**: Không phân biệt lỗi cụ thể để tránh enumeration attacks.

---

*Ngày cập nhật: 2026-01-16 - Based on actual code review*
