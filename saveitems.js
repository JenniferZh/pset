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
        jsons.push(ajson)
    });
    return jsons;
}

function traserval(json, parent, parent_list, result) {
    var cur = {}

    cur.name = json.name;
    cur.code = json.code;
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
            cur.childs.push(json.children[i].name);
            traserval(json.children[i], json.name, cur.parent_list, result);
        }
    }
    result.push(cur);
}

function  generate_class_data() {
    var root = {};
    root.name = "各专业分类编码";


    var testfolder = './classifycode';
    var jsons = getFiles(testfolder);
    var myresult = [];
    var rail_root = {};

    rail_root.name = '铁路领域分类编码';
    rail_root.childs = [];
    rail_root.parent = "各专业分类编码";
    rail_root.def = 'undefined';
    rail_root.code = 'undefined';
    rail_root.parent_list = ["各专业分类编码"];

    for(var i = 0; i < jsons.length; i++) {
        rail_root.childs.push(jsons[i].name);
        traserval(jsons[i], '铁路领域分类编码', [] ,myresult);
    }
    myresult.push(rail_root);



    var road_folder = './classifycode-road';
    var road_jsons = getFiles(road_folder);
    var road_root = {};

    road_root.name = '公路领域分类编码';
    road_root.childs = [];
    road_root.parent = "各专业分类编码";
    road_root.def = 'undefined';
    road_root.code = 'undefined';
    road_root.parent_list = ["各专业分类编码"];

    for(var i = 0; i < road_jsons.length; i++) {
        road_root.childs.push(road_jsons[i].name);
        traserval(road_jsons[i], '公路领域分类编码', [], myresult);
    }

    myresult.push(road_root);


    root.childs = ['铁路领域分类编码', '公路领域分类编码'];
    root.parent = 'null';
    root.def = 'undefined';
    root.code = 'undefined';
    root.parent_list = [];

    myresult.push(root);

    var Classcode = {};
    Classcode.notsplit = jsons;
    Classcode.split = myresult;

    return Classcode;
}





MongoClient.connect(url, function (err, db) {
    if(err) {
        console.error(err);
    } else {
        var itemPromises = [];
        var ClassCodeData = generate_class_data();

        for(var i = 0; i < ClassCodeData.notsplit.length; i++)
            itemPromises.push(saveJsonToCollection(db, 'Classcodes', ClassCodeData.notsplit[i]));

        for(var i = 0; i < ClassCodeData.split.length; i++)
            itemPromises.push(saveJsonToCollection(db, 'Classitems', ClassCodeData.split[i]));

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