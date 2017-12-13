/**
 * Created by Orange on 2017/11/2.
 */
var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    url = 'mongodb://localhost/mylibrary';

var json = JSON.parse(fs.readFileSync('test3.json', 'utf8'));
// console.log(json)

var saveItem = function(db, name, childs, parent, parent_list, attr, attr_all) {
    return new Promise(function (resolve, reject) {
        db.collection('Items').insert({name:name, childs:childs, parent:parent, parent_list:parent_list, attr:attr, attr_all:attr_all}, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

var saveClassify = function (db, json) {
    return new Promise(function (resolve, reject) {
        db.collection('Classcodes').insert(json, function (err, result) {
            if(err) {
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
};

function getFiles(folder) {
    var jsons = [];
    fs.readdirSync(folder).forEach(function (file)  {
        var ajson = JSON.parse(fs.readFileSync(folder+'/'+file, 'utf8'));
        jsons.push(ajson)
    });
    return jsons;
}

testfolder = './classifycode';
var jsons = getFiles(testfolder);

MongoClient.connect(url, function (err, db) {
    if(err) {
        console.error(err);
    } else {
        var itemPromises = [];

        for(var i = 0; i < jsons.length; i++)
            itemPromises.push(saveClassify(db, jsons[i]));

        Promise.all(itemPromises).then(function () {
            db.close();
        });
    }
});


MongoClient.connect(url, function (err, db) {
    if(err) {
        console.error(err);
    } else {
        var itemPromises = [];
        for(var value in json)
            itemPromises.push(saveItem(db, value, json[value].child, json[value].parent, json[value].parentlist, json[value].attr, json[value].attr_all));
        Promise.all(itemPromises).then(function () {
            db.close();
        })
    }

});