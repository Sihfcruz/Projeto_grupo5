const userSearch = document.querySelector("#user-search");
const userRows = document.querySelectorAll("#users-table tbody tr");
const filterButton = document.querySelector("#filter-button");
const newUserButton = document.querySelector(".new-user-button");
const inviteButton = document.querySelector(".invite-button");
const themeToggle = document.querySelector("#theme-toggle");

if (userSearch) {
  userSearch.addEventListener("input", () => {
    const search = userSearch.value.toLowerCase().trim();

    userRows.forEach((row) => {
      row.hidden = !row.textContent.toLowerCase().includes(search);
    });
  });
}

if (filterButton) {
  filterButton.addEventListener("click", () => {
    userRows.forEach((row) => {
      row.hidden = false;
    });

    if (userSearch) {
      userSearch.value = "";
    }
  });
}

if (newUserButton) {
  newUserButton.addEventListener("click", () => {
    alert("Cadastro de novo usuário");
  });
}

if (inviteButton) {
  inviteButton.addEventListener("click", () => {
    alert("Convite de usuário");
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
}
