/**
 * Created by haizhi.wu on 2018/3/7.
 */
var Slice = function( buf, len )
{
    var _buf = buf;
    var _len = len;

    this.data = function() { return _buf; }
    this.size = function() { return _len; }
};

module.exports = exports = Slice;