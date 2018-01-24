// @license
// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

"use strict";

importScripts("https://www.gstatic.com/firebasejs/4.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/4.2.0/firebase-database.js");

defineParticle(({DomParticle}) => {

  return class extends DomParticle {
    constructor() {
      super();
      this.initDb();
    }
    _getInitialState() {
      let name = 'Smitty';
      return {
        name,
        messages: []
      };
    }
    _willReceiveProps(props, state) {
      if (props.config) {
        this.initDb(props.config);
      }
    }
    initDb(config) {
      firebase.initializeApp(config);
      this.db = firebase.database();
      let dbmsgs = this.db.ref('messages');
      dbmsgs.on('child_added', data => {
        let messages = this._state.messages;
        messages.push({text: data.val().text, name: data.val().name});
        this._setState({messages});
      });
    }
  };
});