import { projectPrograms } from "@/lib/projectPeakConfig";
import { getPublicProjectProgram } from "@/lib/programCatalog";
import ProgramDetailClient from "./ProgramDetailClient";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return projectPrograms.map((program) => ({ program: program.key }));
}

export default async function ProgramDetailPage(props: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await props.params;

  return <ProgramDetailClient program={await getPublicProjectProgram(program)} />;
}
