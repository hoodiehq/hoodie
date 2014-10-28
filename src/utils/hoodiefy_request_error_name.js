var exports = module.exports = function(findLettersToUpperCase) {
  findLettersToUpperCase = findLettersToUpperCase || /(^\w|_\w)/g;

  return exports.hoodiefyRequestErrorName.bind(null, findLettersToUpperCase);
};

exports.hoodiefyRequestErrorName = function(findLettersToUpperCase, name) {
  name = name.replace(findLettersToUpperCase, function (match) {
    return (match[1] || match[0]).toUpperCase();
  });

  return 'Hoodie' + name + 'Error';
};

