/* -*- mode: js2; -*- */
'use strict'; // Not required in ES6, but will appear in generated ES5 code

// import { regex, string, alt } from 'parsimmon';
const { regex, string, alt } = parsimmon;
const _ = underscore;

const rule_sets = {
  strip: {},
  html: {
    b (text) { return `<b>${text}</b>`; }
  }
};

const defaults = {
  rules: rule_sets.html,
  unsupported (text) { return text; }
};

function lex (input) {
  const newline = string('\n').map((s) => ({ type: 'newline', value: s }));
  const tag_name = regex(/[^\]]+/);
  const open_bracket = string('[');
  const close_bracket = string(']');
  const close_qualifier = string('/');

  const open_tag = open_bracket
          .then(tag_name)
          .skip(close_bracket)
          .map((tag) => ({ type: 'open-tag', value: tag }));
  const close_tag = open_bracket
          .then(close_qualifier)
          .then(tag_name)
          .skip(close_bracket)
          .map((tag) => ({ type: 'close-tag', value: tag }));

  const raw = regex(/[^[\n]+/).map((text) => ({ type: 'text', value: text }));
  const text = alt(close_tag, open_tag, raw, newline).many();

  return text.parse(input);
}

function sanitize (lexemes) {
  const { tags, snippets, sane } = lexemes.reduce((acc, { type, value }) => {
    const { tags, snippets, sane } = acc;

    function add_text (text) {
      return _.extend({}, acc, { snippets: snippets.concat([{
        text: text, tags: _.uniq(tags).reverse()
      }]) });
    }

    function close_tag (index) {
      return _.extend({}, acc, {
        tags: tags.slice(0, index).concat(tags.slice(index + 1)),
        sane: sane && (index === 0)
      });
    }
    
    if (type === 'text') {
      return add_text(value);
    }
    else if (type === 'open-tag') {
      return _.extend({}, acc, { tags: [value].concat(tags) });
    }
    else if (type === 'close-tag') {
      const index = tags.indexOf(value);
      return (index === -1) ? _.extend({}, acc, { sane: false }) : close_tag(index);
    }
    else if (type === 'newline') {
      const index = tags.indexOf('*');
      return (index === -1) ? add_text(value) : close_tag(index);
    }
    else { throw 'Unsupported lexeme'; }
  }, { tags: [], snippets: [], sane: true });

  return { snippets: snippets, sane: sane && tags.length === 0 };
}

function parse (snippets) {
  function node (tag, snippets) {
    return (tag === void 0)
      ? { type: 'text', value: _.pluck(snippets, 'text').join('') }
      : { type: 'tag', value: tag, children: rec(snippets) };
  }

  function rec (snippets) {
    const { acc, result, tag } = snippets.reduce(({ acc, tag, result }, { text, tags }) => {
      const [next_tag, ...rest] = tags;
      
      return (tag === next_tag || tag === '*')
        ? { tag: tag, acc: acc.concat([{ text: text, tags: rest }]), result: result }
        : { tag: next_tag, acc: [{ text: text, tags: rest }], result: result.concat([node(tag, acc)]) };
    }, { acc: [], result: [], tag: snippets[0].tags[0] });

    return result.concat([node(tag, acc)]);
  }

  return { type: 'root', children: rec(snippets) };
}

function transform (cst, rules, unsupported) {
  function convert (text, tag) {
    return (rules[tag] || unsupported)(text, tag);
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

const Bbfy = {
  converter ({ rules = defaults.rules, unsupported = defaults.unsupported } = defaults) {
    return (text) => {
      const result = lex(text);
      if (!result.status) { throw parsimmon.formatError(text, result); }
      return transform(parse(sanitize(result.value).snippets), rules, unsupported);
    };
  },
  options: defaults,
  ruleSets: rule_sets,
  api: { lex: lex, parse: parse, transform: transform, sanitize: sanitize }
}
