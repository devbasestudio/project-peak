export function GET() {
  return Response.json({ ok: true, service: "project-peak", time: new Date().toISOString() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
