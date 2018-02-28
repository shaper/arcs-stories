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

defineParticle(({DomParticle, log}) => {
  const host = `social-write-posts`;

  const template = `
<style>
[${host}] {
  background-color: white;
  cursor: pointer;
  position: fixed;
  margin-left: 440px;
  bottom: 48px;
  padding: 8px;
  border-radius: 100%;
  box-shadow: 1px 1px 5px 0px rgba(0,0,0,0.75);
  box-sizing: border-box;
}
[${host}] i {
  display: block;
  background-color: #b0e3ff;
  border-radius: 100%;
  font-size: 44px;
}
</style>
<div ${host}>
  <i class="material-icons" on-click="_onOpenEditor">add</i>
</div>
  `.trim();

  return class extends DomParticle {
    get template() {
      return template;
    }
    _getInitialState() {
      return {name: ''};
    }
    _shouldRender({post, posts}) {
      return posts;
    }
    _render({post, posts}, state) {
      // TODO(wkorman|sjmiles): Generalize or somehow clean up or document
      // the overall pattern between WritePosts and EditPost.
      if (post && post.name) {
        // Set the post into the right place in the posts set. If we find it
        // already present replace it, otherwise, add it.
        // TODO(dstockwell): Replace this with happy entity mutation approach.
        const targetPost = posts.find(p => p.id === post.id);
        if (targetPost) {
          if (targetPost.name !== post.name) {
            this._views.get('posts').remove(targetPost);
            this._views.get('posts').store(post);
          }
        } else {
          this._views.get('posts').store(post);
        }

        // TODO(wkorman): And then null it out so that the editor goes away (if
        // we want the editor to go away immediately), otherwise, hitting the
        // 'X' button should do it.
        this._views.get('post').clear();
      }
      return {
        name: state.name,
      };
    }
    _onOpenEditor(e, state) {
      const Post = this._views.get('posts').entityClass;
      // TODO(wkorman): Set existing post data to edit existing.
      this._views.get('post').set(
          new Post({name: '', createdTimestamp: Date.now()}));
    }
  };
});
