#
# Wait until the test condition is true or a timeout occurs. Useful for waiting
# on a server response or for a ui change (fadeIn, etc.) to occur.
#
# @param testFx javascript condition that evaluates to a boolean,
# it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
# as a callback function.
# @param onReady what to do when testFx condition is fulfilled,
# it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
# as a callback function.
# @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
#
waitFor = (testFx, onReady, timeOutMillis=3000) ->
    start = new Date().getTime()
    condition = false
    f = ->
        if (new Date().getTime() - start < timeOutMillis) and not condition
            # If not time-out yet and condition not yet fulfilled
            condition = (if typeof testFx is 'string' then eval testFx else testFx()) #< defensive code
        else
            if not condition
                # If condition still not fulfilled (timeout but condition is 'false')
                console.log "'waitFor()' timeout"
                phantom.exit(1)
            else
                # Condition fulfilled (timeout and/or condition is 'true')
                # console.log "'waitFor()' finished in #{new Date().getTime() - start}ms."
                if typeof onReady is 'string' then eval onReady else onReady() #< Do what it's supposed to do once the condition is fulfilled
                clearInterval interval #< Stop this interval
    interval = setInterval f, 100 #< repeat check every 100ms

# if phantom.args.length isnt 1
#     console.log 'Usage: run-jasmine.coffee URL'
#     phantom.exit()

page = new WebPage()

# Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = (msg, line, file)-> 
  console.log msg
  
page.onError = (msg, trace) ->
    try

      trace_parts =  for item in trace
        "#{item.file}:#{item.line}"
      
      code = """
             getScriptPosition = function() {
               var line = #{trace[0].line},
                   before = 10,
                   after  = 10;
               $.get('#{trace[0].file}', function(data) { 
                 lines = data.split(/\\n/)
                 
                 console.log("")
                 console.log("ERROR")
                 console.log("#{msg.replace(/"/g, "\\\"")}")
                 console.log("")
                 console.log("#{trace_parts.shift()}")
                 for(var i = line - before; i <= line + after; i++) {
                   console.log(i, (i == line) ? ': => ' : ':    ', lines[i - 1])
                 }
                 console.log("")
                 console.log("TRACE")
                 console.log("#{trace_parts.join "\\n"}")
               })
             }
             """
      eval code
      
      page.evaluate getScriptPosition

    catch e
      console.log ""
      console.log "!!! phantomJS error !!!"
      console.log e
      console.log code
      console.log ""


page.open phantom.args[0], (status) ->
    if status isnt 'success'
        console.log status + '! Unable to access ' + phantom.args[0]
        phantom.exit()
    else
        
        waitFor ->
          page.evaluate ->
            return not window.jas.currentRunner_.queue.running
        , ->
            hasErrors = page.evaluate ->
              
                
                
                console.log ''
                console.log "================================================================================"
                console.log document.body.querySelector('.runner .description').innerText
                console.log "================================================================================"
                console.log ''
                
                list = document.body.querySelectorAll('.failed > .description, .failed > .messages > .resultMessage')
                
                hasErrors = list.length
                for el in list 
                  i = ''
                  e = el
                  until e.className == 'jasmine_reporter'
                    e = e.parentNode
                    i += '  ' if /failed/.test(e.className)
                  
                  i += '=> ' if el.className == 'resultMessage fail'
                  console.log i + el.innerText
                  console.log '' if el.className == 'resultMessage fail'

                return hasErrors
            
            if hasErrors
              phantom.exit(1)
            else
              phantom.exit()
