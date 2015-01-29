// Hoodie.js - 1.0.3
// https://github.com/hoodiehq/hoodie.js
// Copyright 2012 - 2014 https://github.com/hoodiehq/
// Licensed Apache License 2.0

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.Hoodie=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    if (promise.isRejected()) {
        return promise;
    }
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
(function (process){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule.js");
var Queue = _dereq_("./queue.js");
var _process = typeof process !== "undefined" ? process : undefined;

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype._withDomain = function(fn) {
    if (_process !== undefined &&
        _process.domain != null &&
        !fn.domain) {
        fn = _process.domain.bind(fn);
    }
    return fn;
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    fn = this._withDomain(fn);
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    }
};

Async.prototype.invokeLater = function (fn, receiver, arg) {
    fn = this._withDomain(fn);
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    fn = this._withDomain(fn);
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invoke = function (fn, receiver, arg) {
    fn = this._withDomain(fn);
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.settlePromises = function(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;

}).call(this,_dereq_("FWaASH"))
},{"./queue.js":24,"./schedule.js":27,"FWaASH":36}],3:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise.js")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise.js":19}],4:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

function makeMethodCaller (methodName) {
    return new Function("obj", "                                             \n\
        'use strict'                                                         \n\
        var len = this.length;                                               \n\
        switch(len) {                                                        \n\
            case 1: return obj.methodName(this[0]);                          \n\
            case 2: return obj.methodName(this[0], this[1]);                 \n\
            case 3: return obj.methodName(this[0], this[1], this[2]);        \n\
            case 0: return obj.methodName();                                 \n\
            default: return obj.methodName.apply(obj, this);                 \n\
        }                                                                    \n\
        ".replace(/methodName/g, methodName));
}

function makeGetter (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
}

function getCompiled(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
}

function getMethodCaller(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
}

function getGetter(name) {
    return getCompiled(name, makeGetter, getterCache);
}

function caller(obj) {
    return obj[this.pop()].apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
    if (canEvaluate) {
        var maybeCaller = getMethodCaller(methodName);
        if (maybeCaller !== null) {
            return this._then(
                maybeCaller, undefined, undefined, args, undefined);
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util.js":34}],5:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var errors = _dereq_("./errors.js");
var async = _dereq_("./async.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    this._unsetCancellable();
    promiseToReject._target()._rejectCallback(reason, false, true);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 4);
    ret._follow(this);
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};

},{"./async.js":2,"./errors.js":10}],6:[function(_dereq_,module,exports){
(function (process){
"use strict";
module.exports = function() {
var async = _dereq_("./async.js");
var inherits = _dereq_("./util.js").inherits;
var bluebirdFramePattern = /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo)/;
var stackFramePattern = null;
var formatStack = null;

function CapturedTrace(parent) {
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var header = CapturedTrace.cleanHeaderStack(error, false);
    var stacks = [header.slice(1)];
    var trace = this;

    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n"), 0));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    var message = header[0].split("\u0002\u0000\u0001").join("\n");
    error.stack = reconstructStack(message, stacks);
};

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    stacks[i] = stacks[i].join("\n");
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function protectErrorMessageNewlines (stack) {
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i <= 1) return 1;
    var errorMessageLines = [];
    for (var j = 0; j < i; ++j) {
        errorMessageLines.push(stack.shift());
    }
    stack.unshift(errorMessageLines.join("\u0002\u0000\u0001"));
    return i;
}

function unProtectNewlines(stack) {
    if (stack.length > 0) {
        stack[0] = stack[0].split("\u0002\u0000\u0001").join("\n");
    }
    return stack;
}

function cleanStack(stack, initialIndex) {
    var ret = stack.slice(0, initialIndex);
    for (var i = initialIndex; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            "    (No stack trace)" === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            ret.push(line);
        }
    }
    return ret;
}

CapturedTrace.cleanHeaderStack = function(error, shouldUnProtectNewlines) {
    if (error.__stackCleaned__) return;
    error.__stackCleaned__ = true;
    var stack = error.stack;
    stack = typeof stack === "string"
        ? stack.split("\n")
        : [error.toString(), "    (No stack trace)"];
    var initialIndex = protectErrorMessageNewlines(stack);
    stack = cleanStack(stack, initialIndex);
    if (shouldUnProtectNewlines) stack = unProtectNewlines(stack);
    error.stack = stack.join("\n");
    return stack;
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console === "object") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof console.warn === "function" ||
            typeof console.warn === "object") {
            console.warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    var domEventFired = false;
    if (fireDomEvent) {
        try {
            domEventFired = fireDomEvent(name.toLowerCase(), {
                reason: reason,
                promise: promise
            });
        } catch (e) {
            domEventFired = true;
            async.throwLater(e);
        }
    }

    if (!globalEventFired && !localEventFired && !domEventFired &&
        name === "unhandledRejection") {
        CapturedTrace.formatAndLogError(reason, "Possibly unhandled ");
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.name + ". " + error.message;
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit = Error.stackTraceLimit + 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        typeof "".startsWith === "function" &&
        (err.stack.startsWith("stackDetection@")) &&
        stackDetection.name === "stackDetection") {

        stackFramePattern = /@/;
        var rline = /[@\n]/;

        formatStack = function(stack, error) {
            if (typeof stack === "string") {
                return (error.name + ". " + error.message + "\n" + stack);
            }

            if (error.name !== undefined &&
                error.message !== undefined) {
                return error.name + ". " + error.message;
            }
            return formatNonError(error);
        };

        return function captureStackTrace(o) {
            var stack = new Error().stack;
            var split = stack.split(rline);
            var len = split.length;
            var ret = "";
            for (var i = 0; i < len; i += 2) {
                ret += split[i];
                ret += "@";
                ret += split[i + 1];
                ret += "\n";
            }
            o.stack = ret;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow) {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.name + ". " + error.message;
        }
        return formatNonError(error);
    };

    return null;

})();

var fireDomEvent;
var fireGlobalEvent = (function() {
    if (typeof process !== "undefined" &&
        typeof process.version === "string" &&
        typeof window === "undefined") {
        return function(name, reason, promise) {
            if (name === "rejectionHandled") {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var customEventWorks = false;
        try {
            var ev = new self.CustomEvent("test");
            customEventWorks = ev instanceof CustomEvent;
        } catch (e) {}
        fireDomEvent = function(type, detail) {
            var event;
            if (customEventWorks) {
                event = new self.CustomEvent(type, {
                    detail: detail,
                    bubbles: false,
                    cancelable: true
                });
            } else if (self.dispatchEvent) {
                event = document.createEvent("CustomEvent");
                event.initCustomEvent(type, false, true, detail);
            }

            return event ? !self.dispatchEvent(event) : false;
        };

        var toWindowMethodNameMap = {};
        toWindowMethodNameMap["unhandledRejection"] = ("on" +
            "unhandledRejection").toLowerCase();
        toWindowMethodNameMap["rejectionHandled"] = ("on" +
            "rejectionHandled").toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = self[methodName];
            if (!method) return false;
            if (name === "rejectionHandled") {
                method.call(self, promise);
            } else {
                method.call(self, reason, promise);
            }
            return true;
        };
    }
})();

return CapturedTrace;
};

}).call(this,_dereq_("FWaASH"))
},{"./async.js":2,"./util.js":34,"FWaASH":36}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util.js");
var errors = _dereq_("./errors.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var keys = _dereq_("./es5.js").keys;
var TypeError = errors.TypeError;

function CatchFilter(instances, callback, promise) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}

function safePredicate(predicate, e) {
    var safeObject = {};
    var retfilter = tryCatch(predicate).call(safeObject, e);

    if (retfilter === errorObj) return retfilter;

    var safeKeys = keys(safeObject);
    if (safeKeys.length) {
        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function (e) {
    var cb = this._callback;
    var promise = this._promise;
    var boundTo = promise._boundTo;
    for (var i = 0, len = this._instances.length; i < len; ++i) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            (item != null && item.prototype instanceof Error);

        if (itemIsErrorType && e instanceof item) {
            var ret = tryCatch(cb).call(boundTo, e);
            if (ret === errorObj) {
                NEXT_FILTER.e = ret.e;
                return NEXT_FILTER;
            }
            return ret;
        } else if (typeof item === "function" && !itemIsErrorType) {
            var shouldHandle = safePredicate(item, e);
            if (shouldHandle === errorObj) {
                e = errorObj.e;
                break;
            } else if (shouldHandle) {
                var ret = tryCatch(cb).call(boundTo, e);
                if (ret === errorObj) {
                    NEXT_FILTER.e = ret.e;
                    return NEXT_FILTER;
                }
                return ret;
            }
        }
    }
    NEXT_FILTER.e = e;
    return NEXT_FILTER;
};

return CatchFilter;
};

},{"./errors.js":10,"./es5.js":11,"./util.js":34}],8:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;
var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;

module.exports = function(Promise) {
var returner = function () {
    return this;
};
var thrower = function () {
    throw this;
};

var wrapper = function (value, action) {
    if (action === 1) {
        return function () {
            throw value;
        };
    } else if (action === 2) {
        return function () {
            return value;
        };
    }
};


Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (wrapsPrimitiveReceiver && isPrimitive(value)) {
        return this._then(
            wrapper(value, 2),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (wrapsPrimitiveReceiver && isPrimitive(reason)) {
        return this._then(
            wrapper(reason, 1),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(thrower, undefined, undefined, reason, undefined);
};
};

},{"./util.js":34}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, null, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, null, INTERNAL);
};
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
var Objectfreeze = _dereq_("./es5.js").freeze;
var util = _dereq_("./util.js");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

AggregateError.prototype.length = 0;
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError
};

},{"./es5.js":11,"./util.js":34}],11:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        keys: Object.keys,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],12:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],13:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
var util = _dereq_("./util.js");
var wrapsPrimitiveReceiver = util.wrapsPrimitiveReceiver;
var isPrimitive = util.isPrimitive;
var thrower = util.thrower;

function returnThis() {
    return this;
}
function throwThis() {
    throw this;
}
function return$(r) {
    return function() {
        return r;
    };
}
function throw$(r) {
    return function() {
        throw r;
    };
}
function promisedFinally(ret, reasonOrValue, isFulfilled) {
    var then;
    if (wrapsPrimitiveReceiver && isPrimitive(reasonOrValue)) {
        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
    } else {
        then = isFulfilled ? returnThis : throwThis;
    }
    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
}

function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundTo)
                    : handler();

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, reasonOrValue,
                                    promise.isFulfilled());
        }
    }

    if (promise.isRejected()) {
        NEXT_FILTER.e = reasonOrValue;
        return NEXT_FILTER;
    } else {
        return reasonOrValue;
    }
}

function tapHandler(value) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundTo, value)
                    : handler(value);

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, value, true);
        }
    }
    return value;
}

Promise.prototype._passThroughHandler = function (handler, isFinally) {
    if (typeof handler !== "function") return this.then();

    var promiseAndHandler = {
        promise: this,
        handler: handler
    };

    return this._then(
            isFinally ? finallyHandler : tapHandler,
            isFinally ? finallyHandler : undefined, undefined,
            promiseAndHandler, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThroughHandler(handler, true);
};

Promise.prototype.tap = function (handler) {
    return this._passThroughHandler(handler, false);
};
};

},{"./util.js":34}],14:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise) {
var errors = _dereq_("./errors.js");
var TypeError = errors.TypeError;
var deprecated = _dereq_("./util.js").deprecated;
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
}

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._next(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    if (result === errorObj) {
        this._generator = undefined;
        var trace = util.canAttachTrace(result.e)
            ? result.e : new Error(util.toString(result.e));
        this._promise._attachExtraTrace(trace);
        this._promise._reject(result.e, trace);
        return;
    }

    var value = result.value;
    if (result.done === true) {
        this._generator = undefined;
        if (!this._promise._tryFollow(value)) {
            this._promise._fulfill(value);
        }
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._throw(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise._then(
            this._next,
            this._throw,
            undefined,
            this,
            null
       );
    }
};

PromiseSpawn.prototype._throw = function (reason) {
    if (util.canAttachTrace(reason))
        this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._next = function (value) {
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        spawn._generator = generator;
        spawn._next(undefined);
        return spawn.promise();
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    deprecated("Promise.spawn is deprecated. Use Promise.coroutine instead.");
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors.js":10,"./util.js":34}],15:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var caller = function(count) {
        var values = [];
        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
        return new Function("holder", "                                      \n\
            'use strict';                                                    \n\
            var callback = holder.fn;                                        \n\
            return callback(values);                                         \n\
            ".replace(/values/g, values.join(", ")));
    };
    var thenCallbacks = [];
    var callers = [undefined];
    for (var i = 1; i <= 5; ++i) {
        thenCallbacks.push(thenCallback(i));
        callers.push(caller(i));
    }

    var Holder = function(total, fn) {
        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
        this.fn = fn;
        this.total = total;
        this.now = 0;
    };

    Holder.prototype.callers = callers;
    Holder.prototype.checkFulfillment = function(promise) {
        var now = this.now;
        now++;
        var total = this.total;
        if (now >= total) {
            var handler = this.callers[total];
            promise._pushContext();
            var ret = tryCatch(handler)(this);
            promise._popContext();
            if (ret === errorObj) {
                promise._rejectCallback(ret.e, false, true);
            } else if (!promise._tryFollow(ret)) {
                promise._fulfillUnchecked(ret);
            }
        } else {
            this.now = now;
        }
    };
}

function reject(reason) {
    this._reject(reason);
}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (last < 6 && canEvaluate) {
            var ret = new Promise(INTERNAL);
            ret._captureStackTrace();
            var holder = new Holder(last, fn);
            var callbacks = thenCallbacks;
            for (var i = 0; i < last; ++i) {
                var maybePromise = tryConvertToPromise(arguments[i], ret);
                if (maybePromise instanceof Promise) {
                    maybePromise = maybePromise._target();
                    if (maybePromise._isPending()) {
                        maybePromise._then(callbacks[i], reject,
                                           undefined, ret, holder);
                    } else if (maybePromise._isFulfilled()) {
                        callbacks[i].call(ret,
                                          maybePromise._value(), holder);
                    } else {
                        ret._reject(maybePromise._reason());
                    }
                } else {
                    callbacks[i].call(ret, maybePromise, holder);
                }
            }
            return ret;
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util.js":34}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var PENDING = {};
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._setIsSpreadable();
    this._promise._captureStackTrace();
    this._callback = fn;
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    this._init$(undefined, -2);
}
util.inherits(MappingPromiseArray, PromiseArray);

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;
    if (values[index] === PENDING) {
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var callback = this._callback;
        var receiver = this._promise._boundTo;
        this._promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        this._promise._popContext();
        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                if (limit >= 1) this._inFlight++;
                values[index] = PENDING;
                return maybePromise._proxyPromiseArray(this, index);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }

    }
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter);
}

Promise.prototype.map = function (fn, options) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

    return map(this, fn, options, null).promise();
};

Promise.map = function (promises, fn, options, _filter) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    return map(promises, fn, options, _filter).promise();
};


};

},{"./util.js":34}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret = tryCatch(nodeback).apply(promise._boundTo, [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundTo;
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundTo, reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./async.js":2,"./util.js":34}],18:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - 5 + 2];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        if (ret.e != null &&
            ret.e.name !== "StopProgressPropagation") {
            var trace = util.canAttachTrace(ret.e)
                ? ret.e : new Error(util.toString(ret.e));
            promise._attachExtraTrace(trace);
            promise._progress(ret.e);
        }
    } else if (ret instanceof Promise) {
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};

},{"./async.js":2,"./util.js":34}],19:[function(_dereq_,module,exports){
(function (process){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var errors = _dereq_("./errors.js");
var RangeError = errors.RangeError;
var TypeError = errors.TypeError;
var CancellationError = errors.CancellationError;
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};
var tryConvertToPromise = _dereq_("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = _dereq_("./captured_trace.js")();
var CatchFilter = _dereq_("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = _dereq_("./promise_resolver.js");
var isArray = util.isArray;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var originatesFromRejection = util.originatesFromRejection;
var markAsOriginatingFromRejection = util.markAsOriginatingFromRejection;
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;

var debugging = false || !!(
    typeof process !== "undefined" &&
    typeof process.execPath === "string" &&
    typeof process.env === "object" &&
    (process.env["BLUEBIRD_DEBUG"] ||
        process.env["NODE_ENV"] === "development")
);
function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
    }
    if (this.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    this._boundTo = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    if (maybePromise instanceof Promise) {
        target._then(INTERNAL, ret._reject, ret._progress, ret, null);
        maybePromise._then(function(thisArg) {
            if (ret._isPending()) {
                ret._setBoundTo(thisArg);
                ret._follow(target);
            }
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._setBoundTo(thisArg);
        ret._follow(target);
    }

    return ret;
};

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};


Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    var followee = this._target();
    var target = followee._isSpreadable()
        ? (followee === this ? this : this.then())
        : this.all();
    return target._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    var ret = new PromiseArray(this).promise();
    ret._setIsSpreadable();
    return ret;
};

Promise.prototype.error = function (fn) {
    return this.caught(originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.all = function (promises) {
    var ret = new PromiseArray(promises).promise();
    ret._setIsSpreadable();
    return ret;
};

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        ret._popContext();
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn, args, ctx) {
    if (typeof fn !== "function") {
        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value = isArray(args)
        ? tryCatch(fn).apply(ctx, args)
        : tryCatch(fn).call(ctx, args);
    ret._popContext();
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
};

Promise.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);

    if (maybePromise instanceof Promise) {
        maybePromise._then(function(thisArg) {
            ret._setBoundTo(thisArg);
            ret._fulfill(undefined);
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._setBoundTo(thisArg);
        ret._setFulfilled();
    }
    return ret;
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._setFulfilled();
        ret._settledValue = val;
        ret._cleanValues();
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    possiblyUnhandledRejection = typeof fn === "function" ? fn : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    unhandledRejectionHandled = typeof fn === "function" ? fn : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
    }
    debugging = CapturedTrace.isSupported();
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    async._schedule = fn;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, 4 | 1);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex =
        target._addCallbacks(didFulfill, didReject, didProgress, ret, receiver);

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    return this._bitField & 131071;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 536870912) === 536870912;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -131072) |
        (len & 131071);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._cancellable = function () {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 2097152;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~2097152);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 2097152) > 0;
};

Promise.prototype._isSpreadable = function () {
    return (this._bitField & 131072) > 0;
};

Promise.prototype._setIsSpreadable = function () {
    this._bitField = this._bitField | 131072;
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~4194304);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 524288;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~524288);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 524288) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    this._bitField = this._bitField | 1048576;
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0
        ? this._receiver0
        : this[
            index * 5 - 5 + 4];
    if (this._isBound() && ret === undefined) {
        return this._boundTo;
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return index === 0
        ? this._promise0
        : this[index * 5 - 5 + 3];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * 5 - 5 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return index === 0
        ? this._rejectionHandler0
        : this[index * 5 - 5 + 1];
};

Promise.prototype._migrateCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    if (promise instanceof Promise) promise._setIsMigrated();
    this._addCallbacks(fulfill, reject, progress, promise, receiver);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver
) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace())
            this._fulfillmentHandler0 = fulfill;
        if (typeof reject === "function") this._rejectionHandler0 = reject;
        if (typeof progress === "function") this._progressHandler0 = progress;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promise;
        this[base + 4] = receiver;
        if (typeof fulfill === "function")
            this[base + 0] = fulfill;
        if (typeof reject === "function")
            this[base + 1] = reject;
        if (typeof progress === "function")
            this[base + 2] = progress;
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promiseSlotValue;
        this[base + 4] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 8388608;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~8388608);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 8388608) === 8388608;
};

Promise.prototype._resolveCallback = function(value) {
    if (this._tryFollow(value)) {
        return;
    }
    this._fulfill(value);
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = canAttachTrace(reason) &&
        typeof trace.stack === "string";
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, trace === reason ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined && r === errorObj) {
        promise._rejectCallback(r.e, true, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundTo, value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._follow = function (promise) {
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(
                this._fulfillmentHandlerAt(i),
                this._rejectionHandlerAt(i),
                this._progressHandlerAt(i),
                this._promiseAt(i),
                this._receiverAt(i)
            );
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
        this._propagateFrom(promise, 1);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
    if (promise._isRejectionUnhandled()) promise._unsetRejectionIsUnhandled();
};

Promise.prototype._tryFollow = function (value) {
    if (this._isFollowingOrFulfilledOrRejected() ||
        value === this) {
        return false;
    }
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) {
        return false;
    }
    this._follow(maybePromise._target());
    return true;
};

Promise.prototype._captureStackTrace = function () {
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._canAttachTrace = function(error) {
    return debugging && canAttachTrace(error);
};

Promise.prototype._attachExtraTraceIgnoreSelf = function (error) {
    if (this._canAttachTrace(error) && this._trace._parent !== undefined) {
        this._trace._parent.attachExtraTrace(error);
    }
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else {
            CapturedTrace.cleanHeaderStack(error, true);
        }
    }
};

Promise.prototype._cleanValues = function () {
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & 1) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & 4) > 0) {
        this._setBoundTo(parent._boundTo);
    }
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);


    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * 5 - 5;
        this[base + 3] =
        this[base + 4] =
        this[base + 0] =
        this[base + 1] =
        this[base + 2] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            -1073741824) === -1073741824;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueSettlePromises = function() {
    if (!this._isSettlePromisesQueued()) {
        async.settlePromises(this);
        this._setSettlePromisesQueued();
    }
};

Promise.prototype._fulfillUnchecked = function (value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!debugging) return;
    if (this._trace !== undefined) {
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!debugging) return;
    if (this._trace !== undefined) {
        contextStack.pop();
    }
};

 /*jshint unused:false*/
function createContext() {
    if (debugging) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === errorObj) {
        this._setRejected();
        var reason = value.e;
        this._settledValue = reason;
        this._cleanValues();
        this._attachExtraTrace(reason);
        this._ensurePossibleRejectionHandled();
    } else {
        var maybePromise = tryConvertToPromise(value, this);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            this._follow(maybePromise);
        } else {
            this._setFulfilled();
            this._settledValue = value;
            this._cleanValues();
        }
    }
};



if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

Promise._makeSelfResolutionError = makeSelfResolutionError;
_dereq_("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
_dereq_("./direct_resolve.js")(Promise);
_dereq_("./synchronous_inspection.js")(Promise);
_dereq_("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.RangeError = RangeError;
Promise.CancellationError = CancellationError;
Promise.TimeoutError = TimeoutError;
Promise.TypeError = TypeError;
Promise.OperationalError = OperationalError;
Promise.RejectionError = OperationalError;
Promise.AggregateError = errors.AggregateError;

util.toFastProperties(Promise);
util.toFastProperties(Promise.prototype);
Promise.Promise = Promise;
CapturedTrace.setBounds(async.firstLineError, util.lastLineError);
_dereq_('./nodeify.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise);
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./cancel.js')(Promise, INTERNAL);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./settle.js')(Promise, PromiseArray);
_dereq_('./call_get.js')(Promise);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./progress.js')(Promise, PromiseArray);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./timers.js')(Promise, INTERNAL, tryConvertToPromise);
_dereq_('./filter.js')(Promise, INTERNAL);

Promise.prototype = Promise.prototype;
return Promise;

};

}).call(this,_dereq_("FWaASH"))
},{"./any.js":1,"./async.js":2,"./call_get.js":4,"./cancel.js":5,"./captured_trace.js":6,"./catch_filter.js":7,"./direct_resolve.js":8,"./each.js":9,"./errors.js":10,"./filter.js":12,"./finally.js":13,"./generators.js":14,"./join.js":15,"./map.js":16,"./nodeify.js":17,"./progress.js":18,"./promise_array.js":20,"./promise_resolver.js":21,"./promisify.js":22,"./props.js":23,"./race.js":25,"./reduce.js":26,"./settle.js":28,"./some.js":29,"./synchronous_inspection.js":30,"./thenables.js":31,"./timers.js":32,"./using.js":33,"./util.js":34,"FWaASH":36}],20:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection) {
var util = _dereq_("./util.js");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -1: return undefined;
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    var parent;
    if (values instanceof Promise) {
        parent = values;
        promise._propagateFrom(parent, 1 | 4);
    }
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values._setBoundTo(this._promise._boundTo);
        values = values._target();
        this._values = values;
        if (values._isFulfilled()) {
            values = values._value();
            if (!isArray(values)) {
                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
                this.__hardReject__(err);
                return;
            }
        } else if (values._isPending()) {
            values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
            return;
        } else {
            this._reject(values._reason());
            return;
        }
    } else if (!isArray(values)) {
        this._promise._follow(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a"));
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var promise = this._promise;
    for (var i = 0; i < len; ++i) {
        var isResolved = this._isResolved();
        var maybePromise = tryConvertToPromise(values[i], promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (isResolved) {
                maybePromise._unsetRejectionIsUnhandled();
            } else if (maybePromise._isPending()) {
                maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                this._promiseFulfilled(maybePromise._value(), i);
            } else {
                this._promiseRejected(maybePromise._reason(), i);
            }
        } else if (!isResolved) {
            this._promiseFulfilled(maybePromise, i);
        }
    }
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype.__hardReject__ =
PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false, true);
};

PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
    this._promise._progress({
        index: index,
        value: progressValue
    });
};


PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

PromiseArray.prototype._promiseRejected = function (reason, index) {
    this._totalResolved++;
    this._reject(reason);
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util.js":34}],21:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = _dereq_("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
}


var PromiseResolver;
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

PromiseResolver.prototype.toString = function () {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._resolveCallback(value);
};

PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._rejectCallback(reason);
};

PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._progress(value);
};

PromiseResolver.prototype.cancel = function () {
    this.promise.cancel();
};

PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./errors.js":10,"./es5.js":11,"./util.js":34}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util.js");
var nodebackForPromise = _dereq_("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultFilter = function(name, func) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        !util.isClass(func);
};
var defaultPromisified = {__isPromisified__: true};


function escapeIdentRegex(str) {
    return str.replace(/([$])/, "\\$");
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

function switchCaseArgumentOrder(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 5);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        if (i === likelyArgumentCount) continue;
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 5; ++i) {
        ret.push(i);
    }
    return ret;
}

function argumentSequence(argumentCount) {
    return util.filledRange(argumentCount, "arguments[", "]");
}

function parameterDeclaration(parameterCount) {
    return util.filledRange(parameterCount, "_arg", "");
}

function parameterCount(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
}

function generatePropertyAccess(key) {
    if (util.isIdentifier(key)) {
        return "." + key;
    }
    else return "['" + key.replace(/(['\\])/g, "\\$1") + "']";
}

function makeNodePromisifiedEval(callback, receiver, originalName, fn, suffix) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var callbackName =
        (typeof originalName === "string" && util.isIdentifier(originalName)
            ? originalName + suffix
            : "promisified");

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (typeof callback === "string") {
            ret = "                                                          \n\
                this.method({{args}}, fn);                                   \n\
                break;                                                       \n\
            ".replace(".method", generatePropertyAccess(callback));
        } else if (receiver === THIS) {
            ret =  "                                                         \n\
                callback.call(this, {{args}}, fn);                           \n\
                break;                                                       \n\
            ";
        } else if (receiver !== undefined) {
            ret =  "                                                         \n\
                callback.call(receiver, {{args}}, fn);                       \n\
                break;                                                       \n\
            ";
        } else {
            ret =  "                                                         \n\
                callback({{args}}, fn);                                      \n\
                break;                                                       \n\
            ";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for(var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }
        var codeForCall;
        if (typeof callback === "string") {
            codeForCall = "                                                  \n\
                this.property.apply(this, args);                             \n\
            "
                .replace(".property", generatePropertyAccess(callback));
        } else if (receiver === THIS) {
            codeForCall = "                                                  \n\
                callback.apply(this, args);                                  \n\
            ";
        } else {
            codeForCall = "                                                  \n\
                callback.apply(receiver, args);                              \n\
            ";
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = fn;                                                    \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", codeForCall);
        return ret;
    }

    return new Function("Promise",
                        "callback",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "INTERNAL","                                         \n\
        var ret = function (Parameters) {                        \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            promise._setIsSpreadable();                                      \n\
            var fn = nodebackForPromise(promise);                            \n\
            try {                                                            \n\
                switch(len) {                                                \n\
                    [CodeForSwitchCase]                                      \n\
                }                                                            \n\
            } catch (e) {                                                    \n\
                var wrapped = maybeWrapAsError(e);                           \n\
                promise._attachExtraTrace(wrapped);                          \n\
                promise._reject(wrapped);                                    \n\
            }                                                                \n\
            return promise;                                                  \n\
        };                                                                   \n\
        ret.__isPromisified__ = true;                                        \n\
        return ret;                                                          \n\
        "
        .replace("FunctionName", callbackName)
        .replace("Parameters", parameterDeclaration(newParameterCount))
        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase()))(
            Promise,
            callback,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            INTERNAL
        );
}

function makeNodePromisifiedClosure(callback, receiver) {
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        if (typeof callback === "string") {
            callback = _receiver[callback];
        }
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        promise._setIsSpreadable();
        var fn = nodebackForPromise(promise);
        try {
            callback.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            var wrapped = maybeWrapAsError(e);
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        }
        return promise;
    }
    promisified.__isPromisified__ = true;
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        obj[promisifiedKey] = promisifier === makeNodePromisified
                ? makeNodePromisified(key, THIS, key, fn, suffix)
                : promisifier(fn, function() {
                    return makeNodePromisified(key, THIS, key, fn, suffix);
                });
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver) {
    return makeNodePromisified(callback, receiver, undefined, callback);
}

Promise.promisify = function (fn, receiver) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    if (isPromisified(fn)) {
        return fn;
    }
    return promisify(fn, arguments.length < 2 ? THIS : receiver);
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
    }
    options = Object(options);
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
    }

    var keys = util.inheritedDataKeys(target, {includeHidden: true});
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier);
            promisifyAll(value, suffix, filter, promisifier);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier);
};
};


},{"./errors":10,"./promise_resolver.js":21,"./util.js":34}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var isObject = util.isObject;
var es5 = _dereq_("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, -3) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 4);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5.js":11,"./util.js":34}],24:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    if (front + length > oldCapacity) {
        var moveItemsCount = (front + length) & (oldCapacity - 1);
        arrayMove(this, 0, this, oldCapacity, moveItemsCount);
    }
};

module.exports = Queue;

},{}],25:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var isArray = _dereq_("./util.js").isArray;

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else if (!isArray(promises)) {
        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 4 | 1);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util.js":34}],26:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    this._zerothIsAccum = (accum === undefined);
    this._gotAccum = false;
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    this._callback = fn;
    this._accum = accum;
    if (!rejected) this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._init = function () {};

ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = 0;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    if (index === 0 && this._zerothIsAccum) {
        if (!gotAccum) {
            this._accum = value;
            this._gotAccum = gotAccum = true;
        }
        valuesPhase[index] = ((valuesPhaseIndex === 0)
            ? 1 : 2);
    } else if (index === -1) {
        if (!gotAccum) {
            this._accum = value;
            this._gotAccum = gotAccum = true;
        }
    } else {
        if (valuesPhaseIndex === 0) {
            valuesPhase[index] = 1;
        }
        else {
            valuesPhase[index] = 2;
            if (gotAccum) {
                this._accum = value;
            }
        }
    }
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundTo;
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === 2) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== 1) return;
        value = values[i];
        if (value instanceof Promise) {
            value = value._target();
            if (value._isFulfilled()) {
                value = value._value();
            } else if (value._isPending()) {
                return;
            } else {
                return this._reject(value._reason());
            }
        }

        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                valuesPhase[i] = 4;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    if (this._reducingIndex < length) return;
    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};

},{"./util.js":34}],27:[function(_dereq_,module,exports){
(function (process){
"use strict";
var schedule;
if (typeof process === "object" && typeof process.version === "string") {
    schedule = parseInt(process.version.split(".")[1], 10) > 10
        ? setImmediate : process.nextTick;
}
else if (typeof MutationObserver !== "undefined") {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
}
else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
}
else {
    schedule = function() {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    };
}
module.exports = schedule;

}).call(this,_dereq_("FWaASH"))
},{"FWaASH":36}],28:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util.js");

function SettledPromiseArray(values) {
    this.constructor$(values);
    this._promise._setIsSpreadable();
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return new SettledPromiseArray(this).promise();
};
};

},{"./util.js":34}],29:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util.js");
var RangeError = _dereq_("./errors.js").RangeError;
var AggregateError = _dereq_("./errors.js").AggregateError;
var isArray = util.isArray;


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    this._promise._setIsSpreadable();
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    if (this._isResolved()) return;
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
    }

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            e.push(this._values[i]);
        }
        this._reject(e);
    }
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    if (promise.isRejected()) {
        return promise;
    }
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors.js":10,"./util.js":34}],30:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValue = promise._settledValue;
    }
    else {
        this._bitField = 0;
        this._settledValue = undefined;
    }
}

PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.isFulfilled =
Promise.prototype._isFulfilled = function () {
    return (this._bitField & 268435456) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype._isRejected = function () {
    return (this._bitField & 134217728) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype._isPending = function () {
    return (this._bitField & 402653184) === 0;
};

PromiseInspection.prototype.isResolved =
Promise.prototype._isResolved = function () {
    return (this._bitField & 402653184) > 0;
};

Promise.prototype.isPending = function() {
    return this._target()._isPending();
};

Promise.prototype.isRejected = function() {
    return this._target()._isRejected();
};

Promise.prototype.isFulfilled = function() {
    return this._target()._isFulfilled();
};

Promise.prototype.isResolved = function() {
    return this._target()._isResolved();
};

Promise.prototype._value = function() {
    return this._settledValue;
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue;
};

Promise.prototype.value = function() {
    var target = this._target();
    if (!target.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return target._settledValue;
};

Promise.prototype.reason = function() {
    var target = this._target();
    if (!target.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return target._settledValue;
};


Promise.PromiseInspection = PromiseInspection;
};

},{}],31:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) {
            return obj;
        }
        else if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
                ret._fulfillUnchecked,
                ret._rejectUncheckedCheckError,
                ret._progressUnchecked,
                ret,
                null
            );
            return ret;
        }
        var then = util.tryCatch(getThen)(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function getThen(obj) {
    return obj.then;
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x,
                                        resolveFromThenable,
                                        rejectFromThenable,
                                        progressFromThenable);
    synchronous = false;
    if (result === errorObj) {
        promise._rejectCallback(result.e, true, true);
    }

    function resolveFromThenable(value) {
        if (x === value) {
            return promise._rejectCallback(
                Promise._makeSelfResolutionError(), false, true);
        }
        promise._resolveCallback(value);
    }

    function rejectFromThenable(reason) {
        promise._rejectCallback(reason, synchronous, true);
    }

    function progressFromThenable(value) {
        if (typeof promise._progress === "function") {
            promise._progress(value);
        }
    }
    return promise;
}

return tryConvertToPromise;
};

},{"./util.js":34}],32:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var util = _dereq_("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    if (!promise.isPending()) return;
    if (typeof message !== "string") {
        message = "operation timed out";
    }
    var err = new TimeoutError(message);
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterDelay = function (value, promise) {
    promise._fulfill(value);
};

var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
    }
    ms = +ms;
    var maybePromise = tryConvertToPromise(value);
    var promise = new Promise(INTERNAL);

    if (maybePromise instanceof Promise) {
        promise._propagateFrom(maybePromise, 4 | 1);
        promise._follow(maybePromise._target());
        return promise.then(function(value) {
            return Promise.delay(value, ms);
        });
    } else {
        setTimeout(function delayTimeout() {
            afterDelay(value, promise);
        }, ms);
    }
    return promise;
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    var target = this._target();
    ms = +ms;
    var ret = new Promise(INTERNAL).cancellable();
    ret._propagateFrom(this, 4 | 1);
    ret._follow(target);
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};

},{"./util.js":34}],33:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext) {
    var TypeError = _dereq_("./errors.js").TypeError;
    var inherits = _dereq_("./util.js").inherits;
    var PromiseInspection = Promise.PromiseInspection;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection._settledValue;
        }
        return inspections;
    }

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = Promise.defer();
        function iterator() {
            if (i >= len) return ret.resolve();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret.promise;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = 268435456;
        return dispose(this, inspection).thenReturn(value);
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = 134217728;
        return dispose(this, inspection).thenThrow(reason);
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise) {
        this.constructor$(fn, promise);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
        len--;
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = arguments[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var promise = Promise.settle(resources)
            .then(inspectionMapper)
            .then(function(vals) {
                promise._pushContext();
                var ret;
                try {
                    ret = fn.apply(undefined, vals);
                } finally {
                    promise._popContext();
                }
                return ret;
            })
            ._then(
                disposerSuccess, disposerFail, undefined, resources, undefined);
        resources.promise = promise;
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 262144;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 262144) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~262144);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors.js":10,"./util.js":34}],34:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var canEvaluate = typeof navigator == "undefined";
var haveGetters = (function(){
    try {
        var o = {};
        es5.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch (e) {
        return false;
    }

})();

var errorObj = {e: {}};
var tryCatchTarget;
function tryCatcher() {
    try {
        return tryCatchTarget.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};

function asString(val) {
    return typeof val === "string" ? val : ("" + val);
}

function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return !isPrimitive(value);
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(asString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}


var wrapsPrimitiveReceiver = (function() {
    return this !== "string";
}).call("string");

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    if (es5.isES5) {
        return function(obj, opts) {
            var ret = [];
            var visitedKeys = Object.create(null);
            var getKeys = Object(opts).includeHidden
                ? Object.getOwnPropertyNames
                : Object.keys;
            while (obj != null) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        return function(obj) {
            var ret = [];
            /*jshint forin:false */
            for (var key in obj) {
                ret.push(key);
            }
            return ret;
        };
    }

})();

function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.keys(fn.prototype);
            return keys.length > 0 &&
                   !(keys.length === 1 && keys[0] === "constructor");
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027*/
    function f() {}
    f.prototype = obj;
    return f;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    asString: asString,
    maybeWrapAsError: maybeWrapAsError,
    wrapsPrimitiveReceiver: wrapsPrimitiveReceiver,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection
};
try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5.js":11}],35:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],36:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],37:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],38:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("FWaASH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":37,"FWaASH":36,"inherits":40}],39:[function(_dereq_,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],40:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],41:[function(_dereq_,module,exports){
var EventEmitter = _dereq_('events').EventEmitter,
    util  = _dereq_('util');

function JqueryEmitter() {
    this.emitting = false;
    
    EventEmitter.call(this);
}

util.inherits(JqueryEmitter, EventEmitter);

function nsMatch(nsIn, nsRegistered) {
    var match = false;
    
    if (Array.isArray(nsIn) && Array.isArray(nsRegistered)) {
        for (var i = 0; i < nsIn.length; i++) {
            if (-1 !== nsRegistered.indexOf(nsIn[i])) {
                match = true;
                break;
            }    
        }    
    }
    
    return match;
}

JqueryEmitter.prototype.emit = function(type) {
    var args = arguments,
        ret  = [],
        _this = this;
  
    type = Array.isArray(type) ? type : type.split(' ');
    
    type.forEach(function(event) {      
        var ns = [],
            handlers,
            newHandlers = [];
            
        if (-1 !== event.indexOf('.') && _this._events) {                            
            ns = event.split('.');
            event = ns.shift();                       
            
            handlers = _this._events[event];
            
            if (handlers) {                
                if (Array.isArray(handlers)) {
                    handlers.forEach(function(handler) {
                        if (nsMatch(ns, handler.__eens)) {
                            newHandlers.push(handler);
                        }
                    })
                    
                    if (newHandlers.length) {
                        _this._events[event] = newHandlers;
                    } else {
                        return;
                    }
                } else if (false == nsMatch(ns, handlers.__eens)){
                    return;
                }
            }                                 
        }
        
        _this.emitting = {event: event, namespaces: ns};
        
        args[0] = event;        
        
        ret.push(EventEmitter.prototype.emit.apply(_this, args));
        
        _this.emitting = false;
        
        if (newHandlers.length) {
            _this._events[event] = handlers;
        }
    })
    
    return ret.length == 1 ? ret[0] : ret;
}

JqueryEmitter.prototype.addListener = function(type, listener) {
    var ns,
        i;
    
    if (-1 !== (i = type.indexOf('.')) && typeof listener == 'function') {
         listener = listener.bind();
         ns = type.split('.');
         type = ns.shift();
         listener.__eens = ns;
    }
    
    return EventEmitter.prototype.addListener.call(this, type, listener);
}

JqueryEmitter.prototype.on = function(type, listener) {
    var isArray = Array.isArray(type),
        _this   = this,
        keys;
    
    if (typeof type == 'string' || isArray) {
        type = isArray ? type : type.split(' ');                
        
        type.forEach(function(ev) {
            _this.addListener(ev, listener);
        })
    } else if (typeof type == 'object') {
        keys = Object.keys(type);
        
        keys.forEach(function(ev) {
            _this.addListener(ev, type[ev]);
        })
    } else {
        EventEmitter.prototype.addListener.call(this, type, listener);
    }           
}

JqueryEmitter.prototype.removeListener = function(type, listener) {
    if (-1 !== type.indexOf('.')) {        
        type = type.split('.').shift();
    }
    
    return EventEmitter.prototype.removeListener.call(this, type, listener);
}

JqueryEmitter.prototype.removeAllListeners = function(type) {
    var ns;

    if (-1 !== type.indexOf('.')) {        
        ns = type.split('.');
        type = ns.shift();  
            
        if (type) {
            this._offNs(ns, type);
        } else {
            if (this._events) {                
                Object.keys(this._events).forEach(this._offNs.bind(this, ns))
            }
        }
    } else {
       EventEmitter.prototype.removeAllListeners.call(this, type);  
    }  
    
    return this;
}

JqueryEmitter.prototype._offNs = function(ns, type) {
    var handlers = this._events && this._events[type],
        _this = this;
            
    if (handlers) {
        if (Array.isArray(handlers)) {                    
            handlers.forEach(function(handler) {
                if (nsMatch(ns, handler.__eens)) {
                    _this.removeListener(type, handler);
                }
            })
        } else if (nsMatch(ns, handlers.__eens)) {
            this.removeListener(type, handlers);
        }
    }
}

JqueryEmitter.prototype.off = function(type, listener) {
    var isArray = Array.isArray(type),
        _this   = this,
        hasListener = typeof listener == 'function',        
        keys;
        
    if (typeof type == 'string' || isArray) {
        type = isArray ? type : type.split(' ');
        
        type.forEach(function(ev) {
            if (hasListener) {
                _this.removeListener(ev, listener);
            } else {
                _this.removeAllListeners(ev);
            }            
        })
    } else if (typeof type == 'object') {
        keys = Object.keys(type);
        
        keys.forEach(function(ev) {
            if (typeof type[ev] == 'function') {
                _this.removeListener(ev, type[ev]);
            } else {
                _this.removeAllListeners(ev);
            }             
        })
    }
      
    return this;
}

module.exports = function(instance) {
    return instance;
}.bind(null, new JqueryEmitter);

var instances = {};

module.exports.create = function(instance) {
    var jqee;
    
    if (instance && instances[instance]) {
        jqee = instances[instance];    
    } else {
        jqee = new JqueryEmitter
    }
    
    return jqee;
};

module.exports.EventEmitter = JqueryEmitter;


},{"events":35,"util":38}],42:[function(_dereq_,module,exports){
/* exported Hoodie */

// Hoodie Core
// -------------
//
// the door to world domination (apps)
//

// Constructor
// -------------

// When initializing a hoodie instance, an optional URL
// can be passed. That's the URL of the hoodie backend.
// If no URL passed it defaults to the current domain.
//
//     // init a new hoodie instance
//     hoodie = new Hoodie
//
var Hoodie = module.exports = (function() {

  // for plugins
  var lib = _dereq_('./lib');
  var utils = _dereq_('./utils');

  function Hoodie(baseUrl) {
    var hoodie = this;

    // enforce initialization with `new`
    if (!(hoodie instanceof Hoodie)) {
      throw new Error('usage: new Hoodie(url);');
    }

    // remove trailing slashes
    hoodie.baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : '';


    // hoodie.extend
    // ---------------

    // extend hoodie instance:
    //
    //     hoodie.extend(function(hoodie) {} )
    //
    hoodie.extend = function extend(extension) {
      extension(hoodie, lib, utils);
    };

    utils.events(hoodie);

    //
    // Extending hoodie core
    //

    // order matters b/c of cross module dependencies
    hoodie.extend(_dereq_('./hoodie/id'));
    hoodie.extend(_dereq_('./hoodie/open'));
    hoodie.extend(_dereq_('./hoodie/request'));
    hoodie.extend(_dereq_('./hoodie/connection'));

    hoodie.extend(_dereq_('./hoodie/store'));
    hoodie.extend(_dereq_('./hoodie/account'));
    hoodie.extend(_dereq_('./hoodie/remote'));
    hoodie.extend(_dereq_('./hoodie/task'));

    // authenticate
    // we use a closure to not pass the username to connect, as it
    // would set the name of the remote store, which is not the username.
    hoodie.account.authenticate().then(function( /* username */ ) {
      return hoodie.remote.connect();
    }).catch(function() {
      // silent "Unhandled promise rejection" in case of error
    });

    //
    // loading user extensions
    //
    applyExtensions(hoodie);
  }

  // Extending hoodie
  // ------------------

  // You can extend the Hoodie class like so:
  //
  // Hoodie.extend(function(hoodie) { hoodie.myMagic = function() {} })
  //
  var extensions = [];

  //
  // detect available extensions and attach to Hoodie Object.
  //
  function applyExtensions(hoodie) {
    for (var i = 0; i < extensions.length; i++) {
      extensions[i](hoodie, lib, utils);
    }
  }

  Hoodie.extend = function(extension) {
    extensions.push(extension);
  };

  return Hoodie;
})();

},{"./hoodie/account":45,"./hoodie/connection":46,"./hoodie/id":47,"./hoodie/open":48,"./hoodie/remote":49,"./hoodie/request":50,"./hoodie/store":54,"./hoodie/task":58,"./lib":64,"./utils":79}],43:[function(_dereq_,module,exports){
(function (global){
// Hoodie.Account
// ================

var helpers = _dereq_('./helpers');

var utils = _dereq_('../../utils');
var generateId = utils.generateId;
var config = utils.config;
var promise = utils.promise;
var reject = promise.reject;
var resolve = promise.resolve;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;

// Authenticate
// --------------

// Use this method to assure that the user is authenticated:
// `hoodie.account.authenticate().done( doSomething ).fail( handleError )`
//
exports.authenticate = function(state) {
  var requests = state.requests;
  // already tried to authenticate, and failed
  if (state.authenticated === false) {
    return reject();
  }

  // already tried to authenticate, and succeeded
  if (state.authenticated === true) {
    return resolveWith(state.username);
  }

  // if there is a pending signOut request, return its promise,
  // but pipe it so that it always ends up rejected
  //
  if (requests.signOut && requests.signOut.state === 'pending') {
    return requests.signOut.then(reject);
  }

  // if there is a pending signIn request, return its promise
  //
  if (requests.signIn && requests.signIn.state === 'pending') {
    return state.requests.signIn;
  }

  // if user has no account, make sure to end the session
  if (!exports.hasAccount(state)) {
    return helpers.sendSignOutRequest(state).then(function() {
      state.authenticated = false;
      return reject();
    });
  }

  // send request to check for session status. If there is a
  // pending request already, return its promise.
  //
  return helpers.withSingleRequest(state, 'authenticate', function() {
    return exports.request(state, 'GET', '/_session')
      .then(helpers.handleAuthenticateRequestSuccess.bind(null, state));
  });
};


// hasValidSession
// -----------------

// returns true if the user is signed in, and has a valid cookie.
//
exports.hasValidSession = function(state) {
  if (!exports.hasAccount(state)) {
    return false;
  }

  return state.authenticated === true;
};


// hasInvalidSession
// -----------------

// returns true if the user is signed in, but does not have a valid cookie
//
exports.hasInvalidSession = function(state) {
  if (!exports.hasAccount(state)) {
    return false;
  }

  return state.authenticated === false;
};


// sign up with username & password
// ----------------------------------

// uses standard CouchDB API to create a new document in _users db.
// The backend will automatically create a userDB based on the username
// address and approve the account by adding a 'confirmed' role to the
// user doc. The account confirmation might take a while, so we keep trying
// to sign in with a 300ms timeout.
//
exports.signUp = function(state, username, password) {
  if (password === undefined) {
    password = '';
  }

  if (!username) {
    return rejectWith('Username must be set.');
  }

  if (exports.hasAnonymousAccount(state)) {
    return helpers.upgradeAnonymousAccount(state, username, password);
  }

  if (exports.hasAccount(state)) {
    return rejectWith('Must sign out first.');
  }

  return helpers.sendSignUpRequest(state, username, password)
    .done(function() {
      helpers.setUsername(state, username);
      state.events.trigger('signup', username);
    });
};


// anonymous sign up
// -------------------

// If the user did not sign up yet, but data needs to be transferred
// to the couch, e.g. to send an email or to share data, the anonymousSignUp
// method can be used. It generates a random password and stores it locally
// in the browser.
//
// If the user signs up for real later, we 'upgrade' the account, meaning we
// change the username and password internally instead of creating another user.
//
exports.anonymousSignUp = function(state) {
  var password, username;

  password = generateId(10);
  username = state.hoodie.id();

  return helpers.sendSignUpRequest(state, username, password)
  .progress( function() {
    helpers.setAnonymousPassword(state, password);
  })
  .done(function() {
    state.events.trigger('signup:anonymous');
  }).then(function() {
    // resolve with null, do not pass anonymous username
    return resolve();
  });
};


// hasAccount
// ---------------------

//
exports.hasAccount = function(state) {
  var hasUsername = !!state.username;
  return hasUsername || exports.hasAnonymousAccount(state);
};


// hasAnonymousAccount
// ---------------------

// anonymous accounts get created when data needs to be
// synced without the user having an account. That happens
// automatically when the user creates a task, but can also
// be done manually using hoodie.account.anonymousSignUp(),
// e.g. to prevent data loss.
//
// To determine between anonymous and "real" accounts, we
// can compare the username to the hoodie.id, which is the
// same for anonymous accounts.
exports.hasAnonymousAccount = function(state) {
  return !!helpers.getAnonymousPassword(state);
};

// sign in with username & password
// ----------------------------------

// uses standard CouchDB API to create a new user session (POST /_session).
// Besides the standard sign in we also check if the account has been confirmed
// (roles include 'confirmed' role).
//
// When signing in, by default all local data gets cleared beforehand.
// Otherwise data that has been created beforehand (authenticated with another user
// account or anonymously) would be merged into the user account that signs in.
// That only applies if username isn't the same as current username.
//
// To prevent data loss, signIn can be called with options.moveData = true, that wll
// move all data from the anonymous account to the account the user signed into.
//
exports.signIn = function(state, username, password, options) {
  var isReauthenticating = (username === state.username);
  var isSilent;
  var promise;

  if (!username) { username = ''; }
  if (!password) { password = ''; }
  username = username.toLowerCase();

  options = options || {};
  isSilent = options.silent;

  if (exports.hasAccount(state) && !isReauthenticating && !options.moveData) {
    promise = helpers.pushLocalChanges(state, options).then(function() {
      return helpers.sendSignInRequest(state, username, password, options);
    });
  } else {
    promise = helpers.sendSignInRequest(state, username, password, options);
  }

  if (!isReauthenticating) {
    promise.done(helpers.disconnect.bind(null, state));
  }

  promise.done( function(newUsername) {
    if (options.moveData) {
      state.events.trigger('movedata');
    }
    if (!isReauthenticating && !options.moveData) {
      helpers.cleanup(state);
      helpers.setBearerToken(state, state.newBearerToken);
    }
    if (isReauthenticating) {
      if (!isSilent) {
        state.events.trigger('reauthenticated', newUsername);
      }
    } else {
      helpers.setUsername(state, newUsername);

      if (!isSilent) {
        state.events.trigger('signin', newUsername, state.newHoodieId, options);
      }
    }
  });

  return promise;
};

// sign out
// ---------

// uses standard CouchDB API to invalidate a user session (DELETE /_session)
//
exports.signOut = function(state, options) {
  var cleanupMethod, promise, currentUsername;
  options = options || {};
  cleanupMethod = options.silent ? helpers.cleanup : helpers.cleanupAndTriggerSignOut;
  currentUsername = state.username;

  if (!exports.hasAccount(state)) {
    promise = cleanupMethod(state);
  } else if (options.moveData) {
    promise = helpers.sendSignOutRequest(state);
  } else {
    promise = helpers.pushLocalChanges(state, options)
      .then(helpers.disconnect.bind(null, state))
      .then(helpers.sendSignOutRequest.bind(null, state))
      .then(cleanupMethod.bind(null, state));
  }

  return promise.then(function() {
    return resolveWith(currentUsername);
  });
};


// Request
// ---

// shortcut
//
exports.request = function(state, type, url, options) {
  return state.hoodie.request.apply(state.hoodie, [
    type,
    url,
    options || {}
  ]);
};


// db
// ----

// return name of db
//
exports.db = function(state) {
  return 'user/' + state.hoodie.id();
};


// fetch
// -------

// fetches _users doc from CouchDB and caches it in _doc
//
exports.fetch = function(state, username) {
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : state.username;

  if (username === undefined) {
    username = currentUsername;
  }

  if (!username) {
    return rejectWith({
      name: 'HoodieUnauthorizedError',
      message: 'Not signed in'
    });
  }

  return helpers.withSingleRequest(state, 'fetch', function() {
    return exports.request(state, 'GET', helpers.userDocUrl(state, username)).done(function(response) {
      state.userDoc = response;
      return state.userDoc;
    });
  });
};


// change password
// -----------------

// Note: the hoodie API requires the currentPassword for security reasons,
// but couchDb doesn't require it for a password change, so it's ignored
// in this implementation of the hoodie API.
//
exports.changePassword = function(state, currentPassword, newPassword) {

  if (!state.username) {
    return rejectWith({
      name: 'HoodieUnauthorizedError',
      message: 'Not signed in'
    });
  }

  helpers.disconnect(state);

  return exports.fetch(state)
    .then(helpers.sendChangeUsernameAndPasswordRequest(state, currentPassword, null, newPassword))
    .then(function() {
      // resolve with null instead of current username
      return resolve();
    })
    .done( function() {
      state.events.trigger('changepassword');
    });
};


// reset password
// ----------------

// This is kind of a hack. We need to create an object anonymously
// that is not exposed to others. The only CouchDB API offering such
// functionality is the _users database.
//
// So we actually sign up a new couchDB user with some special attributes.
// It will be picked up by the password reset worker and removed
// once the password was reset.
//
exports.resetPassword = function(state, username) {
  var data, key, options, resetPasswordId;

  resetPasswordId = config.get('_account.resetPasswordId');

  if (resetPasswordId) {
    return exports.checkPasswordReset(state);
  }

  resetPasswordId = '' + username + '/' + (generateId());

  config.set('_account.resetPasswordId', resetPasswordId);

  key = '' + state.userDocPrefix + ':$passwordReset/' + resetPasswordId;

  data = {
    _id: key,
    name: '$passwordReset/' + resetPasswordId,
    type: 'user',
    roles: [],
    password: resetPasswordId,
    createdAt: helpers.now(state),
    updatedAt: helpers.now(state)
  };

  options = {
    data: JSON.stringify(data),
    contentType: 'application/json'
  };

  // TODO: spec that checkPasswordReset gets executed
  return helpers.withPreviousRequestsAborted(state, 'resetPassword', function() {
    return exports.request(state, 'PUT', '/_users/' + (encodeURIComponent(key)), options)
      .done(exports.checkPasswordReset.bind(null, state))
      .then(helpers.awaitPasswordResetResult.bind(null, state))
      .done(function() {
        state.events.trigger('resetpassword');
      });
  });
};

// checkPasswordReset
// ---------------------

// check for the status of a password reset. It might take
// a while until the password reset worker picks up the job
// and updates it
//
// If a password reset request was successful, the $passwordRequest
// doc gets removed from _users by the worker, therefore a 401 is
// what we are waiting for.
//
// Once called, it continues to request the status update with a
// one second timeout.
//
exports.checkPasswordReset = function(state) {
  var hash, options, resetPasswordId, url, username, couchUsername;

  // reject if there is no pending password reset request
  resetPasswordId = config.get('_account.resetPasswordId');

  if (!resetPasswordId) {
    return rejectWith('No pending password reset.');
  }

  // username is part of resetPasswordId, see account.resetPassword
  username = resetPasswordId.split('/')[0];

  // send request to check status of password reset
  couchUsername = '$passwordReset/' + resetPasswordId;
  url = '/_users/' + (encodeURIComponent(state.userDocPrefix + ':' + couchUsername));
  hash = btoa(couchUsername + ':' + resetPasswordId);

  options = {
    headers: {
      Authorization: 'Basic ' + hash
    }
  };

  return helpers.withSingleRequest(state, 'passwordResetStatus', function() {
    return exports.request(state, 'GET', url, options)
      .then(helpers.handlePasswordResetStatusRequestSuccess.bind(null, state), helpers.handlePasswordResetStatusRequestError(state, username))
      .fail(function(error) {
        if (error.name === 'HoodiePendingError') {
          global.setTimeout(exports.checkPasswordReset.bind(null, state), 1000);
          return;
        }
        return state.events.trigger('error:passwordreset', error, username);
      });
  });
};


// change username
// -----------------

// Note: the hoodie API requires the current password for security reasons,
// but technically we cannot (yet) prevent the user to change the username
// without knowing the current password, so it's ignored in the current
// implementation.
//
// But the current password is needed to login with the new username.
//
exports.changeUsername = function(state, currentPassword, newUsername) {
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : state.username;

  if (newUsername !== currentUsername) {
    newUsername = newUsername || '';
    return helpers.changeUsernameAndPassword(state, currentPassword, newUsername.toLowerCase())
    .done( function() {
      helpers.setUsername(state, newUsername);
      state.events.trigger('changeusername', newUsername);
    });
  }
  return rejectWith({
    name: 'HoodieConflictError',
    message: 'Usernames identical'
  });
};


// destroy
// ---------

// destroys a user's account
//
exports.destroy = function(state) {
  var currentUsername = state.username;
  var promise;

  if (!exports.hasAccount(state)) {
    promise = helpers.cleanupAndTriggerSignOut(state);
  } else {
    promise = exports.fetch(state)
      .then(helpers.handleFetchBeforeDestroySuccess.bind(null, state), helpers.handleFetchBeforeDestroyError.bind(null, state))
      .then(helpers.cleanupAndTriggerSignOut.bind(null, state))
      .then(function() {
        return currentUsername;
      });
  }

  return promise.then(function() {
    state.events.trigger('destroy', currentUsername);
    return resolveWith(currentUsername);
  });
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../utils":79,"./helpers":44}],44:[function(_dereq_,module,exports){
(function (global){
var extend = _dereq_('extend');

var utils = _dereq_('../../utils');
var config = utils.config;
var promise = utils.promise;
var getDefer = promise.defer;
var reject = promise.reject;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;
var resolve = promise.resolve;

var ANONYMOUS_PASSWORD_KEY = '_account.anonymousPassword';
// PRIVATE
// ---------

// set / get / remove anonymous password
// ---------------------------------------

exports.setAnonymousPassword = function(state, password) {
  return config.set(ANONYMOUS_PASSWORD_KEY, password);
};

exports.getAnonymousPassword = function() {
  return config.get(ANONYMOUS_PASSWORD_KEY);
};

exports.removeAnonymousPassword = function() {
  return config.unset(ANONYMOUS_PASSWORD_KEY);
};

exports.anonymousSignIn = function(state) {
  var username = state.hoodie.id();
  var password = exports.getAnonymousPassword(state);
  return state.hoodie.account.signIn(username, password)
    .done(function() {
      state.events.trigger('signin:anonymous', username);
    });
};


// reauthenticate: force hoodie to reauthenticate
exports.reauthenticate = function(state) {
  state.authenticated = undefined;
  return state.hoodie.account.authenticate();
};

// setters
exports.setUsername = function(state, newUsername) {
  if (state.username === newUsername) {
    return;
  }

  state.username = newUsername;
  return config.set('_account.username', newUsername);
};

exports.setBearerToken = function(state, newBearerToken) {
  if (state.hoodie.account.bearerToken === newBearerToken) {
    return;
  }

  state.hoodie.account.bearerToken = newBearerToken;
  return config.set('_account.bearerToken', newBearerToken);
};

//
// handle a successful authentication request.
//
// As long as there is no server error or internet connection issue,
// the authenticate request (GET /_session) does always return
// a 200 status. To differentiate whether the user is signed in or
// not, we check `userCtx.name` in the response. If the user is not
// signed in, it's null, otherwise the name the user signed in with
//
// If the user is not signed in, we differentiate between users that
// signed in with a username / password or anonymously. For anonymous
// users, the password is stored in local store, so we don't need
// to trigger an 'unauthenticated' error, but instead try to sign in.
//
exports.handleAuthenticateRequestSuccess = function(state, response) {
  if (response.userCtx.name) {
    state.authenticated = true;
    return resolveWith(state.username);
  }

  if (state.hoodie.account.hasAnonymousAccount()) {
    return exports.anonymousSignIn(state);
  }

  state.authenticated = false;
  state.events.trigger('error:unauthenticated');
  return reject();
};


//
// handle response of a successful signUp request.
// Response looks like:
//
//     {
//         'ok': true,
//         'id': 'org.couchdb.user:joe',
//         'rev': '1-e8747d9ae9776706da92810b1baa4248'
//     }
//
exports.handleSignUpSuccess = function(state, username, password) {

  return function(response) {
    state.userDoc._rev = response.rev;
    return exports.delayedSignIn(state, username, password);
  };
};

//
// handle response of a failed signUp request.
//
// In case of a conflict, reject with "username already exists" error
// https://github.com/hoodiehq/hoodie.js/issues/174
// Error passed for request looks like this
//
//     {
//         "name": "HoodieConflictError",
//         "message": "Object already exists."
//     }
exports.handleSignUpError = function(state, username) {

  return function(error) {
    if (error.name === 'HoodieConflictError') {
      error.message = 'Username ' + username + ' already exists';
    }
    return rejectWith(error);
  };
};


//
// a delayed sign in is used after sign up and after a
// username change.
//
exports.delayedSignIn = function(state, username, password, options, defer) {

  // delayedSignIn might call itself, when the user account
  // is pending. In this case it passes the original defer,
  // to keep a reference and finally resolve / reject it
  // at some point
  if (!defer) {
    defer = getDefer();
  }

  global.setTimeout(function() {
    var promise = exports.sendSignInRequest(state, username, password, options);
    promise.done(defer.resolve);
    promise.fail(function(error) {
      if (error.name === 'HoodieAccountUnconfirmedError') {

        // It might take a bit until the account has been confirmed
        exports.delayedSignIn(state, username, password, options, defer);
      } else {
        defer.reject.apply(defer, arguments);
      }
    });

  }, 300);

  return defer.promise;
};


//
// parse a successful sign in response from couchDB.
// Response looks like:
//
//     {
//         'ok': true,
//         'name': 'test1',
//         'roles': [
//             'mvu85hy',
//             'confirmed'
//         ]
//     }
//
// we want to turn it into 'test1', 'mvu85hy' or reject the promise
// in case an error occurred ('roles' array contains 'error' or is empty)
//
exports.handleSignInSuccess = function(state, options) {
  options = options || {};

  return function(response) {
    var newUsername;
    var newHoodieId;
    var newBearerToken;

    newUsername = response.name.replace(/^user(_anonymous)?\//, '');
    newHoodieId = response.roles[0];
    newBearerToken = response.bearerToken;

    //
    // if an error occurred, the userDB worker stores it to the $error attribute
    // and adds the 'error' role to the users doc object. If the user has the
    // 'error' role, we need to fetch his _users doc to find out what the error
    // is, before we can reject the promise.
    //
    // TODO:
    // In that case we reject the sign in, but towards the backend we still get
    // a new session, and the old one gets removed. That leads to a state like
    // a session timeout: I'm still signed in with the old username, but not
    // authorized anymore. A better approach might be to send an extra
    // GET /_users/<user-doc-id> with HTTP basic auth to see if the user account
    // is valid and only if it is, we'd send the POST /_session request.
    //
    if (response.roles.indexOf('error') !== -1) {
      return state.hoodie.account.fetch(newUsername).then(function() {
        return rejectWith(state.userDoc.$error);
      });
    }

    //
    // When the userDB worker created the database for the user and everything
    // worked out, it adds the role 'confirmed' to the user. If the role is
    // not present yet, it might be that the worker didn't pick up the the
    // user doc yet, or there was an error. In this cases, we reject the promise
    // with an 'unconfirmed error'
    //
    if (response.roles.indexOf('confirmed') === -1) {
      return rejectWith({
        name: 'HoodieAccountUnconfirmedError',
        message: 'Account has not been confirmed yet'
      });
    }
    state.authenticated = true;

    state.newHoodieId = newHoodieId;
    state.newBearerToken = newBearerToken;

    // TODO: remove setBearerToken & account.fetch here.
    //       Find a better way to get user account properties
    //       after sign in / sign up.
    exports.setBearerToken(state, newBearerToken);
    state.hoodie.account.fetch(newUsername);

    return resolveWith(newUsername);
  };
};


//
// If the request was successful there might have occurred an
// error, which the worker stored in the special $error attribute.
// If that happens, we return a rejected promise with the error
// Otherwise reject the promise with a 'pending' error,
// as we are not waiting for a success full response, but a 401
// error, indicating that our password was changed and our
// current session has been invalidated
//
exports.handlePasswordResetStatusRequestSuccess = function(state, passwordResetObject) {
  var error;

  if (passwordResetObject.$error) {
    error = passwordResetObject.$error;
    error.object = passwordResetObject;
    delete error.object.$error;
  } else {
    error = {
      name: 'HoodiePendingError',
      message: 'Password reset is still pending'
    };
  }
  return rejectWith(error);
};


//
// If the error is a 401, it's exactly what we've been waiting for.
// In this case we resolve the promise.
//
exports.handlePasswordResetStatusRequestError = function(state, username) {
  return function(error) {
    if (error.name === 'HoodieUnauthorizedError') {
      config.unset('_account.resetPasswordId');
      state.events.trigger('passwordreset', username);

      return resolve();
    } else {
      return rejectWith(error);
    }
  };
};


//
// wait until a password reset gets either completed or marked as failed
// and resolve / reject respectively
//
exports.awaitPasswordResetResult = function(state) {
  var defer = getDefer();

  state.events.once('passwordreset', defer.resolve );
  state.events.on('error:passwordreset', exports.removePasswordResetObject.bind(null, state));
  state.events.on('error:passwordreset', defer.reject );

  // clean up callbacks when either gets called
  defer.always( function() {
    state.events.removeListener('passwordreset', defer.resolve );
    state.events.removeListener('error:passwordreset', exports.removePasswordResetObject.bind(null, state));
    state.events.removeListener('error:passwordreset', defer.reject );
  });

  return defer.promise;
};

//
// when a password reset fails, remove it from /_users
//
exports.removePasswordResetObject = function(state, error) {
  var passwordResetObject = error.object;

  // get username & password for authentication
  var username = passwordResetObject.name; // $passwordReset/username/randomhash
  var password = username.substr(15); // => // username/randomhash
  var url = '/_users/' + (encodeURIComponent(state.userDocPrefix + ':' + username));
  var hash = btoa(username + ':' + password);

  // mark as deleted
  passwordResetObject._deleted = true;

  var options = {
    headers: {
      Authorization: 'Basic ' + hash
    },
    contentType: 'application/json',
    data: JSON.stringify(passwordResetObject)
  };

  // cleanup
  state.hoodie.account.request('PUT', url, options);
  config.unset('_account.resetPasswordId');
};

//
// change username and password in 3 steps
//
// 1. assure we have a valid session
// 2. update _users doc with new username and new password (if provided)
// 3. if username changed, wait until current _users doc got removed
// 3. sign in with new credentials to create new session.
//
exports.changeUsernameAndPassword = function(state, currentPassword, newUsername, newPassword) {
  var currentUsername = state.hoodie.account.hasAnonymousAccount() ? state.hoodie.id() : state.username;

  return exports.sendSignInRequest(state, currentUsername, currentPassword).then(function() {
    return state.hoodie.account.fetch()
    .then(exports.sendChangeUsernameAndPasswordRequest(state, currentPassword, newUsername, newPassword));
  });
};


//
// turn an anonymous account into a real account. Internally, this is what happens:
//
// 1. rename the username from `<hoodieId>` to `username`
// 2. Set password to `password`
// 3.
//
exports.upgradeAnonymousAccount = function(state, username, password) {
  var currentPassword = exports.getAnonymousPassword(state);

  return exports.changeUsernameAndPassword(state, currentPassword, username, password)
    .done(function() {
      state.events.trigger('signup', username);
      exports.removeAnonymousPassword(state);
    });
};


//
// we now can be sure that we fetched the latest _users doc, so we can update it
// without a potential conflict error.
//
exports.handleFetchBeforeDestroySuccess = function(state) {

  exports.disconnect(state);
  state.userDoc._deleted = true;

  return exports.withPreviousRequestsAborted(state, 'updateUsersDoc', function() {
    state.hoodie.account.request('PUT', exports.userDocUrl(state), {
      data: JSON.stringify(state.userDoc),
      contentType: 'application/json'
    });
  });
};

//
// dependant on what kind of error we get, we want to ignore
// it or not.
// When we get a 'HoodieNotFoundError' it means that the _users doc have
// been removed already, so we don't need to do it anymore, but
// still want to finish the destroy locally, so we return a
// resolved promise
//
exports.handleFetchBeforeDestroyError = function(state, error) {
  if (error.name === 'HoodieNotFoundError') {
    return resolve();
  } else {
    return rejectWith(error);
  }
};

//
// remove everything form the current account, so a new account can be initiated.
// make sure to remove a promise.
//
exports.cleanup = function(state) {

  // allow other modules to clean up local data & caches
  state.events.trigger('cleanup');
  state.authenticated = undefined;
  exports.setUsername(state, undefined);
  exports.setBearerToken(state, undefined);

  return resolve();
};

//
// make sure to remove a promise
//
exports.disconnect = function(state) {
  return state.hoodie.remote.disconnect();
};


//
exports.cleanupAndTriggerSignOut = function(state) {
  var username = state.username;
  return exports.cleanup(state).then(function() {
    return state.events.trigger('signout', username);
  });
};


//
// depending on whether the user signedUp manually or has been signed up
// anonymously the prefix in the CouchDB _users doc differentiates.
// An anonymous user is characterized by its username, that equals
// its hoodie.id (see `anonymousSignUp`)
//
// We differentiate with `hasAnonymousAccount()`, because `userTypeAndId`
// is used within `signUp` method, so we need to be able to differentiate
// between anonymous and normal users before an account has been created.
//
exports.userTypeAndId = function(state, username) {
  var type;

  if (username === state.hoodie.id()) {
    type = 'user_anonymous';
  } else {
    type = 'user';
  }
  return '' + type + '/' + username;
};


//
// turn a username into a valid _users doc._id
//
exports.userDocKey = function(state, username) {
  var currentUsername = state.hoodie.account.hasAnonymousAccount() ? state.hoodie.id() : state.username;

  username = username || currentUsername;
  return '' + state.userDocPrefix + ':' + exports.userTypeAndId(state, username);
};

//
// get URL of my _users doc
//
exports.userDocUrl = function(state, username) {
  return '/_users/' + (encodeURIComponent(exports.userDocKey(state, username)));
};


//
// update my _users doc.
//
// If a new username has been passed, we set the special attribute $newUsername.
// This will let the username change worker create create a new _users doc for
// the new username and remove the current one
//
// If a new password has been passed, salt and password_sha get removed
// from _users doc and add the password in clear text. CouchDB will replace it with
// according password_sha and a new salt server side
//
exports.sendChangeUsernameAndPasswordRequest = function(state, currentPassword, newUsername, newPassword) {

  return function() {
    // prepare updated _users doc
    var data = extend({}, state.userDoc);

    if (newUsername) {
      data.$newUsername = newUsername;
    }

    data.updatedAt = exports.now(state);
    data.signedUpAt = data.signedUpAt || exports.now(state);

    // trigger password update when newPassword set
    if (newPassword !== undefined) {
      delete data.salt;
      delete data.password_sha;
      data.password = newPassword;
    }

    var options = {
      data: JSON.stringify(data),
      contentType: 'application/json'
    };

    return exports.withPreviousRequestsAborted(state, 'updateUsersDoc', function() {
      return state.hoodie.account.request('PUT', exports.userDocUrl(state), options)
      .then(exports.handleChangeUsernameAndPasswordResponse(state, newUsername, newPassword || currentPassword));
    });

  };
};


//
// depending on whether a newUsername has been passed, we can sign in right away
// or have to wait until the worker removed the old account
//
exports.handleChangeUsernameAndPasswordResponse = function(state, newUsername, newPassword) {
  var currentUsername = state.hoodie.account.hasAnonymousAccount() ? state.hoodie.id() : state.username;

  return function() {
    exports.disconnect(state);

    if (newUsername) {
      // note that if username has been changed, newPassword is the current password.
      // We always change either the one, or the other.
      return exports.awaitCurrentAccountRemoved(state, currentUsername, newPassword).then( function() {

        // we do signOut explicitly although signOut is build into hoodie.signIn to
        // work around trouble in case of local changes. See
        // https://github.com/hoodiehq/hoodie.js/issues/256
        return state.hoodie.account.signOut({silent:true, moveData: true}).then(function() {
          return state.hoodie.account.signIn(newUsername, newPassword, {moveData: true, silent: true});
        });
      });
    } else {
      return state.hoodie.account.signIn(currentUsername, newPassword, {silent: true});
    }
  };
};

//
// keep sending sign in requests until the server returns a 401
//
exports.awaitCurrentAccountRemoved = function(state, username, password, defer) {
  if (!defer) {
    defer = getDefer();
  }

  var requestOptions = {
    data: {
      name: exports.userTypeAndId(state, username),
      password: password
    }
  };

  exports.withPreviousRequestsAborted(state, 'signIn', function() {
    return state.hoodie.account.request('POST', '/_session', requestOptions);
  }).done(function() {
    global.setTimeout(exports.awaitCurrentAccountRemoved.bind(null, state), 300, username, password, defer);
  }).fail(function(error) {
    if (error.status === 401) {
      return defer.resolve();
    }

    defer.reject(error);
  });

  return defer.promise;
};


//
// make sure that the same request doesn't get sent twice
// by cancelling the previous one.
//
exports.withPreviousRequestsAborted = function(state, name, requestFunction) {
  if (state.requests[name] !== undefined) {
    if (typeof state.requests[name].abort === 'function') {
      state.requests[name].abort();
    }
  }
  state.requests[name] = requestFunction();
  return state.requests[name];
};


//
// if there is a pending request, return its promise instead
// of sending another request
//
exports.withSingleRequest = function(state, name, requestFunction) {

  if (state.requests[name] && state.requests[name].state === 'pending') {
    return state.requests[name];
  }

  state.requests[name] = requestFunction();
  state.requests[name].state = 'pending';
  state.requests[name].then(function() {
    state.requests[name].state = 'fullfiled';
  },function() {
    state.requests[name].state = 'rejected';
  });
  return state.requests[name];
};


//
// push local changes when user signs out, unless he enforces sign out
// in any case with `{ignoreLocalChanges: true}`
//
exports.pushLocalChanges = function(state, options) {
  if (state.hoodie.store.hasLocalChanges() && !options.ignoreLocalChanges) {
    return state.hoodie.remote.push();
  }
  return resolve();
};

//
exports.sendSignOutRequest = function(state) {
  return exports.withSingleRequest(state, 'signOut', function() {
    return state.hoodie.account.request('DELETE', '/_session');
  });
};


//
// the sign in request that starts a CouchDB session if
// it succeeds. We separated the actual sign in request from
// the signIn method, as the latter also runs signOut internally
// to clean up local data before starting a new session. But as
// other methods like signUp or changePassword do also need to
// sign in the user (again), these need to send the sign in
// request but without a signOut beforehand, as the user remains
// the same.
//
exports.sendSignInRequest = function(state, username, password, options) {
  var requestOptions = {
    data: {
      name: exports.userTypeAndId(state, username),
      password: password
    }
  };

  return exports.withPreviousRequestsAborted(state, 'signIn', function() {
    var promise = state.hoodie.account.request('POST', '/_session', requestOptions);

    return promise.then(exports.handleSignInSuccess(state, options));
  });
};

//
// Creates a /_users document that will techincally allow
// to authenticate with passed username / password. But in
// Hoodie there is also an "unconfirmed" state that is the
// default state until the Hoodie Server creates the user
// database and sets a confirmed flag + user roles.
//
// sendSignUpRequest calls the progress callbacks when the
// user doc got created, but does not resolve before the
// user account got confirmed.
//
exports.sendSignUpRequest = function(state, username, password) {
  var defer = getDefer();
  var options;

  username = username.toLowerCase();
  options = {
    data: JSON.stringify({
      _id: exports.userDocKey(state, username),
      name: exports.userTypeAndId(state, username),
      type: 'user',
      roles: [],
      password: password,
      hoodieId: state.hoodie.id(),
      database: state.hoodie.account.db(),
      updatedAt: exports.now(state),
      createdAt: exports.now(state),
      signedUpAt: username !== state.hoodie.id() ? exports.now(state) : void 0
    }),
    contentType: 'application/json'
  };
  state.hoodie.account.request('PUT', exports.userDocUrl(state, username), options)
  .done(defer.notify)
  .then(exports.handleSignUpSuccess(state, username, password), exports.handleSignUpError(state, username))
  .then(defer.resolve, defer.reject);

  return defer.promise;
};


//
exports.now = function() {
  return new Date();
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../utils":79,"extend":39}],45:[function(_dereq_,module,exports){
var utils = _dereq_('../../utils');
var api = _dereq_('./api');
var helpers = _dereq_('./helpers');

module.exports = function(hoodie) {
  var account = {};
  // set username from config (local store)
  var username = utils.config.get('_account.username');
  var state = {
    // flag whether user is currently authenticated or not
    authenticated: null,
    // add events API
    events: utils.events(
      hoodie,
      account,
      'account'
    ),
    hoodie: hoodie,
    // map of requestPromises. We maintain this list to avoid sending
    // the same requests several times.
    requests: {},
    // cache for CouchDB _users doc
    userDoc: {},
    // default couchDB user doc prefix
    userDocPrefix: 'org.couchdb.user',
    get username() {
      return username;
    },
    set username(input) {
      username = input;
      account.username = input;
    }
  };

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      account[method] = api[method].bind(null, state);
    }
  });

  hoodie.on('remote:error:unauthenticated', helpers.reauthenticate.bind(null, state));

  // cleanup config on signout
  account.on('cleanup', utils.config.clear);

  // check for pending password reset
  account.checkPasswordReset().catch(function() {
    // silent "Unhandled promise rejection" in case of error
  });

  // init username
  account.username = username;

  // init bearer token
  account.bearerToken = utils.config.get('_account.bearerToken');

  hoodie.account = account;
};

},{"../../utils":79,"./api":43,"./helpers":44}],46:[function(_dereq_,module,exports){
(function (global){
// hoodie.checkConnection() & hoodie.isConnected()
// =================================================

var promise = _dereq_('../utils/promise');

//
var exports = module.exports = function(hoodie) {
  // state
  var state = {
    online: true,
    checkConnectionRequest: null,
    checkConnectionTimeout: null,
    hoodie: hoodie
  };

  hoodie.checkConnection = exports.checkConnection.bind(null, state);
  hoodie.isConnected = exports.isConnected.bind(null, state);

  // check connection when browser goes online / offline
  global.addEventListener('online', hoodie.checkConnection, false);
  global.addEventListener('offline', hoodie.checkConnection, false);

  // start checking connection
  setTimeout(hoodie.checkConnection);
};

// Check Connection
// ------------------

// the `checkConnection` method is used, well, to check if
// the hoodie backend is reachable at `baseUrl` or not.
// Check Connection is automatically called on startup
// and then each 30 seconds. If it fails, it
//
// - sets `online = false`
// - triggers `disconnected` event
// - checks again in 3 seconds
//
// when connection can be reestablished, it
//
// - sets `online = true`
// - triggers `reconnected` event
//
exports.checkConnection = function(state) {

  if (state.checkConnectionRequest) {
    return state.checkConnectionRequest;
  }

  var path = '/?hoodieId=' + state.hoodie.id();

  global.clearTimeout(state.checkConnectionTimeout);

  state.checkConnectionRequest = state.hoodie.request('GET', path).then(
    exports.handleConnection.bind(null, state, 30000, 'reconnected', true),
    exports.handleConnection.bind(null, state, 3000, 'disconnected', false)
  );

  return state.checkConnectionRequest;
};

// isConnected
// -------------

//
exports.isConnected = function(state) {
  return state && state.online;
};

//
//
//
exports.handleConnection = function(state, interval, event, online) {
  state.checkConnectionRequest = undefined;
  state.checkConnectionTimeout = global.setTimeout(
    exports.checkConnection.bind(null, state),
    interval
  );

  if (exports.isConnected(state) !== online) {
    state.hoodie.trigger(event);
    state.online = online;
  }

  return promise[online ? 'resolve' : 'reject']();
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils/promise":82}],47:[function(_dereq_,module,exports){
// hoodie.id
// =========

var utils = _dereq_('../utils');
var generateId = utils.generateId;
var config = utils.config;

// generates a random id and persists using config
// until the user signs out or deletes local data
var exports = module.exports = function(hoodie) {
  var state = {
    id: config.get('_hoodieId')
  };

  // DEPRECATED, remove before 1.0
  if (!state.id) {
    state.id = config.get('_account.ownerHash');
  }

  //
  // subscribe to events coming from other modules
  //
  hoodie.on('account:cleanup', exports.unsetId.bind(null, state));
  hoodie.on('account:signin', function(username, hoodieId) {
    exports.setId(state, hoodieId);
  });
  hoodie.on('account:signin:anonymous', exports.setId.bind(null, state));

  //
  // Public API
  //
  hoodie.id = exports.id.bind(null, state);
};


exports.id = function(state) {
  if (!state.id) {
    exports.setId(state, generateId());
  }
  return state.id;
};

exports.setId = function(state, newId) {
  state.id = newId;

  config.set('_hoodieId', state.id);
};

exports.unsetId = function(state) {
  delete state.id;
  config.unset('_hoodieId');
};

},{"../utils":79}],48:[function(_dereq_,module,exports){
// Open stores
// -------------

var hoodieRemoteStore = _dereq_('../lib/store/remote');
var extend = _dereq_('extend');

var exports = module.exports = function(hoodie) {
  //
  // Public API
  //
  hoodie.open = exports.open.bind(null, hoodie);
};

// generic method to open a store.
//
//     hoodie.open("some_store_name").findAll()
//
exports.open = function(hoodie, storeName, options) {
  options = options || {};

  extend(options, {
    name: storeName
  });

  return exports.hoodieRemoteStore(hoodie, options);
};

// export for testing
exports.hoodieRemoteStore = hoodieRemoteStore;

},{"../lib/store/remote":71,"extend":39}],49:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');
var config = utils.config;
var rejectWith = utils.promise.rejectWith;

// AccountRemote
// ===============

// Connection / Socket to our couch
//
// AccountRemote is using CouchDB's `_changes` feed to
// listen to changes and `_bulk_docs` to push local changes
//
// When hoodie.remote is continuously syncing (default),
// it will continuously  synchronize with local store,
// otherwise sync, pull or push can be called manually
//
var exports = module.exports = function(hoodie) {
  // inherit from Hoodies Store API
  var remote = hoodie.open(hoodie.account.db(), {
    // we're always connected to our own db
    connected: true,
    // do not prefix files for my own remote
    prefix: '',
    //
    since: exports.sinceNrCallback,
    //
    defaultObjectsToPush: hoodie.store.changedObjects,
    //
    knownObjects: hoodie.store.index().map(function(key) {
      var typeAndId = key.split(/\//);
      return {
        type: typeAndId[0],
        id: typeAndId[1]
      };
    })
  });

  remote.connect = exports.connect.bind(null, hoodie, remote.connect);
  remote.trigger = exports.trigger.bind(null, hoodie);
  remote.on = exports.on.bind(null, hoodie);
  remote.unbind = exports.unbind.bind(null, hoodie);

  //
  // subscribe to events coming from outside
  //
  hoodie.on('remote:connect', function() {
    hoodie.on('store:idle', remote.push);
  });

  hoodie.on('remote:disconnect', function() {
    hoodie.unbind('store:idle', remote.push);
  });

  hoodie.on('disconnected', remote.disconnect);
  hoodie.on('reconnected', remote.connect);

  // account events
  hoodie.on('account:signup', remote.connect);
  hoodie.on('account:signup:anonymous', remote.connect);
  hoodie.on('account:signin', remote.connect);
  hoodie.on('account:signin:anonymous', remote.connect);
  hoodie.on('account:changeusername', remote.connect);

  hoodie.on('account:reauthenticated', remote.connect);
  hoodie.on('account:signout', remote.disconnect);

  //
  // expose remote API
  //
  hoodie.remote = remote;
};

// Connect
// ---------

// we slightly extend the original remote.connect method
// provided by `hoodieRemoteStore`, to check if the user
// has an account beforehand. We also hardcode the right
// name for remote (current user's database name)
//
exports.connect = function(hoodie, originalConnectMethod) {
  if (!hoodie.account.hasAccount()) {
    return rejectWith('User has no database to connect to');
  }
  return originalConnectMethod(hoodie.account.db());
};

// trigger
// ---------

// proxies to hoodie.trigger
exports.trigger = function(hoodie) {
  // shift off state
  var parameters = Array.prototype.slice.call(arguments,1);
  // eventName
  parameters[0] = 'remote:' + parameters[0];
  return hoodie.trigger.apply(hoodie, parameters);
};

// on
// ---------

// proxies to hoodie.on
exports.on = function(hoodie, eventName, data) {
  eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+'remote:$2');
  return hoodie.on(eventName, data);
};

// unbind
// ---------

// proxies to hoodie.unbind
exports.unbind = function(hoodie, eventName, callback) {
  eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+'remote:$2');
  return hoodie.unbind(eventName, callback);
};

// Private
// ---------

// getter / setter for since number
//
exports.sinceNrCallback = function(sinceNr) {
  if (sinceNr) {
    return config.set('_remote.since', sinceNr);
  }

  return config.get('_remote.since') || 0;
};

},{"../utils":79}],50:[function(_dereq_,module,exports){
(function (global){
var extend = _dereq_('extend');
var utils = _dereq_('../utils');

var hoodiefyRequestErrorName = utils.hoodiefyRequestErrorName;
var getDefer = utils.promise.defer;
var rejectWith = utils.promise.rejectWith;

//
// hoodie.request
// ================

// Hoodie's central place to send request to its backend.
// At the moment, it's a wrapper around jQuery's ajax method,
// but we might get rid of this dependency in the future.
//
// It has build in support for CORS and a standard error
// handling that normalizes errors returned by CouchDB
// to JavaScript's native conventions of errors having
// a name & a message property.
//
// Common errors to expect:
//
// * HoodieRequestError
// * HoodieUnauthorizedError
// * HoodieConflictError
// * HoodieServerError
var exports = module.exports = function(hoodie) {
  //
  // public API
  //
  hoodie.request = exports.request.bind(null, hoodie);
};

// Hoodie backend listens to requests prefixed by /_api,
// so we prefix all requests with relative URLs

// Requests
// ----------

// sends requests to the hoodie backend.
//
//     promise = hoodie.request('GET', '/user_database/doc_id')
//
var API_PATH = '/_api';

exports.request = function(hoodie, type, url, options) {
  var defaults = {
    type: type,
    dataType: 'json'
  };
  var requestDefer = getDefer();
  var requestPromise = requestDefer.promise;
  var jQueryPromise;
  options = options || {};

  if (hoodie.account.bearerToken) {
    defaults.headers = {
      Authorization: 'Bearer ' + hoodie.account.bearerToken
    };
  }

  // if relative path passed, prefix with baseUrl
  if (!/^http/.test(url)) {
    url = (hoodie.baseUrl || '') + API_PATH + url;
  }

  // if url is cross domain, set CORS headers
  if (/^http/.test(url)) {
    defaults.xhrFields = {
      withCredentials: true
    };
    defaults.crossDomain = true;
  }

  defaults.url = url;

  // we are piping the result of the request to return a nicer
  // error if the request cannot reach the server at all.
  // We can't return the promise of ajax directly because of
  // the piping, as for whatever reason the returned promise
  // does not have the `abort` method any more, maybe others
  // as well. See also http://bugs.jquery.com/ticket/14104
  jQueryPromise = global.jQuery.ajax(extend(defaults, options))
    .done(requestDefer.resolve)
    .fail(requestDefer.reject);
  var pipedPromise = requestPromise.then(
    null,
    exports.handleRequestError.bind(null, hoodie)
  );
  pipedPromise.abort = jQueryPromise.abort;

  return pipedPromise;
};

//
//
//
exports.handleRequestError = function(hoodie, xhr) {
  var error;

  // handle manual abort of request
  if (xhr.statusText === 'abort') {

    return rejectWith({
      name: 'HoodieConnectionAbortError',
      message: 'Request has been aborted',
    });
  }

  try {
    error = exports.parseErrorFromResponse(xhr);
  } catch (_error) {

    if (xhr && xhr.responseText) {
      error = xhr.responseText;
    } else {
      error = {
        name: 'HoodieConnectionError',
        message: 'Could not connect to Hoodie server at {{url}}.',
        url: hoodie.baseUrl || '/'
      };
    }
  }

  return rejectWith(error);
};

//
// CouchDB returns errors in JSON format, with the properties
// `error` and `reason`. Hoodie uses JavaScript's native Error
// properties `name` and `message` instead, so we are normalizing
// that.
//
// Besides the renaming we also do a matching with a map of known
// errors to make them more clear. For reference, see
// https://wiki.apache.org/couchdb/Default_http_errors &
// https://github.com/apache/couchdb/blob/master/src/couchdb/couch_httpd.erl#L807
//

// map CouchDB HTTP status codes to Hoodie Errors
exports.HTTP_STATUS_ERROR_MAP = {
  400: 'HoodieRequestError', // bad request
  401: 'HoodieUnauthorizedError',
  403: 'HoodieRequestError', // forbidden
  404: 'HoodieNotFoundError', // forbidden
  409: 'HoodieConflictError',
  412: 'HoodieConflictError', // file exist
  500: 'HoodieServerError'
};

exports.parseErrorFromResponse = function(xhr) {
  var error = JSON.parse(xhr.responseText);
  // get error name
  error.name = exports.HTTP_STATUS_ERROR_MAP[xhr.status];

  if (!error.name) {
    error.name = hoodiefyRequestErrorName(error.error);
  }

  // store status & message
  error.status = xhr.status;
  error.message = error.reason || '';
  error.message = error.message.charAt(0).toUpperCase() + error.message.slice(1);

  // cleanup
  delete error.error;
  delete error.reason;

  return error;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils":79,"extend":39}],51:[function(_dereq_,module,exports){
(function (global){
var utils = _dereq_('../../utils');
var promise = utils.promise;
var getDefer = promise.defer;
var localStorageWrapper = utils.localStorageWrapper;

var helpers = _dereq_('./helpers');

// TODO: remove coffeescript artifacts

// extended public API
// ---------------------
var exports = module.exports;

// index
// -------

// object key index
// TODO: make this cachy
exports.index = function(state) {
  var i, key, keys, _i, _ref;
  keys = [];
  for (i = _i = 0, _ref = localStorageWrapper.length(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    key = localStorageWrapper.key(i);
    if (helpers.isSemanticKey(state, key)) {
      keys.push(key);
    }
  }
  return keys;
};


// changed objects
// -----------------

// returns an Array of all dirty documents
exports.changedObjects = function(state) {
  var id, key, object, type, _ref, _ref1, _results;

  _ref = state.dirty;
  _results = [];

  for (key in _ref) {
    if (_ref.hasOwnProperty(key)) {
      object = _ref[key];
      _ref1 = key.split('/'),
      type = _ref1[0],
      id = _ref1[1];
      object.type = type;
      object.id = id;
      _results.push(object);
    }
  }
  return _results;
};


// Is dirty?
// ----------

// When no arguments passed, returns `true` or `false` depending on if there are
// dirty objects in the store.
//
// Otherwise it returns `true` or `false` for the passed object. An object is dirty
// if it has no `_syncedAt` attribute or if `updatedAt` is more recent than `_syncedAt`
exports.hasLocalChanges = function(state, type, id) {
  if (!type) {
    return !global.$.isEmptyObject(state.dirty);
  }
  var key = [type,id].join('/');
  if (state.dirty[key]) {
    return true;
  }
  return helpers.hasLocalChanges(state, helpers.cache(state, type, id));
};


// Clear
// ------

// clears localStorage and cache
// TODO: do not clear entire localStorage, clear only the items that have been stored
//       using `hoodie.store` before.
exports.clear = function(state) {
  var defer, key, keys, results;
  defer = getDefer();
  try {
    keys = exports.index(state);
    results = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (helpers.isSemanticKey(state, key)) {
          _results.push(localStorageWrapper.removeItem(key));
        }
      }
      return _results;
    }).call(this);
    state.cachedObject = {};
    helpers.clearChanged(state);
    defer.resolve();
    // TODO: get eventEmitter directly from utils.events
    state.hoodie.store.trigger('clear');
  } catch (_error) {
    defer.reject(_error);
  }
  return defer.promise;
};


// isBootstrapping
// -----------------

// returns true if store is currently bootstrapping data from remote,
// otherwise false.
exports.isBootstrapping = function(state) {
  return state.bootstrapping;
};


// isPersistent
exports.isPersistent = function() {
  return localStorageWrapper.isPersistent;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../utils":79,"./helpers":53}],52:[function(_dereq_,module,exports){
var localStore = _dereq_('./localstore');

var exports = module.exports;

//
exports.start = function(state) {
  state.bootstrapping = true;
  state.hoodie.store.trigger('bootstrap:start');
};

//
exports.end = function(state) {
  var methodCall, method, args, defer;

  state.bootstrapping = false;
  while (state.queue.length > 0) {
    methodCall = state.queue.shift();
    method = methodCall[0];
    args = methodCall[1];
    defer = methodCall[2];
    localStore[method]
      .bind(localStore)
      .apply(localStore, args)
      .then(defer.resolve, defer.reject);
  }

  state.hoodie.store.trigger('bootstrap:end');
};

//
exports.abort = function(state, error) {
  var methodCall, defer;

  state.bootstrapping = false;
  while (state.queue.length > 0) {
    methodCall = state.queue.shift();
    defer = methodCall[2];
    defer.reject(error);
  }

  state.hoodie.store.trigger('bootstrap:error', error);
};

},{"./localstore":55}],53:[function(_dereq_,module,exports){
(function (global){
var extend = _dereq_('extend');

var utils = _dereq_('../../utils');
var promise = utils.promise;
var getDefer = promise.defer;
var localStorageWrapper = utils.localStorageWrapper;
//
// Private methods
// -----------------
//

var exports = module.exports;
// Cache
// -------

// loads an object specified by `type` and `id` only once from localStorage
// and caches it for faster future access. Updates cache when `value` is passed.
//
// Also checks if object needs to be synched (dirty) or not
//
// Pass `options.remote = true` when object comes from remote
// Pass 'options.silent = true' to avoid events from being triggered.
exports.cache = function(state, type, id, object, options) {
  var key, storedObject;

  if (object === undefined) {
    object = false;
  }

  options = options || {};
  key = '' + type + '/' + id;

  if (object) {
    extend(object, {
      type: type,
      id: id
    });

    // we do not store type & id in localStorage values
    storedObject = extend({}, object);
    delete storedObject.type;
    delete storedObject.id;
    localStorageWrapper.setObject(key, storedObject);

    if (options.remote) {
      exports.clearChanged(state, type, id);
      state.cachedObject[key] = extend(true, {}, object);
      return state.cachedObject[key];
    }

  } else {

    // if the cached key returns false, it means
    // that we have removed that key. We just
    // set it to false for performance reasons, so
    // that we don't need to look it up again in localStorage
    if (state.cachedObject[key] === false) {
      return false;
    }

    // if key is cached, return it. But make sure
    // to make a deep copy beforehand (=> true)
    if (state.cachedObject[key]) {
      return extend(true, {}, state.cachedObject[key]);
    }

    key = '' + type + '/' + id;

    // if object is not yet cached, load it from localStore
    object = localStorageWrapper.getObject(key);

    // stop here if object did not exist in localStore
    // and cache it so we don't need to look it up again
    if (! object) {
      exports.clearChanged(state, type, id);
      state.cachedObject[key] = false;
      return false;
    }

    // add type & id as we don't store these in localStorage values
    object.type = type;
    object.id = id;

  }

  if (exports.isMarkedAsDeleted(state, object)) {
    exports.markAsChanged(state, type, id, object, options);
    state.cachedObject[key] = false;
    return false;
  }

  // here is where we cache the object for
  // future quick access
  state.cachedObject[key] = extend(true, {}, object);

  if (exports.hasLocalChanges(state, object)) {
    exports.markAsChanged(state, type, id, state.cachedObject[key], options);
  } else {
    exports.clearChanged(state, type, id);
  }

  return extend(true, {}, object);
};

//
// Marks object as changed (dirty). Triggers a `store:dirty` event immediately and a
// `store:idle` event once there is no change within 2 seconds
//
exports.markAsChanged = function(state, type, id, object, options) {
  var key;

  options = options || {};
  key = '' + type + '/' + id;

  state.dirty[key] = object;
  exports.saveDirtyIds(state);

  if (options.silent) {
    return;
  }

  exports.triggerDirtyAndIdleEvents(state);
};

// Clear changed
// ---------------

// removes an object from the list of objects that are flagged to by synched (dirty)
// and triggers a `store:dirty` event
exports.clearChanged = function(state, type, id) {
  var key;
  if (type && id) {
    key = '' + type + '/' + id;
    delete state.dirty[key];
  } else {
    state.dirty = {};
  }
  exports.saveDirtyIds(state);
  return global.clearTimeout(state.dirtyTimeout);
};


// Mark all as changed
// ------------------------

// Marks all local object as changed (dirty) to make them sync
// with remote
exports.markAllAsChanged = function(state) {
  return state.hoodie.store.findAll().done(function(objects) {
    var key, object, _i, _len;

    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      key = '' + object.type + '/' + object.id;
      state.dirty[key] = object;
    }

    exports.saveDirtyIds(state);
    exports.triggerDirtyAndIdleEvents(state);
  });
};


// when a change comes from our remote store, we differentiate
// whether an object has been removed or added / updated and
// reflect the change in our local store.
exports.handleRemoteChange = function(state, typeOfChange, object) {
  if (typeOfChange === 'remove') {
    state.hoodie.store.remove(object.type, object.id, {
      remote: true,
      update: object
    });
  } else {
    state.hoodie.store.save(object.type, object.id, object, {
      remote: true
    });
  }
};


//
// all local changes get bulk pushed. For each object with local
// changes that have been pushed we trigger a sync event.
// Besides that, we also remove objects that have only been marked
// as _deleted and mark the others as synced.
exports.handlePushedObject = function(state, object) {
  exports.triggerEvents(state, 'sync', object);

  if (object._deleted) {
    state.hoodie.store.remove(object.type, object.id, {
      remote: true,
      silent: true
    });
  } else {
    state.hoodie.store.save(object.type, object.id, object, {
      remote: true,
      silent: true
    });
  }
};

// store IDs of dirty objects
exports.saveDirtyIds = function(state) {
  if (global.$.isEmptyObject(state.dirty)) {
    localStorageWrapper.removeItem('_dirty');
  } else {
    var ids = Object.keys(state.dirty);
    localStorageWrapper.setItem('_dirty', ids.join(','));
  }
};

//
exports.now = function() {
  return JSON.stringify(new Date()).replace(/['"]/g, '');
};


// a semantic key consists of a valid type & id, separated by a "/"
exports.SEMANTIC_ID_PATTERN = new RegExp(/^[a-z$][a-z0-9-]+\/[a-z0-9]+$/);
exports.isSemanticKey = function(state, key) {
  return exports.SEMANTIC_ID_PATTERN.test(key);
};

// `hasLocalChanges` returns true if there is a local change that
// has not been synced yet.
exports.hasLocalChanges = function(state, object) {
  if (!object.updatedAt) {
    return false;
  }
  if (!object._syncedAt) {
    return true;
  }
  return object._syncedAt < object.updatedAt;
};

//
exports.isMarkedAsDeleted = function(state, object) {
  return object._deleted === true;
};

// this is where all the store events get triggered,
// like add:task, change:note:abc4567, remove, etc.
exports.triggerEvents = function(state, eventName, object, options) {
  // TODO: get eventEmitter directly from utils.events
  state.hoodie.store.trigger(eventName, extend(true, {}, object), options);
  state.hoodie.store.trigger(object.type + ':' + eventName, extend(true, {}, object), options);

  // DEPRECATED
  // https://github.com/hoodiehq/hoodie.js/issues/146
  state.hoodie.store.trigger(eventName + ':' + object.type, extend(true, {}, object), options);

  if (eventName !== 'new') {
    state.hoodie.store.trigger( object.type + ':' + object.id+ ':' + eventName, extend(true, {}, object), options);

    // DEPRECATED
    // https://github.com/hoodiehq/hoodie.js/issues/146
    state.hoodie.store.trigger( eventName + ':' + object.type + ':' + object.id, extend(true, {}, object), options);
  }



  // sync events have no changes, so we don't trigger
  // "change" events.
  if (eventName === 'sync') {
    return;
  }

  state.hoodie.store.trigger('change', eventName, extend(true, {}, object), options);
  state.hoodie.store.trigger(object.type + ':change', eventName, extend(true, {}, object), options);

  // DEPRECATED
  // https://github.com/hoodiehq/hoodie.js/issues/146
  state.hoodie.store.trigger('change:' + object.type, eventName, extend(true, {}, object), options);


  if (eventName !== 'new') {
    state.hoodie.store.trigger(object.type + ':' + object.id + ':change', eventName, extend(true, {}, object), options);

    // DEPRECATED
    // https://github.com/hoodiehq/hoodie.js/issues/146
    state.hoodie.store.trigger('change:' + object.type + ':' + object.id, eventName, extend(true, {}, object), options);
  }
};

// when an object gets changed, two special events get triggered:
//
// 1. dirty event
//    the `dirty` event gets triggered immediately, for every
//    change that happens.
// 2. idle event
//    the `idle` event gets triggered after a short timeout of
//    no changes, e.g. 2 seconds.
exports.triggerDirtyAndIdleEvents = function(state) {
  state.hoodie.store.trigger('dirty');
  global.clearTimeout(state.dirtyTimeout);

  state.dirtyTimeout = global.setTimeout(function() {
    state.hoodie.store.trigger('idle', state.hoodie.store.changedObjects());
  }, state.idleTimeout);
};

//
exports.enqueue = function(state, method, args) {
  var defer = getDefer();
  state.queue.push([method, args, defer]);
  return defer.promise;
};

//
// 1. we store all existing data and config in memory
// 2. we write it back on signin, with new hoodieId/username
//
exports.moveData = function (state) {
  var oldObjects = [];
  var oldHoodieId;

  state.hoodie.store.findAll().done( function(data) {
    oldObjects = data;

    if (! oldObjects.length) {
      return;
    }
    oldHoodieId = state.hoodie.id();

    state.hoodie.once('account:signin', function(newUsername, newHoodieId) {
      oldObjects.forEach(function(object) {
        if (object.createdBy === oldHoodieId) {
          object.createdBy = newHoodieId;
        }
        object = exports.cache(state, object.type, object.id, object);
        exports.markAsChanged(state.object.type, object.id, object, {silent: true});
      });

      exports.triggerDirtyAndIdleEvents(state);
    });
  });
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../utils":79,"extend":39}],54:[function(_dereq_,module,exports){
var hoodieStoreApi = _dereq_('../../lib/store/api');
var HoodieObjectTypeError = _dereq_('../../lib/error/object_type');
var HoodieObjectIdError = _dereq_('../../lib/error/object_id');

var api = _dereq_('./api');
var bootstrap = _dereq_('./bootstrap');
var helpers = _dereq_('./helpers');
var localStore = _dereq_('./localstore');

var localStorageWrapper = _dereq_('../../utils').localStorageWrapper;

//
var exports = module.exports = function(hoodie) {
  var state = {
    // if store is currently bootstrapping data from remote
    bootstrapping: false,
    // cache of localStorage for quicker access
    cachedObject: {},
    dirtyTimeout: undefined,
    // map of dirty objects by their ids
    dirty: {},
    hoodie: hoodie,
    // queue of method calls done during bootstrapping
    queue: [],

    // 2 seconds timeout before triggering the `store:idle` event
    idleTimeout: 2000
  };

  var store = exports.hoodieStoreApi(hoodie, {
    // validate
    validate: exports.validate,
    backend: {
      save: exports.localStore.save.bind(null, state),
      find: exports.localStore.find.bind(null, state),
      findAll: exports.localStore.findAll.bind(null, state),
      remove: exports.localStore.remove.bind(null, state),
      removeAll: exports.localStore.removeAll.bind(null, state)
    }
  });

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      store[method] = api[method].bind(null, state);
    }
  });

  // account events
  hoodie.on('account:signup', helpers.markAllAsChanged.bind(null, state));
  hoodie.on('account:movedata', helpers.moveData.bind(null, state));
  hoodie.on('account:cleanup', api.clear.bind(null, state));

  // remote events
  hoodie.on('remote:bootstrap:start', bootstrap.start.bind(null, state));
  hoodie.on('remote:bootstrap:end', bootstrap.end.bind(null, state));
  hoodie.on('remote:bootstrap:error', bootstrap.abort.bind(null, state));
  hoodie.on('remote:change', helpers.handleRemoteChange.bind(null, state));
  hoodie.on('remote:push', helpers.handlePushedObject.bind(null, state));

  // expose public API
  // FIXME: must be setup before exports.bootstrapChangedObjects as
  //        it depends on state.hoodie.store ...
  hoodie.store = store;

  exports.bootstrapChangedObjects(state);
};

// bootstrapping dirty objects, to make sure
// that removed objects get pushed after
// page reload.
//
exports.bootstrapChangedObjects = function(state) {
  var keys = localStorageWrapper.getItem('_dirty');

  if (!keys) {
    return;
  }

  keys = keys.split(',');
  for (var i = 0; i < keys.length; i++) {
    var typeAndId = keys[i].split('/');
    helpers.cache(state, typeAndId[0], typeAndId[1]);
  }
};

// validate
// ----------

//
exports.validate = function(object) {

  if (HoodieObjectTypeError.isInvalid(object.type)) {
    return new HoodieObjectTypeError({
      type: object.type
    });
  }

  if (!object.id) {
    return;
  }

  if (HoodieObjectIdError.isInvalid(object.id)) {
    return new HoodieObjectIdError({
      id: object.id
    });
  }
};

// exports for testing
exports.hoodieStoreApi = hoodieStoreApi;
exports.localStore = localStore;

},{"../../lib/error/object_id":61,"../../lib/error/object_type":62,"../../lib/store/api":67,"../../utils":79,"./api":51,"./bootstrap":52,"./helpers":53,"./localstore":55}],55:[function(_dereq_,module,exports){
/*jshint -W079 */
var helpers = _dereq_('./helpers');

var utils = _dereq_('../../utils');

var generateId = utils.generateId;
var localStorageWrapper = utils.localStorageWrapper;

var promise = utils.promise;
var getDefer = promise.defer;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;
var Promise = promise.Promise;

// LocalStore
// ============

// ------
//
// saves the passed object into the store and replaces
// an eventually existing object with same type & id.
//
// When id is undefined, it gets generated an new object gets saved
//
// It also adds timestamps along the way:
//
// * `createdAt` unless it already exists
// * `updatedAt` every time
// * `_syncedAt`  if changes comes from remote
//
// example usage:
//
//     store.save('car', undefined, {color: 'red'})
//     store.save('car', 'abc4567', {color: 'red'})
//
exports.save = function(state, object, options) {
  var currentObject, defer, error, event, isNew, key;

  options = options || {};

  // if store is currently bootstrapping data from remote,
  // we're queueing local saves until it's finished.
  if (state.hoodie.store.isBootstrapping(state) && !options.remote) {
    return helpers.enqueue(state, 'save', arguments);
  }

  // generate an id if necessary
  if (object.id) {
    currentObject = helpers.cache(state, object.type, object.id);
    isNew = typeof currentObject !== 'object';
  } else {
    isNew = true;
    object.id = generateId();
  }

  if (isNew) {
    // add createdBy hash
    object.createdBy = object.createdBy || state.hoodie.id();
  } else {
    // leave createdBy hash
    if (currentObject.createdBy) {
      object.createdBy = currentObject.createdBy;
    }
  }

  // handle local properties and hidden properties with $ prefix
  // keep local properties for remote updates
  if (!isNew) {

    // for remote updates, keep local properties (starting with '_')
    // for local updates, keep hidden properties (starting with '$')
    for (key in currentObject) {
      if (!object.hasOwnProperty(key)) {
        switch (key.charAt(0)) {
        case '_':
          if (options.remote) {
            object[key] = currentObject[key];
          }
          break;
        case '$':
          if (!options.remote) {
            object[key] = currentObject[key];
          }
        }
      }
    }
  }

  // add timestamps
  if (options.remote) {
    object._syncedAt = helpers.now(state);
  } else if (!options.silent) {
    object.updatedAt = helpers.now(state);
    object.createdAt = object.createdAt || object.updatedAt;
  }

  // handle local changes
  //
  // A local change is meant to be replicated to the
  // users database, but not beyond. For example when
  // a user subscribes to a share but then decides to unsubscribe,
  // all objects get removed with local: true flag, so that
  // they get removed from the users database, but will remain elsewhere.
  if (options.local) {
    object._$local = true;
  } else {
    delete object._$local;
  }

  defer = getDefer();

  try {
    object = helpers.cache(state, object.type, object.id, object, options);
    defer.resolve(object, isNew);
    event = isNew ? 'add' : 'update';
    if (!options.silent) {
      helpers.triggerEvents(state, event, object, options);
    }
  } catch (_error) {
    error = _error;
    defer.reject(error.toString());
  }

  return defer.promise;
};


// find
// ------

// loads one object from Store, specified by `type` and `id`
//
// example usage:
//
//     store.find('car', 'abc4567')
exports.find = function(state, type, id) {
  var error, object;

  // if store is currently bootstrapping data from remote,
  // we're queueing until it's finished
  if (state.hoodie.store.isBootstrapping()) {
    return helpers.enqueue(state, 'find', arguments);
  }

  try {
    object = helpers.cache(state, type, id);
    if (!object) {
      return rejectWith({
        name: 'HoodieNotFoundError',
        message: '"{{type}}" with id "{{id}}" could not be found',
        type: type,
        id: id
      });
    }
    return resolveWith(object);
  } catch (_error) {
    error = _error;
    return rejectWith(error);
  }
};


// findAll
// ---------

// returns all objects from store.
// Can be optionally filtered by a type or a function
//
// example usage:
//
//     store.findAll()
//     store.findAll('car')
//     store.findAll(function(obj) { return obj.brand == 'Tesla' })
//
exports.findAll = function(state, filter) {
  var currentType, defer, error, id, key, keys, obj, results, type;



  if (filter == null) {
    filter = function() {
      return true;
    };
  }

  // if store is currently bootstrapping data from remote,
  // we're queueing until it's finished
  if (state.hoodie.store.isBootstrapping()) {
    return helpers.enqueue(state, 'findAll', arguments);
  }

  keys = state.hoodie.store.index();

  // normalize filter
  if (typeof filter === 'string') {
    type = filter;
    filter = function(obj) {
      return obj.type === type;
    };
  }

  defer = getDefer();

  try {

    //
    results = (function() {
      var _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (!(helpers.isSemanticKey(state, key))) {
          continue;
        }
        _ref = key.split('/'),
        currentType = _ref[0],
        id = _ref[1];

        obj = helpers.cache(state, currentType, id);
        if (obj && filter(obj)) {
          _results.push(obj);
        } else {
          continue;
        }
      }
      return _results;
    }).call(this);

    // sort from newest to oldest
    results.sort(function(a, b) {
      if (a.createdAt > b.createdAt) {
        return -1;
      } else if (a.createdAt < b.createdAt) {
        return 1;
      } else {
        return 0;
      }
    });
    defer.resolve(results);
  } catch (_error) {
    error = _error;
    defer.reject(error);
  }
  return defer.promise;
};


// Remove
// --------

// Removes one object specified by `type` and `id`.
//
// when object has been synced before, mark it as deleted.
// Otherwise remove it from Store.
exports.remove = function(state, type, id, options) {
  var key, object, objectWasMarkedAsDeleted;

  options = options || {};

  // if store is currently bootstrapping data from remote,
  // we're queueing local removes until it's finished.
  if (state.hoodie.store.isBootstrapping() && !options.remote) {
    return helpers.enqueue(state, 'remove', arguments);
  }

  key = type + '/' + id;
  object = helpers.cache(state, type, id);

  // https://github.com/hoodiehq/hoodie.js/issues/147
  if (options.update) {
    object = options.update;
    delete options.update;
  }

  // if change comes from remote, just clean up locally
  if (options.remote) {
    localStorageWrapper.removeItem(key);
    objectWasMarkedAsDeleted = state.cachedObject[key] && helpers.isMarkedAsDeleted(state, state.cachedObject[key]);
    state.cachedObject[key] = false;
    helpers.clearChanged(state, type, id);
    if (object) {
      if (!objectWasMarkedAsDeleted) {
        helpers.triggerEvents(state, 'remove', object, options);
      }
      return resolveWith(object);
    }
  }


  //
  if (!object) {
    return rejectWith({
      name: 'HoodieNotFoundError',
      message: '"{{type}}" with id "{{id}}" could not be found',
      type: type,
      id: id
    });
  }



  if (object._syncedAt) {
    object._deleted = true;
    helpers.cache(state, type, id, object);
  } else {
    key = type + '/' + id;
    localStorageWrapper.removeItem(key);
    state.cachedObject[key] = false;
    helpers.clearChanged(state, type, id);
  }


  helpers.triggerEvents(state, 'remove', object, options);
  return resolveWith(object);
};


// Remove all
// ----------

// Removes one object specified by `type` and `id`.
//
// when object has been synced before, mark it as deleted.
// Otherwise remove it from Store.
exports.removeAll = function(state, type, options) {
  return state.hoodie.store.findAll(type).then(function(objects) {
    var removePromises;

    removePromises = objects.map(function(object) {
      return state.hoodie.store.remove(object.type, object.id, options);
    });

    return Promise.all(removePromises);
  });
};

},{"../../utils":79,"./helpers":53}],56:[function(_dereq_,module,exports){
var extend = _dereq_('extend');
var helpers = _dereq_('./helpers');
var utils = _dereq_('../../utils');
var getDefer = utils.promise.defer;

var exports = module.exports;

// start
// -------

// start a new task. If the user has no account yet, hoodie tries to sign up
// for an anonymous account in the background. If that fails, the returned
// promise will be rejected.
//
exports.start = function(state, type, properties) {
  var defer;

  if (state.hoodie.account.hasAccount()) {
    return state.hoodie.store.add('$' + type, properties)
      .then(helpers.handleNewTask.bind(null, state));
  }

  defer = getDefer();
  state.hoodie.account.anonymousSignUp().then(function() {
    return exports.start(state, type, properties)
    .progress(defer.notify);
  }).done(defer.resolve).fail(defer.reject);

  return defer.promise;
};


// abort
// -------

// abort a running task
//
exports.abort = function(state, type, id) {
  return state.hoodie.store.update('$' + type, id, {
    abortedAt: helpers.now(state)
  }).then(helpers.handleAbortedTaskObject.bind(null, state));
};


// restart
// ---------

// first, we try to abort a running task. If that succeeds, we start
// a new one with the same properties as the original
//
exports.restart = function(state, type, id, update) {
  var start = function(object) {
    extend(object, update);
    delete object.$error;
    delete object.$processedAt;
    delete object.abortedAt;
    return exports.start(state, object.type, object);
  };
  return exports.abort(state, type, id).then(start);
};

// abortAll
// -----------

//
exports.abortAll = function(state, type) {
  return helpers.findAll(state, type)
    .then(helpers.abortTaskObjects.bind(null, state));
};

// restartAll
// -----------

//
exports.restartAll = function(state, type, update) {
  if (typeof type === 'object') {
    update = type;
  }

  return helpers.findAll(state, type).then(function(taskObjects) {
    helpers.restartTaskObjects(state, taskObjects, update);
  });
};

},{"../../utils":79,"./helpers":57,"extend":39}],57:[function(_dereq_,module,exports){
var lib = _dereq_('../../lib');
var HoodieError = lib.error.error;

var utils = _dereq_('../../utils');
var getDefer = utils.promise.defer;
var extend = _dereq_('extend');

var exports = module.exports;

// Private
// -------

//
exports.handleNewTask = function(state, object) {
  var defer = getDefer();
  var taskStore = state.hoodie.store(object.type, object.id);

  taskStore.on('sync', function(object) {
    // remove "$" from type
    object.type = object.type.substr(1);

    defer.notify(object);
  });

  taskStore.on('remove', function(object) {

    // remove "$" from type
    object.type = object.type.substr(1);

    // task finished by worker.
    if (object.$processedAt) {
      return defer.resolve(object);
    }

    // manually removed / aborted.
    defer.reject(new HoodieError({
      message: 'Task has been aborted',
      task: object
    }));
  });
  taskStore.on('update', function(object) {
    var error = object.$error;

    if (! object.$error) {
      return;
    }

    // remove "$" from type
    object.type = object.type.substr(1);

    delete object.$error;
    error.object = object;
    error.message = error.message || 'Something went wrong';

    defer.reject(new HoodieError(error));

    // remove errored task
    state.hoodie.store.remove('$' + object.type, object.id);
  });

  return defer.promise;
};

//
exports.handleAbortedTaskObject = function(state, taskObject) {
  var defer;
  var type = taskObject.type; // no need to prefix with $, it's already prefixed.
  var id = taskObject.id;
  var removePromise = state.hoodie.store.remove(type, id);

  if (!taskObject._rev) {
    // task has not yet been synced.
    return removePromise;
  }

  defer = getDefer();
  state.hoodie.once('store:sync:' + type + ':' + id, defer.resolve);
  removePromise.fail(defer.reject);

  return defer.promise;
};

//
exports.handleStoreChange = function(state, eventName, object, options) {
  if (object.type[0] !== '$') {
    return;
  }

  object.type = object.type.substr(1);
  exports.triggerEvents(state, eventName, object, options);
};

//
exports.findAll = function(state, type) {
  var startsWith = '$';
  var filter;
  if (type) {
    startsWith += type;
  }

  filter = function(object) {
    return object.type.indexOf(startsWith) === 0;
  };
  return state.hoodie.store.findAll(filter);
};

//
exports.abortTaskObjects = function(state, taskObjects) {
  return taskObjects.map(function(taskObject) {
    return state.hoodie.task.abort(taskObject.type.substr(1), taskObject.id);
  });
};

//
exports.restartTaskObjects = function(state, taskObjects, update) {
  return taskObjects.map(function(taskObject) {
    return state.hoodie.task.restart(taskObject.type.substr(1), taskObject.id, update);
  });
};

// this is where all the task events get triggered,
// like add:message, change:message:abc4567, remove, etc.
exports.triggerEvents = function(state, eventName, task, options) {
  var error;

  // "new" tasks are trigger as "start" events
  if (eventName === 'add') {
    eventName = 'start';
  }

  if (eventName === 'remove' && task.abortedAt) {
    eventName = 'abort';
  }

  if (eventName === 'remove' && task.$processedAt && !task.$error) {
    eventName = 'success';
  }

  if (eventName === 'update' && task.$error) {
    eventName = 'error';
    error = task.$error;
    delete task.$error;

    state.events.trigger('error', error, task, options);
    state.events.trigger(task.type + ':error', error, task, options);
    state.events.trigger(task.type + ':' + task.id + ':error', error, task, options);

    options = extend({}, options, {
      error: error
    });

    state.events.trigger('change', 'error', task, options);
    state.events.trigger(task.type + ':change', 'error', task, options);
    state.events.trigger(task.type + ':' + task.id + ':change', 'error', task, options);

    return;
  }

  // ignore all the other events
  if (eventName !== 'start' && eventName !== 'abort' && eventName !== 'success') {
    return;
  }

  state.events.trigger(eventName, task, options);
  state.events.trigger(task.type + ':' + eventName, task, options);

  if (eventName !== 'start') {
    state.events.trigger(task.type + ':' + task.id + ':' + eventName, task, options);
  }

  state.events.trigger('change', eventName, task, options);
  state.events.trigger(task.type + ':change', eventName, task, options);

  if (eventName !== 'start') {
    state.events.trigger(task.type + ':' + task.id + ':change', eventName, task, options);
  }
};

//
exports.now = function() {
  return JSON.stringify(new Date()).replace(/['"]/g, '');
};

},{"../../lib":64,"../../utils":79,"extend":39}],58:[function(_dereq_,module,exports){
// Tasks
// ============

// This class defines the hoodie.task API.
//
// The returned API provides the following methods:
//
// * start
// * abort
// * restart
// * remove
// * on
// * one
// * unbind
//
// At the same time, the returned API can be called as function returning a
// task scoped by the passed type, for example
//
//     var emailTasks = hoodie.task('email');
//     emailTasks.start( properties );
//     emailTasks.abort('id123');
//
var lib = _dereq_('../../lib');
var utils = _dereq_('../../utils');
var api = _dereq_('./api');
var helpers = _dereq_('./helpers');

//
var exports = module.exports = function(hoodie) {
  // The wrapping is needed as `exports.scopedTask` expects a taskApi
  // which would still be undefined if we'd pass it directly
  // (the function itself serves as the taskApi object)
  var scopedTask;
  var task = function () {
    return scopedTask.apply(null, arguments);
  };
  scopedTask = exports.scopedTask.bind(null, hoodie, task);

  var state = {
    events: utils.events(hoodie, task, 'task'),
    hoodie: hoodie
  };

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      task[method] = api[method].bind(null, state);
    }
  });

  hoodie.task = task;
  hoodie.on('store:change', helpers.handleStoreChange.bind(null, state));
};

// public API
exports.scopedTask = function (hoodie, taskApi, type, id) {
  return lib.task.scoped(hoodie, taskApi, {
    type: type,
    id: id
  });
};

},{"../../lib":64,"../../utils":79,"./api":56,"./helpers":57}],59:[function(_dereq_,module,exports){
// Hoodie Error
// -------------

// With the custom hoodie error function
// we normalize all errors the get returned
// when using hoodie's rejectWith
//
// The native JavaScript error method has
// a name & a message property. HoodieError
// requires these, but on top allows for
// unlimited custom properties.
//
// Instead of being initialized with just
// the message, HoodieError expects an
// object with properties. The `message`
// property is required. The name will
// fallback to `error`.
//
// `message` can also contain placeholders
// in the form of `{{propertyName}}`` which
// will get replaced automatically with passed
// extra properties.
//
// ### Error Conventions
//
// We follow JavaScript's native error conventions,
// meaning that error names are camelCase with the
// first letter uppercase as well, and the message
// starting with an uppercase letter.
//
var extend = _dereq_('extend');

module.exports = (function() {
  var replacePattern = /\{\{\s*\w+\s*\}\}/g;
  var findPropertyPattern = /\w+/;

  function HoodieError(properties) {
    // normalize arguments
    if (typeof properties === 'string') {
      properties = {
        message: properties
      };
    }

    if (!properties.message) {
      properties.message = 'Something went wrong';
    }

    if (!properties.name) {
      properties.name = 'HoodieError';
    }

    // must check for properties, as this.name is always set.
    properties.message = properties.message.replace(replacePattern, function(match) {
      var property = match.match(findPropertyPattern)[0];
      return properties[property];
    });

    extend(this, properties);
  }

  HoodieError.prototype = new Error();
  HoodieError.prototype.constructor = HoodieError;

  return HoodieError;
})();

},{"extend":39}],60:[function(_dereq_,module,exports){
module.exports = {
  error: _dereq_('./error'),
  objectId: _dereq_('./object_id'),
  objectType: _dereq_('./object_type')
};

},{"./error":59,"./object_id":61,"./object_type":62}],61:[function(_dereq_,module,exports){
// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object IDs.
//
var HoodieError = _dereq_('./error');
var validation = _dereq_('./validation');

module.exports = (function() {
  var validIdPattern = /^[a-z0-9\-]+$/;

  function HoodieObjectIdError(properties) {
    properties.name = 'HoodieObjectIdError';
    properties.message = '"{{id}}" is invalid object id. {{rules}}.';

    return new HoodieError(properties);
  }

  HoodieObjectIdError.isValid = validation.isValid.bind(null, validIdPattern);
  HoodieObjectIdError.isInvalid = validation.isInvalid.bind(null, validIdPattern);

  HoodieObjectIdError.prototype.rules = 'Lowercase letters, numbers and dashes allowed only. Must start with a letter';

  return HoodieObjectIdError;
})();

},{"./error":59,"./validation":63}],62:[function(_dereq_,module,exports){
// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object types, plus must start
// with a letter.
//
var HoodieError = _dereq_('./error');
var validation = _dereq_('./validation');
var RULES = 'lowercase letters, numbers and dashes allowed only. Must start with a letter';

module.exports = (function() {
  var validTypePattern = /^[a-z$][a-z0-9-]+$/;

  function HoodieObjectTypeError(properties) {
    properties.name = 'HoodieObjectTypeError';
    properties.message = '"{{type}}" is invalid object type. {{rules}}.';
    properties.rules = RULES;

    return new HoodieError(properties);
  }

  HoodieObjectTypeError.isValid = validation.isValid.bind(null, validTypePattern);
  HoodieObjectTypeError.isInvalid = validation.isInvalid.bind(null, validTypePattern);

  return HoodieObjectTypeError;
})();


},{"./error":59,"./validation":63}],63:[function(_dereq_,module,exports){
exports.isValid = function(pattern, id, customPattern) {
  return (customPattern || pattern).test(id || '');
};

exports.isInvalid = function() {
  return !exports.isValid.apply(null, arguments);
};

},{}],64:[function(_dereq_,module,exports){
module.exports = {
  error: _dereq_('./error'),
  store: _dereq_('./store'),
  task: _dereq_('./task')
};

},{"./error":60,"./store":68,"./task":74}],65:[function(_dereq_,module,exports){
/*jshint -W079 */
var extend = _dereq_('extend');

var helpers = _dereq_('./helpers');

var utils = _dereq_('../../../utils');
var promise = utils.promise;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;
var isPromise = promise.isPromise;
var Promise = promise.Promise;

// Save
// --------------

// creates or replaces an an eventually existing object in the store
// with same type & id.
//
// When id is undefined, it gets generated and a new object gets saved
//
// example usage:
//
//     store.save('car', undefined, {color: 'red'})
//     store.save('car', 'abc4567', {color: 'red'})
//
exports.save = function(state, type, id, properties, options) {

  if (options) {
    options = extend(true, {}, options);
  } else {
    options = {};
  }

  // don't mess with passed object
  var object = extend(true, {}, properties, {
    type: type,
    id: id
  });

  // validations
  var error = state.validate(object, options || {});

  if (error) {
    return rejectWith(error);
  }

  return helpers.decoratePromise(state, state.backend.save(object, options || {}));
};


// Add
// -------------------

// `.add` is an alias for `.save`, with the difference that there is no id argument.
// Internally it simply calls `.save(type, undefined, object).
//
exports.add = function(state, type, properties, options) {

  if (properties === undefined) {
    properties = {};
  }

  options = options || {};

  if (! properties.id) {
    return exports.save(state, type, properties.id, properties, options);
  }

  return exports.find(state, type, properties.id)
  .then(function(object) {
    return rejectWith({
      name: 'HoodieConflictError',
      message: '"{{type}}" with id "{{id}}" already exists',
      type: object.type,
      id: object.id
    });
  })
  .catch(function(error) {
    if (error.name === 'HoodieNotFoundError') {
      return exports.save(state, type, properties.id, properties, options);
    }

    throw error;
  });
};


// find
// ------

//
exports.find = function(state, type, id) {

  return helpers.decoratePromise(state, state.backend.find(type, id));
};


// find or add
// -------------

// 1. Try to find a share by given id
// 2. If share could be found, return it
// 3. If not, add one and return it.
//
exports.findOrAdd = function(state, type, id, properties) {

  if (properties === null) {
    properties = {};
  }

  function handleNotFound() {
    var newProperties;
    newProperties = extend(true, {
      id: id
    }, properties);
    return exports.add(state, type, newProperties);
  }

  // promise decorations get lost when piped through `then`,
  // that's why we need to decorate the find's promise again.
  var promise = exports.find(state, type, id).then(null, handleNotFound);
  return helpers.decoratePromise(state, promise);
};


// findAll
// ------------

// returns all objects from store.
// Can be optionally filtered by a type or a function
//
exports.findAll = function(state, type, options) {
  return helpers.decoratePromise(state, state.backend.findAll(type, options));
};


// Update
// -------------------

// In contrast to `.save`, the `.update` method does not replace the stored object,
// but only changes the passed attributes of an existing object, if it exists
//
// both a hash of key/values or a function that applies the update to the passed
// object can be passed.
//
// example usage
//
// hoodie.store.update('car', 'abc4567', {sold: true})
// hoodie.store.update('car', 'abc4567', function(obj) { obj.sold = true })
//
exports.update = function(state, type, id, objectUpdate, options) {

  function handleFound(currentObject) {
    var changedProperties, newObj, value;

    // normalize input
    newObj = extend(true, {}, currentObject);

    if (typeof objectUpdate === 'function') {
      objectUpdate = objectUpdate(newObj);
    }

    if (!objectUpdate) {
      return resolveWith(currentObject);
    }

    // check if something changed
    changedProperties = (function() {
      var _results = [];

      for (var key in objectUpdate) {
        if (objectUpdate.hasOwnProperty(key)) {
          value = objectUpdate[key];
          if (currentObject[key] === value) {
            continue;
          }
          // workaround for undefined values, as extend ignores these
          newObj[key] = value;
          _results.push(key);
        }
      }
      return _results;
    })();

    if (!(changedProperties.length || options)) {
      return resolveWith(newObj);
    }

    //apply update
    return exports.save(state, type, id, newObj, options);
  }

  // promise decorations get lost when piped through `then`,
  // that's why we need to decorate the find's promise again.
  var promise = exports.find(state, type, id).then(handleFound);
  return helpers.decoratePromise(state, promise);
};


// updateOrAdd
// -------------

// same as `.update()`, but in case the object cannot be found,
// it gets created
//
exports.updateOrAdd = function(state, type, id, objectUpdate, options) {
  function handleNotFound() {
    var properties = extend(true, {}, objectUpdate, {
      id: id
    });

    return exports.add(state, type, properties, options);
  }

  var promise = exports.update(state, type, id, objectUpdate, options)
    .then(null, handleNotFound);

  return helpers.decoratePromise(state, promise);
};


// updateAll
// -----------------

// update all objects in the store, can be optionally filtered by a function
// As an alternative, an array of objects can be passed
//
// example usage
//
// hoodie.store.updateAll()
//
exports.updateAll = function(state, filterOrObjects, objectUpdate, options) {
  var promise;

  options = options || {};

  // normalize the input: make sure we have all objects
  switch (true) {
  case typeof filterOrObjects === 'string':
    promise = exports.findAll(state, filterOrObjects);
    break;
  case isPromise(filterOrObjects):
    promise = filterOrObjects;
    break;
  case $.isArray(filterOrObjects):
    promise = resolveWith(filterOrObjects);
    break;
  default:
    // e.g. null, update all
    promise = exports.findAll(state);
    options = objectUpdate;
    objectUpdate = filterOrObjects;
  }

  promise = promise.then(function(objects) {
    // now we update all objects one by one and return a promise
    // that will be resolved once all updates have been finished
    var updatePromises;

    if (!$.isArray(objects)) {
      objects = [objects];
    }

    updatePromises = objects.map(function(object) {
      return exports.update(state, object.type, object.id, objectUpdate, options);
    });

    return Promise.all(updatePromises);
  });

  return helpers.decoratePromise(state, promise);
};


// Remove
// ------------

// Removes one object specified by `type` and `id`.
//
// when object has been synced before, mark it as deleted.
// Otherwise remove it from Store.
//
exports.remove = function(state, type, id, options) {
  return helpers.decoratePromise(state, state.backend.remove(type, id, options || {}));
};


// removeAll
// -----------

// Destroy all objects. Can be filtered by a type
//
exports.removeAll = function(state, type, options) {
  return helpers.decoratePromise(state, state.backend.removeAll(type, options || {}));
};


// decorate promises
// -------------------

// extend promises returned by store.api
exports.decoratePromises = function(state, methods) {
  return extend(state.promiseApi, methods);
};

},{"../../../utils":79,"./helpers":66,"extend":39}],66:[function(_dereq_,module,exports){
var extend = _dereq_('extend');

var error = _dereq_('../../error');
var HoodieError = error.error;
var HoodieObjectTypeError = error.objectType;
var HoodieObjectIdError = error.objectId;

// Private
// ---------
var exports = module.exports;

//
exports.decoratePromise = function (state, promise) {
  return extend(promise, state.promiseApi);
};

// / not allowed for id
exports.validIdOrTypePattern = /^[^\/]+$/;
exports.validIdOrTypeRules = '/ not allowed';

exports.defaultValidate = function(object) {

  if (!object) {
    return new HoodieError({
      name: 'InvalidObjectError',
      message: 'No object passed.'
    });
  }

  if (HoodieObjectTypeError.isInvalid(object.type, exports.validIdOrTypePattern)) {
    return new HoodieObjectTypeError({
      type: object.type,
      rules: exports.validIdOrTypeRules
    });
  }

  if (!object.id) {
    return;
  }

  if (HoodieObjectIdError.isInvalid(object.id, exports.validIdOrTypePattern)) {
    return new HoodieObjectIdError({
      id: object.id,
      rules: exports.validIdOrTypeRules
    });
  }
};

},{"../../error":60,"extend":39}],67:[function(_dereq_,module,exports){
// Store
// ============

// This class defines the API that hoodie.store (local store) and hoodie.open
// (remote store) implement to assure a coherent API. It also implements some
// basic validations.
//
// The returned API provides the following methods:
//
// * validate
// * save
// * add
// * find
// * findOrAdd
// * findAll
// * update
// * updateAll
// * remove
// * removeAll
// * decoratePromises
// * trigger
// * on
// * unbind
//
// At the same time, the returned API can be called as function returning a
// store scoped by the passed type, for example
//
//     var taskStore = hoodie.store('task');
//     taskStore.findAll().then( showAllTasks );
//     taskStore.update('id123', {done: true});
//

//
var hoodieScopedStoreApi = _dereq_('../scoped');
var extend = _dereq_('extend');

var utils = _dereq_('../../../utils');

var helpers = _dereq_('./helpers');
var apiMethods = _dereq_('./api');

module.exports = function(hoodie, options) {
  var state = {
    // persistence logic
    backend: {},
    hoodie: hoodie,
    // name
    storeName:  options.name || 'store',
    // extend this property with extra functions that will be available
    // on all promises returned by hoodie.store API. It has a reference
    // to current hoodie instance by default
    promiseApi: {
      hoodie: hoodie
    }
  };

  // public API
  var api = function(type, id) {
    var scopedOptions = extend(true, {
      type: type,
      id: id
    }, options);
    return hoodieScopedStoreApi(hoodie, api, scopedOptions);
  };

  state.events = utils.events(hoodie, api, state.storeName);

  // Validate
  // --------------

  // by default, we only check for a valid type & id.
  // the validate method can be overwritten by passing
  // options.validate
  //
  // if `validate` returns nothing, the passed object is
  // valid. Otherwise it returns an error
  //
  api.validate = state.validate = helpers.defaultValidate.bind(null);

  if (typeof options.validate === 'function') {
    api.validate = state.validate = options.validate;
  }

  // required backend methods
  // -------------------------
  if (!options.backend) {
    throw new Error('options.backend must be passed');
  }

  [
    'save',
    'find',
    'findAll',
    'remove',
    'removeAll'
  ].forEach(function(method) {

    if (!options.backend[method]) {
      throw new Error('options.backend.' + method + ' must be passed.');
    }

    state.backend[method] = options.backend[method];
  });

  // public API
  Object.keys(apiMethods).forEach(function(method) {
    if (typeof apiMethods[method] === 'function') {
      api[method] = apiMethods[method].bind(null, state);
    }
  });

  return api;
};

},{"../../../utils":79,"../scoped":73,"./api":65,"./helpers":66,"extend":39}],68:[function(_dereq_,module,exports){
module.exports = {
  api: _dereq_('./api'),
  remote: _dereq_('./remote'),
  scoped: _dereq_('./scoped')
};

},{"./api":67,"./remote":71,"./scoped":73}],69:[function(_dereq_,module,exports){
(function (global){
var extend = _dereq_('extend');
var utils = _dereq_('../../../utils');
var getDefer = utils.promise.defer;
var resolveWith = utils.promise.resolveWith;
var resolve = utils.promise.resolve;

var helpers = _dereq_('./helpers');

// request
// ---------
var exports = module.exports;

// wrapper for hoodie's request, with some store specific defaults
// and a prefixed path
//
exports.request = function(state, type, path, options) {
  options = options || {};

  if (state.remoteName) {
    path = '/' + (encodeURIComponent(state.remoteName)) + path;
  }

  if (state.baseUrl) {
    path = '' + state.baseUrl + path;
  }

  options.contentType = options.contentType || 'application/json';

  if (type === 'POST' || type === 'PUT') {
    options.dataType = options.dataType || 'json';
    options.processData = options.processData || false;
    options.data = JSON.stringify(options.data);
  }
  return state.hoodie.request(type, path, options);
};


// isKnownObject
// ---------------

// determine between a known and a new object
//
exports.isKnownObject = function(state, object) {
  var key = '' + object.type + '/' + object.id;

  if (state.knownObjects[key] !== undefined) {
    return state.knownObjects[key];
  }
};


// markAsKnownObject
// -------------------

// determine between a known and a new object
//
exports.markAsKnownObject = function(state, object) {
  var key = '' + object.type + '/' + object.id;
  state.knownObjects[key] = 1;
  return state.knownObjects[key];
};


// synchronization
// -----------------

// Connect
// ---------

// start syncing. `remote.bootstrap()` will automatically start
// pulling when `remote.connected` remains true.
//
var connectDefer;
exports.connect = function(state, name) {
  if (state.connected) {
    return connectDefer.promise;
  }
  connectDefer = getDefer();
  if (name) {
    state.remoteName = name;
  }
  state.connected = true;
  state.remote.trigger('connect');
  state.remote.bootstrap().then(function() {
    return state.remote.push();
  }).then(connectDefer.resolve, connectDefer.reject);

  return connectDefer.promise;
};


// Disconnect
// ------------

// stop syncing changes from remote store
//
exports.disconnect = function(state) {
  state.connected = false;
  state.remote.trigger('disconnect'); // TODO: spec that
  if (state.pullRequest) {
    state.pullRequest.abort();
  }

  if (state.pushRequest) {
    state.pushRequest.abort();
  }

  connectDefer = undefined;
  return resolve();
};


// isConnected
// -------------

//
exports.isConnected = function(state) {
  return state.connected;
};


// getSinceNr
// ------------

// returns the sequence number from which to start to find changes in pull
//
exports.getSinceNr = function(state) {
  if (typeof state.since === 'function') {
    return state.since();
  }

  return state.since;
};


// bootstrap
// -----------

// initial pull of data of the remote store. By default, we pull all
// changes since the beginning, but this behavior might be adjusted,
// e.g for a filtered bootstrap.
//
exports.bootstrap = function(state) {
  state.isBootstrapping = true;
  state.remote.trigger('bootstrap:start');
  return state.remote.pull()
    .done(helpers.handleBootstrapSuccess.bind(null, state))
    .fail(helpers.handleBootstrapError.bind(null, state));
};


// pull changes
// --------------

// a.k.a. make a GET request to CouchDB's `_changes` feed.
// We currently make long poll requests, that we manually abort
// and restart each 25 seconds.
//
exports.pull = function(state) {
  state.pullRequest = state.remote.request('GET', helpers.pullUrl(state));

  if (state.remote.isConnected()) {
    global.clearTimeout(state.pullRequestTimeout);
    state.pullRequestTimeout = global.setTimeout(state.restartPullRequest, 25000);
  }

  return state.pullRequest
    .done(helpers.handlePullSuccess.bind(null, state))
    .fail(helpers.handlePullError.bind(null, state));
};


// push changes
// --------------

// Push objects to remote store using the `_bulk_docs` API.
//
exports.push = function(state, objects) {
  var object;
  var objectsForRemote = [];

  if (! $.isArray(objects)) {
    objects = helpers.defaultObjectsToPush(state);
  }

  if (objects.length === 0) {
    return resolveWith([]);
  }

  // don't mess with the originals
  objects = objects.map(function(object) {
    return extend(true, {}, object);
  });

  objectsForRemote = [];
  for (var i = 0; i < objects.length; i++) {

    object = objects[i];
    helpers.addRevisionTo(state, object);
    state.remote.markAsKnownObject(object);
    object = helpers.parseForRemote(state, object);
    objectsForRemote.push(object);

    // store the revision to prevent change events from
    // being triggered for the same object revisions
    state.pushedObjectRevisions[object._rev] = 1;
  }
  state.pushRequest = state.remote.request('POST', '/_bulk_docs', {
    data: {
      docs: objectsForRemote,
      new_edits: false
    }
  });

  state.pushRequest.done(function() {
    for (var i = 0; i < objects.length; i++) {
      delete objects[i]._revisions;
      state.remote.trigger('push', objects[i]);
    }
  });
  return state.pushRequest;
};

// sync changes
// --------------

// push objects, then pull updates.
//
exports.sync = function(state, objects) {
  return state.remote.push(objects).then(state.remote.pull);
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../../utils":79,"./helpers":70,"extend":39}],70:[function(_dereq_,module,exports){
(function (global){
var extend = _dereq_('extend');
var utils = _dereq_('../../../utils');
var generateId = utils.generateId;

//
// Private
// ---------
//
var exports = module.exports;

// valid CouchDB doc attributes starting with an underscore
//
exports.VALID_SPECIAL_ATTRIBUTES = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];


// default objects to push
// --------------------------

// when pushed without passing any objects, the objects returned from
// this method will be passed. It can be overwritten by passing an
// array of objects or a function as `options.objects`
//
exports.defaultObjectsToPush = function(state) {
  if (! state.options || ! state.options.defaultObjectsToPush) {
    return [];
  }
  if (global.$.isArray(state.options.defaultObjectsToPush)) {
    return state.options.defaultObjectsToPush;
  } else {
    return state.options.defaultObjectsToPush();
  }
};

// setSinceNr
// ------------

// sets the sequence number from which to start to find changes in pull.
// If remote store was initialized with since : function(nr) { ... },
// call the function with the seq passed. Otherwise simply set the seq
// number and return it.
//
exports.setSinceNr = function(state, seq) {
  if (typeof state.since === 'function') {
    return state.since(seq);
  }

  state.since = seq;
  return state.since;
};


// Parse for remote
// ------------------

// parse object for remote storage. All properties starting with an
// `underscore` do not get synchronized despite the special properties
// `_id`, `_rev` and `_deleted` (see above)
//
// Also `id` gets replaced with `_id` which consists of type & id
//
exports.parseForRemote = function(state, object) {
  var attr, properties;
  properties = extend({}, object);

  for (attr in properties) {
    if (properties.hasOwnProperty(attr)) {
      if (exports.VALID_SPECIAL_ATTRIBUTES.indexOf(attr) !== -1) {
        continue;
      }
      if (!/^_/.test(attr)) {
        continue;
      }
      delete properties[attr];
    }
  }

  // prepare CouchDB id
  properties._id = '' + properties.type + '/' + properties.id;
  if (state.prefix) {
    properties._id = '' + state.prefix + properties._id;
  }
  delete properties.id;
  return properties;
};

// ### parseFromRemote

// normalize objects coming from remote
//
// renames `_id` attribute to `id` and removes the type from the id,
// e.g. `type/123` -> `123`
//
exports.parseFromRemote = function(state, object) {
  var id, matches;

  // handle id and type
  id = object._id || object.id;
  delete object._id;

  if (state.prefix) {
    id = id.replace(state.remotePrefixPattern, '');
  }

  // turn doc/123 into type = doc & id = 123
  // NOTE: we don't use a simple id.split(/\//) here,
  // as in some cases IDs might contain '/', too
  //
  matches = id.match(/([^\/]+)\/(.*)/);
  object.type = matches[1], object.id = matches[2];

  return object;
};

exports.parseAllFromRemote = function(state, objects) {
  return objects.map(exports.parseFromRemote.bind(null, state));
};


// ### _addRevisionTo

// extends passed object with a _rev property
//
exports.addRevisionTo = function(state, attributes) {
  var currentRevId, currentRevNr, newRevisionId, revParts;
  if (attributes._rev) {
    revParts = attributes._rev.split(/-/);
    currentRevNr = revParts[0];
    currentRevId = revParts[1];
  }
  currentRevNr = parseInt(currentRevNr, 10) || 0;
  newRevisionId = exports.generateNewRevisionId(state);

  // local changes are not meant to be replicated outside of the
  // users database, therefore the `-local` suffix.
  if (attributes._$local) {
    newRevisionId += '-local';
  }

  attributes._rev = '' + (currentRevNr + 1) + '-' + newRevisionId;
  attributes._revisions = {
    start: 1,
    ids: [newRevisionId]
  };

  if (currentRevId) {
    attributes._revisions.start += currentRevNr;
    return attributes._revisions.ids.push(currentRevId);
  }
};


// ### generate new revision id

//
exports.generateNewRevisionId = function() {
  return generateId(9);
};


// ### map docs from findAll

//
exports.mapDocsFromFindAll = function(state, response) {
  return response.rows.map(function(row) {
    return row.doc;
  });
};


// ### pull url

// Depending on whether remote is connected (= pulling changes continuously)
// return a longpoll URL or not. If it is a beginning bootstrap request, do
// not return a longpoll URL, as we want it to finish right away, even if there
// are no changes on remote.
//
exports.pullUrl = function(state) {
  var since = state.remote.getSinceNr();
  if (state.remote.isConnected() && !state.isBootstrapping) {
    return '/_changes?include_docs=true&since=' + since + '&heartbeat=10000&feed=longpoll';
  } else {
    return '/_changes?include_docs=true&since=' + since;
  }
};


// ### restart pull request

// request gets restarted automatically
// when aborted (see handlePullError)
exports.restartPullRequest = function(state) {
  if (state.pullRequest) {
    state.pullRequest.abort();
  }
};


// ### pull success handler

// request gets restarted automatically
// when aborted (see handlePullError)
//
exports.handlePullSuccess = function(state, response) {
  exports.setSinceNr(state, response.last_seq);
  exports.handlePullResults(state, response.results);
  if (state.remote.isConnected()) {
    return state.remote.pull();
  }
};


// ### pull error handler

// when there is a change, trigger event,
// then check for another change
//
exports.handlePullError = function(state, xhr, error) {
  if (!state.remote.isConnected()) {
    return;
  }

  switch (xhr.status) {
    // Session is invalid. User is still login, but needs to reauthenticate
    // before sync can be continued
  case 401:
    state.remote.trigger('error:unauthenticated', error);
    return state.remote.disconnect();

    // the 404 comes, when the requested DB has been removed
    // or does not exist yet.
    //
    // BUT: it might also happen that the background workers did
    //      not create a pending database yet. Therefore,
    //      we try it again in 3 seconds
    //
    // TODO: review / rethink that.
    //
  case 404:
    return global.setTimeout(state.remote.pull, 3000);

  case 500:
    //
    // Please server, don't give us these. At least not persistently
    //
    state.remote.trigger('error:server', error);
    global.setTimeout(state.remote.pull, 3000);
    return state.hoodie.checkConnection();
  default:
    // usually a 0, which stands for timeout or server not reachable.
    if (xhr.statusText === 'abort') {
      // manual abort after 25sec. restart pulling changes directly when connected
      return state.remote.pull();
    } else {

      // oops. This might be caused by an unreachable server.
      // Or the server cancelled it for what ever reason, e.g.
      // heroku kills the request after ~30s.
      // we'll try again after a 3s timeout
      //
      global.setTimeout(state.remote.pull, 3000);
      return state.hoodie.checkConnection();
    }
  }
};


// ### handle initial bootstrapping from remote
//
exports.handleBootstrapSuccess = function(state) {
  state.isBootstrapping = false;
  state.remote.trigger('bootstrap:end');
};

// ### handle error of initial bootstrapping from remote
//
exports.handleBootstrapError = function(state, error) {
  state.isBootstrapping = false;
  state.remote.trigger('bootstrap:error', error);
};

// ### handle changes from remote
//
exports.handlePullResults = function(state, changes) {
  var doc, event, object;

  var remote = state.remote;

  for (var i = 0; i < changes.length; i++) {
    doc = changes[i].doc;

    if (state.prefix && doc._id.indexOf(state.prefix) !== 0) {
      continue;
    }

    if (state.pushedObjectRevisions[doc._rev]) {
      continue;
    }

    object = exports.parseFromRemote(state, doc);

    if (object._deleted) {
      if (!state.remote.isKnownObject(object)) {
        continue;
      }
      event = 'remove';
      remote.isKnownObject(object);
    } else {
      if (remote.isKnownObject(object)) {
        event = 'update';
      } else {
        event = 'add';
        remote.markAsKnownObject(object);
      }
    }

    remote.trigger(event, object);
    remote.trigger(object.type + ':' + event, object);
    remote.trigger(object.type + ':' + object.id + ':' + event, object);
    remote.trigger('change', event, object);
    remote.trigger(object.type + ':change', event, object);
    remote.trigger(object.type + ':' + object.id + ':change', event, object);

    // DEPRECATED
    // https://github.com/hoodiehq/hoodie.js/issues/146
    // https://github.com/hoodiehq/hoodie.js/issues/326
    remote.trigger(event + ':' + object.type, object);
    remote.trigger(event + ':' + object.type + ':' + object.id, object);
    remote.trigger('change:' + object.type, event, object);
    remote.trigger('change:' + object.type + ':' + object.id, event, object);
  }

  // reset the hash for pushed object revision after
  // every response from the longpoll GET /_changes
  state.pushedObjectRevisions = {};
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../../utils":79,"extend":39}],71:[function(_dereq_,module,exports){
var hoodieStoreApi = _dereq_('../api');
var remoteStore = _dereq_('./remotestore');
var api = _dereq_('./api');

// Remote
// ========

// Connection to a remote Couch Database.
//
// store API
// ----------------
//
// object loading / updating / deleting
//
// * find(type, id)
// * findAll(type )
// * add(type, object)
// * save(type, id, object)
// * update(type, id, new_properties )
// * updateAll( type, new_properties)
// * remove(type, id)
// * removeAll(type)
//
// custom requests
//
// * request(view, params)
// * get(view, params)
// * post(view, params)
//
// synchronization
//
// * connect()
// * disconnect()
// * pull()
// * push()
// * sync()
//
// event binding
//
// * on(event, callback)
//

module.exports = function(hoodie, options) {
  var internals = {
    connected: false,
    prefix: '',
    baseUrl: undefined
  };

  var state = {
    get baseUrl() {
      return internals.baseUrl;
    },
    set baseUrl(input) {
      internals.baseUrl = input;
      remote.baseUrl = input;
    },
    // sync
    // if set to true, updates will be continuously pulled
    // and pushed. Alternatively, `sync` can be set to
    // `pull: true` or `push: true`.
    //
    get connected() {
      return internals.connected;
    },
    set connected(input) {
      internals.connected = input;
      remote.connected = input;
    },
    // prefix
    // prefix for docs in a CouchDB database, e.g. all docs
    // in public user stores are prefixed by '$public/'
    //
    get prefix() {
      return internals.prefix;
    },
    set prefix(input) {
      internals.prefix = input;
      remote.prefix = input;
    },

    // name

    // the name of the Remote is the name of the
    // CouchDB database and is also used to prefix
    // triggered events
    //
    remoteName: null,
    remotePrefixPattern: new RegExp('^'),
    // TODO: spec that!
    since: options.since || 0,
    isBootstrapping: false,
    pullRequest: undefined,
    pullRequestTimeout: undefined,
    pushRequest: undefined,
    pushedObjectRevisions: {},
    // in order to differentiate whether an object from remote should trigger a 'new'
    // or an 'update' event, we store a hash of known objects
    knownObjects: {},
    options: options,
    hoodie: hoodie
  };

  var remote = hoodieStoreApi(hoodie, {
    name: options.name,

    backend: {
      save: remoteStore.save.bind(null, state),
      find: remoteStore.find.bind(null, state),
      findAll: remoteStore.findAll.bind(null, state),
      remove: remoteStore.remove.bind(null, state),
      removeAll: remoteStore.removeAll.bind(null, state)
    }
  });

  // defaults
  // ----------------

  //
  if (options.name !== undefined) {
    state.remoteName = options.name;
  }

  if (options.prefix !== undefined) {
    state.prefix = options.prefix;
    state.remotePrefixPattern = new RegExp('^' + state.prefix);
  }

  if (options.baseUrl !== null) {
    state.baseUrl = options.baseUrl;
  }

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      remote[method] = api[method].bind(null, state);
    }
  });

  // bootstrap known objects
  //
  if (options.knownObjects) {
    for (var i = 0; i < options.knownObjects.length; i++) {
      remote.markAsKnownObject({
        type: options.knownObjects[i].type,
        id: options.knownObjects[i].id
      });
    }
  }

  // externalize current remote instance
  state.remote = remote;

  return remote;
};

},{"../api":67,"./api":69,"./remotestore":72}],72:[function(_dereq_,module,exports){
var utils = _dereq_('../../../utils');
var generateId = utils.generateId;
var helpers = _dereq_('./helpers');

// Remote Store Persistence methods
// ----------------------------------
var exports = module.exports;

// find
// ------

// find one object
//
exports.find = function(state, type, id) {
  var path;

  path = type + '/' + id;

  if (state.prefix) {
    path = state.prefix + path;
  }

  path = '/' + encodeURIComponent(path);

  return state.remote.request('GET', path)
    .then(helpers.parseFromRemote.bind(null, state));
};


// findAll
// ---------

// find all objects, can be filtered by a type
//
exports.findAll = function(state, type) {
  var endkey, path, startkey;

  path = '/_all_docs?include_docs=true';

  switch (true) {
  case (type !== undefined) && state.prefix !== '':
    startkey = state.prefix + type + '/';
    break;
  case type !== undefined:
    startkey = type + '/';
    break;
  case state.prefix !== '':
    startkey = state.prefix;
    break;
  default:
    startkey = '';
  }

  if (startkey) {

    // make sure that only objects starting with
    // `startkey` will be returned
    endkey = startkey.replace(/.$/, function(chars) {
      var charCode;
      charCode = chars.charCodeAt(0);
      return String.fromCharCode(charCode + 1);
    });
    path = path +
      '&startkey="' +
      (encodeURIComponent(startkey)) +
      '"&endkey="' +
      (encodeURIComponent(endkey)) + '"';
  }

  return state.remote.request('GET', path)
    .then(helpers.mapDocsFromFindAll.bind(null, state))
    .then(helpers.parseAllFromRemote.bind(null, state));
};


// save
// ------

// save a new object. If it existed before, all properties
// will be overwritten
//
exports.save = function(state, properties) {
  var remoteProperties, path;

  if (!properties.id) {
    properties.id = generateId();
  }

  // add timestamps and user id
  properties.createdBy = properties.createdBy || state.hoodie.id();
  properties.updatedAt = new Date().toJSON();
  properties.createdAt = properties.createdAt || properties.updatedAt;


  remoteProperties = helpers.parseForRemote(state, properties);
  path = '/' + encodeURIComponent(remoteProperties._id);
  return state.remote.request('PUT', path, {
    data: remoteProperties
  }).then(function(response) {
    properties._rev = response.rev;
    return properties;
  });
};


// remove
// ---------

// remove one object
//
exports.remove = function(state, type, id) {
  return state.remote.update(type, id, {
    _deleted: true
  });
};


// removeAll
// ------------

// remove all objects, can be filtered by type
//
exports.removeAll = function(state, type) {
  return state.remote.updateAll(type, {
    _deleted: true
  });
};

},{"../../../utils":79,"./helpers":70}],73:[function(_dereq_,module,exports){
// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var utils = _dereq_('../../utils');

var exports = module.exports = function (hoodie, storeApi, options) {
  var api = {};
  var id = options.id;
  var storeName = options.name || 'store';
  var type = options.type;

  // add events
  utils.events(
    hoodie,
    api,
    [storeName, type, id].join(':').replace(/:$/,'')
  );

  //
  api.decoratePromises = storeApi.decoratePromises;
  api.validate = storeApi.validate;

  // scoped by both: type & id
  if (id) {
    ['save', 'find', 'update', 'remove'].forEach(function(method) {
      api[method] = exports[method].bind(null, storeApi, type, id);
    });

    return api;
  }

  // scoped by type only
  [
    'save',
    'add',
    'find',
    'findOrAdd',
    'findAll',
    'update',
    'updateAll',
    'remove',
    'removeAll'
  ].forEach(function(method) {
    api[method] = exports[method].bind(null, storeApi, type);
  });

  return api;
};

//
exports.save = function save(storeApi, type, id, properties, options) {
  return storeApi.save(type, id, properties, options);
};

//
exports.add = function add(storeApi, type, properties, options) {
  return storeApi.add(type, properties, options);
};

//
exports.find = function find(storeApi, type, id)  {
  return storeApi.find(type, id);
};

//
exports.findOrAdd = function findOrAdd(storeApi, type, id, properties) {
  return storeApi.findOrAdd(type, id, properties);
};

//
exports.findAll = function findAll(storeApi, type, options) {
  return storeApi.findAll(type, options);
};

//
exports.update = function update(storeApi, type, id, objectUpdate, options) {
  return storeApi.update(type, id, objectUpdate, options);
};

//
exports.updateAll = function updateAll(storeApi, type, objectUpdate, options) {
  return storeApi.updateAll(type, objectUpdate, options);
};

//
exports.remove = function remove(storeApi, type, id, options) {
  return storeApi.remove(type, id, options);
};

//
exports.removeAll = function removeAll(storeApi, type, options) {
  return storeApi.removeAll(type, options);
};

},{"../../utils":79}],74:[function(_dereq_,module,exports){
module.exports = {
  scoped: _dereq_('./scoped')
};

},{"./scoped":75}],75:[function(_dereq_,module,exports){
// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var utils = _dereq_('../../utils');

var exports = module.exports = function (hoodie, taskApi, options) {
  var api = {};
  var id = options.id;
  var type = options.type;

  // add events
  utils.events(
    hoodie,
    api,
    ['task', type, id].join(':').replace(/:$/,'')
  );

  // scoped by both: type & id
  if (id) {
    ['abort', 'restart'].forEach(function(method) {
      api[method] = exports[method].bind(null, taskApi, type, id);
    });

    return api;
  }

  // scoped by type only
  ['start', 'abort', 'restart', 'abortAll', 'restartAll'].forEach(function(method) {
    api[method] = exports[method].bind(null, taskApi, type);
  });

  return api;
};

exports.start = function start(taskApi, type, properties) {
  return taskApi.start(type, properties);
};

exports.abort = function abort(taskApi, type, id) {
  return taskApi.abort(type, id);
};

exports.restart = function restart(taskApi, type, id, update) {
  return taskApi.restart(type, id, update);
};

exports.abortAll = function abortAll(taskApi, type) {
  return taskApi.abortAll(type);
};

exports.restartAll = function restartAll(taskApi, type, update) {
  return taskApi.restartAll(type, update);
};

},{"../../utils":79}],76:[function(_dereq_,module,exports){
// Hoodie Config API
// ===================

var localStorageWrapper = _dereq_('../utils/local_storage_wrapper')();
var extend = _dereq_('extend');

var exports = module.exports = function(storeKey) {
  storeKey = storeKey || '_hoodie_config';

  var store = {
    get: localStorageWrapper.getObject.bind(null, storeKey),
    set: localStorageWrapper.setObject.bind(null, storeKey),
    remove: localStorageWrapper.removeItem.bind(null, storeKey)
  };

  //
  // load current configuration from localStore.
  //
  var config = store.get() || {};

  var state = {config: config, store: store};

  // public API
  return {
    set: exports.set.bind(null, state),
    get: exports.get.bind(null, state),
    clear: exports.clear.bind(null, state),
    unset: exports.unset.bind(null, state)
  };
};

// set
// ----------

// adds a configuration
//
exports.set = function (state, key, value) {
  state.config[key] = value;
  state.store.set(state.config);
};

// get
// ----------

// receives a configuration
//
exports.get = function (state, key) {
  if (key) {
    return state.config[key];
  }
  return extend({}, state.config);
};

// clear
// ----------

// clears config and removes object from localStorageWrapper
//
exports.clear = function (state) {
  state.config = {};
  return state.store.remove();
};

// unset
// ----------

// unsets a configuration. If configuration is present, calls
// config.set(key, undefined).
//
exports.unset = function (state, key) {
  delete state.config[key];
  state.store.set(state.config);
};

},{"../utils/local_storage_wrapper":80,"extend":39}],77:[function(_dereq_,module,exports){

var JQEventEmitter = _dereq_('jqevents');
var extend = _dereq_('extend');


var exports = module.exports = function(hoodie, context, namespace) {
  if (context && namespace) {
    return exports.scopedEventEmitter.apply(null, arguments);
  }

  var emitter = JQEventEmitter.create();

  // aliases
  emitter.one = emitter.once;
  emitter.bind = emitter.on;
  emitter.unbind = emitter.off;

  // monkey patch emit with try-catch
  // because of https://github.com/hoodiehq/hoodie.js/issues/376
  emitter.trigger = emitter.emit = (function(emit) {
    return function() {
      try {
        emit.apply(emitter, arguments);
      } catch (error) {
        setTimeout(function() {
          throw error;
        });
      }
    };
  })(emitter.emit);

  extend(hoodie, emitter);

  return emitter;
};

exports.METHODS = ['on','off','one','trigger','bind','unbind'];

var regexMatchBeginningOfEventNames = /(^|\s)/g;
exports.scopedEventEmitter = function(hoodie, context, namespace) {
  var scopedEmitter = {};

  exports.METHODS.forEach(function(fn) {
    scopedEmitter[fn] = function() {
      var args = [].slice.call(arguments);
      args[0] = args[0].replace(regexMatchBeginningOfEventNames, '$1' + namespace + ':');
      hoodie[fn].apply(hoodie, args);
    };
  });

  extend(context, scopedEmitter);
  return scopedEmitter;
};

},{"extend":39,"jqevents":41}],78:[function(_dereq_,module,exports){
// uuids consist of numbers and lowercase letters only.
// We stick to lowercase letters to prevent confusion
// and to prevent issues with CouchDB, e.g. database
// names only allow for lowercase letters.

var exports = module.exports = function(chars) {
  chars = chars || '0123456789abcdefghijklmnopqrstuvwxyz'.split('');

  return exports.generateId.bind(null, chars);
};

// helper to generate unique ids.
exports.generateId = function(chars, length) {
  var id = '';
  var radix = chars.length;

  // default uuid length to 7
  if (length === undefined) {
    length = 7;
  }

  for (var i = 0; i < length; i++) {
    var rand = Math.random() * radix;
    var char = chars[Math.floor(rand)];
    id += String(char).charAt(0);
  }

  return id;
};


},{}],79:[function(_dereq_,module,exports){
module.exports = {
  config: _dereq_('./config')(),
  events: _dereq_('./events'),
  generateId: _dereq_('./generate_id')(),
  localStorageWrapper: _dereq_('./local_storage_wrapper')(),
  promise: _dereq_('./promise')
};


},{"./config":76,"./events":77,"./generate_id":78,"./local_storage_wrapper":80,"./promise":82}],80:[function(_dereq_,module,exports){
(function (global){

var exports = module.exports = function() {
  if (!exports.hasLocalStorage()) {
    return exports.createWrapper(exports.localStub, false);
  }

  return exports.createWrapper(global.localStorage, true);
};

exports.createWrapper = function(store, isPersistent) {
  return {
    getItem: store.getItem.bind(store),
    setItem: store.setItem.bind(store),
    removeItem: store.removeItem.bind(store),
    key: store.key.bind(store),
    isPersistent: isPersistent,
    length: function() { return store.length; },
    setObject: exports.setObject.bind(null, store),
    getObject: exports.getObject.bind(null, store)
  };
};

var noop = function() {
  return null;
};

exports.localStub = {
  getItem: noop,
  setItem: noop,
  removeItem: noop,
  key: noop,
  length: 0
};

// more advanced localStorage wrappers to find/save objects
exports.setObject = function (store, key, object) {
  if (typeof object !== 'object') {
    return store.setItem(key, object);
  }

  return store.setItem(key, global.JSON.stringify(object));
};

exports.getObject = function (store, key) {
  var item = store.getItem(key);

  if (!item) {
    return null;
  }

  try {
    return global.JSON.parse(item);
  } catch (e) {
    return item;
  }
};

// Is persistent?
// ----------------
//

// returns `true` or `false` depending on whether localStorage is supported or not.
// Beware that some browsers like Safari do not support localStorage in private mode.
//
// inspired by this cappuccino commit
// https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
//

exports.hasLocalStorage = function() {
  try {

    // we've to put this in here. I've seen Firefox throwing `Security error: 1000`
    // when cookies have been disabled
    if (!global.localStorage) {
      return false;
    }

    // Just because localStorage exists does not mean it works. In particular it might be disabled
    // as it is when Safari's private browsing mode is active.
    global.localStorage.setItem('Storage-Test', '1');

    // that should not happen ...
    if (global.localStorage.getItem('Storage-Test') !== '1') {
      return false;
    }

    // okay, let's clean up if we got here.
    global.localStorage.removeItem('Storage-Test');
  } catch (_error) {

    // in case of an error, like Safari's Private Mode, return false
    return false;
  }

  // we're good.
  return true;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],81:[function(_dereq_,module,exports){
/*jshint -W079 */
var Promise = _dereq_('./promise');

module.exports = function Defer() {
  var defer = {};
  defer.promise = new Promise(function (resolveCallback, rejectCallback) {
    defer.resolve = function resolve() {
      defer.notify = function noop () {};
      resolveCallback.apply(null, arguments);
    };
    defer.reject = function reject() {
      defer.notify = function noop () {};
      rejectCallback.apply(null, arguments);
    };
  });

  // add done, fail, always, progress callbacks
  wrapPromise(defer.promise);
  defer.promise._progressCallbacks = [];
  defer.notify = function notify() {
    var args = Array.prototype.slice.call(arguments);
    defer.promise._progressCallbacks.forEach(function(callback) {
      callback.apply(null, args);
    });
  };

  return defer;
};

function wrapPromise (promise) {
  if (promise._isHoodiePromise) {
    return promise;
  }
  promise._isHoodiePromise = true;

  promise.done = function done(callback) {
    this.then(callback);
    return this;
  };
  promise.fail = function fail(callback) {
    this.then(null, callback);
    return this;
  };
  promise.always = function always(callback) {
    this.then(callback, callback);
    return this;
  };
  promise.progress = function progress(callback) {
    if (this._progressCallbacks) {
      this._progressCallbacks.push(callback);
    }
    return this;
  };
  promise.then = function (onResolve, onReject) {
    promise = Promise.prototype.then.call(this,
      passProgressCallbacks(this, onResolve),
      passProgressCallbacks(this, onReject));
    wrapPromise(promise);
    promise._progressCallbacks = this._progressCallbacks;
    return promise;
  };

  promise.catch = function catch_(error) {
    promise = Promise.prototype.catch.call(this, error);
    wrapPromise(promise);
    return promise;
  };

  function passProgressCallbacks(promise, callback) {
    if (! callback) {
      return null;
    }

    return function() {
      var newPromise = callback.apply(promise, arguments);
      if (newPromise && newPromise._progressCallbacks && promise._progressCallbacks) {
        newPromise._progressCallbacks = newPromise._progressCallbacks.concat(promise._progressCallbacks);
      }
      return newPromise;
    };
  }
}

},{"./promise":84}],82:[function(_dereq_,module,exports){
module.exports = {
  defer: _dereq_('./defer'),
  isPromise: _dereq_('./is_promise'),
  rejectWith: _dereq_('./reject_with'),
  reject: _dereq_('./reject'),
  resolveWith: _dereq_('./resolve_with'),
  resolve: _dereq_('./resolve'),
  Promise: _dereq_('./promise')
};


},{"./defer":81,"./is_promise":83,"./promise":84,"./reject":85,"./reject_with":86,"./resolve":87,"./resolve_with":88}],83:[function(_dereq_,module,exports){
module.exports = function isPromise (object) {
  if (object && object.then) {
    return (typeof object.then === 'function');
  }

  return false;
};


},{}],84:[function(_dereq_,module,exports){
(function (global){
module.exports = (function() {
  if (typeof global.Promise === 'function') {
    return global.Promise;
  }
  return _dereq_('bluebird');
})();
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"bluebird":3}],85:[function(_dereq_,module,exports){
var dfd = _dereq_('./defer');

module.exports = function reject() {
  var deferred = dfd();

  deferred.reject();

  return deferred.promise;
};

},{"./defer":81}],86:[function(_dereq_,module,exports){
var dfd = _dereq_('./defer');
var HoodieError = _dereq_('../../lib/error/error');

module.exports = function rejectWith(errorProperties) {
  var error = new HoodieError(errorProperties);
  var deferred = dfd();

  deferred.reject(error);

  return deferred.promise;

};


},{"../../lib/error/error":59,"./defer":81}],87:[function(_dereq_,module,exports){
var dfd = _dereq_('./defer');

module.exports = function resolve() {
  var deferred = dfd();

  deferred.resolve();

  return deferred.promise;
};

},{"./defer":81}],88:[function(_dereq_,module,exports){
var dfd = _dereq_('./defer');

module.exports = function resolveWith() {
  var deferred = dfd();

  deferred.resolve.apply(deferred, arguments);

  return deferred.promise;
};

},{"./defer":81}]},{},[42])
(42)
});