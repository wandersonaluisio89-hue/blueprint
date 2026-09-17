// BLUEPRINT — Orchestrator
// Coordena os agentes responsáveis pela construção do projeto.

const DEFAULT_AGENT_PIPELINE = [
  "strategist",
  "designer",
  "database",
  "builder",
  "security",
  "qa",
  "deploy"
];

export function createBuildPlan(projectBrain) {
  if (!projectBrain) {
    throw new Error("Project Brain não informado.");
  }

  const idea =
    projectBrain.project?.originalIdea ||
    projectBrain.originalIdea ||
    "";

  return {
    id: crypto.randomUUID(),

    projectId: projectBrain.project?.id || null,

    status: "planned",

    createdAt: new Date().toISOString(),

    input: {
      idea
    },

    agents: DEFAULT_AGENT_PIPELINE.map(
      (agent, index) => ({
        order: index + 1,
        agent,
        status: "pending"
      })
    ),

    currentAgent: null,

    completedAgents: [],

    failedAgents: [],

    results: [],

    nextAction: "strategist"
  };
}

export function getNextAgent(buildPlan) {
  if (!buildPlan) {
    throw new Error("Build Plan não informado.");
  }

  const next = buildPlan.agents.find(
    agent => agent.status === "pending"
  );

  return next ? next.agent : null;
}

export function startAgent(buildPlan, agentName) {
  const agents = buildPlan.agents.map(agent => {
    if (agent.agent === agentName) {
      return {
        ...agent,
        status: "running",
        startedAt: new Date().toISOString()
      };
    }

    return agent;
  });

  return {
    ...buildPlan,
    status: "running",
    currentAgent: agentName,
    agents
  };
}

export function completeAgent(
  buildPlan,
  agentName,
  result = {}
) {
  const agents = buildPlan.agents.map(agent => {
    if (agent.agent === agentName) {
      return {
        ...agent,
        status: "completed",
        completedAt: new Date().toISOString()
      };
    }

    return agent;
  });

  const completedAgents = [
    ...(buildPlan.completedAgents || [])
  ];

  if (!completedAgents.includes(agentName)) {
    completedAgents.push(agentName);
  }

  const results = [
    ...(buildPlan.results || []),
    {
      agent: agentName,
      result,
      createdAt: new Date().toISOString()
    }
  ];

  const nextAgent = agents.find(
    agent => agent.status === "pending"
  );

  return {
    ...buildPlan,

    agents,

    completedAgents,

    results,

    currentAgent: nextAgent
      ? nextAgent.agent
      : null,

    nextAction: nextAgent
      ? nextAgent.agent
      : "completed",

    status: nextAgent
      ? "running"
      : "completed"
  };
}

export function failAgent(
  buildPlan,
  agentName,
  error
) {
  const agents = buildPlan.agents.map(agent => {
    if (agent.agent === agentName) {
      return {
        ...agent,
        status: "failed",
        failedAt: new Date().toISOString(),
        error: String(error || "Erro desconhecido.")
      };
    }

    return agent;
  });

  return {
    ...buildPlan,

    agents,

    failedAgents: [
      ...(buildPlan.failedAgents || []),
      agentName
    ],

    currentAgent: null,

    nextAction: "repair",

    status: "failed"
  };
}

export function resetAgent(
  buildPlan,
  agentName
) {
  const agents = buildPlan.agents.map(agent => {
    if (agent.agent === agentName) {
      return {
        ...agent,
        status: "pending",
        startedAt: null,
        completedAt: null,
        failedAt: null,
        error: null
      };
    }

    return agent;
  });

  return {
    ...buildPlan,
    agents,
    status: "planned",
    currentAgent: null,
    nextAction: agentName
  };
}

export function isBuildComplete(buildPlan) {
  if (!buildPlan?.agents) {
    return false;
  }

  return buildPlan.agents.every(
    agent => agent.status === "completed"
  );
}

export function getBuildStatus(buildPlan) {
  if (!buildPlan?.agents) {
    return {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      running: 0,
      percentage: 0
    };
  }

  const total = buildPlan.agents.length;

  const completed = buildPlan.agents.filter(
    agent => agent.status === "completed"
  ).length;

  const failed = buildPlan.agents.filter(
    agent => agent.status === "failed"
  ).length;

  const pending = buildPlan.agents.filter(
    agent => agent.status === "pending"
  ).length;

  const running = buildPlan.agents.filter(
    agent => agent.status === "running"
  ).length;

  const percentage =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    failed,
    pending,
    running,
    percentage
  };
}
