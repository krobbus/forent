import type { Role } from './props';

interface TokenPayload {
    authenticated: true;
    id: number;
    role: Role;
}

interface UnauthenticatedPayload {
    authenticated: false;
}

export const getUserFromToken = async (): Promise<{ userId: number; userRole: Role } | null> => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
            credentials: 'include'
        });

        if (!res.ok) return null;
        const data: TokenPayload | UnauthenticatedPayload = await res.json();
        if (!data.authenticated) return null;

        return { userId: data.id, userRole: data.role };
    } catch {
        return null;
    }
};