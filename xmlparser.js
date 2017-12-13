var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;

var infos = [];
var myconceptTemplates = [];
var views = [];




/**
 * 读入mvdmxl，解析，生成相关数据
 * @type {Buffer | string}
 */
var xml = fs.readFileSync('./mvd/example2.xml', {encoding: 'utf-8'});
var doc = new DOMParser().parseFromString(xml);

infos.push(parseMVD(doc));

xml = fs.readFileSync('./mvd/katalog.mvdxml', {encoding: 'utf-8'});
doc = new DOMParser().parseFromString(xml);


infos.push(parseMVD(doc));

xml = fs.readFileSync('./mvd/example.xml', {encoding: 'utf-8'});
doc = new DOMParser().parseFromString(xml);

infos.push(parseMVD(doc));


//console.log(JSON.stringify(views));

//console.log(parseParameters("O_PsetName[Value]='Pset_WallCommon'"))

//console.log(infos);
//console.log(myconceptTemplates);


/**
 * 数据库操作
 */

var MongoClient = require('mongodb').MongoClient, url = 'mongodb://localhost/mylibrary';

var saveCollection = function (db, collection, content) {
    return new Promise(function (resolve, reject) {
        db.collection(collection).insert(content, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};


MongoClient.connect(url, function (err, db) {
    if (err) {
        console.error(err);
    } else {
        var itemPromises = [];

        //令这两个collection检查uuid,如果重复将不会重复放入
        db.collection('MVDs').createIndex({uuid: 1}, {unique: true});
        db.collection('Templates').createIndex({uuid: 1}, {unique: true});

        for (var i = 0; i < infos.length; i++) {
            itemPromises.push(saveCollection(db, 'MVDs', infos[i]));
        }

        for (var i = 0; i < myconceptTemplates.length; i++) {
            itemPromises.push(saveCollection(db, 'Templates', myconceptTemplates[i]));
        }

        for(var i = 0; i < views.length; i++) {
            itemPromises.push(saveCollection(db, 'Views', views[i]));
        }

        Promise.all(itemPromises).then(function () {
            db.close();
            console.log('done');
        })
    }

});


function parseMVD(doc) {

    var mvd_store = {};
    var mvd = doc.documentElement;

    //解析属性
    mvd_store.name = mvd.getAttributeNode('name').nodeValue;
    mvd_store.ns = mvd.getAttributeNode('xmlns').nodeValue;
    mvd_store.uuid = mvd.getAttributeNode('uuid').nodeValue;
    mvd_store.templates = [];
    mvd_store.views = [];


    var conceptTemplates = mvd.getElementsByTagName('ConceptTemplate');

    for(var i = 0; i < conceptTemplates.length; i++) {

        if(conceptTemplates[i].hasAttribute('applicableEntity')) {
            mvd_store.templates.push(conceptTemplates[i].getAttributeNode('uuid').nodeValue);
            myconceptTemplates.push(parseTemplate(conceptTemplates[i]));
            //console.log(JSON.stringify(parseTemplate(conceptTemplates[i])));
        }
    }


    var childs = mvd.childNodes;
    for (var i = 0; i < childs.length; i++) {

        if (childs[i].nodeName == 'Views') {
            var mvlist = childs[i].childNodes;

            //console.log(mvlist.length);

            for(var j = 0; j < mvlist.length; j++) {
                mvd_store.views.push(mvlist[j].getAttributeNode('uuid').nodeValue);
                //console.log(parseModelView(mvlist[j]));
                views.push(parseModelView(mvlist[j]));
            }

        }

    }

    return mvd_store;
}


function parseTemplate(template) {


    var temp = {};
    temp.type = 'entity';
    temp.children = [];

    //一定有的属性：uuid, name, applicableSchema
    temp.uuid = template.getAttributeNode('uuid').nodeValue;
    temp.templateName = template.getAttributeNode('name').nodeValue;
    temp.applicableSchema = template.getAttributeNode('applicableSchema').nodeValue;

    //可能有的属性：applicabelEntity
    if(template.hasAttribute('applicableEntity')) {
        temp.applicableEntity = template.getAttributeNode('applicableEntity').nodeValue;
    } else {
        temp.applicableEntity = 'undefined';
    }

    //为了画图产生的属性
    temp.name = temp.applicableEntity;
    temp.subtemplates = [];
    temp.def = [];



    //可能有的属性：def, subtemplates, rules

    var childs = template.childNodes;

    for(var i = 0; i < childs.length; i++) {
        if(childs[i].nodeName == 'Definitions')
            temp.def = parseDefinitions(childs[i]);
        if(childs[i].nodeName == 'Rules') {

            for(var j = 0; j < childs[i].childNodes.length; j++)
                temp.children.push(parseAttributeRule(childs[i].childNodes[j]));

        }
        if(childs[i].nodeName == 'SubTemplates') {
            var subtemplates = childs[i].childNodes;


            for(var j = 0; j < subtemplates.length; j++) {

                if(subtemplates[j].nodeName == 'ConceptTemplate') {
                    // var pushin = parseTemplate(subtemplates[j]);
                    // console.log(JSON.stringify(pushin));
                    temp.subtemplates.push(subtemplates[j].getAttributeNode('uuid').value);
                    //temp.children.push(pushin);
                }
            }
        }
    }

    //console.log(JSON.stringify(temp));
    return temp;
}

function parseAttributeRule(attribute) {
    var temp = {};
    temp.name = attribute.getAttributeNode('AttributeName').nodeValue;
    temp.children = [];
    temp.type = 'attribute';

    if(attribute.hasAttribute('RuleID')) {
        temp.ruleid = attribute.getAttributeNode('RuleID').nodeValue;
        temp.name = temp.name + '('+temp.ruleid+')';
    }

    var rules = attribute.childNodes;

    if(rules.length == 0) {
        return temp;
    } else {
        for(var i = 0; i < rules[0].childNodes.length; i++) {
            temp.children.push(parseEntityRule(rules[0].childNodes[i]));
        }
        return temp;
    }


    //
    //
    //
    // var rules = attribute.getElementsByTagName('EntityRules')[0];
    //
    // //如果attributerule里不再嵌套entityrule
    // if (rules == undefined) {
    //     return temp;
    // } else {
    //     for (var i = 0; i < rules.childNodes.length; i++) {
    //         temp.children.push(parseEntityRule(rules.childNodes[i]));
    //     }
    //     return temp;
    // }
}

function parseEntityRule(entity) {
    var temp = {};
    temp.name = entity.getAttributeNode('EntityName').nodeValue;
    temp.children = [];
    temp.type = 'entity';


    if (entity.childNodes[0] != undefined && entity.childNodes[0].nodeName == 'References') {
        temp.ref = entity.childNodes[0].childNodes[0].getAttributeNode('ref').nodeValue;
    }

    var rules = entity.getElementsByTagName('Attributes')[0];

    if (rules == undefined) {
        return temp;
    } else {
        for (var i = 0; i < rules.childNodes.length; i++) {
            temp.children.push(parseAttributeRule(rules.childNodes[i]));
        }
        return temp;
    }


    return temp;
}


function parseModelView(doc) {



    var mview = doc;
    //console.log(mview);


    var modelview = {};

    //提取modelview的属性, uuid,name,applicableSchema认为是一定有的属性
    modelview.uuid = mview.getAttributeNode('uuid').nodeValue;
    modelview.name = mview.getAttributeNode('name').nodeValue;
    modelview.applicableSchma = mview.getAttributeNode('applicableSchema').nodeValue;

    //有些是可选的属性，目前支持code, status；其他见文档
    if (mview.getAttributeNode('code') == undefined) {
        modelview.code = 'undefined';
    } else {
        modelview.code = mview.getAttributeNode('code').nodeValue;
    }

    if (mview.getAttributeNode('status') == undefined) {
        modelview.status = 'undefined';
    } else {
        modelview.status = mview.getAttributeNode('status').nodeValue;
    }

    //解析modelview的子节点，Definition,ExchangeRequirements,Roots
    var childs = mview.childNodes;

    for (var i = 0; i < childs.length; i++) {

        if (childs[i].nodeName == 'Definitions') {
            modelview.def = parseDefinitions(childs[i]);
        }
        if (childs[i].nodeName == 'ExchangeRequirements') {
            modelview.exr = parseExchangeRequirements(childs[i]);
        }
        if (childs[i].nodeName == 'Roots') {
            modelview.roots = parseRoots(childs[i]);
        }
    }




    //console.log(JSON.stringify(modelview));
    return modelview;

}

/**
 * 解析Definitions标签
 * @param def 一个根节点为Definitions的dom Element
 * 返回一个list（这个list可能大多情况只有一个元素）,结构如下：
 * [
 * {
 * content:string
 * lang:string 默认是en
 * }
 * ]
 */
function parseDefinitions(def) {
    //根据文档，definitions包括一个definition的list

    var def_list = [];
    var defs = def.childNodes;

    //解析每一个definition, 现只支持解析body
    for (var i = 0; i < defs.length; i++) {
        var defcontent = defs[i].childNodes;

        var def = {};

        for (var j = 0; j < defcontent.length; j++) {
            if (defcontent[j].nodeName == 'Body') {

                //console.log(defcontent[j].childNodes[0]);
                if (defcontent[j].childNodes[0] == undefined)
                    def.content = "undefined";
                else
                    def.content = defcontent[j].childNodes[0].nodeValue;
                def.lang = 'en';
                if (defcontent[j].hasAttribute('lang'))
                    def.lang = defcontent[j].getAttributeNode('lang').nodeValue;

            }

        }

        def_list.push(def);
    }

    return def_list;


}

/**
 * 解析ExchangeRequirements标签
 *
 * @param exrs 一个根节点为ExchangeRequirements的dom element
 * @returns {Array} 返回一个array，结构如下：
 * [
 *{
 * uuid:string
 * name:string
 * applicability:string
 * code:string
 * def:Array
 * }
 * ]
 */
function parseExchangeRequirements(exrs) {

    var require_list = [];

    var exrms = exrs.childNodes;
    //对于每一条exchangerequirement
    for (var i = 0; i < exrms.length; i++) {
        var exrm = exrms[i];

        var require = {};
        //解析属性,支持uuid, name, applicability, code
        require.uuid = exrm.getAttributeNode('uuid').nodeValue;
        require.name = exrm.getAttributeNode('name').nodeValue;

        if (exrm.hasAttribute('applicability')) {
            require.applicability = exrm.getAttributeNode('applicability').nodeValue;
        } else {
            require.applicability = 'undefined';
        }

        if (exrm.hasAttribute('code')) {
            require.code = exrm.getAttributeNode('code').nodeValue;
        } else {
            require.code = 'undefined';
        }

        var child = exrm.childNodes;

        for (var j = 0; j < child.length; j++) {
            if (child[j].nodeName == 'Definitions')
                require.def = parseDefinitions(child[j]);
        }

        require_list.push(require);


    }
    return require_list;
}

function parseRoots(roots) {
    var root_list = [];

    var conceptroots = roots.childNodes;
    //对于每一条ConceptRoot
    for (var i = 0; i < conceptroots.length; i++) {
        var conceptroot = conceptroots[i];

        var root = {};

        //解析conceptroot的属性，支持name, uuid, applicableRootEntity
        root.name = conceptroot.getAttributeNode('name').nodeValue;
        root.uuid = conceptroot.getAttributeNode('uuid').nodeValue;
        root.applicableRootEntity = conceptroot.getAttributeNode('applicableRootEntity').nodeValue;

        var childs = conceptroot.childNodes;

        for (var j = 0; j < childs.length; j++) {
            if (childs[j].nodeName == 'Definitions')
                root.def = parseDefinitions(childs[j]);
            if (childs[j].nodeName == 'Applicability')
                root.applicability = parseApplicability(childs[j]);
            if (childs[j].nodeName == 'Concepts')
                root.concepts = parseConcepts(childs[j]);
        }

        root_list.push(root);


    }
    return root_list;
}

/**
 *
 * @param app 传入一个根节点是Applicability的dom
 * @returns {Object} 内容如下
 * {
 * ref:uuid string
 * rules:object
 * }
 */
function parseApplicability(app) {
    var app_store = {};
    var childs = app.childNodes;

    //applicability中包含Template和TemplateRules
    for (var i = 0; i < childs.length; i++) {
        if (childs[i].nodeName == 'Template') {

            app_store.ref = childs[i].getAttributeNode('ref').nodeValue;
        }

        if (childs[i].nodeName == 'TemplateRules') {
            app_store.rules = parseTemplateRules(childs[i]);
        }
    }

    return app_store;
}

function parseTemplateRules(rules) {
    var rules_store = {};

    rules_store.name = rules.getAttributeNode('operator').nodeValue;

    var allrules = rules.childNodes;
    var rule_list = [];

    for (var i = 0; i < allrules.length; i++) {
        if (allrules[i].nodeName == 'TemplateRules')
            rule_list.push(parseTemplateRules(allrules[i]));
        if (allrules[i].nodeName == 'TemplateRule') {
            var parameters = allrules[i].getAttributeNode('Parameters').value;
            //rule_list.push({parameters: allrules[i].getAttributeNode('Parameters').value});
            rule_list.push(parseParameters(parameters));
        }

    }

    rules_store.children = rule_list;

    return rules_store;
}

function parseParameters(para) {
    //如果字符串里不含AND OR
    var result = {};
    if(para.indexOf('AND') === -1 && para.indexOf('OR') === -1)
        return {name: para};
    else if(para.indexOf('AND') !== -1) {
        result.name = 'and';
        result.children = [];
        var strs = para.split(' AND ');
        for (var i = 0; i < strs.length; i++) {
            result.children.push(parseParameters(strs[i]));
        }
    } else if(para.indexOf('OR') !== -1) {
        result.name = 'or';
        result.children = [];
        var strs = para.split(' OR ');
        for (var i = 0; i < strs.length; i++) {
            result.children.push(parseParameters(strs[i]));
        }
    }
    return result;
}

/**
 *
 * @param concepts 根节点是concepts的dom
 * @returns {Array}
 * [
 * {
 * uuid:string
 * name:string
 * def:[]
 * req:[]
 * rules:[]
 * }
 * ]
 */
function parseConcepts(concepts) {
    var concept_list = [];

    var cons = concepts.childNodes;

    //对于每一个concept
    for (var i = 0; i < cons.length; i++) {

        //这里可能夹杂有comment,也被当作子节点，因此先做判断
        if(cons[i].nodeName == 'Concept') {
            var concept = {};

            concept.uuid = cons[i].getAttributeNode('uuid').nodeValue;
            concept.name = cons[i].getAttributeNode('name').nodeValue;

            var childs = cons[i].childNodes;

            for (var j = 0; j < childs.length; j++) {
                if (childs[j].nodeName === 'Template')
                    concept.ref = childs[j].getAttributeNode('ref').nodeValue;
                if (childs[j].nodeName === "Definitions")
                    concept.def = parseDefinitions(childs[j]);
                if (childs[j].nodeName === 'Requirements')
                    concept.req = parseRequirements(childs[j]);
                if (childs[j].nodeName === 'TemplateRules')
                    concept.rules = parseTemplateRules(childs[j]);
            }
            concept_list.push(concept);
        }
    }

    return concept_list;

}

/**
 *
 * @param requires 一个根节点是Requirements的dom
 * @returns {Array} an array
 * [
 * {
 * applicability:string
 * exchange:string
 * requirement:string,uuid
 * }
 * ]
 */
function parseRequirements(requires) {
    var require_list = [];

    for (var i = 0; i < requires.childNodes.length; i++) {
        var child = requires.childNodes[i];
        var require = {};
        require.applicability = child.getAttributeNode('applicability').nodeValue;
        require.exchange = child.getAttributeNode('exchangeRequirement').nodeValue;
        require.requirement = child.getAttributeNode('requirement').nodeValue;
        require_list.push(require);
    }

    return require_list;
}