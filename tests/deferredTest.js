var D = require('../deferred');

function failTest(msg) {
	var test = this;
	test.ok(true, false, msg);
	test.done();
};

module.exports.testSimple = function(test) {
    var expected = 'abc';

    var d = new D();
    d.success(function(arg) {
        test.deepEqual(arg, expected);
        test.done();
    }).fail(failTest.bind(test));

    d.resolve(expected);
};

module.exports.testMultipleSuccesses = function(test) {
    var expected = 'abc';

    var d = new D();

	test.expect(2);
    d.success(function(arg) {
        test.deepEqual(arg, expected);
    }).success(function(arg) {
		test.deepEqual(arg, expected);
        test.done();
	}).fail(failTest.bind(test));

    d.resolve(expected);
};

module.exports.testSimpleWithArray = function(test) {
    var expected1 = ['abc', 'def'];
    var expected2 = ['ghi', 34];

    var d = new D();
    d.success(function(arg1, arg2) {
        test.deepEqual(arg1, expected1);
        test.deepEqual(arg2, expected2);
        test.done();
    }).fail(failTest.bind(test));

    d.resolve(expected1, expected2);
};

module.exports.testSimpleExPostWithArray = function(test) {
    var expected1 = ['abc', 'def'];
    var expected2 = ['ghi', 34];

    var d = new D();
    d.resolve(expected1, expected2);
    d.success(function(arg1, arg2) {
        test.deepEqual(arg1, expected1);
        test.deepEqual(arg2, expected2);
        test.done();
    }).fail(failTest.bind(test));
};

module.exports.testExPostSimple = function(test) {
    var expected = 'abc';

    var d = new D();

    d.resolve(expected);

    d.success(function(arg) {
        test.deepEqual(arg, expected);
        test.done();
    }).fail(failTest.bind(test));
};

module.exports.testResolved = function(test) {
    var expected = 'abc';

    var d = D.resolved(expected);

    d.success(function(arg) {
        test.deepEqual(arg, expected);
        test.done();
    }).fail(failTest.bind(test));
};

module.exports.testSimpleFail = function(test) {
    var expected = 'abc';

    var d = new D();
    d.success(test.fail.bind(test))
     .fail(function(arg) {
        test.deepEqual(arg, expected);
        test.done();
    });

    d.reject(expected);
};

module.exports.testMultipleFail = function(test) {
    var expected = 'abc';

    var d = new D();

	test.expect(2);

    d.success(test.fail.bind(test))
     .fail(function(arg) {
        test.deepEqual(arg, expected);
    }).fail(function(arg) {
        test.deepEqual(arg, expected);
        test.done();
	});

    d.reject(expected);
};

module.exports.testExPostSimpleFail = function(test) {
    var expected = 'abc';

    var d = new D();

    d.reject(expected);

    d.success(test.fail.bind(test))
     .fail(function(arg) {
        test.deepEqual(arg, expected);
        test.done();
    });
};

module.exports.testRejected = function(test) {
    var expected = 'abc';

    var d = D.rejected(expected);

    d.success(test.fail.bind(test))
     .fail(function(arg) {
        test.deepEqual(arg, expected);
        test.done();
    });
};

module.exports.testAfterAll = function(test) {
	var expected = [['a', '6'], ['f', 'ksdf', 'jjr'], [1, 2, 3, 5]];

	D.afterAll([f(0), f(1), f(2)]).success(function(results) {
		test.deepEqual(expected, results);
		test.done();
	}).fail(failTest.bind(test));

	function f(n) {
		return D.resolved.apply(undefined, expected[n]);
	};
};

module.exports.testResolvedChaining = function(test) {
	var expected = {2: 3, 'a': 'b'};

	var e = new D();
	var d = new D();

	d.success(e.chainedResolve);
	d.fail(e.chainedReject);

	e.success(function(r) { 
		test.deepEqual(expected, r); 
		test.done(); 
	}).fail(failTest.bind(test));

	d.resolve(expected);
};

module.exports.testRejectedChaining = function(test) {
	var expected = {2: 3, 'a': 'b'};

	var e = new D();
	var d = new D();

	d.success(e.chainedResolve);
	d.fail(e.chainedReject);

	e.fail(function(r) { 
		test.deepEqual(expected, r); 
		test.done(); 
	}).success(failTest.bind(test));

	d.reject(expected);
};

module.exports.testGuard = function(test) {
	var expected = new Error('oops');

	var d = new D();

	d.success(failTest.bind(test)).fail(function(err) {
		test.deepEqual(err, expected);
		test.done();
	});

	d.guard(function() {
		throw expected;
	});
};

module.exports.testGuardArgs = function(test) {
	var a = 'abcl';
	var b = 34.574;
	var c = 'jkldsfjskld';
	var e = 'adskfbcl';
	var expected = getError(a, b, c, e);

	var d = new D();

	d.success(failTest.bind(test)).fail(function(err) {
		test.deepEqual(err, expected);
		test.done();
	});

	d.guard(a, function(b, c, e) {
		var a = this;
		throw getError(a, b, c, e);
	}, b, c, e);

	function getError(a, b, c, e) {
		return a + '[' + b + ', ' + c + ', ' + e + ']';
	};
};
