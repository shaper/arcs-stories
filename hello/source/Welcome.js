/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
"use strict";

defineParticle(({ DomParticle }) => {
  const host = `welcome`;

  const template = `
  <div ${host}>
    <div style="padding: 10px 6px">Ahoy</div>
  </div>
    `.trim();

  const info = console.log.bind(
    console.log,
    "%cWelcome",
    `background: #ee82ee; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`
  );

  return class extends DomParticle {
    get template() {
      return template;
    }
    _shouldRender(props) {
      info("shouldRender");
      return true;
    }
    _willReceiveProps(props, state) {
      info("willReceiveProps");
    }
    _render(props, state) {
      info("render");
      return {};
    }
  };
});
