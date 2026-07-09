import { useContext } from "react";
import { ModalContext } from "./ModalProvider";

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
};