/**
 * @license
 * Copyright (c) 2018 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

'use strict';

defineParticle(({DomParticle}) => {
  const host = `social-edit-post`;

  const template = `
<style>
[${host}] textarea {
  border: none;
  font-family: 'Google Sans', sans-serif;
  font-size: 16pt;
  outline: none;
  resize: none;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 95%;
  margin: 8px;
}
[${host}] {
  font-family: 'Google Sans', sans-serif;
  padding: 8px;
}
[${host}] [post-buttons] {
  position: absolute;
  right: 8px;
  top: -48px;
}
[${host}] [post-buttons] i {
  border-radius: 100%;
  display: inline-block;
  padding: 8px;
}
[${host}] [post-buttons] i:active {
  background-color: #b0e3ff;
}
</style>
<div ${host}>
  <div post-buttons>
    <i class="material-icons" on-click="_onDeletePost">delete</i>
    <i class="material-icons" on-click="_onAttachPhoto">attach_file</i>
    <i class="material-icons live" on-click="_onSavePost">done</i>
  </div>
  <textarea on-change="_onCaptureText" value="{{name}}"></textarea>
</div>
  `.trim();

  return class extends DomParticle {
    get template() {
      return template;
    }
    _getInitialState() {
      return {name: ''};
    }
    _render(props, state) {
      return {
        name: state.name,
      };
    }
    // TODO(wkorman): Add onDeletePost, onAttachPost.
    _onSavePost(e, state) {
      const Post = this._views.get('posts').entityClass;
      this._views.get('post').set(
          new Post({name: state.name, createdTimestamp: Date.now()}));
      this._setState({name: ''});
    }
    _onCaptureText(e, state) {
      if (state.name !== e.data.value) {
        this._setState({name: e.data.value});
      }
    }
  };
});
