import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Building } from "@/lib/types";

// City home: groups the 100 named buildings into their 10 collections,
// plus City Hall as a separate landmark link. Buildings table is public
// read (see schema RLS), so this works even for signed-out visitors.
export default async function Home() {
  const supabase = await createClient();
  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("id, name, collection, is_special")
    .order("id");

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-500">
          Could not load buildings: {error.message}
        </p>
      </main>
    );
  }

  const cityHall = (buildings ?? []).find((b: Building) => b.is_special);
  const collections = new Map<string, Building[]>();
  for (const b of buildings ?? []) {
    if (b.is_special) continue;
    const key = b.collection ?? "Uncategorised";
    if (!collections.has(key)) collections.set(key, []);
    collections.get(key)!.push(b);
  }

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold">Drawtropolis</h1>
        <p className="text-neutral-500">A million rooms. One city. Find yours.</p>
      </header>

      {cityHall && (
        <Link
          href={`/building/${cityHall.id}`}
          className="block mb-10 p-4 border rounded-lg hover:bg-neutral-50"
        >
          <span className="font-medium">{cityHall.name}</span>
          <span className="text-neutral-500 text-sm block">
            Open to everyone. Draw here, no claim needed.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {Array.from(collections.entries()).map(([name, list]) => (
          <section key={name}>
            <h2 className="font-medium mb-2">{name}</h2>
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {list.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/building/${b.id}`}
                    className="text-neutral-700 hover:underline"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
