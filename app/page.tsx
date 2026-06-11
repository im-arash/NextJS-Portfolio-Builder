import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import PortfolioBuilder from "./PortfolioBuilder";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (projectsError) {
    console.error("Projects fetch error:", projectsError);
  }

  let user = null;

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user = authUser;
  } catch {
    user = null;
  }

  return <PortfolioBuilder projects={projects || []} isAdmin={!!user} />;
}
