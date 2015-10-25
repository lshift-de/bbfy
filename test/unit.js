'use strict';

var test = require('tape-catch');
var bbfy = require('../target/bbfy.js');

var tag = function (tag, assignments) {
  return { tag: tag, assignments: assignments };
};

var cst = function (data) {
  return { type: 'root', children: data };
};

var data = [
  {
    comment: 'simple string',
    input: 'Hello World!',
    parsed: [{ type: 'text', value: 'Hello World!' }],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: [] }],
    cst: cst([{ type: 'text', value: 'Hello World!' }]),
    recode: 'Hello World!'
  },

  {
    comment: 'simple string with newline',
    input: 'Hello\nWorld!',
    parsed: [
      { type: 'text', value: 'Hello' },
      { type: 'newline', value: '\n' },
      { type: 'text', value: 'World!' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: 'Hello', tags: [] },
      { type: 'text', value: '\n', tags: [] },
      { type: 'text', value: 'World!', tags: [] }
    ],
    cst: cst([{ type: 'text', value: 'Hello\nWorld!' }]),
    recode: 'Hello\nWorld!'
  },

  {
    comment: 'simple string with a tag',
    input: '[b]Hello World![/b]',
    parsed: [
      { type: 'open-tag', value: tag('b') },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: [tag('b')] }],
    cst: cst([{ type: 'tag', value: tag('b'), children: [{ type: 'text', value: 'Hello World!' }] }]),
    recode: '[b]Hello World![/b]'
  },

  {
    comment: 'simple string with a weird tag',
    input: '[[b]Hello World![/[b]',
    parsed: [
      { type: 'open-tag', value: tag('[b') },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: '[b' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: [tag('[b')] }],
    cst: cst([{ type: 'tag', value: tag('[b'), children: [{ type: 'text', value: 'Hello World!' }] }]),
    recode: '[[b]Hello World![/[b]'
  },

  {
    comment: 'simple string with a simple tag, double closure',
    input: '[b]]Hello World![/b]]',
    parsed: [
      { type: 'open-tag', value: tag('b') },
      { type: 'text', value: ']Hello World!' },
      { type: 'close-tag', value: 'b' },
      { type: 'text', value: ']' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: ']Hello World!', tags: [tag('b')] },
      { type: 'text', value: ']', tags: [] }
    ],
    cst: cst([{ type: 'tag', value: tag('b'), children: [{ type: 'text', value: ']Hello World!' }] },
              { type: 'text', value: ']' }]),
    recode: '[b]]Hello World![/b]]'
  },

  {
    comment: 'simple string with two tags',
    input: '[a][b]Hello World![/b][/a]',
    parsed: [
      { type: 'open-tag', value: tag('a') },
      { type: 'open-tag', value: tag('b') },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'b' },
      { type: 'close-tag', value: 'a' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: [
      tag('a'),
      tag('b')
    ] }],
    cst: cst([{ type: 'tag', value: tag('a'), children: [
      { type: 'tag', value: tag('b'), children: [{ type: 'text', value: 'Hello World!' }] }
    ] }]),
    recode: '[a][b]Hello World![/b][/a]'
  },

  {
    comment: 'simple string with a broken tag containing whitespace',
    input: '[a b]Hello World![/a b]',
    parsed: [
      { type: 'text', value: '[' },
      { type: 'text', value: 'a b]Hello World!' },
      { type: 'text', value: '[' },
      { type: 'text', value: '/a b]' },
    ],
    sane: true,
    snippets: [
      { type: 'text', value: '[', tags: [] },
      { type: 'text', value: 'a b]Hello World!', tags: [] },
      { type: 'text', value: '[', tags: [] },
      { type: 'text', value: '/a b]', tags: [] }
    ],
    cst: cst([{ type: 'text', value: '[a b]Hello World![/a b]' }]),
    recode: '[a b]Hello World![/a b]'
  },

  {
    comment: 'three strings wrapped in common and separate tags',
    input: '[a][b]Foo[/b][c]Bar[/c][d]Baz[/d][/a]',
    parsed: [
      { type: 'open-tag', value: tag('a') },
      { type: 'open-tag', value: tag('b') },
      { type: 'text', value: 'Foo' },
      { type: 'close-tag', value: 'b' },
      { type: 'open-tag', value: tag('c') },
      { type: 'text', value: 'Bar' },
      { type: 'close-tag', value: 'c' },
      { type: 'open-tag', value: tag('d') },
      { type: 'text', value: 'Baz' },
      { type: 'close-tag', value: 'd' },
      { type: 'close-tag', value: 'a' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: 'Foo', tags: [tag('a'), tag('b')] },
      { type: 'text', value: 'Bar', tags: [tag('a'), tag('c')] },
      { type: 'text', value: 'Baz', tags: [tag('a'), tag('d')] }
    ],
    cst: cst([
      { type: 'tag', value: tag('a'), children: [
        { type: 'tag', value: tag('b'), children: [{ type: 'text', value: 'Foo' }] },
        { type: 'tag', value: tag('c'), children: [{ type: 'text', value: 'Bar' }] },
        { type: 'tag', value: tag('d'), children: [{ type: 'text', value: 'Baz' }] }
      ] }
    ]),
    recode: '[a][b]Foo[/b][c]Bar[/c][d]Baz[/d][/a]'
  },

  {
    comment: 'string wrapped in two tags with wrong closure',
    input: '[a][b]Foo[/a][/b]',
    parsed: [
      { type: 'open-tag', value: tag('a') },
      { type: 'open-tag', value: tag('b') },
      { type: 'text', value: 'Foo' },
      { type: 'close-tag', value: 'a' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: false,
    snippets: [
      { type: 'text', value: 'Foo', tags: [tag('a'), tag('b')] }
    ],
    cst: cst([{ type: 'tag', value: tag('a'), children: [
      { type: 'tag', value: tag('b'), children: [{ type: 'text', value: 'Foo' }] }
    ] }]),
    recode: '[a][b]Foo[/b][/a]'
  },

  {
    comment: 'list item',
    input: '[*] Hello World!\n',
    parsed: [
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' Hello World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: ' Hello World!', tags: [tag('*')] },
      { type: 'close', value: '\n', tags: [tag('*')] }
    ],
    cst: cst([{ type: 'tag', value: tag('*'), children: [{ type: 'text', value: ' Hello World!' }] }]),
    recode: '[*] Hello World!\n'
  },

  {
    comment: 'two messed up tag closures',
    input: '[a]Hello [b]cruel[/a] World![/b]',
    parsed: [
      { type: 'open-tag', value: tag('a') },
      { type: 'text', value: 'Hello ' },
      { type: 'open-tag', value: tag('b') },
      { type: 'text', value: 'cruel' },
      { type: 'close-tag', value: 'a' },
      { type: 'text', value: ' World!' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: false,
    snippets: [
      { type: 'text', value: 'Hello ', tags: [tag('a')] },
      { type: 'text', value: 'cruel', tags: [tag('a'), tag('b')] },
      { type: 'text', value: ' World!', tags: [tag('b')] }
    ],
    cst: cst([
      { type: 'tag', value: tag('a'), children: [
        { type: 'text', value: 'Hello ' },
        { type: 'tag', value: tag('b'), children: [ { type: 'text', value: 'cruel' } ] }
      ] },
      { type: 'tag', value: tag('b'), children: [ { type: 'text', value: ' World!' } ] }
    ]),
    recode: '[a]Hello [b]cruel[/b][/a][b] World![/b]'
  },

  {
    comment: 'messed up tag closure within list items',
    input: '[*] [a]Hello\n[*] cruel[/a]\n[*] World!\n',
    parsed: [
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' ' },
      { type: 'open-tag', value: tag('a') },
      { type: 'text', value: 'Hello' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' cruel' },
      { type: 'close-tag', value: 'a' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: false,
    snippets: [
      { type: 'text', value: ' ', tags: [tag('*')] },
      { type: 'text', value: 'Hello', tags: [tag('*'), tag('a')] },
      { type: 'close', value: '\n', tags: [tag('*'), tag('a')] },
      { type: 'text', value: ' cruel', tags: [tag('a'), tag('*')] },
      { type: 'close', value: '\n', tags: [tag('*')] },
      { type: 'text', value: ' World!', tags: [tag('*')] },
      { type: 'close', value: '\n', tags: [tag('*')] }
    ],
    cst: cst([
      { type: 'tag', value: tag('*'), children: [
        { type: 'text', value: ' ' },
        { type: 'tag', value: tag('a'), children: [{ type: 'text', value: 'Hello' }] }
      ] },
      { type: 'tag', value: tag('*'), children: [
        { type: 'tag', value: tag('a'), children: [{ type: 'text', value: ' cruel' }] }
      ] },
      { type: 'tag', value: tag('*'), children: [
        { type: 'text', value: ' World!' }
      ] }
    ]),
    recode: '[*] [a]Hello[/a]\n[*][a] cruel[/a]\n[*] World!\n'
  },

  {
    comment: 'messed up tag closure starting outside list items',
    input: '[a][*] Hello\n[*] cruel[/a]\n[*] World!\n',
    parsed: [
      { type: 'open-tag', value: tag('a') },
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' Hello' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' cruel' },
      { type: 'close-tag', value: 'a' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: false,
    snippets: [
      { type: 'text', value: ' Hello', tags: [tag('a'), tag('*')] },
      { type: 'close', value: '\n', tags: [tag('a'), tag('*')] },
      { type: 'text', value: ' cruel', tags: [tag('a'), tag('*')] },
      { type: 'close', value: '\n', tags: [tag('*')] },
      { type: 'text', value: ' World!', tags: [tag('*')] },
      { type: 'close', value: '\n', tags: [tag('*')] }
    ],
    cst: cst([
      { type: 'tag', value: tag('*'), children: [
        { type: 'tag', value: tag('a'), children: [{ type: 'text', value: ' Hello' }] }
      ] },
      { type: 'tag', value: tag('*'), children: [
        { type: 'tag', value: tag('a'), children: [{ type: 'text', value: ' cruel' }] }
      ] },
      { type: 'tag', value: tag('*'), children: [
        { type: 'text', value: ' World!' }
      ] }
    ]),
    recode: '[*][a] Hello[/a]\n[*][a] cruel[/a]\n[*] World!\n'
  },

  {
    comment: 'identical tag merger',
    input: '[a]Hello[/a][a] World![/a]',
    parsed: [
      { type: 'open-tag', value: tag('a') },
      { type: 'text', value: 'Hello' },
      { type: 'close-tag', value: 'a' },
      { type: 'open-tag', value: tag('a') },
      { type: 'text', value: ' World!' },
      { type: 'close-tag', value: 'a' }     
    ],
    sane: true,
    snippets: [
      { type: 'text', value: 'Hello', tags: [tag('a')] },
      { type: 'text', value: ' World!', tags: [tag('a')] }
    ],
    cst: cst([{ type: 'tag', value: tag('a'), children: [{ type: 'text', value: 'Hello World!' }] }]),
    recode: '[a]Hello World![/a]'
  },

  {
    comment: 'identical line tag non-merger',
    input: '[*] Hello\n[*] World!\n',
    parsed: [
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' Hello' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: tag('*') },
      { type: 'text', value: ' World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: ' Hello', tags: [tag('*')] },
      { type: 'close', value: '\n', tags: [tag('*')] },
      { type: 'text', value: ' World!', tags: [tag('*')] },
      { type: 'close', value: '\n', tags: [tag('*')] }
    ],
    cst: cst([
      { type: 'tag', value: tag('*'), children: [{ type: 'text', value: ' Hello' }] },
      { type: 'tag', value: tag('*'), children: [{ type: 'text', value: ' World!' }] }
    ]),
    recode: '[*] Hello\n[*] World!\n'
  },

  {
    comment: 'simple attribute',
    input: '[a=foo]bar[/a]',
    parsed: [
      { type: 'open-tag', value: tag('a', 'foo') },
      { type: 'text', value: 'bar' },
      { type: 'close-tag', value: 'a' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'bar', tags: [tag('a', 'foo')] }],
    cst: cst([
      { type: 'tag', value: tag('a', 'foo'), children: [
        { type: 'text', value: 'bar' }
      ] }
    ]),
    recode: '[a=foo]bar[/a]'
  },

  {
    comment: 'complex attribute',
    input: '[a foo=bar baz=bop]Hello World![/a]',
    parsed: [
      { type: 'open-tag', value: tag('a', { foo: 'bar', baz: 'bop'}) },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'a' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: [tag('a', { foo: 'bar', baz: 'bop'})] }],
    cst: cst([
      { type: 'tag', value: tag('a', { foo: 'bar', baz: 'bop'}), children: [
        { type: 'text', value: 'Hello World!' }
      ] }
    ]),
    recode: '[a foo=bar baz=bop]Hello World![/a]'
  },
  // {
  //   comment: '...',
  //   input: '...',
  //   parsed: [{ type: '...', value: '...' }],
  //   sane: true,
  //   snippets: [{ type: 'text', value: '...', tags: ['...'] }],
  //   cst: [{ type: '...', value: '...' }],
  //   recode: '...'
  // },
];

test('basic', function (t) {
  t.plan(1);
  t.ok(bbfy.converter(), 'can create converters');
});

data.forEach(function (item) {
  test(item.comment, function (t) {
    var api = bbfy.api,
        parse = api.parse,
        sanitize = api.sanitize,
        cst = api.cst,
        transform = api.transform;
    var result;
    var rules = bbfy.ruleSets.strip;
    var unsupported = function (text, tag, assignment) {
      if (tag === '*') {
        return '[' + tag + ']' + text + '\n';
      }
      else if (assignment === void 0) {
        return '[' + tag + ']' + text + '[/' + tag + ']';
      }
      else if (typeof assignment === 'string') {
        return '[' + tag + '=' + assignment + ']' + text + '[/' + tag + ']';
      }
      else {
        var keyvals = [tag].concat(Object.keys(assignment).map(function (key) {
          return key + '=' + assignment[key];
        })).join(' ');
        return '[' + keyvals + ']' + text + '[/' + tag + ']';
      }
    };
    
    var convert = bbfy.converter({
      rules: bbfy.ruleSets.strip,
      unsupported: unsupported
    });

    t.plan(7);

    result = parse(item.input);
    t.ok(result.status, 'parsing');
    t.deepEqual(result.value, item.parsed, 'parsing content');

    result = sanitize(item.parsed);
    t.equal(result.sane, item.sane, 'sanity check');
    t.deepEqual(result.snippets, item.snippets, 'sanitizing content');

    t.deepEqual(cst(item.snippets), item.cst, 'syntrax tree');
    t.equal(transform(item.cst, rules, unsupported), item.recode, 'transforming (recode)');
    t.equal(convert(item.input), item.recode, 'top-down conversion (recode)');
  });
});
