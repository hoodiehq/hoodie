module.exports = Loader

var Loader = function() {
  start = function start() {
    this.started = true;
    console.log('Loading');
    if (!this.started) {
      process.stdout.write('.');
    }
    setTimeout(start, 300);
  }

  stop = function() {
    this.started = false;
  }

  return {
    started: false,
    start: start,
    stop: stop
  }
}


