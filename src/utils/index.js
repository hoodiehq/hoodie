module.exports = {

  now: function () {
    return JSON.stringify(new Date()).replace(/['"]/g, '');
  },

  hoodiefyRequestErrorName: function (name) {
    name = name.replace(/(^\w|_\w)/g, function (match) {
      return (match[1] || match[0]).toUpperCase();
    });

    return 'Hoodie' + name + 'Error';
  }

};
