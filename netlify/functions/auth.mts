import type {Context} from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Handle CORS preflight requests
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
    return new Response("Method Not Allowed", {status: 405});
  }

  try {
    const {password} = await req.json();

    if (!password) {
      return new Response(JSON.stringify({success: false, message: "Password required"}), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    const netlifyPass = process.env.PASS;
    console.log("Netlify Pass:", netlifyPass);

    if ((netlifyPass && netlifyPass === password)) {
      return new Response(JSON.stringify({success: true}), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    } else {
      return new Response(JSON.stringify({success: false, message: "Invalid credentials"}), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(JSON.stringify({success: false, message: "Internal Server Error"}), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
}


