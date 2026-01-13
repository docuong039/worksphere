import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            isAdministrator: boolean;
        } & DefaultSession['user'];
    }

    interface User {
        isAdministrator: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        isAdministrator: boolean;
    }
}
