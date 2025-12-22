import type { Context } from "@netlify/functions";

const defaultUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbxa5Mqb9oSmOK4uls55ZZC5-pahqPOQMnF1nEJJ2KDYAwAh6PeHM8AUU2xfzl--Vb6pXKX73b4T6C/pub?gid=1348597380&single=true&output=csv";

export default async (req: Request, context: Context) => {
  const url  = process.env.INVESTMENTS_CSV_URL || defaultUrl;

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return new Response(JSON.stringify({ success: false, message: "Password required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const netlifyPass = process.env.PASS;
    if (!(netlifyPass && netlifyPass === password)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const response = await fetch(url);

    if (!response.ok) {
      return new Response(`Error fetching data: ${response.statusText}`, {
        status: response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await response.text();

    return new Response(data, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      }
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ success: false, message: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}