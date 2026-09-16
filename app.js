let projects = [];

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

  if (!idea || !log) return;

  const text = idea.value.trim();

  if (!text) {
    log.textContent = "Digite uma ideia para começar.";
    return;
  }

  log.textContent = "Analisando sua ideia...\n";

  setTimeout(() => {
    log.textContent +=
      "Identificando produto, público e funcionalidades...\n";
  }, 600);

  setTimeout(() => {
    log.textContent +=
      "Estruturando o projeto com o Blueprint Brain...\n";
  }, 1200);

  setTimeout(() => {
    const project = {
      id: Date.now(),
      name: "Novo projeto",
      idea: text,
      date: new Date().toLocaleDateString("pt-BR")
    };

    projects.push(project);

    saveProjects();
    renderProjects();

    log.textContent +=
      "\n✓ Projeto criado com sucesso.\n\n" +
      "Próximas etapas identificadas:\n" +
      "• Definir público\n" +
      "• Estruturar funcionalidades\n" +
      "• Criar MVP\n" +
      "• Preparar lançamento";

  }, 2000);
}

function saveProjects() {
  localStorage.setItem(
    "blueprint_projects",
    JSON.stringify(projects)
  );
}

function loadProjects() {
  const saved = localStorage.getItem("blueprint_projects");

  if (saved) {
    try {
      projects = JSON.parse(saved);
    } catch (error) {
      projects = [];
    }
  }

  renderProjects();
}

function renderProjects() {
  const container = document.getElementById("projectList");

  if (!container) return;

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

          <br>

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

  div.textContent = text;

  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  show("home");
});
