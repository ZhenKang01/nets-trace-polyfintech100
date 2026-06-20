import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type UserId = "u1" | "u2" | "u3";

export const USER_PROFILES: Record<UserId, { name: string; persona: string; balance: number }> = {
  u1: { name: "Alex T.", persona: "The Hawker Loyalist", balance: 47.20 },
  u2: { name: "Jordan L.", persona: "The Bubble Tea Devotee", balance: 23.80 },
  u3: { name: "Sam K.", persona: "The JB Weekend Runner", balance: 61.50 },
};

interface UserCtx {
  userId: UserId;
  setUserId: (id: UserId) => void;
}

const UserContext = createContext<UserCtx>({ userId: "u1", setUserId: () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<UserId>("u1");
  return <UserContext.Provider value={{ userId, setUserId }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
