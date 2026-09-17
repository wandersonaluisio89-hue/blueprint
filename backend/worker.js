// ============================================================
// BLUEPRINT BACKEND
// Encontre. Crie. Venda.
// ============================================================

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}

function id(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// ============================================================
// HEALTH
// ============================================================

async function health(env) {
  return json({
    ok: true,
    service: "BLUEPRINT API",
    version: "0.1.0",
    database: !!env?.DB,
    timestamp: now()
  });
}

// ============================================================
// CREATE PROJECT
// ============================================================

async function createProject(request, env) {
  const body = await readBody(request);

  const originalIdea = String(body.original_idea || body.idea || "").trim();

  if (!originalIdea) {
    return json({
      ok: false,
      error: "A ideia do projeto é obrigatória."
    }, 400);
  }

  const userId = body.user_id || "demo_user";

  const projectId = id("project");

  const projectName =
    body.name ||
    generateProjectName(originalIdea);

  const project = {
    id: projectId,
    user_id: userId,
    name: projectName,
    original_idea: originalIdea,
    description: body.description || "",
    status: "draft",
    project_type: body.project_type || "saas",
    current_version: 1,
    created_at: now(),
    updated_at: now()
  };

  // ----------------------------------------------------------
  // Se o D1 estiver conectado, salva o projeto.
  // ----------------------------------------------------------

  if (env?.DB) {
    await env.DB.prepare(`
      INSERT INTO projects (
        id,
        user_id,
        name,
        original_idea,
        description,
        status,
        project_type,
        current_version,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        project.id,
        project.user_id,
        project.name,
        project.original_idea,
        project.description,
        project.status,
        project.project_type,
        project.current_version,
        project.created_at,
        project.updated_at
      )
      .run();

    // Registra a ideia como requisito inicial.
    await env.DB.prepare(`
      INSERT INTO project_requirements (
        id,
        project_id,
        requirement,
        category,
        priority,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id("req"),
        project.id,
        originalIdea,
        "original_idea",
        "high",
        "pending",
        now()
      )
      .run();

    // Cria a primeira versão.
    await env.DB.prepare(`
      INSERT INTO project_versions (
        id,
        project_id,
        version_number,
        description,
        snapshot,
        created_by,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id("version"),
        project.id,
        1,
        "Versão inicial criada pelo BLUEPRINT",
        JSON.stringify(project),
        userId,
        now()
      )
      .run();
  }

  return json({
    ok: true,
    project,
    message: "Projeto criado com sucesso."
  }, 201);
}

// ============================================================
// LIST PROJECTS
// ============================================================

async function listProjects(request, env) {
  const url = new URL(request.url);

  const userId =
    url.searchParams.get("user_id") || "demo_user";

  if (!env?.DB) {
    return json({
      ok: true,
      projects: [],
      database: false
    });
  }

  const result = await env.DB.prepare(`
    SELECT
      id,
      user_id,
      name,
      original_idea,
      description,
      status,
      project_type,
      current_version,
      created_at,
      updated_at
    FROM projects
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `)
    .bind(userId)
    .all();

  return json({
    ok: true,
    projects: result.results || [],
    database: true
  });
}

// ============================================================
// GET PROJECT
// ============================================================

async function getProject(projectId, env) {
  if (!env?.DB) {
    return json({
      ok: false,
      error: "Banco de dados não conectado."
    }, 503);
  }

  const projectResult = await env.DB.prepare(`
    SELECT *
    FROM projects
    WHERE id = ?
  `)
    .bind(projectId)
    .first();

  if (!projectResult) {
    return json({
      ok: false,
      error: "Projeto não encontrado."
    }, 404);
  }

  const files = await env.DB.prepare(`
    SELECT *
    FROM project_files
    WHERE project_id = ?
    ORDER BY path
  `)
    .bind(projectId)
    .all();

  const requirements = await env.DB.prepare(`
    SELECT *
    FROM project_requirements
    WHERE project_id = ?
    ORDER BY created_at
  `)
    .bind(projectId)
    .all();

  const decisions = await env.DB.prepare(`
    SELECT *
    FROM project_decisions
    WHERE project_id = ?
    ORDER BY created_at
  `)
    .bind(projectId)
    .all();

  const issues = await env.DB.prepare(`
    SELECT *
    FROM project_issues
    WHERE project_id = ?
    ORDER BY created_at DESC
  `)
    .bind(projectId)
    .all();

  const tests = await env.DB.prepare(`
    SELECT *
    FROM project_tests
    WHERE project_id = ?
    ORDER BY created_at DESC
  `)
    .bind(projectId)
    .all();

  const versions = await env.DB.prepare(`
    SELECT
      id,
      project_id,
      version_number,
      description,
      created_by,
      created_at
    FROM project_versions
    WHERE project_id = ?
    ORDER BY version_number DESC
  `)
    .bind(projectId)
    .all();

  return json({
    ok: true,
    project: projectResult,
    files: files.results || [],
    requirements: requirements.results || [],
    decisions: decisions.results || [],
    issues: issues.results || [],
    tests: tests.results || [],
    versions: versions.results || []
  });
}

// ============================================================
// UPDATE PROJECT
// ============================================================

async function updateProject(projectId, request, env) {
  const body = await readBody(request);

  if (!env?.DB) {
    return json({
      ok: false,
      error: "Banco de dados não conectado."
    }, 503);
  }

  const existing = await env.DB.prepare(`
    SELECT *
    FROM projects
    WHERE id = ?
  `)
    .bind(projectId)
    .first();

  if (!existing) {
    return json({
      ok: false,
      error: "Projeto não encontrado."
    }, 404);
  }

  const name =
    body.name !== undefined
      ? String(body.name)
      : existing.name;

  const description =
    body.description !== undefined
      ? String(body.description)
      : existing.description;

  const status =
    body.status !== undefined
      ? String(body.status)
      : existing.status;

  const updatedAt = now();

  await env.DB.prepare(`
    UPDATE projects
    SET
      name = ?,
      description = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
  `)
    .bind(
      name,
      description,
      status,
      updatedAt,
      projectId
    )
    .run();

  const updated = await env.DB.prepare(`
    SELECT *
    FROM projects
    WHERE id = ?
  `)
    .bind(projectId)
    .first();

  return json({
    ok: true,
    project: updated
  });
}

// ============================================================
// DELETE PROJECT
// ============================================================

async function deleteProject(projectId, env) {
  if (!env?.DB) {
    return json({
      ok: false,
      error: "Banco de dados não conectado."
    }, 503);
  }

  const existing = await env.DB.prepare(`
    SELECT id
    FROM projects
    WHERE id = ?
  `)
    .bind(projectId)
    .first();

  if (!existing) {
    return json({
      ok: false,
      error: "Projeto não encontrado."
    }, 404);
  }

  await env.DB.prepare(`
    DELETE FROM projects
    WHERE id = ?
  `)
    .bind(projectId)
    .run();

  return json({
    ok: true,
    deleted: projectId
  });
}

// ============================================================
// PROJECT FILE
// ============================================================

async function saveProjectFile(projectId, request, env) {
  const body = await readBody(request);

  if (!env?.DB) {
    return json({
      ok: false,
      error: "Banco de dados não conectado."
    }, 503);
  }

  const path = String(body.path || "").trim();

  if (!path) {
    return json({
      ok: false,
      error: "O caminho do arquivo é obrigatório."
    }, 400);
  }

  const fileId = id("file");

  await env.DB.prepare(`
    INSERT INTO project_files (
      id,
      project_id,
      path,
      content,
      language,
      file_type,
      is_entrypoint,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, path)
    DO UPDATE SET
      content = excluded.content,
      language = excluded.language,
      file_type = excluded.file_type,
      is_entrypoint = excluded.is_entrypoint,
      updated_at = excluded.updated_at
  `)
    .bind(
      fileId,
      projectId,
      path,
      String(body.content || ""),
      body.language || detectLanguage(path),
      body.file_type || "source",
      body.is_entrypoint ? 1 : 0,
      now(),
      now()
    )
    .run();

  return json({
    ok: true,
    message: "Arquivo salvo.",
    project_id: projectId,
    path
  });
}

// ============================================================
// ADD REQUIREMENT
// ============================================================

async function addRequirement(projectId, request, env) {
  const body = await readBody(request);

  if (!env?.DB) {
    return json({
      ok: false,
      error: "Banco de dados não conectado."
    }, 503);
  }

  const requirement =
    String(body.requirement || "").trim();

  if (!requirement) {
    return json({
      ok: false,
      error: "O requisito é obrigatório."
    }, 400);
  }

  const requirementId = id("req");

  await env.DB.prepare(`
    INSERT INTO project_requirements (
      id,
      project_id,
      requirement,
      category,
      priority,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      requirementId,
      projectId,
      requirement,
      body.category || "feature",
      body.priority || "medium",
      "pending",
      now()
    )
    .run();

  return json({
    ok: true,
    requirement: {
      id: requirementId,
      project_id: projectId,
      requirement
    }
  }, 201);
}

// ============================================================
// ROUTER
// ============================================================

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: jsonHeaders
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // --------------------------------------------------------
      // HEALTH
      // --------------------------------------------------------

      if (
        request.method === "GET" &&
        path === "/api/health"
      ) {
        return health(env);
      }

      // --------------------------------------------------------
      // PROJECTS
      // --------------------------------------------------------

      if (
        request.method === "POST" &&
        path === "/api/projects"
      ) {
        return createProject(request, env);
      }

      if (
        request.method === "GET" &&
        path === "/api/projects"
      ) {
        return listProjects(request, env);
      }

      const projectMatch =
        path.match(/^\/api\/projects\/([^/]+)$/);

      if (projectMatch) {
        const projectId = projectMatch[1];

        if (request.method === "GET") {
          return getProject(projectId, env);
        }

        if (request.method === "PUT") {
          return updateProject(
            projectId,
            request,
            env
          );
        }

        if (request.method === "DELETE") {
          return deleteProject(
            projectId,
            env
          );
        }
      }

      // --------------------------------------------------------
      // PROJECT FILES
      // --------------------------------------------------------

      const fileMatch =
        path.match(/^\/api\/projects\/([^/]+)\/files$/);

      if (
        fileMatch &&
        request.method === "POST"
      ) {
        return saveProjectFile(
          fileMatch[1],
          request,
          env
        );
      }

      // --------------------------------------------------------
      // REQUIREMENTS
      // --------------------------------------------------------

      const requirementMatch =
        path.match(/^\/api\/projects\/([^/]+)\/requirements$/);

      if (
        requirementMatch &&
        request.method === "POST"
      ) {
        return addRequirement(
          requirementMatch[1],
          request,
          env
        );
      }

      return json({
        ok: false,
        error: "Endpoint não encontrado.",
        path
      }, 404);

    } catch (error) {
      console.error(error);

      return json({
        ok: false,
        error: "Erro interno do BLUEPRINT.",
        message: error?.message || String(error)
      }, 500);
    }
  }
};

// ============================================================
// HELPERS
// ============================================================

function generateProjectName(idea) {
  const cleaned = idea
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Novo Projeto";
  }

  const words = cleaned
    .split(" ")
    .slice(0, 6);

  const name = words.join(" ");

  return name.length > 60
    ? `${name.slice(0, 57)}...`
    : name;
}

function detectLanguage(path) {
  const extension =
    path.split(".").pop()?.toLowerCase();

  const languages = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    json: "json",
    sql: "sql",
    md: "markdown",
    py: "python"
  };

  return languages[extension] || "text";
}
