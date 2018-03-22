/**
 * Created by haizhi.wu on 2017/10/13.
 */

var Slice = require('./Slice');

// 数据类型
var Type_Int8 = 1;
var Type_UInt8 = 2;
var Type_Short = 3;
var Type_UShort = 4;
var Type_Int32 = 5;
var Type_UInt32 = 6;
var Type_String = 7; //变长字符串，前四个字节表示长度
var Type_Int64 = 8;
var Type_UInt64 = 9;
var Type_Slice = 10; // 二进制数据类型


/*
 * 构造方法
 * @param buf 需要解包的二进制
 * @param offset 指定数据在二进制的初始位置 默认是0
 */
var StreamBuf = function( buf, offset )
{
    var _buf = buf;
    var _encoding = 'utf8';
    var _offset = offset || 0;
    var _list = [];
    var _endian = 'B';

    //指定文字编码
    this.encoding = function( encode )
    {
        _encoding = encode;
        return this;
    };

    //指定字节序 为BigEndian
    this.bigEndian = function()
    {
        _endian = 'B';
        return this;
    };

    //指定字节序 为LittleEndian
    this.littleEndian = function()
    {
        _endian = 'L';
        return this;
    };

    this.int8 = function(val,index)
    {
        if(val == undefined || val == null)
        {
            _list.push( _buf.readInt8(_offset));
            _offset+=1;
        }
        else
        {
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_Int8,d:val,l:1});
            _offset += 1;
        }
        return this;
    };

    this.uint8 = function(val,index)
    {
        if(val == undefined || val == null)
        {
            _list.push( _buf.readUInt8(_offset));
            _offset+=1;
        }
        else
        {
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_UInt8,d:val,l:1});
            _offset += 1;
        }
        return this;
    };

    this.short = function(val,index)
    {
        if(val == undefined || val == null)
        {
            _list.push(_buf['readInt16'+_endian+'E'](_offset));
            _offset+=2;
        }
        else
        {
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_Short,d:val,l:2});
            _offset += 2;
        }
        return this;
    };

    this.ushort = function(val,index)
    {
        if(val == undefined || val == null)
        {
            _list.push(_buf['readUInt16'+_endian+'E'](_offset));
            _offset+=2;
        }
        else
        {
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_UShort,d:val,l:2});
            _offset += 2;
        }
        return this;
    };

    this.int32 = function(val,index)
    {
        if(val == undefined || val == null)
        {
            _list.push(_buf['readInt32'+_endian+'E'](_offset));
            _offset+=4;
        }
        else
        {
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_Int32,d:val,l:4});
            _offset += 4;
        }
        return this;
    };

    this.uint32 = function(val,index)
    {
        if(val == undefined || val == null)
        {
            _list.push(_buf['readUInt32'+_endian+'E'](_offset));
            _offset+=4;
        }
        else
        {
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_UInt32,d:val,l:4});
            _offset += 4;
        }
        return this;
    };

    /**
     * 变长字符串 前4个字节表示字符串长度
     **/
    this.string = function(val,index)
    {
        if(val == undefined || val == null)
        {
            var len = _buf['readUInt32'+_endian+'E'](_offset);
            _offset+=4;
            _list.push(_buf.toString(_encoding, _offset, _offset+len-1));
            _offset+=len;
        }
        else
        {
            var len = 0;
            if(val)len = Buffer.byteLength(val, _encoding);
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_String,d:val,l:len});
            _offset += len + 4 +1;
        }
        return this;
    };

    this.int64 = function (val, index) {
        if (val == undefined || val == null) {
            var highNum = _buf['readUInt32' + _endian + 'E'](_offset);
            var lowNum = _buf['readUInt32' + _endian + 'E'](_offset + 4);
            var int64 = INT64.fromBits(lowNum, highNum);
            _list.push(int64);
            _offset += 8;
        } else {
            var int64 = INT64.fromString(val);
            _list.splice(index != undefined ? index : _list.length, 0, {
                t: Type_Int64,
                d1: int64.getHighBits(),
                d2: int64.getLowBits(),
                l: 8
            });
            _offset += 8;
        }

        return this;
    };

    this.uint64 = function (val, index) {
        if (val == undefined || val == null) {
            var highNum = _buf['readUInt32' + _endian + 'E'](_offset);
            var lowNum = _buf['readUInt32' + _endian + 'E'](_offset + 4);
            var uint64 = INT64.fromBits( lowNum, highNum, true );
            _list.push(uint64);
            _offset += 8;
        } else {
            var uint64 = INT64.fromString( val, true );
            _list.splice(index != undefined ? index : _list.length, 0, {
                t: Type_UInt64,
                d1: uint64.getHighBitsUnsigned(),
                d2: uint64.getLowBitsUnsigned(),
                l: 8
            });
            _offset += 8;
        }

        return this;
    };

    /**
     * 二进制数据
     **/
    this.slice = function(val,index)
    {
        if(val == undefined || val == null)
        {
            // decode
            var len = _buf['readUInt32'+_endian+'E'](_offset);
            _offset+=4;
            var s = new Slice( _buf.slice(_offset,_offset+len), len - 1 );
            _list.push(s);
            _offset+=len;
        }
        else
        {
            // encode
            _list.splice(index != undefined ? index : _list.length,0,{t:Type_Slice,d:val.data(),l:val.size()});
            _offset += val.size() + 4 +1;
        }
        return this;
    };

    /**
     * 解包成数据数组
     **/
    this.unpack = function()
    {
        return _list;
    };

    /**
     * 打包成二进制
     **/
    this.pack = function(){
        _buf = new Buffer(_offset);
        _buf.fill(0);
        var offset = 0;
        for (var i = 0; i < _list.length; i++) {
            switch(_list[i].t)
            {
                case Type_Int8:
                    _buf.writeInt8(_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_UInt8:
                    _buf.writeUInt8(_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Short:
                    _buf['writeInt16'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_UShort:
                    _buf['writeUInt16'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Int32:
                    _buf['writeInt32'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_UInt32:
                    _buf['writeUInt32'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_String:
                    //前4个字节表示字符串长度
                    _buf['writeUInt32'+_endian+'E'](_list[i].l+1,offset);
                    offset+=4;
                    _buf.write(_list[i].d,offset,_list[i].l,_encoding);
                    offset+=_list[i].l;
                    _buf.write('\0',offset,1,_encoding);
                    offset+=1;
                    break;
                case Type_Int64:
                    _buf['writeInt32' + _endian + 'E'](_list[i].d1, offset);
                    _buf['writeInt32' + _endian + 'E'](_list[i].d2, offset + 4);
                    offset += _list[i].l;
                    break;
                case Type_UInt64:
                    _buf['writeUInt32' + _endian + 'E'](_list[i].d1, offset);
                    _buf['writeUInt32' + _endian + 'E'](_list[i].d2, offset + 4);
                    offset += _list[i].l;
                    break;
                case Type_Slice:
                    // 前4个字节表示二进制数据长度
                    _buf['writeUInt32'+_endian+'E'](_list[i].l+1,offset);
                    offset+=4;
                    _list[i].d.copy(_buf,offset);
                    offset+=_list[i].l;
                    _buf.write('\0',offset,1,_encoding);
                    offset+=1;
                    break;
            }
        }
        return _buf;
    };

    // 转成slice类型
    this.toSlice = function()
    {
        var s = new Slice( _buf, _offset);
        return s;
    };
}

module.exports = exports = StreamBuf;

/**
 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
 *  See the from* functions below for more convenient ways of constructing Int64s.
 * @exports Int64
 * @class A Int64 class for representing a 64 bit two's-complement integer value.
 * @param {number} low The low (signed) 32 bits of the long
 * @param {number} high The high (signed) 32 bits of the long
 * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
 * @constructor
 */

var INT64 = function(low, high, unsigned)
{

    /**
     * The low 32 bits as a signed value.
     * @type {number}
     */
    this.low = low | 0;

    /**
     * The high 32 bits as a signed value.
     * @type {number}
     */
    this.high = high | 0;

    /**
     * Whether unsigned or not.
     * @type {boolean}
     */
    this.unsigned = !!unsigned;
}

// The internal representation of a long is the two given signed, 32-bit values.
// We use 32-bit pieces because these are the size of integers on which
// Javascript performs bit-operations.  For operations like addition and
// multiplication, we split each number into 16 bit pieces, which can easily be
// multiplied within Javascript's floating-point representation without overflow
// or change in sign.
//
// In the algorithms below, we frequently reduce the negative case to the
// positive case by negating the input(s) and then post-processing the result.
// Note that we must ALWAYS check specially whether those values are MIN_VALUE
// (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
// a positive number, it overflows back into a negative).  Not handling this
// case would often result in infinite recursion.
//
// Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
// methods on which they depend.wu

/**
 * An indicator used to reliably determine if an object is a Int64 or not.
 * @type {boolean}
 * @const
 * @private
 */
INT64.prototype.__isInt64__;

Object.defineProperty(INT64.prototype, "__isInt64__", {
    value: true,
    enumerable: false,
    configurable: false
});

/**
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 * @inner
 */
function isInt64(obj) {
    return (obj && obj["__isInt64__"]) === true;
}

/**
 * Tests if the specified object is a int64.
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 */
INT64.isInt64 = isInt64;

/**
 * A cache of the Int64 representations of small integer values.
 * @type {!Object}
 * @inner
 */
var INT_CACHE = {};

/**
 * A cache of the Int64 representations of small unsigned integer values.
 * @type {!Object}
 * @inner
 */
var UINT_CACHE = {};

/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Int64}
 * @inner
 */
function fromInt(value, unsigned) {
    var obj, cachedObj, cache;
    if (unsigned) {
        value >>>= 0;
        if (cache = (0 <= value && value < 256)) {
            cachedObj = UINT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
        if (cache)
            UINT_CACHE[value] = obj;
        return obj;
    } else {
        value |= 0;
        if (cache = (-128 <= value && value < 128)) {
            cachedObj = INT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, value < 0 ? -1 : 0, false);
        if (cache)
            INT_CACHE[value] = obj;
        return obj;
    }
}

/**
 * Returns a Int64 representing the given 32 bit integer value.
 * @function
 * @param {number} value The 32 bit integer in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
 * @returns {!Int64} The corresponding Int64 value
 */
INT64.fromInt = fromInt;

/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Int64}
 * @inner
 */
function fromNumber(value, unsigned) {
    if (isNaN(value) || !isFinite(value))
        return unsigned ? UZERO : ZERO;
    if (unsigned) {
        if (value < 0)
            return UZERO;
        if (value >= TWO_PWR_64_DBL)
            return MAX_UNSIGNED_VALUE;
    } else {
        if (value <= -TWO_PWR_63_DBL)
            return MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL)
            return MAX_VALUE;
    }
    if (value < 0)
        return fromNumber(-value, unsigned).neg();
    return fromBits((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
}

/**
 * Returns a Int64 representing the given value, provided that it is a finite number. Otherwise, zero is returned.
 * @function
 * @param {number} value The number in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
 * @returns {!Int64} The corresponding Int64 value
 */
INT64.fromNumber = fromNumber;

/**
 * @param {number} lowBits
 * @param {number} highBits
 * @param {boolean=} unsigned
 * @returns {!Int64}
 * @inner
 */
function fromBits(lowBits, highBits, unsigned) {
    return new INT64(lowBits, highBits, unsigned);
}

/**
 * Returns a Int64 representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
 *  assumed to use 32 bits.
 * @function
 * @param {number} lowBits The low 32 bits
 * @param {number} highBits The high 32 bits
 * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
 * @returns {!Int64} The corresponding Int64 value
 */
INT64.fromBits = fromBits;

/**
 * @function
 * @param {number} base
 * @param {number} exponent
 * @returns {number}
 * @inner
 */
var pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)

/**
 * @param {string} str
 * @param {(boolean|number)=} unsigned
 * @param {number=} radix
 * @returns {!Int64}
 * @inner
 */
function fromString(str, unsigned, radix) {
    if (str.length === 0)
        throw Error('empty string');
    if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
        return ZERO;
    if (typeof unsigned === 'number') {
        // For goog.math.long compatibility
        radix = unsigned,
            unsigned = false;
    } else {
        unsigned = !! unsigned;
    }
    radix = radix || 10;
    if (radix < 2 || 36 < radix)
        throw RangeError('radix');

    var p;
    if ((p = str.indexOf('-')) > 0)
        throw Error('interior hyphen');
    else if (p === 0) {
        return fromString(str.substring(1), unsigned, radix).neg();
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = fromNumber(pow_dbl(radix, 8));

    var result = ZERO;
    for (var i = 0; i < str.length; i += 8) {
        var size = Math.min(8, str.length - i),
            value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
            var power = fromNumber(pow_dbl(radix, size));
            result = result.mul(power).add(fromNumber(value));
        } else {
            result = result.mul(radixToPower);
            result = result.add(fromNumber(value));
        }
    }
    result.unsigned = unsigned;
    return result;
}

/**
 * Returns a Int64 representation of the given string, written using the specified radix.
 * @function
 * @param {string} str The textual representation of the Int64
 * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to `false` for signed
 * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
 * @returns {!Int64} The corresponding Int64 value
 */
INT64.fromString = fromString;

/**
 * @function
 * @param {!Int64|number|string|!{low: number, high: number, unsigned: boolean}} val
 * @returns {!Int64}
 * @inner
 */
function fromValue(val) {
    if (val /* is compatible */ instanceof INT64)
        return val;
    if (typeof val === 'number')
        return fromNumber(val);
    if (typeof val === 'string')
        return fromString(val);
    // Throws for non-objects, converts non-instanceof Int64:
    return fromBits(val.low, val.high, val.unsigned);
}

/**
 * Converts the specified value to a Int64.
 * @function
 * @param {!Int64|number|string|!{low: number, high: number, unsigned: boolean}} val Value
 * @returns {!Int64}
 */
INT64.fromValue = fromValue;

// NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
// no runtime penalty for these.

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_16_DBL = 1 << 16;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_24_DBL = 1 << 24;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

/**
 * @type {!Int64}
 * @const
 * @inner
 */
var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);

/**
 * @type {!Int64}
 * @inner
 */
var ZERO = fromInt(0);

/**
 * Signed zero.
 * @type {!Int64}
 */
INT64.ZERO = ZERO;

/**
 * @type {!Int64}
 * @inner
 */
var UZERO = fromInt(0, true);

/**
 * Unsigned zero.
 * @type {!Int64}
 */
INT64.UZERO = UZERO;

/**
 * @type {!Int64}
 * @inner
 */
var ONE = fromInt(1);

/**
 * Signed one.
 * @type {!Int64}
 */
INT64.ONE = ONE;

/**
 * @type {!Int64}
 * @inner
 */
var UONE = fromInt(1, true);

/**
 * Unsigned one.
 * @type {!Int64}
 */
INT64.UONE = UONE;

/**
 * @type {!Int64}
 * @inner
 */
var NEG_ONE = fromInt(-1);

/**
 * Signed negative one.
 * @type {!Int64}
 */
INT64.NEG_ONE = NEG_ONE;

/**
 * @type {!Int64}
 * @inner
 */
var MAX_VALUE = fromBits(0xFFFFFFFF|0, 0x7FFFFFFF|0, false);

/**
 * Maximum signed value.
 * @type {!Int64}
 */
INT64.MAX_VALUE = MAX_VALUE;

/**
 * @type {!Int64}
 * @inner
 */
var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF|0, 0xFFFFFFFF|0, true);

/**
 * Maximum unsigned value.
 * @type {!Int64}
 */
INT64.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;

/**
 * @type {!Int64}
 * @inner
 */
var MIN_VALUE = fromBits(0, 0x80000000|0, false);

/**
 * Minimum signed value.
 * @type {!Int64}
 */
INT64.MIN_VALUE = MIN_VALUE;

/**
 * @alias Int64.prototype
 * @inner
 */
var Int64Prototype = INT64.prototype;

/**
 * Converts the Int64 to a 32 bit integer, assuming it is a 32 bit integer.
 * @returns {number}
 */
Int64Prototype.toInt = function toInt() {
    return this.unsigned ? this.low >>> 0 : this.low;
};

/**
 * Converts the Int64 to a the nearest floating-point representation of this value (double, 53 bit mantissa).
 * @returns {number}
 */
Int64Prototype.toNumber = function toNumber() {
    if (this.unsigned)
        return ((this.high >>> 0) * TWO_PWR_32_DBL) + (this.low >>> 0);
    return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
};

/**
 * Converts the Int64 to a string written in the specified radix.
 * @param {number=} radix Radix (2-36), defaults to 10
 * @returns {string}
 * @override
 * @throws {RangeError} If `radix` is out of range
 */
Int64Prototype.toString = function toString(radix) {
    radix = radix || 10;
    if (radix < 2 || 36 < radix)
        throw RangeError('radix');
    if (this.isZero())
        return '0';
    if (this.isNegative()) { // Unsigned Int64s are never negative
        if (this.eq(MIN_VALUE)) {
            // We need to change the Int64 value before it can be negated, so we remove
            // the bottom-most digit in this base and then recurse to do the rest.
            var radixInt64 = fromNumber(radix),
                div = this.div(radixInt64),
                rem1 = div.mul(radixInt64).sub(this);
            return div.toString(radix) + rem1.toInt().toString(radix);
        } else
            return '-' + this.neg().toString(radix);
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
        rem = this;
    var result = '';
    while (true) {
        var remDiv = rem.div(radixToPower),
            intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
            digits = intval.toString(radix);
        rem = remDiv;
        if (rem.isZero())
            return digits + result;
        else {
            while (digits.length < 6)
                digits = '0' + digits;
            result = '' + digits + result;
        }
    }
};

/**
 * Gets the high 32 bits as a signed integer.
 * @returns {number} Signed high bits
 */
Int64Prototype.getHighBits = function getHighBits() {
    return this.high;
};

/**
 * Gets the high 32 bits as an unsigned integer.
 * @returns {number} Unsigned high bits
 */
Int64Prototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
    return this.high >>> 0;
};

/**
 * Gets the low 32 bits as a signed integer.
 * @returns {number} Signed low bits
 */
Int64Prototype.getLowBits = function getLowBits() {
    return this.low;
};

/**
 * Gets the low 32 bits as an unsigned integer.
 * @returns {number} Unsigned low bits
 */
Int64Prototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
    return this.low >>> 0;
};

/**
 * Gets the number of bits needed to represent the absolute value of this Int64.
 * @returns {number}
 */
Int64Prototype.getNumBitsAbs = function getNumBitsAbs() {
    if (this.isNegative()) // Unsigned Int64s are never negative
        return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
    var val = this.high != 0 ? this.high : this.low;
    for (var bit = 31; bit > 0; bit--)
        if ((val & (1 << bit)) != 0)
            break;
    return this.high != 0 ? bit + 33 : bit + 1;
};

/**
 * Tests if this Int64's value equals zero.
 * @returns {boolean}
 */
Int64Prototype.isZero = function isZero() {
    return this.high === 0 && this.low === 0;
};

/**
 * Tests if this Int64's value is negative.
 * @returns {boolean}
 */
Int64Prototype.isNegative = function isNegative() {
    return !this.unsigned && this.high < 0;
};

/**
 * Tests if this Int64's value is positive.
 * @returns {boolean}
 */
Int64Prototype.isPositive = function isPositive() {
    return this.unsigned || this.high >= 0;
};

/**
 * Tests if this Int64's value is odd.
 * @returns {boolean}
 */
Int64Prototype.isOdd = function isOdd() {
    return (this.low & 1) === 1;
};

/**
 * Tests if this Int64's value is even.
 * @returns {boolean}
 */
Int64Prototype.isEven = function isEven() {
    return (this.low & 1) === 0;
};

/**
 * Tests if this Int64's value equals the specified's.
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.equals = function equals(other) {
    if (!isInt64(other))
        other = fromValue(other);
    if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high >>> 31) === 1)
        return false;
    return this.high === other.high && this.low === other.low;
};

/**
 * Tests if this Int64's value equals the specified's. This is an alias of {@link Int64#equals}.
 * @function
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.eq = Int64Prototype.equals;

/**
 * Tests if this Int64's value differs from the specified's.
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.notEquals = function notEquals(other) {
    return !this.eq(/* validates */ other);
};

/**
 * Tests if this Int64's value differs from the specified's. This is an alias of {@link Int64#notEquals}.
 * @function
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.neq = Int64Prototype.notEquals;

/**
 * Tests if this Int64's value is less than the specified's.
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.lessThan = function lessThan(other) {
    return this.comp(/* validates */ other) < 0;
};

/**
 * Tests if this Int64's value is less than the specified's. This is an alias of {@link Int64#lessThan}.
 * @function
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.lt = Int64Prototype.lessThan;

/**
 * Tests if this Int64's value is less than or equal the specified's.
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.lessThanOrEqual = function lessThanOrEqual(other) {
    return this.comp(/* validates */ other) <= 0;
};

/**
 * Tests if this Int64's value is less than or equal the specified's. This is an alias of {@link Int64#lessThanOrEqual}.
 * @function
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.lte = Int64Prototype.lessThanOrEqual;

/**
 * Tests if this Int64's value is greater than the specified's.
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.greaterThan = function greaterThan(other) {
    return this.comp(/* validates */ other) > 0;
};

/**
 * Tests if this Int64's value is greater than the specified's. This is an alias of {@link Int64#greaterThan}.
 * @function
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.gt = Int64Prototype.greaterThan;

/**
 * Tests if this Int64's value is greater than or equal the specified's.
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
    return this.comp(/* validates */ other) >= 0;
};

/**
 * Tests if this Int64's value is greater than or equal the specified's. This is an alias of {@link Int64#greaterThanOrEqual}.
 * @function
 * @param {!Int64|number|string} other Other value
 * @returns {boolean}
 */
Int64Prototype.gte = Int64Prototype.greaterThanOrEqual;

/**
 * Compares this Int64's value with the specified's.
 * @param {!Int64|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */
Int64Prototype.compare = function compare(other) {
    if (!isInt64(other))
        other = fromValue(other);
    if (this.eq(other))
        return 0;
    var thisNeg = this.isNegative(),
        otherNeg = other.isNegative();
    if (thisNeg && !otherNeg)
        return -1;
    if (!thisNeg && otherNeg)
        return 1;
    // At this point the sign bits are the same
    if (!this.unsigned)
        return this.sub(other).isNegative() ? -1 : 1;
    // Both are positive if at least one is unsigned
    return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
};

/**
 * Compares this Int64's value with the specified's. This is an alias of {@link Int64#compare}.
 * @function
 * @param {!Int64|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */
Int64Prototype.comp = Int64Prototype.compare;

/**
 * Negates this Int64's value.
 * @returns {!Int64} Negated Int64
 */
Int64Prototype.negate = function negate() {
    if (!this.unsigned && this.eq(MIN_VALUE))
        return MIN_VALUE;
    return this.not().add(ONE);
};

/**
 * Negates this Int64's value. This is an alias of {@link Int64#negate}.
 * @function
 * @returns {!Int64} Negated Int64
 */
Int64Prototype.neg = Int64Prototype.negate;

/**
 * Returns the sum of this and the specified Int64.
 * @param {!Int64|number|string} addend Addend
 * @returns {!Int64} Sum
 */
Int64Prototype.add = function add(addend) {
    if (!isInt64(addend))
        addend = fromValue(addend);

    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high >>> 16;
    var a32 = this.high & 0xFFFF;
    var a16 = this.low >>> 16;
    var a00 = this.low & 0xFFFF;

    var b48 = addend.high >>> 16;
    var b32 = addend.high & 0xFFFF;
    var b16 = addend.low >>> 16;
    var b00 = addend.low & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
};

/**
 * Returns the difference of this and the specified Int64.
 * @param {!Int64|number|string} subtrahend Subtrahend
 * @returns {!Int64} Difference
 */
Int64Prototype.subtract = function subtract(subtrahend) {
    if (!isInt64(subtrahend))
        subtrahend = fromValue(subtrahend);
    return this.add(subtrahend.neg());
};

/**
 * Returns the difference of this and the specified Int64. This is an alias of {@link Int64#subtract}.
 * @function
 * @param {!Int64|number|string} subtrahend Subtrahend
 * @returns {!Int64} Difference
 */
Int64Prototype.sub = Int64Prototype.subtract;

/**
 * Returns the product of this and the specified Int64.
 * @param {!Int64|number|string} multiplier Multiplier
 * @returns {!Int64} Product
 */
Int64Prototype.multiply = function multiply(multiplier) {
    if (this.isZero())
        return ZERO;
    if (!isInt64(multiplier))
        multiplier = fromValue(multiplier);
    if (multiplier.isZero())
        return ZERO;
    if (this.eq(MIN_VALUE))
        return multiplier.isOdd() ? MIN_VALUE : ZERO;
    if (multiplier.eq(MIN_VALUE))
        return this.isOdd() ? MIN_VALUE : ZERO;

    if (this.isNegative()) {
        if (multiplier.isNegative())
            return this.neg().mul(multiplier.neg());
        else
            return this.neg().mul(multiplier).neg();
    } else if (multiplier.isNegative())
        return this.mul(multiplier.neg()).neg();

    // If both longs are small, use float multiplication
    if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
        return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high >>> 16;
    var a32 = this.high & 0xFFFF;
    var a16 = this.low >>> 16;
    var a00 = this.low & 0xFFFF;

    var b48 = multiplier.high >>> 16;
    var b32 = multiplier.high & 0xFFFF;
    var b16 = multiplier.low >>> 16;
    var b00 = multiplier.low & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
};

/**
 * Returns the product of this and the specified Int64. This is an alias of {@link Int64#multiply}.
 * @function
 * @param {!Int64|number|string} multiplier Multiplier
 * @returns {!Int64} Product
 */
Int64Prototype.mul = Int64Prototype.multiply;

/**
 * Returns this Int64 divided by the specified. The result is signed if this Int64 is signed or
 *  unsigned if this Int64 is unsigned.
 * @param {!Int64|number|string} divisor Divisor
 * @returns {!Int64} Quotient
 */
Int64Prototype.divide = function divide(divisor) {
    if (!isInt64(divisor))
        divisor = fromValue(divisor);
    if (divisor.isZero())
        throw Error('division by zero');
    if (this.isZero())
        return this.unsigned ? UZERO : ZERO;
    var approx, rem, res;
    if (!this.unsigned) {
        // This section is only relevant for signed longs and is derived from the
        // closure library as a whole.
        if (this.eq(MIN_VALUE)) {
            if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                return MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
            else if (divisor.eq(MIN_VALUE))
                return ONE;
            else {
                // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
                var halfThis = this.shr(1);
                approx = halfThis.div(divisor).shl(1);
                if (approx.eq(ZERO)) {
                    return divisor.isNegative() ? ONE : NEG_ONE;
                } else {
                    rem = this.sub(divisor.mul(approx));
                    res = approx.add(rem.div(divisor));
                    return res;
                }
            }
        } else if (divisor.eq(MIN_VALUE))
            return this.unsigned ? UZERO : ZERO;
        if (this.isNegative()) {
            if (divisor.isNegative())
                return this.neg().div(divisor.neg());
            return this.neg().div(divisor).neg();
        } else if (divisor.isNegative())
            return this.div(divisor.neg()).neg();
        res = ZERO;
    } else {
        // The algorithm below has not been made for unsigned longs. It's therefore
        // required to take special care of the MSB prior to running it.
        if (!divisor.unsigned)
            divisor = divisor.toUnsigned();
        if (divisor.gt(this))
            return UZERO;
        if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
            return UONE;
        res = UZERO;
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    rem = this;
    while (rem.gte(divisor)) {
        // Approximate the result of division. This may be a little greater or
        // smaller than the actual value.
        approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

        // We will tweak the approximate result by changing it in the 48-th digit or
        // the smallest non-fractional digit, whichever is larger.
        var log2 = Math.ceil(Math.log(approx) / Math.LN2),
            delta = (log2 <= 48) ? 1 : pow_dbl(2, log2 - 48),

        // Decrease the approximation until it is smaller than the remainder.  Note
        // that if it is too large, the product overflows and is negative.
            approxRes = fromNumber(approx),
            approxRem = approxRes.mul(divisor);
        while (approxRem.isNegative() || approxRem.gt(rem)) {
            approx -= delta;
            approxRes = fromNumber(approx, this.unsigned);
            approxRem = approxRes.mul(divisor);
        }

        // We know the answer can't be zero... and actually, zero would cause
        // infinite recursion since we would make no progress.
        if (approxRes.isZero())
            approxRes = ONE;

        res = res.add(approxRes);
        rem = rem.sub(approxRem);
    }
    return res;
};

/**
 * Returns this Int64 divided by the specified. This is an alias of {@link Int64#divide}.
 * @function
 * @param {!Int64|number|string} divisor Divisor
 * @returns {!Int64} Quotient
 */
Int64Prototype.div = Int64Prototype.divide;

/**
 * Returns this Int64 modulo the specified.
 * @param {!Int64|number|string} divisor Divisor
 * @returns {!Int64} Remainder
 */
Int64Prototype.modulo = function modulo(divisor) {
    if (!isInt64(divisor))
        divisor = fromValue(divisor);
    return this.sub(this.div(divisor).mul(divisor));
};

/**
 * Returns this Int64 modulo the specified. This is an alias of {@link Int64#modulo}.
 * @function
 * @param {!Int64|number|string} divisor Divisor
 * @returns {!Int64} Remainder
 */
Int64Prototype.mod = Int64Prototype.modulo;

/**
 * Returns the bitwise NOT of this Int64.
 * @returns {!Int64}
 */
Int64Prototype.not = function not() {
    return fromBits(~this.low, ~this.high, this.unsigned);
};

/**
 * Returns the bitwise AND of this Int64 and the specified.
 * @param {!Int64|number|string} other Other Int64
 * @returns {!Int64}
 */
Int64Prototype.and = function and(other) {
    if (!isInt64(other))
        other = fromValue(other);
    return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
};

/**
 * Returns the bitwise OR of this Int64 and the specified.
 * @param {!Int64|number|string} other Other Int64
 * @returns {!Int64}
 */
Int64Prototype.or = function or(other) {
    if (!isInt64(other))
        other = fromValue(other);
    return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
};

/**
 * Returns the bitwise XOR of this Int64 and the given one.
 * @param {!Int64|number|string} other Other Int64
 * @returns {!Int64}
 */
Int64Prototype.xor = function xor(other) {
    if (!isInt64(other))
        other = fromValue(other);
    return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
};

/**
 * Returns this Int64 with bits shifted to the left by the given amount.
 * @param {number|!Int64} numBits Number of bits
 * @returns {!Int64} Shifted Int64
 */
Int64Prototype.shiftLeft = function shiftLeft(numBits) {
    if (isInt64(numBits))
        numBits = numBits.toInt();
    if ((numBits &= 63) === 0)
        return this;
    else if (numBits < 32)
        return fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
    else
        return fromBits(0, this.low << (numBits - 32), this.unsigned);
};

/**
 * Returns this Int64 with bits shifted to the left by the given amount. This is an alias of {@link Int64#shiftLeft}.
 * @function
 * @param {number|!Int64} numBits Number of bits
 * @returns {!Int64} Shifted Int64
 */
Int64Prototype.shl = Int64Prototype.shiftLeft;

/**
 * Returns this Int64 with bits arithmetically shifted to the right by the given amount.
 * @param {number|!Int64} numBits Number of bits
 * @returns {!Int64} Shifted Int64
 */
Int64Prototype.shiftRight = function shiftRight(numBits) {
    if (isInt64(numBits))
        numBits = numBits.toInt();
    if ((numBits &= 63) === 0)
        return this;
    else if (numBits < 32)
        return fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
    else
        return fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
};

/**
 * Returns this Int64 with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Int64#shiftRight}.
 * @function
 * @param {number|!Int64} numBits Number of bits
 * @returns {!Int64} Shifted Int64
 */
Int64Prototype.shr = Int64Prototype.shiftRight;

/**
 * Returns this Int64 with bits logically shifted to the right by the given amount.
 * @param {number|!Int64} numBits Number of bits
 * @returns {!Int64} Shifted Int64
 */
Int64Prototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
    if (isInt64(numBits))
        numBits = numBits.toInt();
    numBits &= 63;
    if (numBits === 0)
        return this;
    else {
        var high = this.high;
        if (numBits < 32) {
            var low = this.low;
            return fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
        } else if (numBits === 32)
            return fromBits(high, 0, this.unsigned);
        else
            return fromBits(high >>> (numBits - 32), 0, this.unsigned);
    }
};

/**
 * Returns this Int64 with bits logically shifted to the right by the given amount. This is an alias of {@link Int64#shiftRightUnsigned}.
 * @function
 * @param {number|!Int64} numBits Number of bits
 * @returns {!Int64} Shifted Int64
 */
Int64Prototype.shru = Int64Prototype.shiftRightUnsigned;

/**
 * Converts this Int64 to signed.
 * @returns {!Int64} Signed long
 */
Int64Prototype.toSigned = function toSigned() {
    if (!this.unsigned)
        return this;
    return fromBits(this.low, this.high, false);
};

/**
 * Converts this Int64 to unsigned.
 * @returns {!Int64} Unsigned long
 */
Int64Prototype.toUnsigned = function toUnsigned() {
    if (this.unsigned)
        return this;
    return fromBits(this.low, this.high, true);
};

/**
 * Converts this Int64 to its byte representation.
 * @param {boolean=} le Whether little or big endian, defaults to big endian
 * @returns {!Array.<number>} Byte representation
 */
Int64Prototype.toBytes = function(le) {
    return le ? this.toBytesLE() : this.toBytesBE();
}

/**
 * Converts this Int64 to its little endian byte representation.
 * @returns {!Array.<number>} Little endian byte representation
 */
Int64Prototype.toBytesLE = function() {
    var hi = this.high,
        lo = this.low;
    return [
        lo         & 0xff,
        (lo >>>  8) & 0xff,
        (lo >>> 16) & 0xff,
        (lo >>> 24) & 0xff,
        hi         & 0xff,
        (hi >>>  8) & 0xff,
        (hi >>> 16) & 0xff,
        (hi >>> 24) & 0xff
    ];
}

/**
 * Converts this Int64 to its big endian byte representation.
 * @returns {!Array.<number>} Big endian byte representation
 */
Int64Prototype.toBytesBE = function() {
    var hi = this.high,
        lo = this.low;
    return [
        (hi >>> 24) & 0xff,
        (hi >>> 16) & 0xff,
        (hi >>>  8) & 0xff,
        hi         & 0xff,
        (lo >>> 24) & 0xff,
        (lo >>> 16) & 0xff,
        (lo >>>  8) & 0xff,
        lo         & 0xff
    ];
}



