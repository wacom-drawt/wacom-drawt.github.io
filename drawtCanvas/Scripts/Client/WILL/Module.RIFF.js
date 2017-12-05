Module.WILLFormat = {
	version: new Uint8Array([1, 0, 0]),
	fourCCLength: 4,

	headers: {
		riffFourCC: "RIFF".toCharArray(true),
		formatFourCC: "WILL".toCharArray(true),
		headChunkFourCC: "HEAD".toCharArray(true),
		inkChunkFourCC: "INK ".toCharArray(true),
		paintChunkFourCC: "PNT ".toCharArray(true)
	}
};

/**
 * WILL format encoder
 *
 * @deprecated since 1.5
 * @class Module.WILLEncoder
 * @since version 1.3
 */
Module.WILLEncoder = function() {
	this.chunks = new Array();

	this.fileBytes = null;
	this.dataView = null;
	this.byteOffset = 0;

	Object.defineProperty(Module.WILLEncoder.prototype, "data", {
		get: function() {
			if (!this.fileBytes) this.build();
			return this.fileBytes;
		},
	});
}

Object.extend(Module.WILLEncoder.prototype, {
	/**
	 * Encoded data container
	 *
	 * @memberof Module.WILLEncoder
	 * @member {Uint8Array} data
	 */
	data: null,

	/**
	 * Encodes ink path
	 *
	 * @method Module.WILLEncoder.prototype.encodeInk
	 * @param {Uint8Array} ink bytes result from ink paths serialization
	 */
	encodeInk: function(ink) {
		if (!ink) return;
		this.encode(Module.WILLFormat.headers.inkChunkFourCC, ink);
	},

	encodePaint: function(paint) {
		if (!paint) return;
		this.encode(Module.WILLFormat.headers.paintChunkFourCC, paint);
	},

	/**
	 * Encodes data
	 *
	 * @method Module.WILLEncoder.prototype.encode
	 * @param {String} fourCC chunk identifier, should be 4 chars long, where allowed chars are latin leters, numbers and space
	 * @param {Uint8Array} bytes serialized user defined data
	 */
	encode: function(fourCC, bytes) {
		var fourCCBytes = (fourCC instanceof Uint8Array)?fourCC:fourCC.toCharArray().toUint8Array();

		if (fourCCBytes.length != Module.WILLFormat.fourCCLength)
			throw new Error("Invalid fourCC: \"" + fourCC + "\"");

		if (this.fileBytes)
			throw new Error("File content building completed. Cannot add more chunks.");

		this.chunks.push(this.createChunk(fourCCBytes, bytes));
	},

	build: function() {
		var ffh = Module.WILLFormat.headers;
		var chunksLength = 0;

		this.chunks.unshift(this.createChunk(Module.WILLFormat.headers.headChunkFourCC, Module.WILLFormat.version));

		this.chunks.forEach(function(chunk) {
			chunksLength += chunk.length;
		}, this);

		var riffFileSize = ffh.formatFourCC.length + chunksLength;
		var fileLength = ffh.riffFourCC.length + Uint32Array.BYTES_PER_ELEMENT + riffFileSize;

		var fileBuffer = new ArrayBuffer(fileLength);
		this.fileBytes = new Uint8Array(fileBuffer);
		this.dataView = new DataView(fileBuffer);

		this.fileBytes.set(ffh.riffFourCC, this.byteOffset);
		this.byteOffset += ffh.riffFourCC.length;

		this.dataView.setUint32(this.byteOffset, riffFileSize, true);
		this.byteOffset += Uint32Array.BYTES_PER_ELEMENT;

		this.fileBytes.set(ffh.formatFourCC, this.byteOffset);
		this.byteOffset += ffh.formatFourCC.length;

		this.chunks.forEach(function(chunk) {
			this.appendChunk(chunk);
			this.byteOffset += chunk.length;
		}, this);
	},

	createChunk: function(fourCC, bytes) {
		var size = bytes.length;
		var paddingSize = size % 2;
		var length = fourCC.length + Uint32Array.BYTES_PER_ELEMENT + size + paddingSize;

		return {
			fourCC: fourCC,
			bytes: bytes,
			size: size,
			length: length
		};
	},

	appendChunk: function(chunk) {
		this.fileBytes.set(chunk.fourCC, this.byteOffset);

		var byteOffset = this.byteOffset + chunk.fourCC.length;

		this.dataView.setUint32(byteOffset, chunk.size, true);
		byteOffset += Uint32Array.BYTES_PER_ELEMENT;

		this.fileBytes.set(chunk.bytes, byteOffset);
	}
});

/**
 * WILL format decoder
 *
 * @deprecated since 1.5
 * @class Module.WILLDecoder
 * @since version 1.3
 * @param {ArrayBuffer} fileBuffer file content
 */
Module.WILLDecoder = function(fileBuffer) {
	this.fileBytes = new Uint8Array(fileBuffer);
	this.dataView = new DataView(fileBuffer);

	this.byteOffset = 0;
}

Object.extend(Module.WILLDecoder.prototype, {
	/**
	 * File format version
	 *
	 * @memberof Module.WILLDecoder
	 * @member {String} file
	 */
	version: "",

	/**
	 * Serialized strokes data, could be decoded with Module.InkDecoder
	 *
	 * @memberof Module.WILLDecoder
	 * @member {Uint8Array} ink
	 */
	ink: null,

	paint: null,

	/**
	 * Serialized user defined data
	 *
	 * @memberof Module.WILLDecoder
	 * @member {Array<Object>} chunks
	 */
	chunks: new Array(),

	/**
	 * Decodes data. Decoded data is accessible in instance properties.
	 *
	 * @method Module.WILLDecoder.prototype.decode
	 */
	decode: function() {
		var ffh = Module.WILLFormat.headers;

		var byteOffsetLength = this.byteOffset + ffh.riffFourCC.length;
		if (String.fromCharArray(this.fileBytes.subarray(this.byteOffset, byteOffsetLength)) != String.fromCharArray(ffh.riffFourCC)) throw new Error("Invalid RIFF fourCC");

		this.byteOffset = byteOffsetLength;
		byteOffsetLength = this.byteOffset + Uint32Array.BYTES_PER_ELEMENT;
		var riffFileSize = this.dataView.getUint32(this.byteOffset, true) + byteOffsetLength;

		if (riffFileSize != this.fileBytes.length) throw new Error("Incomplete RIFF file");
		if (riffFileSize % 2 != 0) throw new Error("Invalid RIFF file size");

		this.byteOffset = byteOffsetLength;
		byteOffsetLength = this.byteOffset + ffh.formatFourCC.length;
		if (String.fromCharArray(this.fileBytes.subarray(this.byteOffset, byteOffsetLength)) != String.fromCharArray(ffh.formatFourCC)) throw new Error("Invalid WILL fourCC");

		this.byteOffset = byteOffsetLength;

		while (this.byteOffset < riffFileSize) {
			var chunk = this.extractChunk();
			this.byteOffset += chunk.length;

			var fourCC = String.fromCharArray(chunk.fourCC);

			switch(fourCC) {
				case String.fromCharArray(ffh.headChunkFourCC):
					this.version = chunk.bytes[0] + "." + chunk.bytes[1] + chunk.bytes[2];
					break;
				case String.fromCharArray(ffh.inkChunkFourCC):
					this.ink = chunk.bytes;
					break;
				case String.fromCharArray(ffh.paintChunkFourCC):
					this.paint = chunk.bytes;
					break;
				default:
					this.chunks.push({fourCC: fourCC, bytes: chunk.bytes});
			}
		}
	},

	extractChunk: function() {
		var fourCC = this.fileBytes.subarray(this.byteOffset, this.byteOffset + Module.WILLFormat.fourCCLength);
		var bytes = null;
		var size = 0;
		var length = 0;
		var paddingSize = 0;

		var byteOffsetLength = this.byteOffset + fourCC.length;
		var byteOffset = byteOffsetLength;
		byteOffsetLength = byteOffset + Uint32Array.BYTES_PER_ELEMENT;

		size = this.dataView.getUint32(byteOffset, true);

		byteOffset = byteOffsetLength;
		byteOffsetLength = byteOffset + size;

		if (size > 0) {
			bytes = this.fileBytes.subarray(byteOffset, byteOffsetLength);
			bytes = new Uint8Array(bytes, bytes.byteOffset, bytes.length);
		}
		else
			bytes = new Uint8Array(0);

		length = fourCC.length + Uint32Array.BYTES_PER_ELEMENT + size;
		paddingSize = length % 2;

		return {
			fourCC: fourCC,
			bytes: bytes,
			size: size,
			length: length + paddingSize
		};
	}
});