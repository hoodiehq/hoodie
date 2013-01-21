var HoodieAdminClass = function(hoodie) {
  this.hoodie = hoodie;
}

HoodieAdminClass.prototype = {
  users: {
    findAll: function() {},
    search: function() {}
  },
  config: {
    get: function() {},
    set: function() {}
  },
  on: function() {},
  logs: {
    findAll: function() {}
  },
  stats: function(since) {

    // dummy stats
    stats = {
      signups : 12,
      account_deletions : 1,
      users_active : 1302,
      users_total : 4211,
      growth : 0.04,
      active : -0.02
    }

    if (! since) {
      for (key in stats) {
        stats[key] = stats[key] * 17
      }
    }

    return this.hoodie.defer().resolve(stats).promise()
  }
};

Hoodie.extend('admin', HoodieAdminClass);
