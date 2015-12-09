bbfy BBCode Processor
=====================

bbfy is a modular, extensible [BBCode] parser and converter for
[node.js]/[io.js] and web browsers.

Installation
------------

For use with node.js or io.js, bbfy can be installed through [npm]:

    npm install bbfy

bbfy can also be run inside web browsers, by using bbfy.browser.js. Since it
supports [UMD], it can be integrated standalone or through an [AMD] loader such
as [RequireJS]. Rename bbfy.browser.js to bbfy.js and copy it to your project.
For standalone use, reference it through a `source` tag:

    <script src="bbfy.js"></script>

AMD loaders can simply list and use `bbfy` as a `require` or `define`
dependency:

```javascript
require(['bbfy'], function (bbfy) {
  ....
}
```

Copying bbfy.browser.js.map is optional and provides debugging capabilities as
bbfy.browser.js is uglified.

Usage
-----

bbfy exposes one function, `converter`, which optionally takes an object of
options. Invoking `converter` returns and anonymous function that converts
BBCode-enriched text based on the provided ruleset.

```javascript
var convert = bbfy.converter();
var bbcode = '[b]Hello World![/b]';
var html = convert(bbcode); // <b>Hello World!</b>
```

The default ruleset converts BBCode to standards-compliant HTML.

All defaults are exposed via `bbfy.options` and pre-defined rulesets as
`bbfy.ruleSets`. The call to `converter` supports overriding the ruleset by
setting the key `rules`. Additionally, the key `unsupported` can be assigned to
a fallback function handling unknown BBCode tags. The default one just strips
off the tags.

The internal API is exposed through `bbfy.api` and should only be used at your
own discretion as there a no guarantees towards stability or consistency
throughout releases.

API
---

<dl>
<dt>bbfy.converter({ rules, unsupported, lineTags } (optional)) => fn (string) => string</dt>
<dd>BBCode to anything converter. `rules` has to be an object mapping tag names
to functions of the form `fn (text, tag, args) => string`. The input string is the text
inside the bbcode tags. `tag` is the name of the tag itself. The format of
`args` depends on the kind of assignment present, if any, and can be a simple
string or an object. The converter may through an error message if there is a
fatal error during parsing th input string, but this is unlikely to ever
happen. `unsupported` get called for properly parsed tags that don't match any
rule in the ruleset and takes the same options as the other rules. `lineTags` is
an array of BBCode tags to be terminated by newlines.</dd>

<dt>bbfy.options</dt>
<dd>Contains the defaults for rulesets, unsupported tags and line tags. Here it
is possible to override them on a global scale.</dd>

<dt>bbfy.ruleSets</dt>
<dd>A mapping of predefined rulesets. By default, only `strip` and
`html`. `strip` removes all BBCode tags, which is useful e.g. for web standard
notifications.</dd>

<dt>bbfy.api</dt>
<dd>Exposes all internal functions, mainly for unit testing purposes. As there
are no guarantees for the API, please see the source code itself if you want to
use it anyway.</dd>
</dl>

Development
-----------

bbfy is written in [ES6] and built using [gulp]. Run `npm install` to fetch all
dependencies needed for building bbfy and `gulp compile` to build the node.js
version in `target/bbfy.js`. `gulp bundle` builds the browser version bundling
all dependencies using browserify. The output file is `target/bbfy.browser.js`.
`gulp test` runs all tests and `gulp watch` watches for source code or test code
changes and re-runs all building and test tasks on demand.

If you don't want to install gulp globally, you can run it off the local node
depedency cache: `node_modules/gulp/bin/gulp.js`.

Links
-----

[BBCode]: http://bbcode.org/
[node.js]: https://nodejs.org/
[io.js]: https://iojs.org/
[npm]: https://www.npmjs.com/
[UMD]: https://github.com/umdjs/umd
[AMD]: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
[RequireJS]: http://requirejs.org/
[ES6]: http://es6-features.org/
[gulp]: http://gulpjs.com/

License
-------

Copyright © 2015 LShift Services GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
