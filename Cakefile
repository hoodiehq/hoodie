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
  
task 'test', 'Run all test', ->
  test()
    
task 'autotest', 'Run all tests & rerun on file changes', ->
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
   
  
task 'build', 'build hoodie.min.js', -> 
  
  # the files need to be in a specific order, 
  # as some modules depend on others (e.g.
  # AccountRemote > Remote)
  files = """
  src/events.coffee
  src/hoodie.coffee
  src/core/account.coffee
  src/core/config.coffee
  src/core/email.coffee
  src/core/errors.coffee
  src/core/store.coffee
  src/core/remote_store.coffee
  src/core/remote.coffee
  src/core/account_remote.coffee
  src/core/local_store.coffee
  src/extensions/share.coffee
  src/extensions/user.coffee
  src/extensions/global.coffee
  src/extensions/share_instance.coffee
  """.split("\n")
  
  console.log "concatinating files ..."
  coffee = spawn 'coffee', ['-j', 'hoodie.js', '-c', '-b'].concat(files)
  coffee.on 'exit', (code) ->
    console.log "minifying ..."
    spawn 'uglifyjs', ['-o', 'hoodie.min.js', 'hoodie.js']


  
task 'docs', 'create docs from code', ->
  console.log ""
  console.log "doesn't work correctly (ignores -t parameter). Please run manually:"
  console.log 'groc -t src/ "src/**/*.coffee"'
  console.log ""
  return
  groc = spawn 'groc', ['-t "src/"', 'src/**/*.coffee']
  groc.stdout.on 'data', (data) -> print data.toString()
  groc.on 'exit', (status) -> callback?() if status is 0

task 'wishlist', 'create docs from dream code', ->
  groc = spawn 'groc', ['-t wishlist/', '-o whishlist/doc', 'wishlist/**/*.js']
  groc.stdout.on 'data', (data) -> print data.toString()
  groc.on 'exit', (status) -> callback?() if status is 0
    
task 'all', 'one cake to rule them all', ->
  exec 'cake compile && cake build && cake docs', (err) ->
    throw err if err