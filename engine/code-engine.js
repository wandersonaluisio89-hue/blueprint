// BLUEPRINT — Code Engine
// Núcleo responsável por preparar a geração, alteração,
// validação e versionamento do código dos projetos.

export function createGenerationRequest({
  projectBrain,
  buildPlan,
  instruction
}) {
  if (!projectBrain) {
    throw new Error("Project Brain não informado.");
  }

  return {
    id: crypto.randomUUID(),

    type: "code_generation",

    createdAt: new Date().toISOString(),

    projectId:
      projectBrain.project?.id || null,

    originalIdea:
      projectBrain.project?.originalIdea || "",

    instruction:
      String(instruction || "").trim(),

    buildPlan: buildPlan || null,

    context: {
      architecture:
        projectBrain.architecture || {},

      requirements:
        projectBrain.requirements || {},

      files:
        projectBrain.files || [],

      databaseSchema:
        projectBrain.databaseSchema || {},

      permissions:
        projectBrain.permissions || {},

      dependencies:
        projectBrain.dependencies || {},

      issues:
        projectBrain.issues || []
    },

    status: "pending"
  };
}

export function createFileChange({
  path,
  operation = "create",
  content = "",
  reason = ""
}) {
  const validOperations = [
    "create",
    "update",
    "delete"
  ];

  if (!validOperations.includes(operation)) {
    throw new Error(
      `Operação inválida: ${operation}`
    );
  }

  return {
    id: crypto.randomUUID(),

    path,

    operation,

    content,

    reason,

    createdAt: new Date().toISOString()
  };
}

export function createCodeResult({
  requestId,
  changes = [],
  explanation = "",
  tests = []
}) {
  return {
    id: crypto.randomUUID(),

    requestId,

    status: "generated",

    changes,

    explanation,

    tests,

    createdAt: new Date().toISOString()
  };
}

export function validateFileChanges(changes = []) {
  const errors = [];

  for (const change of changes) {
    if (!change.path) {
      errors.push(
        "Uma alteração não possui caminho de arquivo."
      );
    }

    if (
      !["create", "update", "delete"].includes(
        change.operation
      )
    ) {
      errors.push(
        `Operação inválida no arquivo ${change.path || "desconhecido"}.`
      );
    }

    if (
      change.operation !== "delete" &&
      typeof change.content !== "string"
    ) {
      errors.push(
        `O conteúdo do arquivo ${change.path || "desconhecido"} precisa ser texto.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function calculateChangeImpact(
  existingFiles = [],
  changes = []
) {
  const existingPaths = new Set(
    existingFiles.map(file => file.path)
  );

  const impact = {
    create: [],
    update: [],
    delete: [],
    unchanged: []
  };

  for (const change of changes) {
    if (change.operation === "create") {
      if (existingPaths.has(change.path)) {
        impact.update.push(change.path);
      } else {
        impact.create.push(change.path);
      }
    }

    if (change.operation === "update") {
      impact.update.push(change.path);
    }

    if (change.operation === "delete") {
      impact.delete.push(change.path);
    }
  }

  return impact;
}

export function createVersionSnapshot({
  projectBrain,
  files = [],
  description = ""
}) {
  return {
    id: crypto.randomUUID(),

    description,

    createdAt: new Date().toISOString(),

    project: JSON.parse(
      JSON.stringify(projectBrain)
    ),

    files: JSON.parse(
      JSON.stringify(files)
    )
  };
}

export function prepareRepairRequest({
  projectBrain,
  failedTests = [],
  errors = []
}) {
  return {
    id: crypto.randomUUID(),

    type: "repair",

    createdAt: new Date().toISOString(),

    projectId:
      projectBrain?.project?.id || null,

    failedTests,

    errors,

    context: {
      files:
        projectBrain?.files || [],

      architecture:
        projectBrain?.architecture || {},

      databaseSchema:
        projectBrain?.databaseSchema || {},

      issues:
        projectBrain?.issues || []
    },

    status: "pending"
  };
}

export function estimateGenerationComplexity({
  changes = [],
  requirements = {}
}) {
  const fileCount = changes.length;

  const functionalRequirements =
    requirements.functional?.length || 0;

  const integrations =
    requirements.integrations?.length || 0;

  let complexity = "low";

  const score =
    fileCount +
    functionalRequirements * 2 +
    integrations * 3;

  if (score >= 15) {
    complexity = "high";
  } else if (score >= 7) {
    complexity = "medium";
  }

  return {
    score,
    complexity
  };
}
