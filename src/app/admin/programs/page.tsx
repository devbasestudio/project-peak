import { getPublicProjectPrograms } from "@/lib/programCatalog";
import ProgramsClient from "./ProgramsClient";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  const programs = await getPublicProjectPrograms();
  return <ProgramsClient programs={programs} />;
}
