import { createContext, useState, ReactNode } from "react";
import { Drawer } from "../drawer";
import { UseMedicineForm } from "../../../features/medicine/ui/UseMedicineForm";
import AddCombinationToPatientForm from "../../../features/combinations/ui/AddCombinationToPatientForm";
import UseArticleForm from "../../../features/articles/ui/UseArticleForm";


type ModalType = "medicine" | "combination" | "article" |null;

type ModalContextType = {
  open: (type: ModalType, props?: any) => void;
  close: () => void;
};

export const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [type, setType] = useState<ModalType>(null);
  const [props, setProps] = useState<any>(null);

  const open = (type: ModalType, props?: any) => {
    setType(type);
    setProps(props);
  };

  const close = () => {
    setType(null);
    setProps(null);
  };

  return (
    <ModalContext.Provider value={{ open, close }}>
      {children}

      <Drawer open={!!type} onClose={close}>
        {type === "medicine" && <UseMedicineForm {...props} />}
        {type === "article" && <UseArticleForm {...props} />}
        {type === "combination" && <AddCombinationToPatientForm {...props} />}
      </Drawer>
    </ModalContext.Provider>
  );
};