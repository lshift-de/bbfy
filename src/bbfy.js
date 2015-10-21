/* -*- mode: js2; -*- */
'use strict'; // Not required in ES6, but will appear in generated ES5 code

// import { regex, string, alt } from 'parsimmon';
const { regex, string, alt, seq, whitespace, optWhitespace, fail, lazy } = parsimmon;
const _ = underscore;

const rule_sets = {
  strip: {},
  html: {
    b (text) { return `<b>${text}</b>`; }
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
  const { tags, snippets, sane } = lexemes.reduce((acc, { type, value, children }) => {
    const { tags, snippets, sane } = acc;
    const tag_names = _.pluck(tags, 'tag');

    function add_item (acc, type, value) {
      return _.extend({}, acc, { snippets: snippets.concat([{
        type: type, value: value, tags: _.uniq(tags).reverse()
      }]) });
    }

    function close_tag (acc, index) {
      return _.extend({}, acc, {
        tags: tags.slice(0, index).concat(tags.slice(index + 1)),
        sane: sane && (index === 0)
      });
    }

    if (type === 'text') {
      return add_item(acc, 'text', value);
    }
    else if (type === 'open-tag') {
      return _.extend({}, acc, { tags: [value].concat(tags) });
    }
    else if (type === 'close-tag') {
      const index = tag_names.indexOf(value);
      return (index === -1) ? _.extend({}, acc, { sane: false }) : close_tag(acc, index);
    }
    else if (type === 'newline') {
      const index = _.findIndex(tag_names, (tag) => _.contains(lineTags, tag));
      return (index === -1)
        ? add_item(acc, 'text', value)
        : add_item(close_tag(acc, index), 'close', value);
    }
    else { throw 'Unsupported lexeme ' + type; }
  }, { tags: [], snippets: [], sane: true });

  return { snippets: snippets, sane: sane && tags.length === 0, tags: tags };
}

function cst (snippets, { lineTags = defaults.lineTags } = defaults) {
  function node (tag, snippets) {
    return (tag === void 0)
      ? { type: 'text', value: _.pluck(snippets, 'value').join('') }
      : { type: 'tag', value: tag, children: rec(snippets) };
  }

  function rec (snippets) {
    function sort_tags (tags) {
      return _.sortBy(tags, (tag) => _.contains(lineTags, tag.tag) ? 0 : 1);
    }
    
    if (snippets.length === 0) { return []; }
    const start_tag = sort_tags(snippets[0].tags)[0];
    
    const { acc, result, tag } = snippets.reduce(({ acc, tag, result }, { type, value, tags }) => {
      const [next_tag, ...rest] = sort_tags(tags);

      if (type === 'close') {
        return { tag: next_tag, acc: [], result: result.concat([node(tag, acc)]) };
      }
      else if (acc.length === 0 || _.isEqual(tag, next_tag)) {
        return { tag: tag, acc: acc.concat([{ type: 'text', value: value, tags: rest }]), result: result };
      }
      else {
        return { tag: next_tag, acc: [{ type: 'text', value: value, tags: rest }], result: result.concat([node(tag, acc)]) };
      }
    }, { acc: [], result: [], tag: start_tag });

    return acc.length > 0 ? result.concat([node(tag, acc)]) : result;
  }

  return { type: 'root', children: rec(snippets) };
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

const Bbfy = {
  converter (config = defaults) {
    const { rules = defaults.rules, unsupported = defaults.unsupported } = config;
    return (text) => {
      const result = parse(text, config);
      if (!result.status) { throw parsimmon.formatError(text, result); }
      return transform(cst(sanitize(result.value, config).snippets), rules, unsupported);
    };
  },
  options: defaults,
  ruleSets: rule_sets,
  api: { parse: parse, transform: transform, sanitize: sanitize, cst: cst }
}
