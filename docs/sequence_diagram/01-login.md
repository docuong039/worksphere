# Sequence Diagram 01: Đăng nhập (UC-01)

> **Use Case**: UC-01 - Đăng nhập  
> **Module**: Authentication  
> **Ngày**: 2026-01-15

---

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Participants** | Browser, NextAuth, AuthAPI, UserService, Database |
| **Trigger** | User submit login form |
| **Precondition** | User có tài khoản trong hệ thống |
| **Postcondition** | JWT Session được tạo, User được redirect |

---

## 2. Sequence Diagram (PlantUML)

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE
skinparam sequenceMessageAlign center

title Sequence Diagram: Đăng nhập (UC-01)

actor "User" as User
participant "Browser\n(React)" as Browser #LightBlue
participant "NextAuth\n(Client)" as NextAuthClient #LightGreen
participant "NextAuth\n(Server)" as NextAuthServer #LightGreen
participant "Auth API\n(/api/auth)" as AuthAPI #Orange
participant "User Service\n(lib/auth)" as UserService #Pink
database "Database\n(Prisma)" as DB #LightGray

== Khởi tạo ==
User -> Browser: Truy cập /login
Browser -> Browser: Render LoginPage

== Submit Form ==
User -> Browser: Nhập email, password
User -> Browser: Click "Đăng nhập"
Browser -> NextAuthClient: signIn("credentials", {email, password})

== NextAuth Processing ==
NextAuthClient -> NextAuthServer: POST /api/auth/callback/credentials
NextAuthServer -> AuthAPI: authorize(credentials)

== Authentication ==
AuthAPI -> UserService: validateUser(email, password)
UserService -> DB: SELECT * FROM User\nWHERE email = ?
DB --> UserService: user | null

alt User không tồn tại
    UserService --> AuthAPI: null
    AuthAPI --> NextAuthServer: throw Error("Invalid credentials")
    NextAuthServer --> NextAuthClient: error
    NextAuthClient --> Browser: Hiển thị lỗi
    Browser --> User: "Email hoặc mật khẩu không đúng"
else User tồn tại
    UserService -> UserService: bcrypt.compare(password, user.password)
    
    alt Password không đúng
        UserService --> AuthAPI: null
        AuthAPI --> NextAuthServer: throw Error("Invalid credentials")
        NextAuthServer --> NextAuthClient: error
        NextAuthClient --> Browser: Hiển thị lỗi
        Browser --> User: "Email hoặc mật khẩu không đúng"
    else Password đúng
        UserService -> UserService: Check user.isActive
        
        alt Account bị khóa
            UserService --> AuthAPI: throw Error("Account disabled")
            AuthAPI --> NextAuthServer: error
            NextAuthServer --> NextAuthClient: error
            NextAuthClient --> Browser: Hiển thị lỗi
            Browser --> User: "Tài khoản đã bị khóa"
        else Account active
            UserService --> AuthAPI: user object
            AuthAPI --> NextAuthServer: user object
            
            == Create Session ==
            NextAuthServer -> NextAuthServer: Create JWT Token
            note right of NextAuthServer
                JWT payload:
                - id
                - email
                - name
                - isAdministrator
            end note
            
            NextAuthServer --> NextAuthClient: session + cookie
            NextAuthClient -> Browser: Set cookie (next-auth.session-token)
            NextAuthClient --> Browser: redirect to "/"
            Browser --> User: Hiển thị Dashboard
        end
    end
end

@enduml
```

---

## 3. Participants Description

| Participant | Công nghệ | Chức năng |
|-------------|-----------|-----------|
| Browser | React/Next.js | UI, form handling |
| NextAuth Client | next-auth/react | signIn(), session management |
| NextAuth Server | next-auth | JWT creation, callback handling |
| Auth API | Next.js API Route | Credentials authorization |
| User Service | lib/auth.ts | User validation, bcrypt |
| Database | Prisma/SQLite | User storage |

---

## 4. Messages Detail

| # | From | To | Message | Type |
|---|------|----|---------|------|
| 1 | Browser | NextAuthClient | signIn("credentials", {email, password}) | sync call |
| 2 | NextAuthClient | NextAuthServer | POST /api/auth/callback/credentials | HTTP POST |
| 3 | NextAuthServer | AuthAPI | authorize(credentials) | callback |
| 4 | AuthAPI | UserService | validateUser(email, password) | async call |
| 5 | UserService | DB | SELECT * FROM User WHERE email = ? | query |
| 6 | UserService | UserService | bcrypt.compare() | internal |
| 7 | NextAuthServer | NextAuthServer | Create JWT Token | internal |
| 8 | NextAuthServer | Browser | Set-Cookie | HTTP header |

---

## 5. Error Handling

| Error | HTTP Status | Message | Handling |
|-------|-------------|---------|----------|
| Email not found | 401 | "Invalid credentials" | Show error, stay on login |
| Wrong password | 401 | "Invalid credentials" | Show error, stay on login |
| Account disabled | 401 | "Account disabled" | Show error, stay on login |
| Server error | 500 | "Server error" | Show error, retry |

---

## 6. JWT Token Structure

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "isAdministrator": false,
  "iat": 1705333200,
  "exp": 1707925200
}
```

---

*Ngày tạo: 2026-01-15*
