const themeToggle = document.querySelector("#theme-toggle");
const tableSearch = document.querySelector("#table-search");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
}

if (tableSearch) {
  const rows = document.querySelectorAll("tbody tr");

  tableSearch.addEventListener("input", () => {
    const termo = tableSearch.value.toLowerCase().trim();

    rows.forEach((row) => {
      row.style.display = row.textContent.toLowerCase().includes(termo)
        ? ""
        : "none";
    });
  });
}
