import { getProjectProgram, projectPrograms } from "@/lib/projectPeakConfig";
import ProgramDetailClient from "./ProgramDetailClient";

export function generateStaticParams() {
  return projectPrograms.map((program) => ({ program: program.key }));
}

export default async function ProgramDetailPage(props: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await props.params;

  return <ProgramDetailClient program={getProjectProgram(program)} />;
}
