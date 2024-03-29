/*
  Version: MPL 1.1/GPL 2.0/LGPL 2.1

  The contents of this file are subject to the Mozilla Public License Version
  1.1 (the "License"); you may not use this file except in compliance with
  the License. You may obtain a copy of the License at
  http://www.mozilla.org/MPL/

  Software distributed under the License is distributed on an "AS IS" basis,
  WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
  for the specific language governing rights and limitations under the
  License.

  The Original Code is Shorten URL extension

  The Initial Developer of the Original Code is LouCypher.
  Portions created by the Initial Developer are Copyright (C) 2008
  the Initial Developer. All Rights Reserved.

  Contributor(s):
  - LouCypher <loucypher@mozillaca.com>

  Alternatively, the contents of this file may be used under the terms of
  either the GNU General Public License Version 2 or later (the "GPL"), or
  the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
  in which case the provisions of the GPL or the LGPL are applicable instead
  of those above. If you wish to allow use of your version of this file only
  under the terms of either the GPL or the LGPL, and not to allow others to
  use your version of this file under the terms of the MPL, indicate your
  decision by deleting the provisions above and replace them with the notice
  and other provisions required by the GPL or the LGPL. If you do not delete
  the provisions above, a recipient may use your version of this file under
  the terms of any one of the MPL, the GPL or the LGPL.
*/

var ShortenURL = {

  _DEFAULT: 86, // default shortener, depends on who wants to collaborate :)

  _TEXT: "",

  getText: function shortenURL_getText(aString) {
    this._TEXT = aString;
  },

  get prefService() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefBranch)
                     .getBranch("extensions.shortenURL.");
  },

  setVersion: function shortenURL_setVersion(aString) {
    if (this.prefService.getCharPref("version") != aString) {
      this.prefService.setCharPref("version", aString);
    }
  },

  logMessage: function shortenURL_logMessage(aString) {
    Components.classes["@mozilla.org/consoleservice;1"]
              .getService(Components.interfaces.nsIConsoleService)
              .logStringMessage("Shorten URL:\n" + aString);
  },

  checkVersion: function shortenURL_checkVersion() {
    if (typeof Components.interfaces.nsIExtensionManager == "object") {
      var version = Components.classes['@mozilla.org/extensions/manager;1']
                              .getService(Components.interfaces
                                                    .nsIExtensionManager)
                              .getItemForID("ShortenURL@loucypher")
                              .version;
      this.setVersion(version);
    } else {
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID("ShortenURL@loucypher", function (aAddon) {
        ShortenURL.setVersion(aAddon.version);
      });
    }
  },

  // set default shortener
  setDefault: function shortenURL_getDefault() {
    try {
      if (this.prefService.getIntPref("default") != this._DEFAULT) {
        this.prefService.setIntPref("default", this._DEFAULT);
        if (this.prefService.prefHasUserValue("baseURL")) {
          this.prefService.clearUserPref("baseURL");
        }
      }
    } catch(ex) {
      this.prefService.setIntPref("default", this._DEFAULT);
      if (this.prefService.prefHasUserValue("baseURL")) {
        this.prefService.clearUserPref("baseURL");
      }
    }
  },

  get strings() {
    return document.getElementById("shorten-url-strings");
  },

  get baseNum() {
    return this.prefService.getIntPref("baseURL");
  },

  get baseMP3Num() {
    return this.prefService.getIntPref("mp3.baseURL");
  },

  populatePopup: function shortenURL_populatePopup(aNode) {
    if (!aNode || (aNode.lastChild.localName != "menuseparator")) {
      return;
    }

    var rv = [];
    var prefArray = this.prefService.getChildList("name", rv);
    var n = prefArray.length;
    if (n <= 0) return;

    var shorteners = [];
    for (var i = 0; i < n; i++) {
      shorteners[i] = {
        index: i,
        name: this.prefService.getCharPref("name." + i)
      }
    }

    shorteners.sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })

    var mi = null;
    for (var i = 0; i < shorteners.length; i++) {
      mi = document.createElement("menuitem");
      mi.setAttribute("value", shorteners[i].index);
      mi.setAttribute("label", shorteners[i].name);
      mi.setAttribute("type", "radio");
      if (shorteners[i].index == this._DEFAULT) {
        aNode.insertBefore(mi, aNode.firstChild.nextSibling.nextSibling);
      } else {
        aNode.appendChild(mi);
      }
      if (shorteners[i].index == this.baseNum) {
        var selectedIndex = i;
      }
    }
    aNode.childNodes[selectedIndex].setAttribute("checked", "true");
  },

  selectShortener: function shortenURL_selectShortener(aNum) {
    this.prefService.setIntPref("baseURL", parseInt(aNum));
  },

  selectMenuitem: function shortenURL_selectItem(aNode) {
    var num = this.prefService.getIntPref("baseURL").toString();
    var ms = aNode.childNodes;
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].hasAttribute("value") && ms[i].value == num) {
        ms[i].setAttribute("checked", "true");
      } else {
        ms[i].removeAttribute("checked");
      }
    }
  },

  setStatus: function shortenURL_setStatus(aString) {
    document.getElementById("statusbar-display").label = aString;
  },

  alert: function shortenURL_alert(aString) {
    Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
              .getService(Components.interfaces.nsIPromptService)
              .alert(null, "Shorten URL", aString);
  },

  // supported schemes, http and https only
  isValidScheme: function shortenURL_isValidScheme(aURL) {
    var reg = new RegExp("^https?", "i");
    return reg.test(aURL);
  },

  isMP3: function shortenURL_isMP3(aURL) {
    var reg = new RegExp("^https?\\:\\/\\/cdn.*\\.projectplaylist\\.com.*" +
                         "|(?!rapidshare|rapidlibrary|mediafire" +
                         "|4share|easy\\-share).*\\.mp3", "i");
    return reg.test(aURL) && this.prefService.getBoolPref("mp3");
  },

  makeURI: function shortenURL_makeURI(aURL, aOriginCharset, aBaseURI) {
    var ioService = Components.classes['@mozilla.org/network/io-service;1']
                              .getService(Components.interfaces.nsIIOService);
    return ioService.newURI(aURL, aOriginCharset, aBaseURI);
  },

  getBaseURL: function shortenURL_getBaseURL(aBaseNum) {
    try {
      return this.prefService.getCharPref(aBaseNum);
    } catch(ex) {
      return this.prefService.getCharPref(0);
    }
  },

  // copy to clipboard
  copy: function shortenURL_copy(aString) {
    Components.classes["@mozilla.org/widget/clipboardhelper;1"]
              .getService(Components.interfaces.nsIClipboardHelper)
              .copyString(aString);
  },

  // post to Twitter
  twitter: function shortenURL_twitter(aString) {
    this._TEXT = "";

    // Open Echofon panel if it's installed
    if (typeof EchofonCommon == "object") {
      if (EchofonCommon.pref().getBoolPref("login") == false ||
          EchofonCommon.pref().getIntPref("activeUserId") == 0) {
        var accounts = EchofonCommon.pref().getCharPref("accounts");
        if (EchofonCommon.pref().getIntPref("activeUserId") == 0 &&
            accounts == "{}") {
          EchofonCommon.openPreferences();
          return;
        }
        EchofonCommon.pref().setBoolPref("login", true);
        if (EchofonCommon.pref().getIntPref("activeUserId") == 0) {
          EchofonCommon.pref().setIntPref("activeUserId",
                                          EchofonAccountManager.instance().
                                          getPrimaryAccount());
        }
        EchofonCommon.notify("initSession");
      }
      let loc = document.getElementById("identity-box");
      EchofonCommon.openComposeWindow(loc, aString, false);

    } else {
      // open Twitter home in a new tab
      gBrowser.loadOneTab("http://twitter.com/?status=" +
                          encodeURIComponent(aString) +
                          "&in_reply_to=shortenurl",
                          null, null, null, false);
    }
  },

  // post to StatusNet server
  laconica: function shortenURL_laconica(aString) {
    this._TEXT = "";
    var server = this.prefService.getCharPref("post.server.laconica");
    if (!server) server = "http://identi.ca/";
    gBrowser.loadOneTab(server + "?action=newnotice&status_textarea=" +
                        encodeURIComponent(aString),
                        null, null, null, false);
  },

  // post to micro-blogging service
  post: function shortenURL_post(aString) {
    var text = (this._TEXT == "") ? aString : this._TEXT + " " + aString;
    switch (this.prefService.getIntPref("post.server")) {
      case 0: this.twitter(text); break;
      case 1: this.laconica(text);
    }
  },

  isURLof: function shortenURL_isURLIndexOf(aURL, aString) {
    return aURL.indexOf(aString) > -1;
  },

  // open options dialog
  openPrefs: function shortenURL_openPrefs() {
    var wenum = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                          .getService(Components.interfaces.nsIWindowWatcher)
                          .getWindowEnumerator();

    var index = 1;
    while (wenum.hasMoreElements()) {
      var win = wenum.getNext();
      if (win.name == "shortenurl-options") {
        win.focus();
        return;
      }
      index++
    }

    // show open location dialog if location bar is not available
    openDialog("chrome://shortenurl/content/options.xul",
               "shortenurl-options",
               "chrome, dialog, close, titlebar, centerscreen");
  },

  // display result in location bar
  showShortURL: function shortenURL_showShortenURL(aURL) {
    if (window.fullScreen && ("mouseoverToggle" in FullScreen)) {
      FullScreen.mouseoverToggle(true);
    }

    if (gURLBar &&
        (gURLBar.boxObject.height > 0 && gURLBar.boxObject.width > 0) &&
        !gURLBar.readOnly) {
      gURLBar.value = aURL;
      gBrowser.userTypedValue = aURL;
      gURLBar.focus();
      gURLBar.select();
      return;
    }

    openDialog("chrome://browser/content/openLocation.xul",
               "_blank", "chrome, modal, titlebar",
               window, aURL);
  },

  // shorten long URL
  shorten: function shortenURL_shorten(aURL, aBaseNum) {
    var url = aURL != undefined ? aURL : content.location.href;
    if (!this.isValidScheme(url)) {
      this.alert(this.strings.getString("invalid_url"));
      return;
    }

    var baseNum = (aBaseNum != undefined) ?
                   aBaseNum : this.isMP3(url) ?
                              this.baseMP3Num : this.baseNum;

    var baseURL =  this.getBaseURL(baseNum);

    var api = baseURL + ((this.isURLof(baseURL, "7rz.de") ||
                          this.isURLof(baseURL, "arm.in") ||
                          this.isURLof(baseURL, "min2.me") ||
                          this.isURLof(baseURL, "qr.cx") ||
                          this.isURLof(baseURL, "rde.me") ||
                          this.isURLof(baseURL, "ri.ms") ||
                          this.isURLof(baseURL, "srnk.net") ||
                          this.isURLof(baseURL, "vl.am"))
                         ? url : encodeURIComponent(url))
                      + ((baseNum == 91) ? this.isMP3(url) ? "&type=aud"
                                                           : "&type=web"
                                         : "");

    // log message
    if (this.prefService.getBoolPref("logMessages")) {
      this.logMessage(api);
    }

    var version = this.prefService.getCharPref("version");

    var error = null;
    try {
      var req = new XMLHttpRequest();

      if (this.isURLof(baseURL, "goo.gl")) {
        req.open("POST", api, false);
        req.setRequestHeader("X-Auth-Google-Url-Shortener", "true");
      } else {
        req.open("GET", api, false);
      }

      if (!this.isURLof(baseURL, "hj.to")) {
        req.setRequestHeader("User-Agent",
                             navigator.userAgent + " ShortenURL/" + version);
        req.setRequestHeader("Referer",
                             "http://code.google.com/p/shortenurl/");
      }
      req.send(null);

      if (req.status == 200 || req.status == 201) {
        if (typeof JSON != "object") {
          var JSON = Components.classes["@mozilla.org/dom/json;1"]
                               .createInstance(Components.interfaces.nsIJSON);
        }

        var shortURL = "";

        // JSON output formats
        if (this.isURLof(baseURL, "pipes.yahoo.com")) {
          shortURL = JSON.legacyDecode(req.responseText).value.items[0].link;

        } else if (this.isURLof(baseURL, "dlvr.it")) {
          let obj = JSON.legacyDecode(req.responseText);
          for (var i in obj) {
            shortURL = obj[i].short;
            break;
          }

        } else if (this.isURLof(baseURL, "durl.me") ||
                   this.isURLof(baseURL, "song.ly")) {
          shortURL = JSON.legacyDecode(req.responseText).shortUrl;

        } else if (this.isURLof(baseURL, "goo.gl")) {
          shortURL = JSON.legacyDecode(req.responseText).short_url;

        } else if (this.isURLof(baseURL, "linkee.com")) {
          shortURL = JSON.legacyDecode(req.responseText).result;

        } else if (this.isURLof(baseURL, "lnk.by")) {
          shortURL = JSON.legacyDecode(req.responseText).ShortUrl;

        } else if (this.isURLof(baseURL, "mcaf.ee")) {
          shortURL = JSON.legacyDecode(req.responseText).data.url;

        } else if (this.isURLof(baseURL, "mrte.ch")) {
          shortURL = JSON.legacyDecode(req.responseText).shorturl;

        } else if (this.isURLof(baseURL, "ndurl.com")) {
          shortURL = JSON.legacyDecode(req.responseText).data.shortURL;

        } else if (this.isURLof(baseURL, "ow.ly")) {
          shortURL = JSON.legacyDecode(req.responseText).results.shortUrl;

        } else if (this.isURLof(baseURL, "p.ly")) {
          shortURL = JSON.legacyDecode(req.responseText).success;

        } else if (this.isURLof(baseURL, "plo.cc")) {
          shortURL = JSON.legacyDecode(req.responseText).hmmph;

        } else if (this.isURLof(baseURL, "qik.li")) {
          shortURL = JSON.legacyDecode(req.responseText.replace(/^\(|\)$/g, ""))
                         .qikUrl;

        } else if (this.isURLof(baseURL, "rt.nu")) {
          shortURL = JSON.legacyDecode(req.responseText).response;

        } else if (this.isURLof(baseURL, "sfu.ca")) {
          shortURL = "http://get.sfu.ca/" +
                     JSON.legacyDecode(req.responseText).shorturl;

        } else if (this.isURLof(baseURL, "su.pr") ||
                   this.isURLof(baseURL, "hj.to")) {
          let obj = JSON.legacyDecode(req.responseText);
          for (var i in obj.results) {
            shortURL = obj.results[i].shortUrl;
            break;
          }

        } else if (this.isURLof(baseURL, "tra.kz")) {
          shortURL = "http://tra.kz/" + JSON.legacyDecode(req.responseText).s;

        } else if (this.isURLof(baseURL, "2.gp") ||
                   this.isURLof(baseURL, "2.ly") ||
                   this.isURLof(baseURL, "safe.mn") ||
                   this.isURLof(baseURL, "tr.im")) {
          shortURL = JSON.legacyDecode(req.responseText).url;

        } else if (this.isURLof(baseURL, "ur.ly")) {
          shortURL = "http://ur.ly/" + JSON.legacyDecode(req.responseText).code;

        } else if (this.isURLof(baseURL, "vb.ly")) {
          shortURL = JSON.legacyDecode(req.responseText).shorturl;

        } else if (this.isURLof(baseURL, "zapt.in")) {
          let obj = JSON.legacyDecode(req.responseText);
          for (var i in obj.results) {
            shortURL = obj.results[i].shortUrl;
            break;
          }

        } else if (this.isURLof(baseURL, "zipmyurl.com")) {
          shortURL = "http://zipmyurl.com/" +
                     JSON.legacyDecode(req.responseText).zipURL;

        // XML output formats
        } else if (this.isURLof(baseURL, "arm.in")) {
          shortURL = req.responseXML.getElementsByTagName("arminized_url")[0]
                                    .textContent;

        } else if (this.isURLof(baseURL, "lnk.nu")) {
          shortURL = req.responseXML.getElementsByTagName("minilink")[0]
                                    .textContent;

        } else if (this.isURLof(baseURL, "migre.me") ||
                   this.isURLof(baseURL, "min2.me")) {
          shortURL = req.responseXML.getElementsByTagName("migre")[0]
                                    .textContent;

        } else if (this.isURLof(baseURL, "shw.me")) {
          shortURL = req.responseXML.getElementsByTagName("shwme-url")[0]
                                    .textContent;

        } else if (this.isURLof(baseURL, "voizle.com")) {
          shortURL = req.responseXML.getElementsByTagName("voizleurl")[0]
                                    .textContent;

        } else if (this.isURLof(baseURL, "xxsurl.de")) {
          shortURL = req.responseXML.getElementsByTagName("shortlink")[0]
                                    .textContent;

        // plain text or html output formats
        } else if (this.isURLof(baseURL, "7rz.de")) {
          shortURL = "http://" + req.responseText;

        } else if (this.isURLof(baseURL, "buk.me")) {
          shortURL = req.responseText.match(/^[^\<]+/).toString();

        } else if (this.isURLof(baseURL, "fon.gs")) {
          shortURL = req.responseText.match(/http\:.+/).toString();

        } else if (this.isURLof(baseURL, "lin.cr")) {
          shortURL = "http://lin.cr/" + req.responseText;

        } else if (this.isURLof(baseURL, "micurl.com")) {
          shortURL = "http://micurl.com/" + req.responseText;

        } else if (this.isURLof(baseURL, "al.ly")) {
          shortURL = req.responseText.match(/http\:\/\/al\.ly\/\w+/)
                                     .toString();

        } else if (this.isURLof(baseURL, "pt2.me")) {
          shortURL = "http://pt2.me/" + req.responseText;

        } else if (this.isURLof(baseURL, "ikr.me") ||
                   this.isURLof(baseURL, "r.im")) {
          shortURL = req.responseText.match(/[^\s]+/).toString();

        } else if (this.isURLof(baseURL, "shrt.ws") ||
                   this.isURLof(baseURL, "trumpink.lt")) {
          shortURL = req.responseText.match(/^[^\s]+/).toString();

        } else if (this.isURLof(baseURL, "z.pe")) {
          shortURL = "http://z.pe/" +
                     req.responseText.match(/\w+(?=\s)/).toString();

        } else if (this.isURLof(baseURL, "zi.pe")) {
          shortURL = req.responseText.match(/[^\<]+/).toString();

        } else {
          shortURL = req.responseText;
        }

        if (shortURL.indexOf("http") == 0) {

          if (this.isURLof(shortURL, "/www.")) {
            shortURL = shortURL.replace(/\/www\./, "/");
          }

          // log message
          if (this.prefService.getBoolPref("logMessages")) {
            this.logMessage(shortURL + " <-- " + url);
          }

          // copy to clipboard
          if (this.prefService.getBoolPref("autocopy")) {
            this.copy(shortURL);
          }

          // load mp3 shorturl
          if (this.isMP3(url)) {
            gBrowser.loadOneTab(shortURL, null, null, null, false);
            return;
          }

          // post to micro-blogging service
          if (this.prefService.getBoolPref("post")) {
            this.post(shortURL);
            return;
          }

          this.showShortURL(shortURL);
          this.setStatus(shortURL);

          // show message if the output is longer than the original URL
          if (shortURL.length > url.length) {
            this.alert(this.strings.getFormattedString("is_shorter",
                                                       [url, shortURL]));
          }

          return;
        }
      }
      error = req.status;
    } catch(ex) {
      error = ex;
    }
    // FAIL!
    this.alert(this.strings.getString("shorten_fail"));
    Components.utils.reportError(error);

  },

  changeLabelOrTooltip:
  function shortenURL_changeLabelOrTooltip(aNodeId, aURL) {
    var name = "(" + this.prefService.getCharPref("name." +
               (this.isMP3(aURL) ? this.baseMP3Num : this.baseNum)) + ")";
    if ((/\)(?=\)$)/).test(name)) {
      name = name.match(/\([^\s\)]+\)/).toString();
    }
    var node = document.getElementById(aNodeId);
    var attrName = node.hasAttribute("tooltiptext") ? "tooltiptext" : "label";
    var attrValue = node.getAttribute(attrName);
    node.setAttribute(attrName, attrValue.replace(/\(.+\)$/, name));
  },

  toggleMenuIcons: function shortenURL_toggleMenuIcons(aEvent) {
    var sh = this.prefService.getBoolPref("showMenuIcons");
    var si = aEvent.target.getElementsByClassName("shortenURL-context");
    for (var i = 0; i < si.length; i++) {
      si[i].className = sh ? "menuitem-iconic shortenURL-context"
                           : "shortenURL-context";
    }
  },

  // initiate main context menu
  initMainPopup: function shortenURL_initMainPopup(aEvent) {
    ShortenURL.toggleMenuIcons(aEvent);

    // context menuitem IDs
    var itemIDs = ["context-shorten-linkURL", "context-shorten-pageURL",
                   "context-shorten-frameURL", "context-shorten-imageURL"];
    // change/add menuitems label to selected URL shortening service name
    for (var i in itemIDs) {
      ShortenURL.changeLabelOrTooltip(itemIDs[i], gContextMenu.linkURL);
    }

    // "Shorten this link URL" menu, only shown if right click on a link
    gContextMenu.showItem("context-shorten-linkURL",
                          gContextMenu.onLink &&
                          ShortenURL.isValidScheme(gContextMenu.
                                                   linkProtocol));

    // "Shorten this page URL"
    gContextMenu.showItem("context-shorten-pageURL",
                          !(gContextMenu.isContentSelected ||
                            gContextMenu.onTextInput ||
                            gContextMenu.onLink ||
                            gContextMenu.onImage) &&
                          ShortenURL.isValidScheme(content.document.
                                                   location.protocol));

    // "Shorten this frame URL", only shown if right click on a frame
    gContextMenu.showItem("context-shorten-frameURL",
                          gContextMenu.inFrame &&
                          ShortenURL.isValidScheme(gContextMenu.target.
                                                   ownerDocument.location
                                                                .protocol));

    // "Shorten this image URL", only shown if right click on an image
    gContextMenu.showItem("context-shorten-imageURL",
                          gContextMenu.onImage &&
                          ShortenURL.isValidScheme("mediaURL" in gContextMenu
                                                    ? gContextMenu.mediaURL
                                                    : gContextMenu.imageURL));
  },

  // initiate bookmarks context menu
  initBookmarksPopup: function shortenURL_initBookmarksPopup(aEvent) {
    ShortenURL.toggleMenuIcons(aEvent);

    // "Shorten this bookmark URL",
    // only visible when right click on a bookmark item, not bookmark folder
    var isOnBookmark = (document.popupNode.node != "undefined") ||
                       (document.popupNode._placesNode != "undefined");

    var item = document.getElementById("placesContext_shortenURL");
    item.hidden = !isOnBookmark ||
                  !ShortenURL.isValidScheme(
                              document.popupNode.node
                              ? document.popupNode.node.uri
                              : document.popupNode._placesNode.uri);

    // change/add menuitems label to selected URL shortening service name
    if (isOnBookmark) {
      ShortenURL.changeLabelOrTooltip(
                  "placesContext_shortenURL",
                  document.popupNode.node
                  ? document.popupNode.node.uri
                  : document.popupNode._placesNode.uri
      );
    }

    // test
    /*ShortenURL.logMessage("hidden: " + item.hidden + "\n" +
                          "on bookmark: " + isOnBookmark);*/

  },

  // initiate tab context menu
  initTabPopup: function shotenURL_initTabPopup(aEvent) {
    ShortenURL.toggleMenuIcons(aEvent);

    var tab = document.popupNode.localName == "tabs"
              ? getBrowser().mCurrentTab : getBrowser().mContextTab;
    var shortenTab = document.getElementById("context-shortenTab");
    shortenTab.hidden = !ShortenURL.isValidScheme(tab.linkedBrowser.
                                                  currentURI.scheme);

    // change/add menuitems label to selected URL shortening service name
    ShortenURL.changeLabelOrTooltip("context-shortenTab", null);
  },

  // initiate Firefox 4 appmenu
  initAppmenu: function shortenURL_initAppmenu(aEvent) {
    ShortenURL.toggleMenuIcons(aEvent);

    var shortenMenu = document.getElementById("appmenu-shorten-pageURL");
    shortenMenu.hidden = !ShortenURL.isValidScheme(content.location.protocol);

    ShortenURL.changeLabelOrTooltip("appmenu-shorten-pageURL", null);
  },

  init: function shortenURL_init() {
    // set default shortener
    ShortenURL.setDefault();
    ShortenURL.checkVersion();

    // main context menu initalizations
    var cm = document.getElementById("contentAreaContextMenu");
    cm.addEventListener("popupshowing", ShortenURL.initMainPopup, false);
    cm.removeEventListener("popuphiding", ShortenURL.initMainPopup, false);

    // Bookmarks context menu initializations
    var popup = document.getElementById("placesContext");
    popup.addEventListener("popupshowing",
                           ShortenURL.initBookmarksPopup, false);
    popup.removeEventListener("popuphiding",
                              ShortenURL.initBookmarksPopup, false);

    // tab context menu initializations
    var shortenTab = document.getElementById("context-shortenTab");
    var bookmarkTab = document.getElementById("context_bookmarkTab");
    var tabContext = document.getElementById("tabContextMenu")
                     ? document.getElementById("tabContextMenu")
                     : bookmarkTab.parentNode;
    tabContext.insertBefore(shortenTab, bookmarkTab);
    tabContext.addEventListener("popupshowing",
                                ShortenURL.initTabPopup, false);
    tabContext.removeEventListener("popuphiding",
                                   ShortenURL.initTabPopup, false);

    // Firefox 4 appmenu initializations
    var appMenu = document.getElementById("appmenu-popup");
    if (appMenu) {
      appMenu.addEventListener("popupshowing", ShortenURL.initAppmenu, false);
      appMenu.addEventListener("popuphiding", ShortenURL.initAppmenu, false);
    }

    // populate toolbarbutton menu
    var buttonPopup = document.getElementById("shortenurl-toolbarbutton-popup");
    ShortenURL.populatePopup(buttonPopup);

    // populate Firefox 4 appmenu Shorten URL menu
    var appmenuPopup = document.getElementById("appmenu-shortenurl-menu");
    if (appmenuPopup) {
      ShortenURL.populatePopup(appmenuPopup);
    }
  }
}

window.addEventListener("load", ShortenURL.init, false);
window.removeEventListener("unload", ShortenURL.init, false);

