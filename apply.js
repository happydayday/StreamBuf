/**
 * Created by haizhi.wu on 2017/10/17.
 */

var Item_Data = require( './Item')

var itemdata = new Item_Data();

itemdata.set_db_id( '9147936743096323');
itemdata.set_db_roleid( '17635135717378');
itemdata.set_db_baseid(100004);
itemdata.set_db_count(10);
itemdata.set_db_place(1);
itemdata.set_db_create_time('1506309873');

var buff = itemdata.encode();
/*
console.log(buff);
console.log(itemdata.get_db_id());
itemdata.clean()
buff = itemdata.encode()
console.log(buff.length)
console.log(buff);
itemdata.set_db_count(20);
buff = itemdata.encode()
console.log(buff.length)
console.log(buff);
*/
var itemdata2 = new Item_Data();
itemdata2.decode(buff)

console.log(itemdata2.get_db_id());
console.log(itemdata2.get_db_roleid());
console.log(itemdata2.get_db_baseid());
console.log(itemdata2.get_db_count());
console.log(itemdata2.get_db_place());
console.log(itemdata2.get_db_create_time());
itemdata2.set_db_count(20);
console.log(itemdata2.encode().length)

itemdata.clean()
