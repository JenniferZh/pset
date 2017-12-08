var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;


/**
 * 给一个文件夹，读取所有的文件并解析
 * @param folder
 */
function getFiles(folder) {
    var jsons = [];
    fs.readdirSync(folder).forEach(function (file)  {
        //var ajson = JSON.parse(fs.readFileSync(folder+'/'+file, 'utf8'));

        xml = fs.readFileSync(folder+'/'+file, 'utf8');
        var doc = new DOMParser().parseFromString(xml);
        console.log(JSON.stringify(parseXML(doc)));

    });
    //return jsons;
}


/**
 * 解析xml文件成json
 * @param doc
 * @returns {{}}
 */
function parseXML(doc) {

    var pset = doc.documentElement;
    var childs = pset.childNodes;

    var result = {};

    //注意：一个标签下的内容并不是这个标签的值，而是在这个标签下的一个文本节点的值（子节点）

    for(var i = 0; i < childs.length; i++) {
        var child = childs[i];
        if(child.nodeName === 'Name') {
            result.name = child.childNodes[0].nodeValue;
        }
        if(child.nodeName === 'IfcVersion') {
            result.ifcversion = child.getAttributeNode('version').nodeValue;
        }
        if(child.nodeName === 'Definition') {
            result.def = child.childNodes[0].nodeValue;
        }
        if(child.nodeName === 'ApplicableClasses') {
            result.appclass = [];
            var classes = child.getElementsByTagName('ClassName');
            for(var j = 0; j < classes.length; j++) {
                result.appclass.push(classes[j].childNodes[0].nodeValue);
            }
        }
        if(child.nodeName === 'PsetDefinitionAliases') {
            result.defaliases = [];
            var classes = child.getElementsByTagName('PsetDefinitionAlias');
            for(var j = 0; j < classes.length; j++) {
                var onedef = {}
                onedef.lang = classes[j].getAttributeNode('lang').nodeValue;
                if(classes[j].childNodes[0] === undefined) {
                    onedef.def = "";
                }
                else {
                    onedef.def = classes[j].childNodes[0].nodeValue;
                }
                result.defaliases.push(onedef);
            }

        }
        if(child.nodeName === 'PropertyDefs') {
            result.property = [];
            var classes = child.getElementsByTagName('PropertyDef');
            for(var j = 0; j < classes.length; j++) {
                //console.log(j);
                result.property.push(parseProperty(classes[j]));
            }
        }


        //console.log(childs[i].nodeName);
    }
    return result;

}

function parseProperty(property) {

    var result = {};
    result.guid = property.getAttributeNode('ifdguid').nodeValue;

    var childs = property.childNodes;


    //注意：一个标签下的内容并不是这个标签的值，而是在这个标签下的一个文本节点的值（子节点）

    for(var i = 0; i < childs.length; i++) {
        var child = childs[i];
        if(child.nodeName === 'Name') {
            result.name = child.childNodes[0].nodeValue;
        }
        if(child.nodeName === 'Definition') {
            result.def = child.childNodes[0].nodeValue;
        }

        if(child.nodeName === 'DefinitionAliases') {
            result.defaliases = [];
            var classes = child.getElementsByTagName('DefinitionAlias');
            for(var j = 0; j < classes.length; j++) {
                var onedef = {}
                onedef.lang = classes[j].getAttributeNode('lang').nodeValue;
                onedef.def = classes[j].childNodes[0].nodeValue;
                result.defaliases.push(onedef);
            }
        }
        if(child.nodeName === 'NameAliases') {
            result.namealiases = [];
            var classes = child.getElementsByTagName('NameAlias');
            for(var j = 0; j < classes.length; j++) {
                var onename = {};
                onename.lang = classes[j].getAttributeNode('lang').nodeValue;
                onename.def = classes[j].childNodes[0].nodeValue;
                result.namealiases.push(onename);
            }
        }
        if(child.nodeName === 'PropertyType') {
            result.datatype = parsePropertyType(child);
        }


        //console.log(childs[i].nodeName);
    }

    return result;

}

function parsePropertyType(type) {
    result = {};
    result.type = type.getAttributeNode('p4:type').nodeValue;

    var childs = type.childNodes;

    for(var i = 0; i < childs.length; i++) {

        if(childs[i].nodeName === 'TypePropertyEnumeratedValue') {
            result.value = [];
            var values = childs[i].getElementsByTagName('EnumItem');
            for(var j = 0; j < values.length; j++) {
                result.value.push(values[j].childNodes[0].nodeValue);

            }

        }
        if(childs[i].nodeName === 'TypePropertySingleValue') {
            //console.log(childs[i].getElementsByTagName('DataType')[0].getAttributeNode('type').nodeValue)
            result.value = childs[i].getElementsByTagName('DataType')[0].getAttributeNode('type').nodeValue;
        }
        if(childs[i].nodeName === 'TypePropertyBoundedValue') {
            result.value = childs[i].getElementsByTagName('DataType')[0].getAttributeNode('type').nodeValue;
        }
    }

    return result;
}

testfolder = './psetxml';
var jsons = getFiles(testfolder);
console.log(jsons)