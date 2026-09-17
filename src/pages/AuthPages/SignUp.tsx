import PageMeta from "@shared/ui/common/PageMeta";
import AuthLayout from "@pages/AuthPages/AuthPageLayout";
import SignUpForm from "@features/auth/ui/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Registracija korisnika | Medikalija"
        description="Registracija novog korisnika u sistemu Medikalija"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
