// BLUEPRINT — Provider Router
// Camada responsável por escolher e organizar os provedores externos.
// As chaves nunca devem ficar no frontend.

const DEFAULT_PROVIDER = "gemini";

const PROVIDERS = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    capabilities: [
      "planning",
      "reasoning",
      "code_generation",
      "code_review"
    ],
    enabled: true
  }
};

export function getProvider(providerId = DEFAULT_PROVIDER) {
  return PROVIDERS[providerId] || null;
}

export function listProviders() {
  return Object.values(PROVIDERS);
}

export function selectProvider(task = {}) {
  const requestedProvider = task.provider;

  if (
    requestedProvider &&
    PROVIDERS[requestedProvider]?.enabled
  ) {
    return PROVIDERS[requestedProvider];
  }

  const available = Object.values(PROVIDERS).find(
    provider => provider.enabled
  );

  if (!available) {
    throw new Error(
      "Nenhum provedor disponível para esta operação."
    );
  }

  return available;
}

export function canHandle(providerId, capability) {
  const provider = PROVIDERS[providerId];

  if (!provider || !provider.enabled) {
    return false;
  }

  return provider.capabilities.includes(capability);
}

export function registerProvider(provider) {
  if (!provider?.id) {
    throw new Error("Provider precisa de um ID.");
  }

  PROVIDERS[provider.id] = {
    ...provider,
    enabled: provider.enabled !== false
  };

  return PROVIDERS[provider.id];
}
