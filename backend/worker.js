
// BLUEPRINT — Backend Worker
// Cloudflare Workers + D1
// Slogan: Encontre. Crie. Venda.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // ==========================================
      // HEALTH CHECK
      // ==========================================

      if (path === "/api/health" && method === "GET") {
        return json({
          success: true,
          app: "BLUEPRINT",
          status: "online",
          message: "BLUEPRINT Backend funcionando.",
          timestamp: now()
        });
      }

      // ==========================================
      // CRIAR PROJETO
      // ==========================================

      if (path === "/api/projects" && method === "POST") {
        const body = await request.json();

        const idea = String(body.idea || "").trim();
        const name =
          String(body.name || "").trim() ||
          "Novo projeto BLUEPRINT";

        if (!idea) {
          return json(
            {
              success: false,
              error: "A ideia do projeto é obrigatória."
            },
            400
          );
        }

        const project = {
          id: createId(),
          name,
          idea,
          status: "planning",
          created_at: now(),
          updated_at: now()
        };

        // ------------------------------------------
        // D1
        // ------------------------------------------

        if (env.DB) {
          try {
            await env.DB.prepare(`
              INSERT INTO projects
              (id, name, description, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `)
              .bind(
                project.id,
                project.name,
                project.idea,
                project.status,
                project.created_at,
                project.updated_at
              )
              .run();
          } catch (dbError) {
            console.error("D1 error:", dbError);

            return json(
              {
                success: false,
                error: "Não foi possível salvar o projeto no banco de dados.",
                details: dbError.message
              },
              500
            );
          }
        }

        return json({
          success: true,
          message: "Projeto recebido pelo BLUEPRINT Brain.",
          project,
          next_step:
            "O Orchestrator deverá analisar a ideia e montar o plano de construção."
        }, 201);
      }

      // ==========================================
      // LISTAR PROJETOS
      // ==========================================

      if (path === "/api/projects" && method === "GET") {
        if (!env.DB) {
          return json({
            success: true,
            projects: [],
            message:
              "Backend online. Banco D1 ainda não conectado."
          });
        }

        const result = await env.DB.prepare(`
          SELECT *
          FROM projects
          ORDER BY created_at DESC
        `).all();

        return json({
          success: true,
          projects: result.results || []
        });
      }

      // ==========================================
      // BUSCAR PROJETO
      // ==========================================

      if (
        path.startsWith("/api/projects/") &&
        method === "GET"
      ) {
        const projectId = path.split("/").pop();

        if (!projectId) {
          return json(
            {
              success: false,
              error: "ID do projeto não informado."
            },
            400
          );
        }

        if (!env.DB) {
          return json({
            success: true,
            project: null,
            message: "Banco D1 ainda não conectado."
          });
        }

        const result = await env.DB.prepare(`
          SELECT *
          FROM projects
          WHERE id = ?
          LIMIT 1
        `)
          .bind(projectId)
          .first();

        if (!result) {
          return json(
            {
              success: false,
              error: "Projeto não encontrado."
            },
            404
          );
        }

        return json({
          success: true,
          project: result
        });
      }

      // ==========================================
      // ATUALIZAR PROJETO
      // ==========================================

      if (
        path.startsWith("/api/projects/") &&
        method === "PUT"
      ) {
        const projectId = path.split("/").pop();
        const body = await request.json();

        if (!env.DB) {
          return json(
            {
              success: false,
              error: "Banco D1 não conectado."
            },
            503
          );
        }

        const name = String(body.name || "").trim();
        const description = String(
          body.description || body.idea || ""
        ).trim();

        await env.DB.prepare(`
          UPDATE projects
          SET name = ?,
              description = ?,
              updated_at = ?
          WHERE id = ?
        `)
          .bind(
            name,
            description,
            now(),
            projectId
          )
          .run();

        return json({
          success: true,
          message: "Projeto atualizado.",
          project_id: projectId
        });
      }

      // ==========================================
      // DELETAR PROJETO
      // ==========================================

      if (
        path.startsWith("/api/projects/") &&
        method === "DELETE"
      ) {
        const projectId = path.split("/").pop();

        if (!env.DB) {
          return json(
            {
              success: false,
              error: "Banco D1 não conectado."
            },
            503
          );
        }

        await env.DB.prepare(`
          DELETE FROM projects
          WHERE id = ?
        `)
          .bind(projectId)
          .run();

        return json({
          success: true,
          message: "Projeto excluído.",
          project_id: projectId
        });
      }

      // ==========================================
      // ROTA NÃO ENCONTRADA
      // ==========================================

      return json(
        {
          success: false,
          error: "Rota não encontrada.",
          path
        },
        404
      );

    } catch (error) {
      console.error("BLUEPRINT Worker Error:", error);

      return json(
        {
          success: false,
          error: "Erro interno do BLUEPRINT.",
          details: error.message
        },
        500
      );
    }
  }
};
