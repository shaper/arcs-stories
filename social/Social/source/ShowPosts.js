// @license
// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

'use strict';

defineParticle(({DomParticle, resolver, log}) => {
  const host = `social-show-posts`;

  const template = `
<style>
  [${host}] .material-icons.md-14 { font-size: 14px; }
  [${host}] {
    font-family: 'Google Sans', sans-serif;
    font-size: 16pt;
    color: rgba(0, 0, 0, 0.87);
  }
  [${host}] [msg] [avatar] {
    display: inline-block;
    height: 24px;
    width: 24px;
    min-width: 24px;
    border-radius: 100%;
    margin-left: 16px;
    margin-right: 16px;
    vertical-align: bottom;
  }
  [${host}] [header] {
    background-color: white;
    border-bottom: 1px solid lightgrey;
    border-top: 1px solid lightgrey;
    text-align: center;
  }
  [${host}] [header] [blogAvatar] {
    display: inline-block;
    height: 56px;
    width: 56px;
    min-width: 56px;
    border-radius: 100%;
    margin-left: auto;
    margin-right: auto;
    margin-top: 16px;
  }
  [${host}] [header] [blogDescription] {
    color: rgba(0, 0, 0, 0.4);
    margin-bottom: 14px;
    text-decoration: underline lightgrey;
  }
  [${host}] [zerostate] {
    font-size: 32pt;
    margin: 0.5em 56px auto 56px;
    text-align: center;
  }
  [${host}] [msg] input {
    border: none;
    background: #d4d4d4;
    padding: 10px;
    border-bottom: 1px solid grey;
    width: 300px;
  }
  [${host}] [msg] input:focus{
    outline: none;
  }
  [${host}] [msg] {
    padding-bottom: 16px;
    border-bottom: solid 0.5px;
    border-bottom-color: #d4d4d4;
  }
  [${host}] [msg] [title] {
    margin-bottom: 14px;
    margin-top: 18px;
  }
  [${host}] [msg] [content] {
    margin-left: 56px;
  }
  [${host}] [owner] {
    font-size: 14pt;
    margin-right: 6px;
  }
  [${host}] [when] {
    font-size: 12pt;
    color: rgba(0, 0, 0, 0.4);
  }
</style>
<div ${host}>
  <div header>
    <!-- TODO(wkorman): Find a way to collapse this with position: sticky
         and scroll position or similar. -->
    <div blogAvatar style='{{blogAvatarStyle}}'></div>
    <div blogAuthor>{{blogAuthor}}</div>
    <div blogDescription>Add a description</div>
  </div>
  <div zeroState hidden="{{hideZeroState}}">
    Get started by naming your miniblog & creating your first post!
  </div>
  <div postContent>
    <!-- TODO(wkorman): Convert to standard list particle. -->
    <x-list items="{{posts}}">
        <template>
        <div msg>
          <div title>
            <span avatar style='{{avatarStyle}}'></span><span owner>{{owner}}</span><span when>{{time}}</span>
            <i class="material-icons md-14" style%="{{style}}" value="{{id}}" on-click="_onClick">clear</i>
            <br>
          </div>
          <div content value="{{id}}">{{name}}</div>
        </div>
        </template>
    </x-list>
  </div>
</div>
    `.trim();

  return class extends DomParticle {
    get template() {
      return template;
    }
    _peopleSetToMap(people) {
      const peopleMap = {};
      if (people)
        people.map(p => peopleMap[p.id] = p.name);
      return peopleMap;
    }
    _avatarSetToMap(avatars) {
      const avatarMap = {};
      if (avatars)
        avatars.map(a => avatarMap[a.owner] = a.url);
      return avatarMap;
    }
    _initBlogMetadata(props) {
      if (!props.metadata) {
        const metadataHandle = this._views.get('metadata');
        // Note that the aggregated feed recipe use case for this particle does
        // not provide a metadata handle at all.
        // TODO(wkorman): Consider splitting this particle into separate
        // ones -- one for working with a single miniblog and a separate one
        // to act as the feed, as differing logic is starting to get complex.
        if (metadataHandle) {
          const BlogMetadata = metadataHandle.entityClass;
          metadataHandle.set(
              new BlogMetadata({blogOwner: props.user.id, description: ''}));
        }
      }
    }
    _willReceiveProps(props) {
      if (props.posts) {
        this._initBlogMetadata(props);
        this._setState({
          posts: props.posts,
          people: this._peopleSetToMap(props.people),
          avatars: this._avatarSetToMap(props.avatars)
        });
      }
    }
    _onClick(e, state) {
      const targetPost = state.posts.find(p => p.id == e.data.value);
      if (targetPost)
        this._views.get('posts').remove(targetPost);
    }
    _timeSince(time) {
      let interval = Math.floor((Date.now() - time) / 1000);
      if (interval < 60) {
        return interval + ' seconds';
      }
      interval = Math.floor(interval / 60);
      if (interval < 60) {
        return interval + ' minutes';
      }
      interval = Math.floor(interval / 60);
      if (interval < 24) {
        return interval + ' hours';
      }
      return time;
    }

    _avatarToStyle(url) {
      return `background: url('${
          url}') center no-repeat; background-size: cover;`;
    }
    _blogOwnerName(metadata) {
      const unknownName = 'Unknown';
      let name = unknownName;
      if (metadata) {
        name = this._state.people[metadata.blogOwner] || unknownName;
      }
      return name;
    }
    _blogOwnerAvatarStyle(metadata, avatars) {
      const unknownAvatarUrl = '';
      let avatarUrl = unknownAvatarUrl;
      if (metadata) {
        avatarUrl = resolver(avatars[metadata.blogOwner]) || unknownAvatarUrl;
      }
      return this._avatarToStyle(avatarUrl);
    }
    _sortPostsByDateAscending(posts) {
      return posts.sort((a, b) => {
        return b.createdTimestamp - a.createdTimestamp;
      });
    }
    _postToModel(viewingUserName, viewingUserAvatar, visible, post) {
      // TODO(wkorman): The below is invalid when a user views another
      // user's miniblog arc directly (i.e. not as an aggregated feed),
      // since we won't have boxed owner info in that case. Rework this
      // to persist the owner id with each post.
      const avatarUrl = post.owner ? resolver(this._state.avatars[post.owner]) :
                                     viewingUserAvatar;
      return {
        name: post.name,
        id: post.id,
        time: this._timeSince(post.createdTimestamp),
        style: {display: visible ? 'inline' : 'none'},
        avatarStyle: this._avatarToStyle(avatarUrl),
        owner: post.owner ? this._state.people[post.owner] : viewingUserName
      };
    }
    _render({user, metadata}, {posts, avatars}) {
      const blogAuthor = this._blogOwnerName(metadata);
      const blogAvatarStyle = this._blogOwnerAvatarStyle(metadata, avatars);
      if (posts && posts.length > 0) {
        const sortedPosts = this._sortPostsByDateAscending(posts);
        const viewingUserName = user.name;
        const viewingUserAvatar = user ? resolver(avatars[user.id]) : '';
        const visible = this._views.get('posts').canWrite;
        return {
          hideZeroState: true,
          blogAuthor,
          blogAvatarStyle,
          posts: sortedPosts.map(
              p => this._postToModel(
                  viewingUserName, viewingUserAvatar, visible, p))
        };
      } else {
        return {hideZeroState: false, blogAuthor, blogAvatarStyle, posts: []};
      }
    }
  }
});
