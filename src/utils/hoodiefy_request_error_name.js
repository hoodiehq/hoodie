var findLettersToUpperCase = /(^\w|_\w)/g;

exports.hoodiefyRequestErrorName = function (name) {
  name = name.replace(findLettersToUpperCase, function (match) {
    return (match[1] || match[0]).toUpperCase();
  });

  return 'Hoodie' + name + 'Error';
};

