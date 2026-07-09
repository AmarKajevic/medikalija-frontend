import { HelmetProvider, Helmet } from "react-helmet-async";
import { ModalProvider } from "../../shared/ui/modal/ModalProvider";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <ModalProvider>
    {children}
    </ModalProvider>
    </HelmetProvider>
);

export default PageMeta;
