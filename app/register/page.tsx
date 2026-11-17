import AuthRedirect from "@/components/AuthRedirect";
import Header from "@/components/Header";

export default function RegisterPage() {
  return (
    <main>
      <Header />
      <AuthRedirect mode="register" />
    </main>
  );
}
