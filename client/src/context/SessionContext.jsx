// Remembers who is signed in, for every page of the React app.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, http } from '../lib/http.js';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [member, setMember] = useState(null);
  const [ready, setReady] = useState(false);

  // The server recognises us by the session cookie
  useEffect(() => {
    http
      .get(api.session)
      .then((data) => setMember(data.member))
      .catch(() => setMember(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (login, password) => {
    const data = await http.post(api.session, { login, password });
    setMember(data.member);
  }, []);

  const join = useCallback(async (form) => {
    const data = await http.post(api.members, form);
    setMember(data.member);
  }, []);

  const signOut = useCallback(async () => {
    await http.remove(api.session);
    setMember(null);
  }, []);

  const value = useMemo(() => ({ member, ready, signIn, join, signOut }), [member, ready, signIn, join, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
