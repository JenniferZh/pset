/**
 * Created by Orange on 2017/11/2.
 */
var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    url = 'mongodb://localhost/mylibrary';

var json = JSON.parse(fs.readFileSync('rail.json', 'utf8'));
var json_road = JSON.parse(fs.readFileSync('road.json', 'utf8'));
// console.log(json)

var saveItem = function(db, collectionname, name, childs, parent, parent_list, attr, attr_all, equalclass) {
    return new Promise(function (resolve, reject) {
        db.collection(collectionname).insert({name:name, childs:childs, parent:parent, parent_list:parent_list, attr:attr, attr_all:attr_all, equalclass: equalclass}, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

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

function getFiles(folder) {
    var jsons = [];
    fs.readdirSync(folder).forEach(function (file)  {
        var ajson = JSON.parse(fs.readFileSync(folder+'/'+file, 'utf8'));
        ajson.code = '';
        jsons.push(ajson)
    });
    return jsons;
}

function traserval(json, parent, parent_list, result) {
    var cur = {};



    cur.name = json.name;
    cur.code = json.code;

    if(cur.code !== undefined)
        cur.name = cur.name + cur.code.replace(/[\s.-]/g, '');


    cur.parent = parent;
    cur.def = (json.def === undefined)? 'undefined':json.def;
    cur.childs = [];

    cur.parent_list = [];
    for(var p = 0; p < parent_list.length; p++) {
        cur.parent_list.push(parent_list[p]);
    }
    cur.parent_list.push(parent);


    if(json.children.length !== 0) {
        for(var i = 0; i < json.children.length; i++) {
            cur.childs.push(json.children[i].name+json.children[i].code.replace(/[\s.-]/g, ''));
            traserval(json.children[i], json.name+json.code.replace(/[\s.-]/g, ''), cur.parent_list, result);
        }
    }
    result.push(cur);
}

function  generate_class_data() {
    var testfolder = './classifycode';
    var jsons = getFiles(testfolder);
    var myresult = [];
    var root = {};

    root.name = '铁路领域分类编码';
    root.childs = [];
    root.parent = 'null';
    root.def = 'undefined';
    root.code = 'undefined';
    root.parent_list = [];

    for(var i = 0; i < jsons.length; i++) {
        root.childs.push(jsons[i].name);
        traserval(jsons[i], '铁路领域分类编码', [] ,myresult);
    }

    myresult.push(root);

    var Classcode = {};
    Classcode.notsplit = jsons;
    Classcode.split = myresult;

    return Classcode;
}

function  generate_road_class_data() {
    var testfolder = './classifycode-road';
    var jsons = getFiles(testfolder);
    var myresult = [];
    var root = {};

    root.name = '公路领域分类编码';
    root.childs = [];
    root.parent = 'null';
    root.def = 'undefined';
    root.code = 'undefined';
    root.parent_list = [];

    for(var i = 0; i < jsons.length; i++) {
        root.childs.push(jsons[i].name);
        traserval(jsons[i], '公路领域分类编码', [] ,myresult);
    }

    myresult.push(root);

    var Classcode = {};
    Classcode.notsplit = jsons;
    Classcode.split = myresult;

    return Classcode;
}



// MongoClient.connect(url, function (err, db) {
//     if(err) {
//         console.error(err);
//     } else {
//         var itemPromises = [];
//         var ClassCodeData = generate_class_data();
//         var ClassCodeRoadData = generate_road_class_data();
//
//         for(var i = 0; i < ClassCodeData.notsplit.length; i++)
//             itemPromises.push(saveJsonToCollection(db, 'Classcodes', ClassCodeData.notsplit[i]));
//
//         for(var i = 0; i < ClassCodeData.split.length; i++)
//             itemPromises.push(saveJsonToCollection(db, 'Classitems', ClassCodeData.split[i]));
//
//         for(var i = 0; i < ClassCodeRoadData.split.length; i++)
//             itemPromises.push(saveJsonToCollection(db, 'RoadClassitems', ClassCodeRoadData.split[i]));
//
//         Promise.all(itemPromises).then(function () {
//             db.close();
//         });
//     }
// });


MongoClient.connect(url, function (err, db) {
    if(err) {
        console.error(err);
    } else {
        var itemPromises = [];
        for(var value in json)
            itemPromises.push(saveItem(db, 'Items', value, json[value].child, json[value].parent, json[value].parentlist, json[value].attr, json[value].attr_all, json[value].equalclass));
        Promise.all(itemPromises).then(function () {
            db.close();
        })
    }

});


MongoClient.connect(url, function (err, db) {
    if(err) {
        console.error(err);
    } else {
        var itemPromises = [];
        for(var value in json_road)
            itemPromises.push(saveItem(db, 'RoadItems', value, json_road[value].child, json_road[value].parent, json_road[value].parentlist, json_road[value].attr, json_road[value].attr_all, json_road[value].equalclass));
        Promise.all(itemPromises).then(function () {
            db.close();
        })
    }
});