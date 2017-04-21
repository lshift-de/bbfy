/* -*- mode: js2; -*-
 *
 * This file is part of bbfy.
 *
 * Copyright © 2015 LShift Services GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Authors:
 * - Alexander Kahl <alex@lshift.de>
 */

'use strict'; // Not required in ES6, but will appear in generated ES5 code

import { regex, string, alt, seq, whitespace, optWhitespace } from 'parsimmon';
import _ from 'underscore';

function translate_tag (tag) {
  return (text) => `<${tag}>${text}</${tag}>`;
}

function span (style, text) {
  return `<span style="${style}">${text}</span>`;
}

const rule_sets = {
  strip: {},
  html: {
    b: translate_tag('b'),
    i: translate_tag('i'),
    u: translate_tag('u'),
    s: translate_tag('s'),
    color (text, tag, color = '') {
      return color.match(/^(#[0-9a-f]{6}|\w+)$/i) ? span(`color: ${color.toLowerCase()};`, text) : text;
    },
    font (text, tag, font = '') {
      return font.match(/^\w+$/) ? span(`font-family: ${font};`, text) : text;
    },
    size (text, tag, size = '') {
      return size.match(/^\d+$/) ? span(`font-size: ${size}px;`, text) : text;
    },
    url (text, tag, url = '') {
      return url.match(/\/\/.+\..+/) ? `<a href="${url}">${text}</a>` : text;
    },
    img (url, tag, args) {
      if (url.match(/\/\/.+\..+/)) {
        if (args) {
          const [width = '', height = ''] = (typeof args === 'string')
                  ? (/(\d+)x(\d+)/.exec(args) || []).slice(1)
                  : [args.width, args.height];
          if (width.match(/^\d+$/) && height.match(/^\d+$/)) {
            return `<img src="${url}" width="${width}" height="${height}"/>`;
          }
        }
        return `<img src="${url}"/>`;
      } else { return ''; }
    }
  }
};

const defaults = {
  rules: rule_sets.html,
  unsupported (text) { return text; },
  lineTags: ['*']
};

function parse (input) {
  function tokenizer (type) {
    return (value) => ({ type: type, value: value });
  }
  
  const newline = string('\n').map(tokenizer('newline'));
  const name = regex(/[^\] =]+/);
  const attribute = string('=').then(name);
  const open_bracket = string('[');
  const close_bracket = string(']');
  const close_qualifier = string('/');
  const raw = regex(/[^[\n]+/).map(tokenizer('text'));
  const garbage = regex(/[\[\] ]/).map(tokenizer('text'));
  
  const simple_tag = seq(name);
  const assignment = seq(name, attribute);
  const complex_tag = seq(name.skip(whitespace), assignment.skip(optWhitespace).many().map(_.object));
  const tag = complex_tag.or(assignment).or(simple_tag).map(([tag, assignments]) => ({ tag: tag, assignments: assignments }));
  const open_tag = open_bracket
          .then(tag)
          .skip(close_bracket)
          .map(tokenizer('open-tag'));
  
  const close_tag = open_bracket
          .then(close_qualifier)
          .then(name)
          .skip(close_bracket)
          .map(tokenizer('close-tag'));

  const text = alt(close_tag, open_tag, raw, newline, garbage).many();

  return text.parse(input);
}

function sanitize (lexemes, { lineTags = defaults.lineTags } = defaults) {
  const { result, sane, tags } = lexemes.reduce((acc, { type, value }) => {
    const { result, sane, tags } = acc;

    function close (index, close_value, data) {
      if (index === -1) {
        return _.extend({}, acc, data);
      }
      else if (index === 0) {
        return _.extend({}, acc, {
          result: result.concat([close_value]),
          tags: tags.slice(1)
        });
      }
      else {
        const close = tags.slice(0, index + 1);
        return _.extend({}, acc, {
          result: result.concat(close.map(tag => ({ type: 'close-tag', value: tag }))),
          tags: tags.slice(index + 1),
          sane: false
        });
      }
    }

    if (type === 'text') {
      return _.extend({}, acc, { result: result.concat([{
        type: type, value: value
      }]) });
    }
    else if (type === 'open-tag') {
      return _.extend({}, acc, {
        result: result.concat([{ type: type, value: value }]),
        tags: [value.tag].concat(tags)
      });
    }
    else if (type === 'close-tag') {
      return close(tags.indexOf(value), { type: type, value: value }, { sane: false });
    }
    else if (type === 'newline') {
      return close(_.findIndex(tags, (tag) => _.contains(lineTags, tag)),
                   { type: 'close-tag', value: tags[0] },
                   { result: result.concat([{ type: 'text', value: value }]) });
    }
    else { throw 'Unsupported lexeme ' + type; };
  }, { result: [], sane: true, tags: [] });

  return { lexemes: result, sane: sane && tags.length === 0, tags: tags };
}

function cst (nodes) {
  function rec (nodes) {
    let rest = nodes, acc = [], node;
    while (rest !== void 0 && rest.length > 0) {
      [node, ...rest] = rest;
      const { type, value } = node;
      if (type === 'text') {
        acc.push(node);
      }
      else if (type === 'open-tag') {
        let result = rec(rest);
        acc.push({ type: 'tag', value: value, children: result.result });
        rest = result.rest;
      }
      else if (type === 'close-tag') {
        return { result: acc, rest: rest };
      }
    }

    return { result: acc, rest: rest };
  }

  return { type: 'root', children: rec(nodes).result };
}

function transform (cst, rules, unsupported) {
  function convert (text, { tag, assignments }) {
    return (rules[tag] || unsupported)(text, tag, assignments);
  }
  
  function rec ({ type, value, children }) {
    if (type === 'text') {
      return value;
    }
    else if (type === 'tag') {
      return convert(children.reduce((s, child) => s + rec(child), ''), value);
    }
    else {
      return children.reduce((s, child) => s + rec(child), '');
    }
  }

  return rec(cst);
}

const bbfy = {
  converter (config = defaults) {
    const { rules = defaults.rules, unsupported = defaults.unsupported } = config;
    return (text) => {
      const result = parse(text, config);
      if (!result.status) { throw parsimmon.formatError(text, result); }
      return transform(cst(sanitize(result.value, config).lexemes), rules, unsupported);
    };
  },
  options: defaults,
  ruleSets: rule_sets,
  api: { parse: parse, transform: transform, sanitize: sanitize, cst: cst }
};

export default bbfy;
