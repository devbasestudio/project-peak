import { getClients } from "@/lib/adminData";
import DevicesClient from "./DevicesClient";

export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  const clients = await getClients();
  return <DevicesClient clients={clients.map((c) => ({ id: c.id, username: c.username }))} />;
}
