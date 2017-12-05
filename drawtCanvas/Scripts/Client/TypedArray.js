let TypedArray = {
	 // a, b TypedArray of same type
	concat: function(a, b) {
		var c = new (a.constructor)(a.length + b.length);
		c.set(a, 0);
		c.set(b, a.length);
		return c;
	},

	concatBuffers: function(a, b) {
		return TypedArray.concat(new Uint8Array(a.buffer || a), new Uint8Array(b.buffer || b)).buffer;
	}
};
