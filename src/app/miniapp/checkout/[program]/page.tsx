import { getProjectProgram, projectPrograms } from "@/lib/projectPeakConfig";
import CheckoutClient from "./CheckoutClient";

export function generateStaticParams() {
  return projectPrograms.map((program) => ({ program: program.key }));
}

export default async function CheckoutPage(props: {
  params: Promise<{ program: string }>;
  searchParams: Promise<{ months?: string }>;
}) {
  const [{ program }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const selectedProgram = getProjectProgram(program);
  const initialMonths = Number(searchParams.months || selectedProgram.durations[0].months);

  return <CheckoutClient program={selectedProgram} initialMonths={initialMonths} />;
}
