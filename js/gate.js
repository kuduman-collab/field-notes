/* Half-Baked Thoughts — simple password gate
   Not real security (it's client-side), just a soft "not open to the
   world yet" door. The password is checked case-insensitively. */
(function(){
  var PASSWORD = "kaaya";
  var KEY = "hbt-unlocked";

  if (sessionStorage.getItem(KEY) === "yes") return;

  document.documentElement.style.visibility = "hidden";

  document.addEventListener("DOMContentLoaded", function(){
    var overlay = document.createElement("div");
    overlay.id = "gate-overlay";
    overlay.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-title">Half-Baked Thoughts</div>' +
        '<p class="gate-sub">This notebook is still being seasoned. Enter the password to peek in.</p>' +
        '<form id="gate-form" autocomplete="off">' +
          '<input type="password" id="gate-input" placeholder="Password" autofocus />' +
          '<button type="submit">Enter</button>' +
        '</form>' +
        '<div class="gate-error" id="gate-error" style="display:none;">Not quite — try again.</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.documentElement.style.visibility = "visible";

    var form = document.getElementById("gate-form");
    var input = document.getElementById("gate-input");
    var error = document.getElementById("gate-error");

    form.addEventListener("submit", function(e){
      e.preventDefault();
      if (input.value.trim().toLowerCase() === PASSWORD){
        sessionStorage.setItem(KEY, "yes");
        overlay.remove();
      } else {
        error.style.display = "block";
        input.value = "";
        input.focus();
      }
    });
  });
})();
