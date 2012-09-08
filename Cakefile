fs      = require 'fs'
{print} = require 'util'
{spawn, exec} = require 'child_process'

timeout = null
build = (callback, watch = false) ->
  if watch
    coffee = spawn 'coffee', ['-c', '-b', '-o', 'compiled', '-w', '.']
  else
    coffee = spawn 'coffee', ['-c', '-b', '-o', 'compiled', '.']
  
  coffee.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  coffee.stdout.on 'data', (data) ->
    clear()
    print data.toString()
    
    if callback and watch
      clearTimeout timeout
      timeout = setTimeout callback, 100
    
  coffee.on 'exit', (code) ->
    callback?() if code is 0

clear = ->
  process.stdout.write '\u001B[2J\u001B[0;0f'

test = ->
  phantom = spawn 'phantomjs', ['test/lib/phantomjs_test_runner.coffee', 'test/index.html']
  
  phantom.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  phantom.stdout.on 'data', (data) ->
    print data.toString()

task 'compile', 'Build lib/', ->
  build()

task 'watch', 'Build lib/ and watch for changes', ->
  build(null, true)
  
task 'test', 'test', ->
  test()
    
task 'autotest', 'autotest', ->
  build ( -> 
    clear();
    test() 
  ), true

task 'console', 'run a browser console, from command line, hell yeah', ->
  spawn process.env["EDITOR"], ['/tmp/phantom_command.coffee']

  spawn 'touch', ['/tmp/phantom_command.coffee']
  spawn 'coffee', ['-b', '-c', '-w', '/tmp/phantom_command.coffee']
  
  phantom = spawn 'phantomjs', ['test/lib/phantomjs_console.coffee', 'index.html']
  phantom.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  phantom.stdout.on 'data', (data) ->
    print data.toString()
   
  
task 'build', 'build hoodie-client.min.js', -> 
  try fs.unlinkSync 'hoodie.js'

  js_code = ''
  build = spawn 'cat', [
    'compiled/src/events.js'
    'compiled/src/hoodie.js'
    'compiled/src/hoodie/account.js'
    'compiled/src/hoodie/store.js'
    'compiled/src/hoodie/remote_store.js'
    'compiled/src/hoodie/account/remote_store.js'
    'compiled/src/hoodie/config.js'
    'compiled/src/hoodie/email.js'
    'compiled/src/hoodie/errors.js'
    'compiled/src/hoodie/local_store.js'
    'compiled/src/hoodie/user.js'
    'compiled/src/hoodie/global.js'
    'compiled/src/hoodie/share.js'
    'compiled/src/hoodie/share/hoodie.js'
    'compiled/src/hoodie/share/account.js'
    'compiled/src/hoodie/share/remote.js'
    'compiled/src/hoodie/share/instance.js'
  ]

  build.stdout.on 'data', (data) -> 
    console.log 'data!'
    js_code += data

  # build.stderr.on 'data', (data) -> print data.toString()
  build.on 'exit', (status) -> 
    fs.writeFileSync 'hoodie.js', js_code
    callback?() if status is 0
  
task 'docs', 'create docs from code', ->
  groc = spawn 'groc', ['-t src/ src/**/*.coffee']
  groc.stdout.on 'data', (data) -> print data.toString()
  groc.on 'exit', (status) -> callback?() if status is 0

task 'wishlist', 'create docs from code', ->
  groc = spawn 'groc', ['-t wishlist/', '-o whishlist/doc', 'wishlist/**/*.js']
  groc.stdout.on 'data', (data) -> print data.toString()
  groc.on 'exit', (status) -> callback?() if status is 0
    
task 'all', 'one cake to rule them all', ->
  exec 'cake compile && cake build && cake docs', (err) ->
    throw err if err