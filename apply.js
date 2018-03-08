/**
 * Created by haizhi.wu on 2017/10/17.
 */

var Item_Data = require( './Item')

var itemdata = new Item_Data('17635135717378','9147936743096323');
itemdata.set_db_baseid(100004);
itemdata.set_db_count(10);
itemdata.set_db_place(1);
itemdata.set_db_create_time('1506309873');

var slice = itemdata.encode();
itemdata.clean()

// 模拟玩家数据结果
// 数据结构: string 表名 uint64 角色id ushort 数据行数 slice 数据
var StreamBuf = require('./StreamBuf');
var pack = new StreamBuf();
pack.string('CharBase');
pack.uint64('17635135717378');
pack.ushort(1);
pack.slice(slice);
var buf = pack.pack()

// 解析玩家数据结果
var unpack = new StreamBuf( buf );
var content = unpack.unpack();
unpack.string();
console.log(content[ content.length - 1 ])
unpack.uint64();
console.log(content[ content.length - 1 ].toString());
unpack.ushort();
console.log(content[ content.length - 1 ])
unpack.slice()
console.log(content[ content.length - 1 ])

var itemdata2 = new Item_Data();
itemdata2.decode(content[content.length - 1].data())
console.log(itemdata2.get_db_baseid());
console.log(itemdata2.get_db_count());
console.log(itemdata2.get_db_place());
console.log(itemdata2.get_db_create_time());


