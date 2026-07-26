import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Floors are NOT a database table (see schema note in
// drawtropolis_initial_schema.sql — they carry no data of their own until
// a room in them is claimed), so this page just generates 1-100 as links.
// Doctrine: every floor has the same layout (100 rooms: 56 even on the
// outer corridor, 44 odd on the inner corridor).
export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buildingId = Number(id);
  const supabase = await createClient();

  const { data: building } = await supabase
    .from("buildings")
    .select("id, name, collection, is_special")
    .eq("id", buildingId)
    .single();

  if (!building) notFound();

  const floors = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        &larr; Back to the city
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">{building.name}</h1>
      {building.is_special && (
        <p className="text-neutral-500 mb-6 text-sm">
          Public landmark — open to everyone, no claim required.
        </p>
      )}
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mt-6">
        {floors.map((floor) => (
          <Link
            key={floor}
            href={`/room/${building.id}/${floor}`}
            className="border rounded px-2 py-3 text-center text-sm hover:bg-neutral-50"
          >
            {floor}
          </Link>
        ))}
      </div>
    </main>
  );
}
