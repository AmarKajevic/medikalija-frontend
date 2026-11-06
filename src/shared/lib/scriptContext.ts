import { createContext, useContext } from "react";
import type { Script } from "@shared/lib/script";

export interface ScriptContextValue {
  script: Script;
  setScript: (s: Script) => void;
}

export const ScriptContext = createContext<ScriptContextValue>({ script: "latin", setScript: () => {} });

export const useScript = () => useContext(ScriptContext);
