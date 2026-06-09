import { getPublicProjectPrograms } from "@/lib/programCatalog";
import MiniAppClient from "./MiniAppClient";

export const dynamic = "force-dynamic";

export default async function MiniAppPage() {
  const programs = await getPublicProjectPrograms();
  return <MiniAppClient programs={programs} />;
}
