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

ShortenURL.dndObserver = {

  onDrop:
  function shortenURL_DNDObserver_onDrop(aEvent, aXferData, aDragSession) {
    var split = aXferData.data.split("\n");
    var url = split[0];
    if (url != aXferData.data) {
      var dialogArgs = {name:split[1], url:url};
      ShortenURL.shorten(dialogArgs.url);
    } else {
      split = aXferData.data.split(" ");
      url = split[0];
      try {
        ShortenURL.shorten(ShortenURL.makeURI(url).spec);
      } catch(ex) {
        ShortenURL.alert(ShortenURL.strings.getString("invalid_url"));
      }
    }
  },

  onDragOver:
  function shortenURL_DNDObserver_onDragOver(aEvent, aFlavour, aDragSession) {
    ShortenURL.setStatus(ShortenURL.strings.getString("dropLinkOnButt"));
    aDragSession.dragAction = Components.interfaces.nsIDragService
                                                   .DRAGDROP_ACTION_LINK;
  },

  onDragExit:
  function shortenURL_DNDObserver_onDragExit(aEvent, aDragSession) {
    ShortenURL.setStatus("");
  },

  getSupportedFlavours:
  function shortenURL_DNDObserver_getSupportedFlavours() {
    var flavourSet = new FlavourSet;
    flavourSet.appendFlavour("text/x-moz-url");
    flavourSet.appendFlavour("text/unicode");
    return flavourSet;
  }
}

