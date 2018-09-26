var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    url = 'mongodb://localhost/mylibrary';

var json = JSON.parse(fs.readFileSync('./share.json', 'utf8'));
var sharejson = [];
var relationjson = [];
var set = new Set();
var num = 1;

function FormatNumberLength(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}
sharejson.push({
    name:'共享层构件',
    code:'00000',
    scope:'GX'
});
json.forEach(function(item) {

    if(!set.has(item.a.name)) {
        var newshare = {};
        newshare.name = item.a.name;
        set.add(item.a.name);
        newshare.code = FormatNumberLength(num++, 5);
        newshare.scope = 'GX';
        sharejson.push(newshare);
        var relation = {};
        relation.parent = 'GX-00000';
        relation.child = newshare.scope+'-'+newshare.code;
        relationjson.push(relation);
    }
    //console.log(item);
});


MongoClient.connect(url, function(err, db) {

    db.collection('AllScopes').insertMany(sharejson, function(err, result) {
        if(err) {
            throw err;
        }
        db.collection('RelationParent').insertMany(relationjson, function(err, result) {
            if(err) {
                throw err;
            }
            db.close();
        });
    });
});

