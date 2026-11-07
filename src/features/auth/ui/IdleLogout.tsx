import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";

// Automatska odjava posle neaktivnosti — zdravstveni podaci na zajedničkom računaru
// na odeljenju. Aktivnost se deli između kartica (localStorage), pa rad u jednoj
// kartici ne odjavljuje drugu.
export const IDLE_MINUTES = 30;
const WARN_SECONDS = 60;
const KEY = "lastActivity";
const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "mousemove"] as const;

const now = () => Date.now();
const lastActivity = () => Number(localStorage.getItem(KEY)) || now();

export default function IdleLogout({ minutes = IDLE_MINUTES }: { minutes?: number }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastWrite = useRef(0);
  const timeoutMs = minutes * 60_000;

  const touch = useCallback(() => {
    // Upis najviše na 5 s (mousemove okida stalno)
    if (now() - lastWrite.current < 5000) return;
    lastWrite.current = now();
    localStorage.setItem(KEY, String(now()));
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, String(now()));
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      const idle = now() - lastActivity();
      if (idle >= timeoutMs) {
        window.clearInterval(timer);
        localStorage.removeItem(KEY);
        void logout().then(() => navigate(paths.signIn, { replace: true, state: { reason: "idle" } }));
      } else if (idle >= timeoutMs - WARN_SECONDS * 1000) {
        setSecondsLeft(Math.ceil((timeoutMs - idle) / 1000));
      } else {
        setSecondsLeft(null);
      }
    }, 1000);
    return () => {
      window.clearInterval(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [timeoutMs, touch, logout, navigate]);

  const stay = () => {
    lastWrite.current = 0;
    localStorage.setItem(KEY, String(now()));
    setSecondsLeft(null);
  };

  return (
    <Dialog
      open={secondsLeft !== null}
      onClose={stay}
      size="sm"
      title="Da li ste još tu?"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => void logout().then(() => navigate(paths.signIn, { replace: true }))}>
            Odjavi me
          </Button>
          <Button size="sm" onClick={stay} autoFocus>
            Nastavi rad
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 dark:text-gray-300" aria-live="assertive">
        Zbog zaštite podataka o pacijentima odjavićemo vas za <strong className="tabular-nums">{secondsLeft}</strong> s, jer niste ništa radili {minutes} minuta.
      </p>
    </Dialog>
  );
}
