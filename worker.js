/**
 * BLUEPRINT BACKEND — Cloudflare Workers scaffold
 *
 * Bindings expected:
 * DB        -> D1 database
 * AI_API_KEY -> secret (provider key, never exposed to browser)
 *
 * This Worker is intentionally provider-neutral.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Headers":"Content-Type, Authorization",
      "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS"
    };

    if(request.method === "OPTIONS")
      return new Response(null,{headers:cors});

    try {
      if(url.pathname === "/api/health"){
        return json({ok:true,service:"blueprint-api",version:"0.1.0"},cors);
      }

      if(url.pathname === "/api/projects" && request.method === "POST"){
        const body = await request.json();
        if(!body.idea || typeof body.idea !== "string")
          return json({error:"idea_required"},cors,400);

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        if(env.DB){
          await env.DB.prepare(
            `INSERT INTO projects (id,user_id,name,idea,status,version,created_at,updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?7)`
          ).bind(
            id,
            body.userId || "anonymous-beta",
            body.idea.slice(0,120),
            body.idea,
            "PLANNING",
            "0.1.0",
            now
          ).run();
        }

        return json({
          project:{
            id,
            idea:body.idea,
            status:"PLANNING",
            version:"0.1.0"
          }
        },cors,201);
      }

      if(url.pathname === "/api/projects" && request.method === "GET"){
        if(!env.DB) return json({projects:[]},cors);
        const result = await env.DB.prepare(
          "SELECT * FROM projects ORDER BY created_at DESC LIMIT 100"
        ).all();
        return json({projects:result.results || []},cors);
      }

      return json({error:"not_found"},cors,404);
    } catch(error){
      return json({error:"internal_error",message:String(error?.message || error)},cors,500);
    }
  }
};

function json(data, cors={}, status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json",...cors}
  });
}