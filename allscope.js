var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    url = 'mongodb://localhost:27017/mylibrary';

var json = JSON.parse(fs.readFileSync('./allscope/alldata.json', 'utf8'));
var same = JSON.parse(fs.readFileSync('./allscope/relationsame.json', 'utf8'));
var parent = JSON.parse(fs.readFileSync('./allscope/relationparent.json', 'utf8'));

function addItemToCollection(db, collection, item) {
    return new Promise(function(resolve, reject) {
       db.collection(collection).insertOne(item, function(err, result) {

       })
    });
}

MongoClient.connect('url', function(err, db) {
    db.collection('AllScopes').insertMany(json, function(err, result) {
        console.log(result.insertedCount);
    });
    db.collection('RelationSame').insertMany(same, function(err, result) {
        console.log(result.insertedCount);
    });
    db.collection('RelationParent').insertMany(parent, function(err, result) {
        console.log(result.insertedCount);
    });
    db.close();

});