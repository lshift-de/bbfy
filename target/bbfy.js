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

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var _parsimmon = require('parsimmon');

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function translate_tag(tag) {
  return function (text) {
    return '<' + tag + '>' + text + '</' + tag + '>';
  };
}

function span(style, text) {
  return '<span style="' + style + '">' + text + '</span>';
}

var rule_sets = {
  strip: {},
  html: {
    b: translate_tag('b'),
    i: translate_tag('i'),
    u: translate_tag('u'),
    s: translate_tag('s'),
    color: function color(text, tag) {
      var _color = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

      return _color.match(/^(#[0-9a-f]{6}|\w+)$/i) ? span('color: ' + _color.toLowerCase() + ';', text) : text;
    },
    font: function font(text, tag) {
      var _font = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

      return _font.match(/^\w+$/) ? span('font-family: ' + _font + ';', text) : text;
    },
    size: function size(text, tag) {
      var _size = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

      return _size.match(/^\d+$/) ? span('font-size: ' + _size + 'px;', text) : text;
    },
    url: function url(text, tag) {
      var _url = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

      return _url.match(/^https?:\/\/.+/) ? '<a href="' + _url + '">' + text + '</a>' : text;
    },
    img: function img(url, tag, args) {
      if (url.match(/^https?:\/\/.+/)) {
        if (args) {
          var _ref = typeof args === 'string' ? (/(\d+)x(\d+)/.exec(args) || []).slice(1) : [args.width, args.height];

          var _ref2 = _slicedToArray(_ref, 2);

          var _ref2$0 = _ref2[0];
          var width = _ref2$0 === undefined ? '' : _ref2$0;
          var _ref2$1 = _ref2[1];
          var height = _ref2$1 === undefined ? '' : _ref2$1;

          if (width.match(/^\d+$/) && height.match(/^\d+$/)) {
            return '<img src="' + url + '" width="' + width + '" height="' + height + '"/>';
          }
        }
        return '<img src="' + url + '"/>';
      } else {
        return '';
      }
    }
  }
};

var defaults = {
  rules: rule_sets.html,
  unsupported: function unsupported(text) {
    return text;
  },
  lineTags: ['*']
};

function parse(input) {
  function tokenizer(type) {
    return function (value) {
      return { type: type, value: value };
    };
  }

  var newline = (0, _parsimmon.string)('\n').map(tokenizer('newline'));
  var name = (0, _parsimmon.regex)(/[^\] =]+/);
  var attribute = (0, _parsimmon.string)('=').then(name);
  var open_bracket = (0, _parsimmon.string)('[');
  var close_bracket = (0, _parsimmon.string)(']');
  var close_qualifier = (0, _parsimmon.string)('/');
  var raw = (0, _parsimmon.regex)(/[^[\n]+/).map(tokenizer('text'));
  var garbage = (0, _parsimmon.regex)(/[\[\] ]/).map(tokenizer('text'));

  var simple_tag = (0, _parsimmon.seq)(name);
  var assignment = (0, _parsimmon.seq)(name, attribute);
  var complex_tag = (0, _parsimmon.seq)(name.skip(_parsimmon.whitespace), assignment.skip(_parsimmon.optWhitespace).many().map(_underscore2['default'].object));
  var tag = complex_tag.or(assignment).or(simple_tag).map(function (_ref3) {
    var _ref32 = _slicedToArray(_ref3, 2);

    var tag = _ref32[0];
    var assignments = _ref32[1];
    return { tag: tag, assignments: assignments };
  });
  var open_tag = open_bracket.then(tag).skip(close_bracket).map(tokenizer('open-tag'));

  var close_tag = open_bracket.then(close_qualifier).then(name).skip(close_bracket).map(tokenizer('close-tag'));

  var text = (0, _parsimmon.alt)(close_tag, open_tag, raw, newline, garbage).many();

  return text.parse(input);
}

function sanitize(lexemes) {
  var _ref4 = arguments.length <= 1 || arguments[1] === undefined ? defaults : arguments[1];

  var _ref4$lineTags = _ref4.lineTags;
  var lineTags = _ref4$lineTags === undefined ? defaults.lineTags : _ref4$lineTags;

  var _lexemes$reduce = lexemes.reduce(function (acc, _ref5) {
    var type = _ref5.type;
    var value = _ref5.value;
    var result = acc.result;
    var sane = acc.sane;
    var tags = acc.tags;

    function close(index, close_value, data) {
      if (index === -1) {
        return _underscore2['default'].extend({}, acc, data);
      } else if (index === 0) {
        return _underscore2['default'].extend({}, acc, {
          result: result.concat([close_value]),
          tags: tags.slice(1)
        });
      } else {
        var _close = tags.slice(0, index + 1);
        return _underscore2['default'].extend({}, acc, {
          result: result.concat(_close.map(function (tag) {
            return { type: 'close-tag', value: tag };
          })),
          tags: tags.slice(index + 1),
          sane: false
        });
      }
    }

    if (type === 'text') {
      return _underscore2['default'].extend({}, acc, { result: result.concat([{
          type: type, value: value
        }]) });
    } else if (type === 'open-tag') {
      return _underscore2['default'].extend({}, acc, {
        result: result.concat([{ type: type, value: value }]),
        tags: [value.tag].concat(tags)
      });
    } else if (type === 'close-tag') {
      return close(tags.indexOf(value), { type: type, value: value }, { sane: false });
    } else if (type === 'newline') {
      return close(_underscore2['default'].findIndex(tags, function (tag) {
        return _underscore2['default'].contains(lineTags, tag);
      }), { type: 'close-tag', value: tags[0] }, { result: result.concat([{ type: 'text', value: value }]) });
    } else {
      throw 'Unsupported lexeme ' + type;
    };
  }, { result: [], sane: true, tags: [] });

  var result = _lexemes$reduce.result;
  var sane = _lexemes$reduce.sane;
  var tags = _lexemes$reduce.tags;

  return { lexemes: result, sane: sane && tags.length === 0, tags: tags };
}

function cst(nodes) {
  function rec(nodes) {
    var rest = nodes,
        acc = [],
        node = undefined;
    while (rest !== void 0 && rest.length > 0) {
      var _rest = rest;

      var _rest2 = _toArray(_rest);

      node = _rest2[0];
      rest = _rest2.slice(1);
      var _node = node;
      var type = _node.type;
      var value = _node.value;

      if (type === 'text') {
        acc.push(node);
      } else if (type === 'open-tag') {
        var result = rec(rest);
        acc.push({ type: 'tag', value: value, children: result.result });
        rest = result.rest;
      } else if (type === 'close-tag') {
        return { result: acc, rest: rest };
      }
    }

    return { result: acc, rest: rest };
  }

  return { type: 'root', children: rec(nodes).result };
}

function transform(cst, rules, unsupported) {
  function convert(text, _ref6) {
    var tag = _ref6.tag;
    var assignments = _ref6.assignments;

    return (rules[tag] || unsupported)(text, tag, assignments);
  }

  function rec(_ref7) {
    var type = _ref7.type;
    var value = _ref7.value;
    var children = _ref7.children;

    if (type === 'text') {
      return value;
    } else if (type === 'tag') {
      return convert(children.reduce(function (s, child) {
        return s + rec(child);
      }, ''), value);
    } else {
      return children.reduce(function (s, child) {
        return s + rec(child);
      }, '');
    }
  }

  return rec(cst);
}

var bbfy = {
  converter: function converter() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? defaults : arguments[0];
    var _config$rules = config.rules;
    var rules = _config$rules === undefined ? defaults.rules : _config$rules;
    var _config$unsupported = config.unsupported;
    var unsupported = _config$unsupported === undefined ? defaults.unsupported : _config$unsupported;

    return function (text) {
      var result = parse(text, config);
      if (!result.status) {
        throw parsimmon.formatError(text, result);
      }
      return transform(cst(sanitize(result.value, config).lexemes), rules, unsupported);
    };
  },
  options: defaults,
  ruleSets: rule_sets,
  api: { parse: parse, transform: transform, sanitize: sanitize, cst: cst }
};

exports['default'] = bbfy;
module.exports = exports['default'];
//# sourceMappingURL=bbfy.js.map
