import { ReactNode, useEffect, useMemo, useState } from "react";
import { getScript, Script, storeScript, transliterate } from "@shared/lib/script";
import { ScriptContext } from "@shared/lib/scriptContext";

// Prikaz cele aplikacije u izabranom pismu.
//
// Tekstovi interfejsa su pisani latinicom, a podaci iz baze mogu biti u oba pisma,
// pa se preslovljava ono što je na ekranu: tekst i atributi koje korisnik čita
// (placeholder, title, aria-label, alt), uključujući ono što iscrtavaju biblioteke
// (kalendar, obaveštenja). MutationObserver prati svaku promenu; preslovljavanje je
// idempotentno, pa sopstvene izmene ne prave petlju.
//
// Ne dira se: vrednost polja koje korisnik kuca, <script>/<style>, <kbd> (tasteri
// su latinični) i sve unutar [data-no-translit] ili [translate="no"].

const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"] as const;
const SKIP_SELECTOR = "script,style,noscript,textarea,kbd,code,[data-no-translit],[translate='no'],[contenteditable='true']";

function skipped(node: Node): boolean {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return !el || !!el.closest(SKIP_SELECTOR);
}

function convertText(node: Text, script: Script) {
  const value = node.nodeValue;
  if (!value || !value.trim() || skipped(node)) return;
  const next = transliterate(value, script);
  if (next !== value) node.nodeValue = next;
}

function convertAttributes(el: Element, script: Script) {
  if (skipped(el)) return;
  for (const name of ATTRIBUTES) {
    const value = el.getAttribute(name);
    if (!value) continue;
    const next = transliterate(value, script);
    if (next !== value) el.setAttribute(name, next);
  }
}

function convertTree(root: Node, script: Script) {
  if (root.nodeType === Node.TEXT_NODE) return convertText(root as Text, script);
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (skipped(root)) return;
    convertAttributes(root as Element, script);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP_SELECTOR) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) convertText(n as Text, script);
    else convertAttributes(n as Element, script);
  }
}

export default function ScriptProvider({ children }: { children: ReactNode }) {
  const [script, setScriptState] = useState<Script>(getScript);

  useEffect(() => {
    document.documentElement.lang = script === "cyrillic" ? "sr-Cyrl" : "sr-Latn";
    convertTree(document.documentElement, script);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData") convertText(m.target as Text, script);
        else if (m.type === "attributes") convertAttributes(m.target as Element, script);
        else m.addedNodes.forEach((n) => convertTree(n, script));
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    });
    return () => observer.disconnect();
  }, [script]);

  const value = useMemo(
    () => ({
      script,
      setScript: (s: Script) => {
        storeScript(s);
        setScriptState(s);
      },
    }),
    [script]
  );

  return <ScriptContext.Provider value={value}>{children}</ScriptContext.Provider>;
}
