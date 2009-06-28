ShortenURL = mainWin.ShortenURL;
closeMenus = mainWin.closeMenus;

window.addEventListener("load", shortenInit = function() {
  E("context").addEventListener("popupshowing", sPopupInit = function() {
    var name = "(" + ShortenURL.prefService.getCharPref("name." +
               (ShortenURL.isMP3(treeView.getSelectedItem().location)
                ? ShortenURL.baseMP3Num : ShortenURL.baseNum)) + ")";
    if ((/\)(?=\)$)/).test(name)) {
      name = name.match(/\([^\s\)]+\)/).toString();
    }
    var node = E("contextShortenURL");
    var attrName = node.hasAttribute("tooltiptext") ? "tooltiptext" : "label";
    var attrValue = node.getAttribute(attrName);
    node.setAttribute(attrName, attrValue.replace(/\(.+\)$/, name));
  }, false);
  E("context").removeEventListener("popuphiding", sPopupInit, false);
}, false);

window.removeEventListener("unload", shortenInit, false);

