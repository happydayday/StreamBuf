
var StreamBuf = require('./StreamBuf');

var Item_Data = function()
{
    // TableName
    this.tablename = function() { return m_tablename; }

    // Clean Dirty Fields
    this.clean = function()
    {
        m_method = 0
        for ( var i = 0; i < NFIELDS; i++ )
        {
            m_dirty[i] = 0
        }
    }

    // Check Object is dirty
    this.isDirty = function()
    {
        for ( var i = 0; i < NFIELDS; ++i )
        {
            if ( m_dirty[i] != 0 ) return true;
        }

        return false;
    }

    this.keystring = function()
    {
        var key = ""
        key += m_db_id;
        return key;
    }

    this.encode = function()
    {
        var nfields = 0;
        var pack = new StreamBuf();

        // fields
        for ( var i = 0; i < NFIELDS; ++i )
        {
            if ( m_dirty[i] == 0 )
            {
                continue;
            }

            switch ( i )
            {
                case 0 :
                    ++nfields;
                    pack.ushort( i );
                    pack.uint64( m_db_id );
                    break;
                case 1 :
                    ++nfields;
                    pack.ushort( i );
                    pack.uint64( m_db_roleid );
                    break;
                case 2 :
                    ++nfields;
                    pack.ushort( i );
                    pack.uint32( m_db_baseid );
                    break;
                case 3 :
                    ++nfields;
                    pack.ushort( i );
                    pack.uint32( m_db_count );
                    break;
                case 4 :
                    ++nfields;
                    pack.ushort( i );
                    pack.uint8( m_db_place );
                    break;
                case 5 :
                    ++nfields;
                    pack.ushort( i );
                    pack.uint64( m_db_create_time );
                    break;
            }
        }

        // key fields
        pack.int64( m_db_roleid );
        pack.int64( m_db_id );
        // fields number
        pack.ushort( nfields, 0 );

        return pack.pack();
    }

    this.decode = function( value )
    {
        var unpack = new StreamBuf(value);
        var content = unpack.unpack();

        // fields number
        unpack.ushort();
        var nfields = content[ content.length - 1 ]

        // fields
        for ( var i = 0; i < nfields; ++i )
        {
            unpack.ushort();
            var index = content[ content.length - 1 ]

            switch ( index )
            {
                case 0 :
                    {
                        unpack.uint64();
                        m_db_id = content[ content.length - 1 ].toString();
                    }
                    break;
                case 1 :
                    {
                        unpack.uint64();
                        m_db_roleid = content[ content.length - 1 ].toString();
                    }
                    break;
                case 2 :
                    {
                        unpack.uint32();
                        m_db_baseid = content[ content.length - 1 ];
                    }
                    break;
                case 3 :
                    {
                        unpack.uint32();
                        m_db_count = content[ content.length - 1 ];
                    }
                    break;
                case 4 :
                    {
                        unpack.uint8();
                        m_db_place = content[ content.length - 1 ];
                    }
                    break;
                case 5 :
                    {
                        unpack.uint64();
                        m_db_create_time = content[ content.length - 1 ].toString();
                    }
                    break;
            }
        }

        return true;
    }

    // Field: id, Index: 0
    this.get_db_id = function() { return m_db_id; }
    this.set_db_id = function( value ) { m_db_id = value; m_dirty[0] = 1; }

    // Field: roleid, Index: 1
    this.get_db_roleid = function() { return m_db_roleid; }
    this.set_db_roleid = function( value ) { m_db_roleid = value; m_dirty[1] = 1; }

    // Field: baseid, Index: 2
    this.get_db_baseid = function() { return m_db_baseid; }
    this.set_db_baseid = function( value ) { m_db_baseid = value; m_dirty[2] = 1; }

    // Field: count, Index: 3
    this.get_db_count = function() { return m_db_count; }
    this.set_db_count = function( value ) { m_db_count = value; m_dirty[3] = 1; }

    // Field: place, Index: 4
    this.get_db_place = function() { return m_db_place; }
    this.set_db_place = function( value ) { m_db_place = value; m_dirty[4] = 1; }

    // Field: create_time, Index: 5
    this.get_db_create_time = function() { return m_db_create_time; }
    this.set_db_create_time = function( value ) { m_db_create_time = value; m_dirty[5] = 1; }

    // Fields
    var m_db_id = 0;
    var m_db_roleid = 0;
    var m_db_baseid = 0;
    var m_db_count = 0;
    var m_db_place = 0;
    var m_db_create_time = 0;

    var NFIELDS = 6;
    var m_tablename = "Item";
    var m_dirty = new Int8Array(NFIELDS);
    var m_method = 0;
}

Item_Data.TABLENAME = "Item";

module.exports = exports = Item_Data

