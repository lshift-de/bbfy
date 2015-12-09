require(['bbfy'], function (bbfy) {
  var convert = bbfy.converter();
  var input = document.getElementById('input');
  var output = document.getElementById('output');
  var html = document.getElementById('html');

  var update = function (text) {
    var bbcode = convert(text);
    output.value = bbcode;
    html.innerHTML = bbcode;
  };

  input.addEventListener('input', function (e) {
    update(e.target.value || '');
  });

  update(input.value);
});
