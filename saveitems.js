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
    cur.equalclass = [];

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
    root.equalclass = [];

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
    root.equalclass = [];

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

function equal_relation(RailData, RoadData){
    var railprefix = '/classitem/';
    var roadprefix = '/roadclassitem/';
    //左边铁路右边公路
    var relation = [
        {key:'桥梁52040000', value:'桥梁17050000'},
        {key:'梁桥52041000', value:'梁式桥17050100'},
        {key:'拱桥52042000', value:'拱式桥17050200'},
        {key:'悬索桥52045000', value:'悬索桥17050400'},
    ];

    for(var i = 0; i < RailData.split.length; i++)
    {
        for(var j = 0; j < relation.length; j++)
        {
            if(RailData.split[i].name === relation[j].key)
            {
                RailData.split[i].equalclass.push(roadprefix+relation[j].value);
            }
        }
    }

    for(var i = 0; i < RoadData.split.length; i++)
    {
        for(var j = 0; j < relation.length; j++)
        {
            if(RoadData.split[i].name === relation[j].value)
            {
                RoadData.split[i].equalclass.push(railprefix+relation[j].key);
            }
        }
    }


    //console.log(RailData.split);
    //console.log(RoadData.split);

}


MongoClient.connect(url, function (err, db) {
    if(err) {
        console.error(err);
    } else {
        var itemPromises = [];
        var ClassCodeData = generate_class_data();
        var ClassCodeRoadData = generate_road_class_data();

        equal_relation(ClassCodeData, ClassCodeRoadData);

        for(var i = 0; i < ClassCodeData.notsplit.length; i++)
            itemPromises.push(saveJsonToCollection(db, 'Classcodes', ClassCodeData.notsplit[i]));

        for(var i = 0; i < ClassCodeData.split.length; i++)
            itemPromises.push(saveJsonToCollection(db, 'Classitems', ClassCodeData.split[i]));

        for(var i = 0; i < ClassCodeRoadData.split.length; i++)
            itemPromises.push(saveJsonToCollection(db, 'RoadClassitems', ClassCodeRoadData.split[i]));

        Promise.all(itemPromises).then(function () {
            db.close();
        });
    }
});


// MongoClient.connect(url, function (err, db) {
//     if(err) {
//         console.error(err);
//     } else {
//         var itemPromises = [];
//         for(var value in json)
//             itemPromises.push(saveItem(db, 'Items', value, json[value].child, json[value].parent, json[value].parentlist, json[value].attr, json[value].attr_all, json[value].equalclass));
//         Promise.all(itemPromises).then(function () {
//             db.close();
//         })
//     }
//
// });
//
//
// MongoClient.connect(url, function (err, db) {
//     if(err) {
//         console.error(err);
//     } else {
//         var itemPromises = [];
//         for(var value in json_road)
//             itemPromises.push(saveItem(db, 'RoadItems', value, json_road[value].child, json_road[value].parent, json_road[value].parentlist, json_road[value].attr, json_road[value].attr_all, json_road[value].equalclass));
//         Promise.all(itemPromises).then(function () {
//             db.close();
//         })
//     }
// });