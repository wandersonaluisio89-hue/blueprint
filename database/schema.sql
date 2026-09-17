PRAGMA foreign_keys = ON;

-- ==========================================
-- BLUEPRINT DATABASE
-- Cloudflare D1 / SQLite
-- ==========================================

-- PLANOS
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    ia_credits INTEGER NOT NULL DEFAULT 0,
    action_credits INTEGER NOT NULL DEFAULT 0,
    max_projects INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ASSINATURAS
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    provider TEXT,
    provider_subscription_id TEXT,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- CRÉDITOS
CREATE TABLE IF NOT EXISTS credits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    ia_credits INTEGER NOT NULL DEFAULT 25,
    action_credits INTEGER NOT NULL DEFAULT 100,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MOVIMENTAÇÃO DE CRÉDITOS
CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- PROJETOS
-- ==========================================

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    original_idea TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ARQUIVOS DOS PROJETOS
CREATE TABLE IF NOT EXISTS project_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    path TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    language TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_id, path),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- VERSÕES
CREATE TABLE IF NOT EXISTS project_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    description TEXT,
    snapshot TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_id, version),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- REQUISITOS
CREATE TABLE IF NOT EXISTS project_requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    requirement TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- DECISÕES DO PROJECT BRAIN
CREATE TABLE IF NOT EXISTS project_decisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category TEXT,
    decision TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- PROBLEMAS / BUGS
CREATE TABLE IF NOT EXISTS project_issues (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- TESTES
CREATE TABLE IF NOT EXISTS project_tests (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    result TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ==========================================
-- ESTRUTURA DE BANCO GERADA PELO BLUEPRINT
-- ==========================================

CREATE TABLE IF NOT EXISTS databases (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    engine TEXT NOT NULL DEFAULT 'sqlite',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS database_tables (
    id TEXT PRIMARY KEY,
    database_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS database_fields (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    nullable INTEGER NOT NULL DEFAULT 1,
    default_value TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (table_id) REFERENCES database_tables(id) ON DELETE CASCADE
);

-- ==========================================
-- IA
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    project_id TEXT,
    provider TEXT NOT NULL,
    model TEXT,
    action TEXT NOT NULL,
    prompt TEXT,
    response TEXT,
    ia_credits_used INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- ==========================================
-- USO / LIMITES
-- ==========================================

CREATE TABLE IF NOT EXISTS usage (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    project_id TEXT,
    resource TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ==========================================
-- PROVEDORES
-- ==========================================

CREATE TABLE IF NOT EXISTS api_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_usage (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    user_id TEXT,
    project_id TEXT,
    endpoint TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES api_providers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- ==========================================
-- PAGAMENTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_id TEXT,
    provider TEXT,
    provider_payment_id TEXT,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- WEBHOOKS
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_id TEXT,
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    processed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TEMPLATES
-- ==========================================

CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    content TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DEPLOYMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    deployment_id TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deployed_at TEXT,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ==========================================
-- EXECUÇÃO DOS AGENTES
-- ==========================================

CREATE TABLE IF NOT EXISTS agent_executions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    task TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    input TEXT,
    output TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_projects_user
ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_project_files_project
ON project_files(project_id);

CREATE INDEX IF NOT EXISTS idx_project_versions_project
ON project_versions(project_id);

CREATE INDEX IF NOT EXISTS idx_requirements_project
ON project_requirements(project_id);

CREATE INDEX IF NOT EXISTS idx_decisions_project
ON project_decisions(project_id);

CREATE INDEX IF NOT EXISTS idx_issues_project
ON project_issues(project_id);

CREATE INDEX IF NOT EXISTS idx_tests_project
ON project_tests(project_id);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user
ON ai_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_requests_project
ON ai_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_usage_user
ON usage(user_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_provider
ON api_usage(provider_id);

CREATE INDEX IF NOT EXISTS idx_payments_user
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_deployments_project
ON deployments(project_id);

CREATE INDEX IF NOT EXISTS idx_agent_executions_project
ON agent_executions(project_id);

-- ==========================================
-- DADOS INICIAIS
-- ==========================================

INSERT OR IGNORE INTO plans
(id, name, price_cents, ia_credits, action_credits, max_projects)
VALUES
('free', 'FREE', 0, 25, 100, 1),
('start', 'START', 2990, 100, 1000, 3),
('pro', 'PRO', 5990, 300, 5000, 10),
('agency', 'AGENCY', 14990, 1000, 20000, 50);

INSERT OR IGNORE INTO api_providers
(id, name, type, active)
VALUES
('gemini', 'Gemini', 'ai', 1),
('cloudflare', 'Cloudflare', 'infrastructure', 1),
('netlify', 'Netlify', 'deployment', 1);

-- ==========================================
-- FIM DO BLUEPRINT DATABASE
-- ==========================================
