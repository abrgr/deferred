var _ = require('underscore');

var Deferred = module.exports = function(name) {
    if ( !!name ) {
        this.name = name;
    } else {
        this.name = Deferred.caller.name;
    }

    this._fired = false;
    this._firing = false;
    this._successCbs = [];
    this._failureCbs = [];
    this._args = [];
    this._success = undefined; // undefined - not done yet, true = success, false = failure
};

Deferred.prototype.resolve = function() {
    return this._fireCallbacks(this._successCbs, true, Array.prototype.slice.call(arguments));
};

Deferred.prototype.__defineGetter__('chainedResolve', function() {
    return this.resolve.bind(this);
});

Deferred.prototype.reject = function() {
    return this._fireCallbacks(this._failureCbs, false, Array.prototype.slice.call(arguments));
};

Deferred.prototype.__defineGetter__('chainedReject', function() {
    return this.reject.bind(this);
});

Deferred.prototype._fireCallbacks = function(cbs, success, args) {
    if ( !(this._firing || this._fired) ) {
        try {
            // _args and _success must be set before _firing
            this._args = Array.prototype.slice.call(args);
            this._success = success;
            this._firing = true;

            while ( cbs[0] ) {
                try {
                    cbs.shift().apply(this, this._args);
                } catch (e) {
                    //TODO: what should we do here?
                    var exceptionStr = '';
                    if ( e instanceof Error ) {
                        exceptionStr = e.message + '\n' + e.stack;
                    } else {
                        exceptionStr = e.toString();
                    }
                    console.error('exception thrown in callback for [' + this.name + ']:', exceptionStr);
                }
            }
        } finally {
            this._fired = true;
            this._firing = false;
        }
    }

    return this;
};

Deferred.prototype.success = function(cb) {
    if ( !(this._firing || this._fired) ) {
        this._successCbs.push(cb);
    } else if ( this._success === true ) {
        // already firing or fired
        //TODO: we may be mid-firing so this may be out of order
        cb.apply(this, this._args);
    }

    return this;
};

Deferred.prototype.fail = function(cb) {
    if ( !(this._firing || this._fired) ) {
        this._failureCbs.push(cb);
    } else if ( this._success === false ) {
        // already firing or fired
        //TODO: we may be mid-firing so this may be out of order
        cb.apply(this, this._args);
    }

    return this;
};

Deferred.prototype.promise = function() {
    var self = this;

    return {
        success: function(cb) { return self.success(cb); },
        fail: function(cb) { return self.fail(cb); }
    };
};

Deferred.prototype.guard = function(ctx, blockToGuard) {
    if ( arguments.length === 1 && _.isFunction(ctx) ) {
        blockToGuard = ctx;
        ctx = null;
    }

    if ( !_.isFunction(blockToGuard) ) {
        throw new Error('Deferred.guard requires a function as a parameter.  Received a ' + typeof(blockToGuard));
    }

    try {
        blockToGuard.apply(ctx, Array.prototype.slice.call(arguments, 2));
    } catch ( err ) {
        this.reject(err);
    }
};

Deferred.afterAll = function(promises) {
    if ( !_.isArray(promises) ) {
        throw new Error('afterAll requires an array of promises');
    }

    var args = [];

    if ( promises.length < 1 ) {
        return Deferred.resolved(args);
    }

    var deferred = new Deferred();
    var returnCount = 0;
    
    promises.forEach(function(promise, idx) {
        promise.success(function() {
            args[idx] = Array.prototype.slice.call(arguments);
            if ( (++returnCount) === promises.length ) {
                deferred.resolve(args);
            }
        }).fail(function() {
            deferred.reject(Array.prototype.slice.call(arguments));
        });
    });

    return deferred.promise();
};

Deferred.resolved = function() {
    var deferred = new Deferred();
    deferred.resolve.apply(deferred, Array.prototype.slice.call(arguments));
    return deferred.promise();
};

Deferred.rejected = function() {
    var deferred = new Deferred();
    deferred.reject.apply(deferred, Array.prototype.slice.call(arguments));
    return deferred.promise();
};
