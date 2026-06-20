import { createClient } from "@supabase/supabase-js";
import RespondClient from "@/components/RespondClient";
import type { Meeting } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Server Component: fetch meetings server-side for faster initial render
export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .order("created_at", { ascending: false });

  return <RespondClient meetings={(meetings as Meeting[]) ?? []} />;
}
