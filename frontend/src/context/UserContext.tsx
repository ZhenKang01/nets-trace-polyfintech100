import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type UserId = "u1" | "u2" | "u3";

export const USER_PROFILES: Record<UserId, { name: string; persona: string; balance: number }> = {
  u1: { name: "Alex T.", persona: "The Hawker Loyalist", balance: 12847.20 },
  u2: { name: "Jordan L.", persona: "The Bubble Tea Devotee", balance: 24631.80 },
  u3: { name: "Sam K.", persona: "The JB Weekend Runner", balance: 67410.50 },
};

const INITIAL_BALANCES: Record<UserId, number> = {
  u1: 12847.20,
  u2: 24631.80,
  u3: 67410.50,
};

interface UserCtx {
  userId: UserId;
  setUserId: (id: UserId) => void;
  balance: number;
  addBalance: (amount: number) => void;
}

const UserContext = createContext<UserCtx>({
  userId: "u1",
  setUserId: () => {},
  balance: INITIAL_BALANCES.u1,
  addBalance: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<UserId>("u1");
  const [balances, setBalances] = useState<Record<UserId, number>>(INITIAL_BALANCES);

  const addBalance = (amount: number) => {
    setBalances((prev) => ({ ...prev, [userId]: prev[userId] + amount }));
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, balance: balances[userId], addBalance }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
