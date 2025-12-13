import type {Context} from "@netlify/functions";

export const hashPin = async (pin: string) => {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error("Eroare la generarea hash-ului:", error);
    return null;
  }
};

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

    const hashedInput = await hashPin(password);
    const netlifyPass = process.env.PASS;
    const expectedHash = '91c08bff2e05931ed678b9944c27f4b8788412a5a63fbe2793e62299ca46c6ae';

    console.log("password", password)
    console.log("netlify pass", netlifyPass);
    if ((netlifyPass && netlifyPass === password) || (!netlifyPass && hashedInput === expectedHash)) {
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


