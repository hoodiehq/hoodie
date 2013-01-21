this["JST"] = this["JST"] || {};

this["JST"]["application"] = function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<p>Your content here</p>\n\n";};

this["JST"]["dashboard"] = function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "      <div class=\"content centered\">\n        <h2 class=\"top\">";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += Handlebars.Utils.escapeExpression(stack1) + "New events for minutes.io  since your last visit <span class=\"timeago\">";
  stack1 = depth0.stats;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.since;
  stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1;
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</span></h2>\n        <h3 class=\"top\">Users</h3>\n        <div class=\"row-fluid statistics\">\n          <div class=\"panel success span4\">\n            <span>New signups/past 30 days</span>\n            <h1>";
  stack1 = depth0.stats;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.signups;
  stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1;
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</h1>\n          </div>\n          <div class=\"panel warning span4\">\n            <span>Account deletions/past 30 days</span>\n            <h1>";
  stack1 = depth0.stats;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.account_deletions;
  stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1;
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</h1>\n          </div>\n          <div class=\"panel success span4\">\n            <span>Growth/past 30 days</span>\n            <h1>";
  stack1 = depth0.stats;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.growth;
  stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1;
  buffer += Handlebars.Utils.escapeExpression(stack1) + "%</h1>\n          </div>\n        </div>\n        <div class=\"row-fluid statistics\">\n          <div class=\"panel info span4\">\n            <span>Total</span>\n            <h1>";
  stack1 = depth0.stats;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.users_total;
  stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1;
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</h1>\n          </div>\n          <div class=\"panel info span4\">\n            <span>Active/past 30 days</span>\n            <h1>";
  stack1 = depth0.stats;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.users_active;
  stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1;
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</h1>\n          </div>\n          <div class=\"panel warning span4\">\n            <span>Activity/past 30 days</span>\n            <h1>";
  stack1 = depth0.stats;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.active;
  stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1;
  buffer += Handlebars.Utils.escapeExpression(stack1) + "%</h1>\n          </div>\n        </div>\n        <h3>Messages and errors</h3>\n        <div class=\"alert alert-error\">\n          <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>\n          <ul>\n            <li>Module Mail reports error: Cannot send email (about 4 hours ago)</li>\n            <li>Module Mail reports error: Cannot send email (about 4 hours ago)</li>\n            <li>Module Mail reports error: Cannot send email (about 5 hours ago)</li>\n            <li>46 additional new errors in this module</li>\n          </ul>\n        </div>\n        <div class=\"alert alert-info\">\n          <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>\n          <ul>\n            <li>Module Signup confirmation reports: New user confirmed! (about 6 hours ago)</li>\n          </ul>\n        </div>\n      </div>";
  return buffer;};

this["JST"]["users"] = function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n            <tr>\n              <td>";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</td>\n              <td>";
  foundHelper = helpers.lastLogin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.lastLogin; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</td>\n              <td>";
  foundHelper = helpers.signedUpAt;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.signedUpAt; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</td>\n              <td>";
  foundHelper = helpers.state;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.state; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += Handlebars.Utils.escapeExpression(stack1) + "</td>\n              <td>resend / new</td>\n              <td>edit / delete</td>\n            </tr>\n            ";
  return buffer;}

  buffer += "<div class=\"content centered\">\n        <h2 class=\"top\">Users</h2>\n        <div class=\"userSearch\">\n          <form class=\"form-search\">\n            <input type=\"text\" class=\"input-large search-query\" placeholder=\"Search in users\">\n            <button type=\"submit\" class=\"btn\">Search</button>\n          </form>\n          <div class=\"pagination pagination-right\">\n            <ul>\n              <li class=\"disabled\"><a href=\"#\">Prev</a></li>\n              <li class=\"active\"><a href=\"#\">1</a></li>\n              <li><a href=\"#\">2</a></li>\n              <li><a href=\"#\">3</a></li>\n              <li><a href=\"#\">4</a></li>\n              <li><a href=\"#\">5</a></li>\n              <li><a href=\"#\">Next</a></li>\n            </ul>\n          </div>\n        </div>\n        <div class=\"tableStatus\">\n          <p class=\"currentSearchTerm muted\">Currently displaying all users</p>\n          <p class=\"currentSearchMetrics muted\">Showing 50 of 4211 users</p>\n        </div>\n        <table class=\"table\">\n          <thead>\n            <tr>\n              <th>Email</th>\n              <th>Last seen</th>\n              <th>Signup date</th>\n              <th>State</th>\n              <th>Password</th>\n              <th></th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr>\n              <td>hello@alexfeyerke.com</td>\n              <td>2 hours ago</td>\n              <td>17.06.12</td>\n              <td>confirmed</td>\n              <td>resend / new</td>\n              <td>edit / delete</td>\n            </tr>\n            ";
  stack1 = depth0.users;
  stack2 = {};
  stack1 = helpers.each.call(depth0, stack1, {hash:stack2,inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n          </tbody>\n        </table>\n        <div class=\"tableStatus\">\n          <p class=\"currentSearchTerm muted\">Currently displaying all users</p>\n          <p class=\"currentSearchMetrics muted\">Showing 50 of 4211 users</p>\n        </div>\n        <div class=\"userSearch\">\n\n        <div class=\"pagination pagination-right\">\n          <ul>\n            <li class=\"disabled\"><a href=\"#\">Prev</a></li>\n            <li class=\"active\"><a href=\"#\">1</a></li>\n            <li><a href=\"#\">2</a></li>\n            <li><a href=\"#\">3</a></li>\n            <li><a href=\"#\">4</a></li>\n            <li><a href=\"#\">5</a></li>\n            <li><a href=\"#\">Next</a></li>\n          </ul>\n        </div>\n        </div>\n      </div>\n";
  return buffer;};