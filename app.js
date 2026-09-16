let projects = [];
let isCreating = false;

function show(screen) {
  document.querySelectorAll(".screen").forEach((item) => {
    item.classList.remove("active");
  });

  const target = document.getElementById(screen);

  if (target) {
    target.classList.add("active");
  }
}

function openBuilder() {
  show("builder");

  setTimeout(() => {
    const idea = document.getElementById("idea");

    if (idea) {
      idea.focus();
    }
  }, 100);
}

function preset(text) {
  const idea = document.getElementById("idea");

  if (idea) {
    idea.value = text;
    idea.focus();
  }
}

function createBlueprint() {
  const idea = document.getElementById("idea");
  const log = document.getElementById("log");

  if (!idea || !log) {
    console.error("Elementos #idea ou #log não encontrados.");
    return;
  }

  const text = idea.value.trim();

  if (!text) {
    log.textContent = "Digite uma ideia para começar.";
    return;
  }

  if (isCreating) {
    return;
  }

  isCreating = true;

  const button = document.querySelector(
    'button[onclick="createBlueprint()"]'
  );

  if (button) {
    button.disabled = true;
    button.textContent = "Criando...";
  }

  log.textContent = "Analisando sua ideia...";

  setTimeout(() => {
    log.textContent +=
      "\nIdentificando produto, público e funcionalidades...";
  }, 600);

  setTimeout(() => {
    log.textContent +=
      "\nEstruturando o projeto com o Blueprint Brain...";
  }, 1200);

  setTimeout(() => {
    const project = {
      id: Date.now(),
      name: text.substring(0, 40),
      idea: text,
      date: new Date().toLocaleDateString("pt-BR")
    };

    projects.push(project);

    saveProjects();
    renderProjects();

    log.textContent +=
      "\n\n✓ Projeto criado com sucesso.\n\n" +
      "Próximas etapas identificadas:\n" +
      "• Definir público\n" +
      "• Estruturar funcionalidades\n" +
      "• Criar MVP\n" +
      "• Preparar lançamento";

    isCreating = false;

    if (button) {
      button.disabled = false;
      button.textContent = "Criar com o Blueprint Brain";
    }

    /*
     * Depois de criar o projeto, abre a tela de projetos.
     * O seu index.html precisa ter um elemento com id="projects".
     */
    setTimeout(() => {
      const projectsScreen = document.getElementById("projects");

      if (projectsScreen) {
        show("projects");
      }
    }, 1500);
  }, 2000);
}

function saveProjects() {
  try {
    localStorage.setItem(
      "blueprint_projects",
      JSON.stringify(projects)
    );
  } catch (error) {
    console.error("Não foi possível salvar o projeto:", error);
  }
}

function loadProjects() {
  try {
    const saved = localStorage.getItem("blueprint_projects");

    if (saved) {
      const parsedProjects = JSON.parse(saved);

      if (Array.isArray(parsedProjects)) {
        projects = parsedProjects;
      }
    }
  } catch (error) {
    console.error("Não foi possível carregar os projetos:", error);
    projects = [];
  }

  renderProjects();
}

function renderProjects() {
  const container = document.getElementById("projectList");

  if (!container) {
    return;
  }

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="project">
        <h3>Nenhum projeto ainda</h3>
        <p>
          Crie seu primeiro projeto usando o Blueprint Brain.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = projects
    .map(
      (project) => `
        <div class="project">
          <h3>${escapeHTML(project.name)}</h3>

          <p>
            ${escapeHTML(project.idea)}
          </p>

          <small>
            Criado em ${escapeHTML(project.date)}
          </small>
        </div>
      `
    )
    .join("");
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text || "");
  return div.innerHTML;
}

function clearProjects() {
  projects = [];

  try {
    localStorage.removeItem("blueprint_projects");
  } catch (error) {
    console.error("Não foi possível apagar os projetos:", error);
  }

  renderProjects();
}

document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  show("home");
});
