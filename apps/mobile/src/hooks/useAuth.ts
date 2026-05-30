import { useState, useEffect } from "react";
import * as api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthUser = {
  id: string;
  username: string;
  publicCode: string;
};
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rehydrating, setRehydrating] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem("Copa:authToken");
        const savedUser = await AsyncStorage.getItem("Copa:user");
        if (!mounted) return;
        if (savedToken) {
          setToken(savedToken);
          api.setAuthToken(savedToken);
        }
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setRehydrating(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      console.log("useAuth.signIn: start", { username });
      const res = await api.login(username, password);
      console.log("useAuth.signIn: api.login response", res);
      if (res.status === 201 || res.status === 200) {
        const payload = res.data;
        setUser(payload.user);
        setToken(payload.accessToken);
        api.setAuthToken(payload.accessToken);
        await AsyncStorage.setItem("Copa:authToken", payload.accessToken);
        await AsyncStorage.setItem("Copa:user", JSON.stringify(payload.user));
        return true;
      }
      console.log("useAuth.signIn: failed result", res);
      setError(res.data?.message || "Credenciais inválidas");
      return false;
    } catch (err: any) {
      console.log("useAuth.signIn: exception", err);
      setError(err?.message || "Erro de rede");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      console.log("useAuth.signUp: start", { username });
      const res = await api.register(username, password);
      console.log("useAuth.signUp: api.register response", res);
      if (res.status === 201 || res.status === 200) {
        const payload = res.data;
        setUser(payload.user);
        setToken(payload.accessToken);
        api.setAuthToken(payload.accessToken);
        await AsyncStorage.setItem("Copa:authToken", payload.accessToken);
        await AsyncStorage.setItem("Copa:user", JSON.stringify(payload.user));
        return true;
      }
      console.log("useAuth.signUp: failed result", res);
      setError(res.data?.message || "Erro no cadastro");
      return false;
    } catch (err: any) {
      console.log("useAuth.signUp: exception", err);
      setError(err?.message || "Erro de rede");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setUser(null);
    setToken(null);
    api.setAuthToken(null);
    AsyncStorage.removeItem("Copa:authToken");
    AsyncStorage.removeItem("Copa:user");
  }

  return {
    user,
    token,
    loading: loading || rehydrating,
    error,
    signIn,
    signUp,
    signOut,
  };
}
