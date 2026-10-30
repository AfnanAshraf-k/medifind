import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTowns } from "@/lib/locations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const towns = await getTowns(supabase);
    return NextResponse.json({ towns });
  } catch (err: any) {
    console.error("Error fetching towns:", err);
    const towns = await getTowns(null);
    return NextResponse.json({ towns });
  }
}

