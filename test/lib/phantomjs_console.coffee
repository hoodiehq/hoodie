fs = require('fs')
command_file = "/tmp/phantom_command.js"
fs.touch command_file

url = phantom.args[0]

unless url
  console.log "\nUSAGE:"
  console.log "phantomjs path/to/file.html\n"
  phantom.exit()



# fs.write user_flags_file, lines.join("\n"), 'w'


page = new WebPage()

page.onConsoleMessage = (msg, line, file)-> 
  console.log msg
  
page.onError = (msg, trace) ->
  console.log msg

page.open phantom.args[0], (status) ->
  readCommand = ->
    command = fs.read(command_file)
    fs.write command_file, ''
    if command
      # strip the comment on first line
      command = command.replace /^.*\n/, ''

      # strip whitespaces
      command = command.replace /(^\s+|\s+$)/g, ''

      console.log " > #{command}"
      page.evaluate execCommand, command

  execCommand = (command) ->

    ret = eval(command)
    console.log "->", ret?.toString().replace(/\n/g, "\n   ") unless /console\.log/.test command


  if status isnt 'success'
    console.log status + '! Unable to access ' + phantom.args[0]
    phantom.exit()
  else
      
    console.log ""
    console.log "Exit with ^ + C"
    console.log ""

    setInterval readCommand, 100