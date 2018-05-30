var fs = require('fs');
var json = JSON.parse(fs.readFileSync('./allscope/alldata.json', 'utf8'));

for(var i = 0; i < json.length; i++)
{
    var tmp = json[i].code;
    json[i].scope = tmp.split('-')[0];
    json[i].code = tmp.split('-')[1];
}



var railifcjson = JSON.parse(fs.readFileSync('./rail.json'));
var roadifcjson = JSON.parse(fs.readFileSync('./road.json'));
var final = [];
final = final.concat(JSON.parse(fs.readFileSync('./allscope/relationsame.json')));
// final = final.concat(parseParentRelation(railifcjson, 'IFCRAIL'));
// final = final.concat(parseParentRelation(roadifcjson,'IFCROAD'));
//
// fs.writeFileSync('./allscope/relationparent2.json', JSON.stringify(final))

final = final.concat(parseRelationSame(railifcjson, roadifcjson));
fs.writeFileSync('./allscope/relationsame2.json', JSON.stringify(final))




function parseifc(ifc, scope) {
    var result = [];
    for(var prop in ifc) {
        var entity = {};
        entity.scope = scope;
        entity.code = prop;
        entity.name = prop.match(/[A-Z][a-z]+/g).join(" ");
        entity.name = entity.name.toLowerCase();
        result.push(entity);
    }
    console.log(result);
    return result;
}

//分析继承关系
function parseParentRelation(ifc, scope) {
    var result = [];
    for(var prop in ifc) {
        var rel = {};
        if(ifc[prop].parent !=="null") {
            rel.parent = scope+'-'+ifc[prop].parent;
            rel.child = scope+'-'+prop;
            result.push(rel);
        }
    }

    return result;
}

//分析等价关系
function parseRelationSame(railifc, roadifc) {
    var result = []
    for(var prop in railifc) {
        var rel = {}
        if(prop in roadifc) {
            rel.a = 'IFCRAIL-'+prop;
            rel.b = 'IFCROAD-'+prop;
            result.push(rel);
        }
    }
    return result;
    //console.log(result);

}

