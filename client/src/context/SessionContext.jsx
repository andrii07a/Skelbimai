// Remembers who is signed in, for every page of the React app.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints, http } from '../lib/http.js';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [member, setMember] = useState(null);
  const [ready, setReady] = useState(false);

  // The server knows us by the session cookie
  useEffect(() => {
    http
      .get(endpoints.me)
      .then(({ user }) => setMember(user))
      .catch(() => setMember(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (login, password) => {
    const { user } = await http.post(endpoints.login, { login, password });
    setMember(user);
  }, []);

  const signUp = useCallback(async (form) => {
    const { user } = await http.post(endpoints.register, form);
    setMember(user);
  }, []);

  const signOut = useCallback(async () => {
    await http.post(endpoints.logout);
    setMember(null);
  }, []);

  const value = useMemo(() => ({ member, ready, signIn, signUp, signOut }), [member, ready, signIn, signUp, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
