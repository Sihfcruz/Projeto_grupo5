const themeToggle = document.querySelector("#theme-toggle");
const form = document.querySelector("#item-form");
const cancelButton = document.querySelector("#cancel-button");
const validadeToggle = document.querySelector("#validade-toggle");
const validadeData = document.querySelector("#validade-data");
const classificationOptions = document.querySelectorAll(
  ".classification-option",
);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
}

classificationOptions.forEach((option) => {
  option.addEventListener("click", () => {
    classificationOptions.forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
    option.querySelector("input").checked = true;
  });
});

if (validadeToggle && validadeData) {
  validadeToggle.addEventListener("change", () => {
    validadeData.disabled = !validadeToggle.checked;
  });
}

if (cancelButton) {
  cancelButton.addEventListener("click", () => {
    window.location.href = "inventory.html";
  });
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}
