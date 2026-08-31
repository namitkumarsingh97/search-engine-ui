import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href="/" className="text-xl font-semibold text-brand-dark">
        MiniSearch
      </Link>
      <nav className="text-sm text-gray-600">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
      </nav>
    </header>
  );
}
