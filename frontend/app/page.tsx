import Link from "next/link";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">Sistema OnMauri</h1>
      <p className="text-gray-500 mb-6">
        Painel administrativo
      </p>

      <Link
        href="/estoque"
        className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:opacity-90"
      >
        Ir para Estoque →
      </Link>
    </main>
  );
}
