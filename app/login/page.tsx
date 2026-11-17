import AuthRedirect from "@/components/AuthRedirect";
import Header from "@/components/Header";

export default function LoginPage() {
  return (
    <main>
      <Header />
      <AuthRedirect mode="login" />
    </main>
  );
}
