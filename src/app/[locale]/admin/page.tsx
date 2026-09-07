import { redirect } from "next/navigation";

export default function AdminRedirect() {
  redirect("https://admin.projectpeak.fit/home-workout/payments");
}
