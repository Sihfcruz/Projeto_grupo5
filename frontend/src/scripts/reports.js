const themeToggle = document.querySelector("#theme-toggle");
const exportButton = document.querySelector("#export-button");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
}

if (exportButton) {
  exportButton.addEventListener("click", () => {
    alert("Relatório exportado.");
  });
}
