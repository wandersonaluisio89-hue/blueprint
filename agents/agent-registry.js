// BLUEPRINT — Agent Registry
// Registro central dos agentes especializados.

export const AGENTS = {
  strategist: {
    id: "strategist",
    name: "Strategist",
    role: "Analisa a ideia e transforma em requisitos.",
    responsibilities: [
      "Interpretar a ideia do usuário",
      "Definir requisitos funcionais",
      "Definir fluxos principais",
      "Identificar integrações necessárias",
      "Preparar o plano do produto"
    ]
  },

  designer: {
    id: "designer",
    name: "Designer",
    role: "Define a experiência visual e UX.",
    responsibilities: [
      "Criar estrutura de telas",
      "Definir componentes",
      "Criar experiência responsiva",
      "Definir hierarquia visual",
      "Garantir consistência da interface"
    ]
  },

  database: {
    id: "database",
    name: "Database Agent",
    role: "Planeja e estrutura o banco de dados.",
    responsibilities: [
      "Criar tabelas",
      "Definir relacionamentos",
      "Definir índices",
      "Planejar migrations",
      "Definir regras de acesso"
    ]
  },

  builder: {
    id: "builder",
    name: "Builder",
    role: "Constrói e modifica o código do projeto.",
    responsibilities: [
      "Criar arquivos",
      "Escrever código",
      "Modificar código existente",
      "Integrar componentes",
      "Implementar funcionalidades"
    ]
  },

  security: {
    id: "security",
    name: "Security Agent",
    role: "Analisa segurança e permissões.",
    responsibilities: [
      "Validar autenticação",
      "Validar autorização",
      "Proteger dados",
      "Verificar exposição de secrets",
      "Analisar riscos básicos"
    ]
  },

  qa: {
    id: "qa",
    name: "QA Agent",
    role: "Testa o projeto e identifica problemas.",
    responsibilities: [
      "Executar testes",
      "Detectar erros",
      "Validar fluxos",
      "Verificar responsividade",
      "Solicitar correções quando necessário"
    ]
  },

  deploy: {
    id: "deploy",
    name: "Deploy Agent",
    role: "Prepara e publica o projeto.",
    responsibilities: [
      "Preparar build",
      "Validar configuração",
      "Publicar projeto",
      "Verificar deployment",
      "Registrar versão publicada"
    ]
  },

  growth: {
    id: "growth",
    name: "Growth Agent",
    role: "Analisa conversão e experiência do usuário.",
    responsibilities: [
      "Analisar onboarding",
      "Sugerir melhorias de conversão",
      "Analisar CTAs",
      "Melhorar experiência",
      "Sugerir próximos passos"
    ]
  }
};

export function getAgent(agentId) {
  return AGENTS[agentId] || null;
}

export function listAgents() {
  return Object.values(AGENTS);
}

export function hasAgent(agentId) {
  return Boolean(AGENTS[agentId]);
}
