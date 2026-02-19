// src/lib/api.ts
export function apiBase(): string {
  const base = import.meta.env.GEMINI_API_KEY as string | undefined;
  if (!base) throw new Error("Missing GEMINI_API_KEY");
  return base.replace(/\/+$/, "");
}

export async function postWorkflow(payload: any) {
  const res = await fetch(`${apiBase()}/api/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getWorkflow(id: string) {
  const res = await fetch(`${apiBase()}/api/workflows/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listWorkflows() {
  const res = await fetch(`${apiBase()}/api/workflows`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
