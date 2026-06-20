import { getDeviceSummaries } from "@/lib/adminData";
import DevicesClient from "./DevicesClient";

export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  const clients = await getDeviceSummaries();
  return <DevicesClient clients={clients} />;
}
