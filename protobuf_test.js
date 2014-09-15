var ProtoBuf = require("protobufjs");

//var builder = protobuf.loadJsonFile("protocol.json");
var builder = ProtoBuf.loadProtoFile("protocol.proto");

var test = builder.build("Person");

var v = new test("1234","1234","1234");

console.log(v.encode64());

