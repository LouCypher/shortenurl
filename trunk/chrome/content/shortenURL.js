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
  - LouCypher <me@loucypher.mp>

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

  get prefService() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefBranch)
                     .getBranch("extensions.shortenURL.");
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

  setStatus: function shortenURL_setStatus(aString) {
    document.getElementById("statusbar-display").label = aString;
  },

  alert: function shortenURL_alert(aString) {
    Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
              .getService(Components.interfaces.nsIPromptService)
              .alert(null, "Shorten URL", aString);
  },

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

  copy: function shortenURL_copy(aString) {
    Components.classes["@mozilla.org/widget/clipboardhelper;1"]
              .getService(Components.interfaces.nsIClipboardHelper)
              .copyString(aString);
  },

  tweet: function shortenURL_tweet(aString) {
    /*if (typeof TWITTERBAR == "object") {
      gURLBar.value = aString;
      TWITTERBAR.post(true);
    } else*/ if ((typeof gTwitterNotifier == "object") &&
        (gTwitterNotifier._util.accounts) &&
        (gTwitterNotifier._util.pref().getBoolPref("login"))) {
      var t = gTwitterNotifier.$("twitternotifier-message-input");
      t.setAttribute("rows", 5);
      t.setAttribute("multiline", true);
      gTwitterNotifier._util.notify("getRecent", {type: "timeline"});
      t.value = aString;
      t.focus();
    } else {
      gBrowser.loadOneTab("http://twitter.com/home/?status=" + aString,
                          null, null, null, false);
    }
  },

  isURLof: function shortenURL_isURLIndexOf(aURL, aString) {
    return aURL.indexOf(aString) > -1;
  },

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

    openDialog("chrome://shortenurl/content/options.xul",
               "shortenurl-options",
               "chrome, centerscreen");
  },

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

  shorten: function shortenURL_shorten(aURL, aBaseNum) {
    var url = aURL != undefined ? aURL : content.location.href;
    if (!this.isValidScheme(url)) {
      this.alert(this.strings.getString("invalid_url"));
      return;
    }

    var baseNum = (aBaseNum != undefined) ?
                   aBaseNum : this.isMP3(aURL) ?
                              this.baseMP3Num : this.baseNum;

    var baseURL =  this.getBaseURL(baseNum);

    var error = null;
    try {
      var req = new XMLHttpRequest();
      req.open("GET",
               baseURL + ((this.isURLof(baseURL, "arm.in") ||
                           this.isURLof(baseURL, "vl.am") ||
                           this.isURLof(baseURL, "rde.me") ||
                           this.isURLof(baseURL, "min2.me"))
                          ? url : encodeURIComponent(url)),
               false);
      req.send(null);
      if (req.status == 200) {
        var JSON = Components.classes["@mozilla.org/dom/json;1"]
                             .createInstance(Components.interfaces.nsIJSON);

        var shortURL = "";
        if (this.isURLof(baseURL, "pipes.yahoo.com")) {
          shortURL = JSON.decode(req.responseText).value.items[0].link;

        } else if (this.isURLof(baseURL, "tr.im")) {
          shortURL = JSON.decode(req.responseText).url;

        } else if (this.isURLof(baseURL, "digg.com")) {
          shortURL = JSON.decode(req.responseText).shorturls[0].short_url;

        } else if (this.isURLof(baseURL, "zipmyurl.com")) {
          shortURL = "http://zipmyurl.com/" +
                     JSON.decode(req.responseText).zipURL;

        } else if (this.isURLof(baseURL, "xrl.in")) {
          shortURL = "http://xrl.in/" + req.responseText;

        } else if (this.isURLof(baseURL, "lin.cr")) {
          shortURL = "http://lin.cr/" + req.responseText;

        } else if (this.isURLof(baseURL, "micurl.com")) {
          shortURL = "http://micurl.com/" + req.responseText;

        } else if (this.isURLof(baseURL, "r.im")) {
          shortURL = req.responseText.match(/[^\s]+/).toString();

        } else if (this.isURLof(baseURL, "lnk.by")) {
          shortURL = "http://" + JSON.decode(req.responseText).ShortUrl;

        } else if (this.isURLof(baseURL, "tra.kz")) {
          shortURL = "http://tra.kz/" + JSON.decode(req.responseText).s;

        } else if (this.isURLof(baseURL, "song.ly")) {
          shortURL = JSON.decode(req.responseText).shortUrl;

        } else if (this.isURLof(baseURL, "2ze.us")) {
          var obj = JSON.decode(req.responseText);
          for (var i in obj.urls) {
            shortURL = obj.urls[i].shortcut;
            break;
          }

        } else if (this.isURLof(baseURL, "ur.ly")) {
          shortURL = "http://ur.ly/" + JSON.decode(req.responseText).code;

        } else if (this.isURLof(baseURL, "migre.me") ||
                   this.isURLof(baseURL, "min2.me")) {
          shortURL = req.responseXML.getElementsByTagName("migre")[0]
                                    .textContent;

        } else if (this.isURLof(baseURL, "z.pe")) {
          shortURL = "http://z.pe/" +
                     req.responseText.match(/\w+(?=\s)/).toString();

        } else if (this.isURLof(baseURL, "arm.in")) {
          shortURL = req.responseXML.getElementsByTagName("arminized_url")[0]
                                    .textContent;

        } else if (this.isURLof(baseURL, "buk.me")) {
          shortURL = req.responseText.match(/^[^\<]+/).toString();

        } else if (this.isURLof(baseURL, "poprl.com")) {
          shortURL = req.responseText.match(/^[^\s]+/).toString();

        } else {
          shortURL = req.responseText;
        }

        if (shortURL.indexOf("http") == 0) {
          if (this.isURLof(shortURL, "snurl.com")) {
            shortURL = shortURL.replace(/snurl\.com/, "sn.im");
          }

          if (this.isURLof(shortURL, "/www.")) {
            shortURL = shortURL.replace(/\/www\./, "/");
          }

          if (this.prefService.getBoolPref("autocopy")) {
            this.copy(shortURL);
          }

          if (this.prefService.getBoolPref("autotweet")) {
            this.tweet(shortURL);
            return;
          }

          this.showShortURL(shortURL);
          this.setStatus(shortURL);

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
    this.alert(this.strings.getString("shorten_fail"));
    throw new Error(error);
  }

}

window.addEventListener("load", shortenURL_init = function(e) {
  var cm = document.getElementById("contentAreaContextMenu");
  cm.addEventListener("popupshowing", contextInit = function(e) {
    gContextMenu.showItem("context-shorten-linkURL",
                          gContextMenu.onLink &&
                          ShortenURL.isValidScheme(gContextMenu.
                                                   linkProtocol));

    gContextMenu.showItem("context-shorten-pageURL",
                          !(gContextMenu.isContentSelected ||
                            gContextMenu.onTextInput ||
                            gContextMenu.onLink ||
                            gContextMenu.onImage) &&
                          ShortenURL.isValidScheme(content.document.
                                                   location.protocol));

    gContextMenu.showItem("context-shorten-frameURL",
                          gContextMenu.inFrame &&
                          ShortenURL.isValidScheme(gContextMenu.target.
                                                   ownerDocument.location
                                                                .protocol));

    gContextMenu.showItem("context-shorten-imageURL",
                          gContextMenu.onImage &&
                          ShortenURL.isValidScheme("mediaURL" in gContextMenu
                                                    ? gContextMenu.mediaURL
                                                    : gContextMenu.imageURL));

  }, false);
  cm.removeEventListener("popuphiding", contextInit, false);
}, false);

window.removeEventListener("unload", shortenURL_init, false);

