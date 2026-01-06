// lib/auth-proxy.ts - A simple proxy for auth functions
export const useSession = () => ({ 
  data: null, 
  status: 'unauthenticated' 
});

export const getSession = async () => null;

export const getServerSession = async () => null;

export const signIn = async () => ({ error: 'Auth not configured' });
export const signOut = async () => ({ error: 'Auth not configured' });

