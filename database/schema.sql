-- =========================================================
-- BLUEPRINT — DATABASE SCHEMA
-- "Encontre. Crie. Venda."
-- =========================================================

PRAGMA foreign_keys = ON;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    plan_id TEXT DEFAULT 'free',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- PLANS
-- =========================================================

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    monthly_price_cents INTEGER NOT NULL DEFAULT 0,
    ia_credits INTEGER NOT NULL DEFAULT 0,
    action_credits INTEGER NOT NULL DEFAULT 0,
    max_projects INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    provider TEXT,
    provider_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- =========================================================
-- CREDITS
-- =========================================================

CREATE TABLE IF NOT EXISTS credits (
    user_id TEXT PRIMARY KEY,
    ia_credits INTEGER NOT NULL DEFAULT 25,
    action_credits INTEGER NOT NULL DEFAULT 100,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- CREDIT TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    credit_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER,
    description TEXT,
    reference_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- PROJECTS
-- =========================================================

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    original_idea TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    project_type TEXT DEFAULT 'saas',
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- PROJECT FILES
-- =========================================================

CREATE TABLE IF NOT EXISTS project_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    path TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    language TEXT,
    file_type TEXT,
    is_entrypoint INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

    UNIQUE(project_id, path)
);

-- =========================================================
-- PROJECT VERSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS project_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    description TEXT,
    snapshot TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

    UNIQUE(project_id, version_number)
);

-- =========================================================
-- PROJECT REQUIREMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS project_requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    requirement TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- PROJECT DECISIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS project_decisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- PROJECT ISSUES
-- =========================================================

CREATE TABLE IF NOT EXISTS project_issues (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- PROJECT TESTS
-- =========================================================

CREATE TABLE IF NOT EXISTS project_tests (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    result TEXT,
    executed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- GENERATED DATABASES
-- =========================================================

CREATE TABLE IF NOT EXISTS databases (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'd1',
    database_identifier TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- DATABASE TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS database_tables (
    id TEXT PRIMARY KEY,
    database_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE,

    UNIQUE(database_id, name)
);

-- =========================================================
-- DATABASE FIELDS
-- =========================================================

CREATE TABLE IF NOT EXISTS database_fields (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    nullable INTEGER NOT NULL DEFAULT 1,
    primary_key INTEGER NOT NULL DEFAULT 0,
    unique_field INTEGER NOT NULL DEFAULT 0,
    default_value TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (table_id) REFERENCES database_tables(id) ON DELETE CASCADE
);

-- =========================================================
-- AI REQUESTS
-- =========================================================

CREATE TABLE IF NOT EXISTS ai_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    provider TEXT,
    model TEXT,
    agent TEXT,
    operation TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- =========================================================
-- USAGE
-- =========================================================

CREATE TABLE IF NOT EXISTS usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    action TEXT NOT NULL,
    provider TEXT,
    units INTEGER DEFAULT 1,
    credits_used INTEGER DEFAULT 0,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- =========================================================
-- API PROVIDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS api_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    service_type TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 100,
    configuration TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- API USAGE
-- =========================================================

CREATE TABLE IF NOT EXISTS api_usage (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    user_id TEXT,
    project_id TEXT,
    operation TEXT,
    units INTEGER DEFAULT 1,
    estimated_cost_cents INTEGER DEFAULT 0,
    actual_cost_cents INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id) REFERENCES api_providers(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- =========================================================
-- PAYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_id TEXT,
    provider TEXT,
    provider_payment_id TEXT,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    status TEXT DEFAULT 'pending',
    payment_type TEXT DEFAULT 'subscription',
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- =========================================================
-- WEBHOOKS
-- =========================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_id TEXT,
    payload TEXT,
    status TEXT DEFAULT 'received',
    processed_at TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider, event_id)
);

-- =========================================================
-- TEMPLATES
-- =========================================================

CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    template_data TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- DEPLOYMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    provider TEXT,
    deployment_id TEXT,
    url TEXT,
    environment TEXT DEFAULT 'production',
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    deployed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- AGENT EXECUTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS agent_executions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    operation TEXT,
    status TEXT DEFAULT 'pending',
    input_data TEXT,
    output_data TEXT,
    error_message TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =========================================================
-- INDEXES
-- =========================================================

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

CREATE INDEX IF NOT EXISTS idx_usage_project
ON usage(project_id);

CREATE INDEX IF NOT EXISTS idx_payments_user
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_deployments_project
ON deployments(project_id);

CREATE INDEX IF NOT EXISTS idx_agent_executions_project
ON agent_executions(project_id);

-- =========================================================
-- DEFAULT PLANS
-- =========================================================

INSERT OR IGNORE INTO plans (
    id,
    name,
    description,
    monthly_price_cents,
    ia_credits,
    action_credits,
    max_projects
)
VALUES
(
    'free',
    'FREE',
    'Plano gratuito para testar o BLUEPRINT',
    0,
    25,
    100,
    1
),
(
    'start',
    'START',
    'Plano para começar a criar produtos',
    2990,
    100,
    1000,
    5
),
(
    'pro',
    'PRO',
    'Plano completo para criadores',
    5990,
    300,
    5000,
    20
),
(
    'agency',
    'AGENCY',
    'Plano para operação em escala',
    14990,
    1000,
    20000,
    100
);

-- =========================================================
-- DEFAULT PROVIDERS
-- =========================================================

INSERT OR IGNORE INTO api_providers (
    id,
    name,
    service_type,
    enabled,
    priority
)
VALUES
(
    'gemini',
    'Gemini',
    'ai',
    1,
    10
),
(
    'cloudflare',
    'Cloudflare',
    'infrastructure',
    1,
    10
),
(
    'netlify',
    'Netlify',
    'deployment',
    1,
    20
);

-- =========================================================
-- BLUEPRINT SCHEMA COMPLETE
-- =========================================================
