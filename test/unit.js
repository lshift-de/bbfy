var test = require('tape-catch');
var bbfy = require('../target/bbfy.js');

var data = [
  {
    comment: 'simple string',
    input: 'Hello World!',
    parsed: [{ type: 'text', value: 'Hello World!' }],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: [] }],
    cst: [{ type: 'text', value: 'Hello World!' }],
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
    cst: [{ type: 'text', value: 'Hello\nWorld!' }],
    recode: 'Hello\nWorld!'
  },
  {
    comment: 'simple string with a tag',
    input: '[b]Hello World![/b]',
    parsed: [
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: ['b'] }],
    cst: [{ type: 'tag', value: 'b', children: [{ type: 'text', value: 'Hello World!' }] }],
    recode: '[b]Hello World![/b]'
  },
  {
    comment: 'simple string with a weird tag',
    input: '[[b]Hello World![/[b]',
    parsed: [
      { type: 'open-tag', value: '[b' },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: '[b' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: ['[b'] }],
    cst: [{ type: 'tag', value: '[b', children: [{ type: 'text', value: 'Hello World!' }] }],
    recode: '[[b]Hello World![/[b]'
  },
  {
    comment: 'simple string with a simple tag, double closure',
    input: '[b]]Hello World![/b]]',
    parsed: [
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: ']Hello World!' },
      { type: 'close-tag', value: 'b' },
      { type: 'text', value: ']' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: ']Hello World!', tags: ['b'] },
      { type: 'text', value: ']', tags: [] }
    ],
    cst: [{ type: 'tag', value: 'b', children: [{ type: 'text', value: ']Hello World!' }] },
          { type: 'text', value: ']' }],
    recode: '[b]]Hello World![/b]]'
  },
  {
    comment: 'simple string with two tags',
    input: '[a][b]Hello World![/b][/a]',
    parsed: [
      { type: 'open-tag', value: 'a' },
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'Hello World!' },
      { type: 'close-tag', value: 'b' },
      { type: 'close-tag', value: 'a' }
    ],
    sane: true,
    snippets: [{ type: 'text', value: 'Hello World!', tags: ['a', 'b'] }],
    cst: [{ type: 'tag', value: 'a', children: [
      { type: 'tag', value: 'b', children: [{ type: 'text', value: 'Hello World!' }] }
    ] }],
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
    cst: [{ type: 'text', value: '[a b]Hello World![/a b]' }],
    recode: '[a b]Hello World![/a b]'
  },
  {
    comment: 'three strings wrapped in common and separate tags',
    input: '[a][b]Foo[/b][c]Bar[/c][d]Baz[/d][/a]',
    parsed: [
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
      { type: 'text', value: 'Foo', tags: ['a', 'b'] },
      { type: 'text', value: 'Bar', tags: ['a', 'c'] },
      { type: 'text', value: 'Baz', tags: ['a', 'd'] }
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
    parsed: [
      { type: 'open-tag', value: 'a' },
      { type: 'open-tag', value: 'b' },
      { type: 'text', value: 'Foo' },
      { type: 'close-tag', value: 'a' },
      { type: 'close-tag', value: 'b' }
    ],
    sane: false,
    snippets: [
      { type: 'text', value: 'Foo', tags: ['a', 'b'] }
    ],
    cst: [{ type: 'tag', value: 'a', children: [
      { type: 'tag', value: 'b', children: [{ type: 'text', value: 'Foo' }] }
    ] }],
    recode: '[a][b]Foo[/b][/a]'
  },
  {
    comment: 'list item',
    input: '[*] Hello World!\n',
    parsed: [
      { type: 'open-tag', value: '*' },
      { type: 'text', value: ' Hello World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: ' Hello World!', tags: ['*'] },
      { type: 'close', value: '\n', tags: ['*'] }
    ],
    cst: [{ type: 'tag', value: '*', children: [{ type: 'text', value: ' Hello World!' }] }],
    recode: '[*] Hello World!\n'
  },
  {
    comment: 'two messed up tag closures',
    input: '[a]Hello [b]cruel[/a] World![/b]',
    parsed: [
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
      { type: 'text', value: 'Hello ', tags: ['a'] },
      { type: 'text', value: 'cruel', tags: ['a', 'b'] },
      { type: 'text', value: ' World!', tags: ['b'] }
    ],
    cst: [
      { type: 'tag', value: 'a', children: [
        { type: 'text', value: 'Hello ' },
        { type: 'tag', value: 'b', children: [ { type: 'text', value: 'cruel' } ] }
      ] },
      { type: 'tag', value: 'b', children: [ { type: 'text', value: ' World!' } ] }
    ],
    recode: '[a]Hello [b]cruel[/b][/a][b] World![/b]'
  },
  {
    comment: 'messed up tag closure within list items',
    input: '[*] [a]Hello\n[*] cruel[/a]\n[*] World!\n',
    parsed: [
      { type: 'open-tag', value: '*' },
      { type: 'text', value: ' ' },
      { type: 'open-tag', value: 'a' },
      { type: 'text', value: 'Hello' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: '*' },
      { type: 'text', value: ' cruel' },
      { type: 'close-tag', value: 'a' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: '*' },
      { type: 'text', value: ' World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: false,
    snippets: [
      { type: 'text', value: ' ', tags: ['*'] },
      { type: 'text', value: 'Hello', tags: ['*', 'a'] },
      { type: 'close', value: '\n', tags: ['*', 'a'] },
      { type: 'text', value: ' cruel', tags: ['a', '*'] },
      { type: 'close', value: '\n', tags: ['*'] },
      { type: 'text', value: ' World!', tags: ['*'] },
      { type: 'close', value: '\n', tags: ['*'] }
    ],
    cst: [
      { type: 'tag', value: '*', children: [
        { type: 'text', value: ' ' },
        { type: 'tag', value: 'a', children: [{ type: 'text', value: 'Hello' }] }
      ] },
      { type: 'tag', value: '*', children: [
        { type: 'tag', value: 'a', children: [{ type: 'text', value: ' cruel' }] }
      ] },
      { type: 'tag', value: '*', children: [
        { type: 'text', value: ' World!' }
      ] }
    ],
    recode: '[*] [a]Hello[/a]\n[*][a] cruel[/a]\n[*] World!\n'
  },
  {
    comment: 'identical tag merger',
    input: '[a]Hello[/a][a] World![/a]',
    parsed: [
      { type: 'open-tag', value: 'a' },
      { type: 'text', value: 'Hello' },
      { type: 'close-tag', value: 'a' },
      { type: 'open-tag', value: 'a' },
      { type: 'text', value: ' World!' },
      { type: 'close-tag', value: 'a' }     
    ],
    sane: true,
    snippets: [
      { type: 'text', value: 'Hello', tags: ['a'] },
      { type: 'text', value: ' World!', tags: ['a'] }
    ],
    cst: [{ type: 'tag', value: 'a', children: [{ type: 'text', value: 'Hello World!' }] }],
    recode: '[a]Hello World![/a]'
  },
  {
    comment: 'identical line tag non-merger',
    input: '[*] Hello\n[*] World!\n',
    parsed: [
      { type: 'open-tag', value: '*' },
      { type: 'text', value: ' Hello' },
      { type: 'newline', value: '\n' },
      { type: 'open-tag', value: '*' },
      { type: 'text', value: ' World!' },
      { type: 'newline', value: '\n' }
    ],
    sane: true,
    snippets: [
      { type: 'text', value: ' Hello', tags: ['*'] },
      { type: 'close', value: '\n', tags: ['*'] },
      { type: 'text', value: ' World!', tags: ['*'] },
      { type: 'close', value: '\n', tags: ['*'] }
    ],
    cst: [
      { type: 'tag', value: '*', children: [{ type: 'text', value: ' Hello' }] },
      { type: 'tag', value: '*', children: [{ type: 'text', value: ' World!' }] }
    ],
    recode: '[*] Hello\n[*] World!\n'
  },
  // {
  //   comment: 'simple attribute',
  //   input: '[a=foo]bar[/a]',
  //   parsed: [
  //     { type: 'open-tag', value: ['a', 'foo'] },
  //     { type: 'text', value: 'bar' },
  //     { type: 'close-tag', value: 'a' }
  //   ],
  //   sane: true,
  //   snippets: [
  //     { type: 'text', value: '...', tags: ['...'] }
  //   ],
  //   cst: [
  //     { type: '...', value: '...' }
  //   ],
  //   recode: '[a=foo]bar[/a]'
  // }
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
        cst = api.cst;
    var result;
    var convert = bbfy.converter({
      rules: bbfy.ruleSets.strip,
      unsupported: function (text, tag) {
        return tag === '*'
          ? '[' + tag + ']' + text + '\n'
          : '[' + tag + ']' + text + '[/' + tag + ']';
      }
    });

    t.plan(6);

    result = parse(item.input);
    t.ok(result.status, 'parsing');
    t.deepEqual(result.value, item.parsed, 'parsing content');

    result = sanitize(item.parsed);
    t.equal(result.sane, item.sane, 'sanity check');
    t.deepEqual(result.snippets, item.snippets, 'sanitizing content');

    t.deepEqual(cst(item.snippets).children, item.cst, 'syntrax tree');
    t.equal(convert(item.input), item.recode, 'transforming (recode)');
  });
});
