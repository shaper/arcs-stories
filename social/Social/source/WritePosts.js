/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

'use strict';

defineParticle(({DomParticle}) => {
  const template = `
<style>
  [edit] input {
    border: none;
    background: #d4d4d4;
    padding: 10px;
    font-family: "Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace;
    border-bottom: solid 1px;
    border-bottom-color: grey;
    width: 300px;
  }
  [edit] input:focus{
    outline: none;
  }
  [edit] {
    margin: 25px;
  }
</style>
<div edit>
  <input name="name" type="text" id="name" size="30" value={{name}} on-change="_onNameChange"></input>
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
    _onNameChange(e, state) {
      const Post = this._views.get('posts').entityClass;
      this._views.get('posts').store(
          new Post({name: e.data.value, time: new Date().toLocaleString()}));
      // Set the state to trigger render().
      this._setState({name: ''});
    }
  };
});
