fs = require('fs');

var railprefix = '/datamodel/ifcrailway/';
var roadprefix = '/datamodel/ifcroad/';

var railjson = JSON.parse(fs.readFileSync('test3.json', 'utf8'));
var roadjson = JSON.parse(fs.readFileSync('test4.json', 'utf8'));

//表示等价的类，左边是铁路，右边是公路
var equal_relation = {
    IfcTunnel: "IfcTunnel",
    IfcTunnelPart: "IfcTunnelPart",
    IfcTunnelLiningStructure: "IfcTunnelLining"
};

function Add_relation_to_json() {
    for(var equalclass in equal_relation)
    {
        var key = equalclass;
        var value = equal_relation[equalclass];

        railjson[key].equalclass.push(roadprefix + value);
        roadjson[value].equalclass.push(railprefix + key);

        //console.log(railjson);
    }
    console.log(roadjson);
}

Add_relation_to_json();

fs.writeFileSync('road.json', JSON.stringify(roadjson));
fs.writeFileSync('rail.json', JSON.stringify(railjson));

