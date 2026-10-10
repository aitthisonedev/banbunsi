(function () {
  try {
    var k = "banbunsi-theme";
    var s = localStorage.getItem(k);
    var d = s
      ? s === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", d);
  } catch (e) {}
})();
