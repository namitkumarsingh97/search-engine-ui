import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";

export default function LoginPage() {
  return (
    <main>
      <Header />
      <AuthForm mode="login" />
    </main>
  );
}
