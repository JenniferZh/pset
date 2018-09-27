var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    url = 'mongodb://localhost/mylibrary';

var json = JSON.parse(fs.readFileSync('./share.json', 'utf8'));
var sharejson = [];
var relationjson = [];
var relationsame = [];
var set = new Map();
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
        newshare.code = FormatNumberLength(num++, 5);
        newshare.scope = 'GX';
        set.set(item.a.name, newshare.code);
        sharejson.push(newshare);
        var relation = {};
        relation.parent = 'GX-00000';
        relation.child = newshare.scope+'-'+newshare.code;
        relationjson.push(relation);

        var relationsame_a = {};
        relationsame_a.a = 'GX-'+newshare.code;
        relationsame_a.b = item.a.code;
        relationsame.push(relationsame_a);
        var relationsame_b = {};
        relationsame_b.a = 'GX-'+newshare.code;
        relationsame_b.b = item.b.code;
        relationsame.push(relationsame_b);
    } else {
        var sharecode = set.get(item.a.name);
        var relationsame_a = {};
        relationsame_a.a = 'GX-'+sharecode;
        relationsame_a.b = item.a.code;
        relationsame.push(relationsame_a);
        var relationsame_b = {};
        relationsame_b.a = 'GX-'+sharecode;
        relationsame_b.b = item.b.code;
        relationsame.push(relationsame_b);
    }
    //console.log(item);
});


// MongoClient.connect(url, function(err, db) {
//
//     db.collection('RelationSame').insertMany(relationsame, function(err, result) {
//         if(err) {
//             throw err;
//         }
//         db.close();
//     });
// });


MongoClient.connect(url, function(err, db) {

    db.collection('AllScopes').insertMany(sharejson, function(err, result) {
        if(err) {
            throw err;
        }
        db.collection('RelationParent').insertMany(relationjson, function(err, result) {
            if(err) {
                throw err;
            }
            db.collection('RelationSame').insertMany(relationsame, function(err, result) {
                if(err) {
                    throw err;
                }
                db.close();
            });
        });
    });
});


