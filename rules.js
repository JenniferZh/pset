var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    url = 'mongodb://localhost/mylibrary';

var json = JSON.parse(fs.readFileSync('./rules/rules.json', 'utf8'));

var saveJsonToCollection = function (db, collectionname, json) {
    return new Promise(function (resolve, reject) {
        db.collection(collectionname).insert(json, function (err, result) {
            if(err) {
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
};

MongoClient.connect(url, function (err, db) {
    if(err) {
        console.error(err);
    } else {
        var itemPromises = [];


        for(var i = 0; i < json.length; i++)
            itemPromises.push(saveJsonToCollection(db, 'Rules', json[i]));


        Promise.all(itemPromises).then(function () {
            db.close();
        });
    }
});
