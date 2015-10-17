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
    lexed: [
      { type: 'text', value: 'Hello' },
      { type: 'newline', value: '\n' },
      { type: 'text', value: 'World!' }
    ],
    sane: true,
    snippets: [
      { text: 'Hello', tags: [] },
      { text: '\n', tags: [] },
      { text: 'World!', tags: [] }
    ],
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
  },
  {
    comment: 'list item',
    input: '[*] Hello World!\n',
    lexed: [
      { type: 'list-tag', value: '*' },
      { type: 'text', value: ' Hello World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: true,
    snippets: [{ text: ' Hello World!', tags: ['*'] }],
    cst: [{ type: 'tag', value: '*', children: [{ type: 'text', value: ' Hello World!' }] }],
    recode: '[*] Hello World!\n'
  },
  {
    comment: 'two messed up tag closures',
    input: '[a]Hello [b]cruel[/a] World![/b]',
    lexed: [
      { type: 'open-tag', value: 'a' },
      { type: 'text', value: 'Hello ' },
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'cruel' },
      { type: 'close-tag', value: 'a' },
      { type: 'text', value: ' World!' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: false,
    snippets: [
      { text: 'Hello ', tags: ['a'] },
      { text: 'cruel', tags: ['a', 'b'] },
      { text: ' World!', tags: ['b'] }
    ],
    cst:
    [
      { type: 'tag', value: 'a', children: [
        { type: 'text', value: 'Hello ' },
        { type: 'tag', value: 'b', children: [ { type: 'text', value: 'cruel' } ] }
      ] },
      { type: 'tag', value: 'b', children: [ { type: 'text', value: ' World!' } ] }
    ],
    recode: '[a]Hello [b]cruel[/b][/a][b] World![/b]'
  },
  // {
  //   comment: '...',
  //   input: '...',
  //   lexed: [{ type: '...', value: '...' }],
  //   sane: true,
  //   snippets: [{ text: '...', tags: ['...'] }],
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
    t.plan(6);

    var api = bbfy.api,
        lex = api.lex,
        parse = api.parse,
        sanitize = api.sanitize;
    var result;
    var convert = bbfy.converter({
      rules: bbfy.ruleSets.strip,
      unsupported: function (text, tag) {
        return tag === '*'
          ? '[' + tag + ']' + text + '\n'
          : '[' + tag + ']' + text + '[/' + tag + ']';
      }
    });

    result = lex(item.input);
    t.ok(result.status, 'lexing');
    t.deepEqual(result.value, item.lexed, 'lexing content');

    result = sanitize(item.lexed);  
    t.equal(result.sane, item.sane, 'sanity check');
    t.deepEqual(result.snippets, item.snippets, 'sanitizing content');

    t.deepEqual(parse(item.snippets).children, item.cst, 'syntrax tree');
    t.equal(convert(item.input), item.recode, 'transforming (recode)');
  });
});
