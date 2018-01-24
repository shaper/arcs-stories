// @license
// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

"use strict";

defineParticle(({DomParticle}) => {

  let template = `
<style>
  .material-icons.md-14 { font-size: 14px; }

  [msg] {
    font-family: "Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace;  
    font-size: 9pt;  
  }
  [msg] input {
    border: none;
    background: #d4d4d4;
    padding: 10px;
    border-bottom: solid 1px;
    border-bottom-color: grey;
    width: 300px;
  }
  [msg] input:focus{
    outline: none;
  }
  [msg] {
    margin: 20px;
    padding-bottom: 3px;
    border-bottom: solid 0.5px;
    border-bottom-color: #d4d4d4;    
    width: 320px;
  }
  [msg] [title] {
    margin-bottom: 4px;
  }
</style>
<x-list items="{{posts}}">
    <template>
    <div msg>
      <div title>
        <strong>~<span>{{owner}}</span></strong>&nbsp;written <span>{{time}}</span> ago
        <i class="material-icons md-14" style%="{{style}}" value="{{id}}" on-click="_onClick">clear</i>
        <br>
      </div>
      <div content value="{{id}}">{{name}}</div>
    </div>
    </template>
</x-list>
    `.trim();

  return class extends DomParticle {
    get template() {
      return template;
    }
    _willReceiveProps(props) {
      if (props.posts) {
        this._setState({posts: props.posts});
      }
    }
    _onClick(e, state) {
      this._views.get('posts').remove(state.posts[e.data.value]);
    }
    _timeSince(time) {
      var interval = Math.floor((new Date() - new Date(time)) / 1000);
      if (interval < 60) {
        return interval + " seconds";
      }
      interval = Math.floor(interval / 60);
      if (interval < 60) {
        return interval + " minutes";        
      }
      interval = Math.floor(interval / 60);
      if (interval < 24) {
        return interval + " hours";        
      }
      return time;
    }
    _render(props, state) {
      if (state.posts) {
        let posts = state.posts.map((t, i) => {
          t.date = new Date(t.time);
          t.id = i;
          return t;
        });
        posts.sort((a, b) => {
          return b.date.getTime() - a.date.getTime();
        });
        return {
          posts: posts.map(post => {
            return { name: post.name,
                     id: post.id,
                     time: this._timeSince(post.time),
                     style: { display: this._views.get('posts').canWrite ? 'inline' : 'none' },
                     owner: post.owner ? post.owner : props.user.name };   
          })
        };
      }
    }
  };
});
