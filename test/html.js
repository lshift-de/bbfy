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

'use strict';

var test = require('tape-catch');
var bbfy = require('../target/bbfy.js');

var data = [
  ['bold tag', '[b]Hello World![/b]', '<b>Hello World!</b>'],
  ['italic tag', '[i]Hello World![/i]', '<i>Hello World!</i>'],
  ['underscore tag', '[u]Hello World![/u]', '<u>Hello World!</u>'],
  ['strikethrough tag', '[s]Hello World![/s]', '<s>Hello World!</s>'],
  ['empty color', '[color]Hello World![/color]', 'Hello World!'],
  ['some named color', '[color=blue]Hello World![/color]', '<span style="color: blue;">Hello World!</span>'],
  ['some rgb color (digits)', '[color=#123456]Hello World![/color]', '<span style="color: #123456;">Hello World!</span>'],
  ['some rgb color (mixed)', '[color=#1a2B3c]Hello World![/color]', '<span style="color: #1a2b3c;">Hello World!</span>'],
  ['some invalid color', '[color=!!!]Hello World![/color]', 'Hello World!'],
  ['empty font', '[font]Hello World![/font]', 'Hello World!'],
  ['some font', '[font=sans]Hello World![/font]', '<span style="font-family: sans;">Hello World!</span>'],
  ['empty size', '[size]Hello World![/size]', 'Hello World!'],
  ['some size', '[size=100]Hello World![/size]', '<span style="font-size: 100px;">Hello World!</span>'],
  ['empty URL', '[url]Hello World![/url]', 'Hello World!'],
  ['invalid URL', '[url=foobar]Hello World![/url]', 'Hello World!'],
  ['valid URL', '[url=http://lshift.de/]Hello World![/url]', '<a href="http://lshift.de/">Hello World!</a>'],
  ['valid URL(`//` start)', '[url=//lshift.de/]Hello World![/url]', '<a href="//lshift.de/">Hello World!</a>'],
  ['invalid img', '[img]foobar[/img]', ''],
  ['valid img', '[img]http://foobar.com[/img]', '<img src="http://foobar.com"/>'],
  ['valid img(`//` start)', '[img]//foobar.com[/img]', '<img src="//foobar.com"/>'],
  ['valid img, invalid string size', '[img=foo]http://foobar.com[/img]', '<img src="http://foobar.com"/>'],
  ['valid img, invalid string size 2', '[img=fooxbar]http://foobar.com[/img]', '<img src="http://foobar.com"/>'],
  ['valid img, valid string size', '[img=100x200]http://foobar.com[/img]', '<img src="http://foobar.com" width="100" height="200"/>'],
  ['valid img, invalid size attributes', '[img width=foo height=bar]http://foobar.com[/img]', '<img src="http://foobar.com"/>'],
  ['valid img, valid size attributes', '[img width=100 height=200]http://foobar.com[/img]', '<img src="http://foobar.com" width="100" height="200"/>']
];

test('conversions', function (t) {
  var convert = bbfy.converter({
    rules: bbfy.ruleSets.html
  });

  t.plan(data.length);
  data.forEach(function (item) {
    t.equal(convert(item[1]), item[2], item[0]);
  });  
});
