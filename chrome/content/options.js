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

function $(aID) {
  return document.getElementById(aID);
}

({
  get prefService() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefService);
  },


  get pref() {
    return this.prefService.getBranch("extensions.shortenURL.");
  },

  get services() {
    var prefBranch = this.prefService.getBranch(null).
                     QueryInterface(Components.interfaces.nsIPrefBranch2);
    var rv = [];
    var prefArray = prefBranch.getChildList("extensions.shortenURL.name", rv);
    var n = prefArray.length;
    if (n <= 0) return;

    var s = [];
    for (var i = 0; i < n; i++) {
      s[i] = { index: i, name: this.pref.getCharPref("name." + i) }
    }

    s.sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })

    return s;
  },

  populate: function config_populate(aObject) {
    var mi = document.createElement("menuitem");
    mi.setAttribute("value", aObject.index);
    mi.setAttribute("label", aObject.name);
    $("menupopup").appendChild(mi);
  },

  load: function config_onLoad() {
    $("mp3-shortener").disabled = !$("mp3").checked;
    $("micro-blogs").disabled = !$("post").checked;
    $("laconica-server").disabled = !$("laconica").selected || !$("post").checked;

    $("mp3").addEventListener("DOMAttrModified", function() {
      $("mp3-shortener").disabled = !$("mp3").checked;
    }, false);

    $("post").addEventListener("DOMAttrModified", function() {
      $("micro-blogs").disabled = !$("post").checked;
      $("laconica-server").disabled = !$("laconica").selected || !$("post").checked;
    }, false);

    $("laconica").addEventListener("DOMAttrModified", function() {
      $("laconica-server").disabled = !$("laconica").selected || !$("post").checked;
      $("laconica-server").focus();
    }, false);

    for (var i = 0; i < this.services.length; i++) {
      this.populate(this.services[i]);
      if (this.services[i].index == this.pref.getIntPref("baseURL")) {
        var selectedIndex = i;
      }
    }
    $("menulist").selectedIndex = selectedIndex;
  }

}).load()

