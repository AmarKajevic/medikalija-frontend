import PageMeta from "@shared/ui/common/PageMeta";
import AuthLayout from "@pages/AuthPages/AuthPageLayout";
import SignInForm from "@features/auth/ui/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Prijava | Medikalija"
        description="Prijava u sistem za upravljanje korisnicima i osobljem doma Medikalija"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
