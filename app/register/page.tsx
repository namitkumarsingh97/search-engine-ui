import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";

export default function RegisterPage() {
  return (
    <main>
      <Header />
      <AuthForm mode="register" />
    </main>
  );
}
