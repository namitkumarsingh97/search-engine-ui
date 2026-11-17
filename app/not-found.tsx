import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <main>
      <Header />
      <div className="page pt-14">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_16rem]">
          <div>
            <p className="kicker mb-4 flex items-center gap-3">
              <span className="inline-block h-3 w-10 bg-accent" />
              Error 404
            </p>
            <h1 className="display text-[clamp(4rem,14vw,10rem)]">Lost.</h1>
            <p className="mt-5 max-w-md text-lg font-medium">That page doesn&apos;t exist, or it moved. Try a search instead.</p>
            <Link href="/" className="btn-primary mt-6 !py-3">
              Back to search
            </Link>
          </div>
          <div className="relative hidden aspect-square md:block" aria-hidden>
            <div className="absolute left-0 top-0 h-[60%] w-[60%] bg-mustard" />
            <div className="absolute bottom-0 right-0 h-[60%] w-[60%] bg-ink" />
            <div className="absolute right-0 top-0 h-[34%] w-[34%] bg-accent" />
          </div>
        </div>
      </div>
    </main>
  );
}
