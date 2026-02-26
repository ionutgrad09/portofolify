import type { Context } from "@netlify/functions";


export default async (req: Request, context: Context) => {
  const url  = process.env.INVESTMENTS_CSV_URL;

  if (!url) return;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return new Response(`Error fetching data: ${response.statusText}`, {
        status: response.status
      });
    }

    const data = await response.text();

    return new Response(data, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (error) {

    console.error("Function error:", error);

    return new Response("Internal Server Error", { status: 500 });
  }
}