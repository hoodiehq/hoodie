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
  build( test, true)
  
task 'build', 'build hoodie-client.min.js', ->
  build = spawn 'r.js', ['-o', 'name=hoodie', 'optimize=none', 'wrap.start=(function() {', 'wrap.end=}())', 'baseUrl=./compiled/src', 'paths.requireLib=../../vendor/require-1.0.7', 'out=hoodie.min.js', 'include=requireLib,hoodie,hoodie/store,hoodie/config,hoodie/account,hoodie/remote,hoodie/email,hoodie/sharing,hoodie/sharing/account,hoodie/sharing/remote']
  build.stdout.on 'data', (data) -> print data.toString()
  # build.stderr.on 'data', (data) -> print data.toString()
  build.on 'exit', (status) -> callback?() if status is 0
  
task 'docs', 'create docs from code', ->
  
  docco = spawn 'docco', ['src/*.coffee']
  docco.stdout.on 'data', (data) -> print data.toString()
  docco.on 'exit', (status) -> callback?() if status is 0
  
  # docco = spawn 'docco', ['src/**/*.coffee']
  # docco.stdout.on 'data', (data) -> print data.toString()
  # docco.on 'exit', (status) -> callback?() if status is 0
  
  # fs.readdir 'src', (err, contents) ->
  #   files = []
  #   files = ("src/#{file}" for file in contents when /\.coffee$/.test file)
  #   
  #   console.log files
  #   docco = spawn 'docco', files
  #   docco.stdout.on 'data', (data) -> print data.toString()
  #   # docco.stderr.on 'data', (data) -> print data.toString()
  #   docco.on 'exit', (status) -> callback?() if status is 0
    
task 'all', 'one cake to rule them all', ->
  exec 'cake compile && cake build && cake docs', (err) ->
    throw err if err