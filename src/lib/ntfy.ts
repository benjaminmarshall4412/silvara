import "server-only";

/**
 * Push a notification to ntfy (default public topic Silvara).
 * Set NTFY_TOPIC / NTFY_SERVER to override. Optional NTFY_TOKEN for access-controlled topics.
 */
export async function notifyNtfy(input: {
  title: string;
  message: string;
  priority?: number;
  tags?: string[];
  clickUrl?: string;
}): Promise<void> {
  const topic = process.env.NTFY_TOPIC?.trim() || "Silvara";
  const server = (process.env.NTFY_SERVER?.trim() || "https://ntfy.sh").replace(
    /\/$/,
    "",
  );
  const url = `${server}/${encodeURIComponent(topic)}`;

  const headers: Record<string, string> = {
    Title: input.title.slice(0, 250),
    Priority: String(input.priority ?? 4),
    "Content-Type": "text/plain; charset=utf-8",
  };
  if (input.tags?.length) {
    headers.Tags = input.tags.join(",");
  }
  if (input.clickUrl) {
    headers.Click = input.clickUrl;
  }
  const token = process.env.NTFY_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: input.message,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[ntfy]", res.status, text.slice(0, 200));
    }
  } catch (err) {
    console.error("[ntfy]", err);
  }
}
