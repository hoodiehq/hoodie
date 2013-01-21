whereTheMagicHappens = location.protocol + '//' + location.hostname.replace(/^admin/, 'api');
var hoodie = new Hoodie(whereTheMagicHappens);

hoodie.request('GET', '/')
.done(function(data) {
  console.log('hoodie is a go.');
  console.log(data);
})
.fail(function(error) {
  console.log('hoodie has an error.');
  console.log(error);
});
