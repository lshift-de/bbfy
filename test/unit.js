var test = require('tape-catch');
var bbfy = require('../target/bbfy.js');

var data = [
  {
    comment: 'simple string',
    input: 'Hello World!',
    lexed: [{ type: 'text', value: 'Hello World!' }],
    sane: true,
    snippets: [{ text: 'Hello World!', tags: [] }],
    cst: [{ type: 'text', value: 'Hello World!' }],
    recode: 'Hello World!'
  },
  {
    comment: 'simple string with newline',
    input: 'Hello\nWorld!',
    lexed: [{ type: 'text', value: 'Hello\nWorld!' }],
    sane: true,
    snippets: [{ text: 'Hello\nWorld!', tags: [] }],
    cst: [{ type: 'text', value: 'Hello\nWorld!' }],
    recode: 'Hello\nWorld!'
  },
  {
    comment: 'simple string with a tag',
    input: '[b]Hello World![/b]',
    lexed: [
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: true,
    snippets: [{ text: 'Hello World!', tags: ['b'] }],
    cst: [{ type: 'tag', value: 'b', children: [{ type: 'text', value: 'Hello World!' }] }],
    recode: '[b]Hello World![/b]'
  },
  {
    comment: 'simple string with a weird tag',
    input: '[[b]Hello World![/[b]',
    lexed: [
      { type: 'open-tag', value: '[b' },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: '[b' }
    ],
    sane: true,
    snippets: [{ text: 'Hello World!', tags: ['[b'] }],
    cst: [{ type: 'tag', value: '[b', children: [{ type: 'text', value: 'Hello World!' }] }],
    recode: '[[b]Hello World![/[b]'
  },
  {
    comment: 'simple string with a simple tag, double closure',
    input: '[b]]Hello World![/b]]',
    lexed: [
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: ']Hello World!' },
      { type: 'close-tag', value: 'b' },
      { type: 'text', value: ']' }
    ],
    sane: true,
    snippets: [
      { text: ']Hello World!', tags: ['b'] },
      { text: ']', tags: [] }
    ],
    cst: [{ type: 'tag', value: 'b', children: [{ type: 'text', value: ']Hello World!' }] },
          { type: 'text', value: ']' }],
    recode: '[b]]Hello World![/b]]'
  },
  {
    comment: 'simple string with two tags',
    input: '[a][b]Hello World![/b][/a]',
    lexed: [
      { type: 'open-tag', value: 'a' },
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'b' },
      { type: 'close-tag', value: 'a' }
    ],
    sane: true,
    snippets: [{ text: 'Hello World!', tags: ['a', 'b'] }],
    cst: [{ type: 'tag', value: 'a', children: [
      { type: 'tag', value: 'b', children: [{ type: 'text', value: 'Hello World!' }] }
    ] }],
    recode: '[a][b]Hello World![/b][/a]'
  },
  {
    comment: 'simple string with a tag containing whitespace',
    input: '[a b]Hello World![/a b]',
    lexed: [
      { type: 'open-tag', value: 'a b' },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'a b' },
    ],
    sane: true,
    snippets: [{ text: 'Hello World!', tags: ['a b'] }],
    cst: [{ type: 'tag', value: 'a b', children: [{ type: 'text', value: 'Hello World!' }] }],
    recode: '[a b]Hello World![/a b]'
  },
  {
    comment: 'three strings wrapped in common and separate tags',
    input: '[a][b]Foo[/b][c]Bar[/c][d]Baz[/d][/a]',
    lexed: [
      { type: 'open-tag', value: 'a' },
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'Foo' },
      { type: 'close-tag', value: 'b' },
      { type: 'open-tag', value: 'c' },
      { type: 'text', value: 'Bar' },
      { type: 'close-tag', value: 'c' },
      { type: 'open-tag', value: 'd' },
      { type: 'text', value: 'Baz' },
      { type: 'close-tag', value: 'd' },
      { type: 'close-tag', value: 'a' }
    ],
    sane: true,
    snippets: [
      { text: 'Foo', tags: ['a', 'b'] },
      { text: 'Bar', tags: ['a', 'c'] },
      { text: 'Baz', tags: ['a', 'd'] }
    ],
    cst: [{ type: 'tag', value: 'a', children: [
      { type: 'tag', value: 'b', children: [{ type: 'text', value: 'Foo' }] },
      { type: 'tag', value: 'c', children: [{ type: 'text', value: 'Bar' }] },
      { type: 'tag', value: 'd', children: [{ type: 'text', value: 'Baz' }] }
    ] }],
    recode: '[a][b]Foo[/b][c]Bar[/c][d]Baz[/d][/a]'
  },
  {
    comment: 'string wrapped in two tags with wrong closure',
    input: '[a][b]Foo[/a][/b]',
    lexed: [
      { type: 'open-tag', value: 'a' },
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'Foo' },
      { type: 'close-tag', value: 'a' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: false,
    snippets: [
      { text: 'Foo', tags: ['a', 'b'] }
    ],
    cst: [{ type: 'tag', value: 'a', children: [
      { type: 'tag', value: 'b', children: [{ type: 'text', value: 'Foo' }] }
    ] }],
    recode: '[a][b]Foo[/b][/a]'
  }
];

test('basic', function (t) {
  t.plan(1);
  t.ok(bbfy.converter(), 'can create converters');
});

test('lexing', function (t) {
  var lex = bbfy.api.lex;
  t.plan(2 * data.length);
  data.forEach(function (item) {
    var result = lex(item.input);
    t.ok(result.status, 'lexing ' + item.comment);
    t.deepEqual(result.value, item.lexed, 'lexing content of ' + item.comment);
  });
});

test('parsing', function (t) {
  var parse = bbfy.api.parse;
  t.plan(2 * data.length);
  data.forEach(function (item) {
    var result = parse(item.lexed);
    t.equal(result.sane, item.sane, 'sanity check of ' + item.comment);
    t.deepEqual(result.snippets, item.snippets, 'parsing content of ' + item.comment);
  });
});

test('cst', function (t) {
  var cst = bbfy.api.cst;
  t.plan(data.length);
  data.forEach(function (item) {
    t.deepEqual(cst(item.snippets).children, item.cst, 'syntrax tree of ' + item.comment);
  });
});

test('transform: recode', function (t) {
  var convert = bbfy.converter({
    rules: bbfy.ruleSets.strip,
    unsupported: function (text, tag) {
      return '[' + tag + ']' + text + '[/' + tag + ']';
    }
  });
  t.plan(data.length);
  data.forEach(function (item) {
    t.equal(convert(item.input), item.recode, 'transforming (recode) ' + item.comment);
  });
});
