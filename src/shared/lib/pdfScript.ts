import { transliterate, type Script } from "@shared/lib/script";

// PDF u izabranom pismu: preslovljavaju se samo vrednosti `text` (ne stilovi, boje, slike)
export function inScript<T>(node: T, script: Script, isText = false): T {
  if (typeof node === "string") return (isText ? transliterate(node, script) : node) as T;
  if (Array.isArray(node)) return node.map((n) => inScript(n, script, isText)) as T;
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => [k, typeof v === "function" ? v : inScript(v, script, k === "text")])
    ) as T;
  }
  return node;
}
