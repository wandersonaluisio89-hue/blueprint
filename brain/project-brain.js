// BLUEPRINT — Project Brain
// Memória estrutural dos projetos criados pelo usuário.

export function createProjectBrain(input = {}) {
  const idea = String(input.idea || "").trim();

  return {
    version: "1.0.0",

    project: {
      id: input.projectId || null,
      name: input.name || "Novo projeto",
      originalIdea: idea,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },

    requirements: {
      functional: [],
      nonFunctional: [],
      userFlows: [],
      integrations: []
    },

    decisions: [],

    architecture: {
      frontend: null,
      backend: null,
      database: null,
      authentication: null,
      deployment: null
    },

    files: [],

    databaseSchema: {
      tables: [],
      relations: [],
      indexes: []
    },

    permissions: {
      roles: [],
      rules: []
    },

    dependencies: [],

    issues: [],

    tests: [],

    versions: [],

    lastAction: null,

    status: "planning"
  };
}

export function updateProjectBrain(brain, changes = {}) {
  const updated = {
    ...brain,
    ...changes,

    project: {
      ...(brain.project || {}),
      ...(changes.project || {}),
      updatedAt: new Date().toISOString()
    }
  };

  return updated;
}

export function addDecision(brain, decision) {
  return {
    ...brain,

    decisions: [
      ...(brain.decisions || []),
      {
        id: crypto.randomUUID(),
        description: decision,
        createdAt: new Date().toISOString()
      }
    ],

    project: {
      ...(brain.project || {}),
      updatedAt: new Date().toISOString()
    }
  };
}

export function addFile(brain, file) {
  return {
    ...brain,

    files: [
      ...(brain.files || []),
      {
        id: crypto.randomUUID(),
        path: file.path,
        type: file.type || "source",
        status: file.status || "created",
        updatedAt: new Date().toISOString()
      }
    ],

    project: {
      ...(brain.project || {}),
      updatedAt: new Date().toISOString()
    }
  };
}

export function addIssue(brain, issue) {
  return {
    ...brain,

    issues: [
      ...(brain.issues || []),
      {
        id: crypto.randomUUID(),
        description: issue,
        status: "open",
        createdAt: new Date().toISOString()
      }
    ]
  };
}

export function addTest(brain, test) {
  return {
    ...brain,

    tests: [
      ...(brain.tests || []),
      {
        id: crypto.randomUUID(),
        name: test.name || "Teste",
        status: test.status || "pending",
        details: test.details || "",
        createdAt: new Date().toISOString()
      }
    ]
  };
}

export function createVersion(brain, description = "") {
  const version = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    description,
    snapshot: JSON.parse(JSON.stringify(brain))
  };

  return {
    ...brain,

    versions: [
      ...(brain.versions || []),
      version
    ]
  };
}

export function restoreVersion(brain, versionId) {
  const version = (brain.versions || []).find(
    item => item.id === versionId
  );

  if (!version) {
    throw new Error("Versão não encontrada.");
  }

  return {
    ...version.snapshot,

    versions: brain.versions,

    project: {
      ...(version.snapshot.project || {}),
      updatedAt: new Date().toISOString()
    },

    lastAction: {
      type: "restore_version",
      versionId,
      createdAt: new Date().toISOString()
    }
  };
}

export function setLastAction(brain, action) {
  return {
    ...brain,

    lastAction: {
      ...action,
      createdAt: new Date().toISOString()
    },

    project: {
      ...(brain.project || {}),
      updatedAt: new Date().toISOString()
    }
  };
}
