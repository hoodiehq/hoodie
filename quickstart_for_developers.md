Quickstart for developers
=========================

hoodie.js is written in [CoffeeScript](http://coffeescript.org/) and uses [phantomJS](http://phantomjs.org/) for automated, headless testing.

```bash
# install CoffeScript
npm install -g coffee-script
# install phantomJS for testing
brew update && brew install phantomjs
```

That's all you need. Make your changes, run the test, send a pull request, win karma. We've lots to give

Here are your friendly [cake](http://coffeescript.org/documentation/docs/cake.html) helpers

```bash
cake compile              # Build lib/
cake watch                # Build lib/ and watch for changes
cake test                 # Run all test
cake autotest             # Run all tests & rerun on file changes
cake console              # run a browser console, from command line, hell yeah
cake build                # build hoodie-client.min.js
cake docs                 # create docs from code
cake wishlist             # create docs from dream code
cake all                  # one cake to rule them all
```


Q & A
-----

1. I HATE CoffeeScript  

   [Haters gonna hate](http://youtu.be/yMs712oA_Lg). 

2. I don't really like CoffeeScript
   
   Oh, that's actually great! What we care most about is [hoodie's API](hoodiehq.github.com/hoodie.js).
   If you feel the implemantion could be better, please go ahead, we're happy to assist. Take [underscore](http://underscorejs.org/) /
   [lodash](http://lodash.com/) for a great outcome of the same approach.

3. I don't like nodeJS / couchDB / ponys?
   
   Oh my, even better! We think every backend deserve a nicely tailored hoodie, wouldn't you agree?
   So why not make one for your beloved one, we are happy to help. Just stick to [hoodie's API](hoodiehq.github.com/hoodie.js)
   and the frotend-ers out there won't even tell the difference ;-)