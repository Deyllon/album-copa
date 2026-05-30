import { useState } from "react";
import * as api from "../services/api";

export type TradeComparison = {
  otherUser: { username: string; publicCode: string };
  iCanOffer: Array<{ code: string; playerName?: string }>;
  iNeedFromThem: Array<{ code: string; playerName?: string }>;
};

export function useTradeBuilder(token?: string) {
  const [comparison, setComparison] = useState<TradeComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Set<string>>(new Set());
  const [selectedReceive, setSelectedReceive] = useState<Set<string>>(
    new Set(),
  );

  async function loadComparison(identifier: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.tradeCompare(identifier, token);
      if (res.status === 200) {
        setComparison(res.data as TradeComparison);
        setSelectedOffer(new Set());
        setSelectedReceive(new Set());
        return true;
      }
      setError(res.data?.message || "Erro ao carregar comparação");
      return false;
    } catch (err: any) {
      setError(err?.message || "Erro de rede");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function toggleOffer(code: string) {
    const next = new Set(selectedOffer);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelectedOffer(next);
  }

  function toggleReceive(code: string) {
    const next = new Set(selectedReceive);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelectedReceive(next);
  }

  function clear() {
    setSelectedOffer(new Set());
    setSelectedReceive(new Set());
    setComparison(null);
  }

  async function executeTrade() {
    const payload = {
      toPublicCode: comparison?.otherUser?.publicCode ?? null,
      offered: Array.from(selectedOffer),
      requested: Array.from(selectedReceive),
    };
    if (token) {
      const res = await api.executeTrade(payload as any, token);
      if (res.status === 200 || res.status === 201) {
        return { success: true, server: res.data };
      }
      return {
        success: false,
        message: res.data?.message || "Erro ao aplicar troca",
      };
    }
    return {
      success: true,
      offered: payload.offered,
      requested: payload.requested,
    };
  }

  return {
    comparison,
    loading,
    error,
    loadComparison,
    selectedOffer,
    selectedReceive,
    toggleOffer,
    toggleReceive,
    clear,
    executeTrade,
  } as const;
}
