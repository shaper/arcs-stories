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

defineParticle(({DomParticle, log}) => {
  const host = `social-edit-post`;

  const template = `
<style>
[${host}] textarea {
  border: none;
  font-family: 'Google Sans', sans-serif;
  font-size: 16pt;
  /* TODO(wkorman|sjmiles): Rework in conjunction with DetailSlider to allow
     something functionally like height: 100%. */
  height: 300px;
  width: 100%;
  outline: none;
  resize: none;
}
[${host}] {
  font-family: 'Google Sans', sans-serif;
  padding: 8px;
}
[${host}] [post-buttons] {
  position: absolute;
  right: 8px;
  top: 8px;
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
  <textarea on-change="_onCaptureText" value="{{message}}"></textarea>
</div>
  `.trim();

  return class extends DomParticle {
    get template() {
      return template;
    }
    _getInitialState() {
      return {message: ''};
    }
    _willReceiveProps(props) {
      if (props.user) {
        this._setState({user: props.user});
      }
    }
    _render(props, state) {
      return {
        message: state.message,
      };
    }
    // TODO(wkorman): Add onDeletePost, onAttachPost.
    _onSavePost(e, state) {
      const Post = this._views.get('posts').entityClass;
      this._views.get('post').set(new Post({
        message: state.message,
        createdTimestamp: Date.now(),
        author: state.user.id
      }));
      this._setState({message: ''});
    }
    _onCaptureText(e, state) {
      if (state.message !== e.data.value) {
        this._setState({message: e.data.value});
      }
    }
  };
});
