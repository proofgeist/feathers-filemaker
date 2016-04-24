'use strict';

/**
 * Created by toddgeist on 5/3/15.
 */

var _ = require('lodash');
var is = require('is');

var FileMakerServerError = require('./FileMakerServerError');


/**
 * creates a query object
 * @param post
 * @param options
 * @returns {{send: Function}}
 */
    /*


/**
 * handle the response from the request
 * @param fmresultset
 * @returns {*}
 */
var parseFMResponse = function (fmresultset) {
    var error = fmresultset.error[0].$.code;
    if(error != 0 ){
        var err = new FileMakerServerError(error,'');
        return err
        //some errors are transient, they should just return empty sets and basic info
        if(err.isTransient){
            return {
                error : error ,
                errorMessage : err.message
            }
        }else{
            return err
        }
    }
    var recordset = fmresultset.resultset[0];
    var records = recordset.record;
    var data;
    if (records){
        data = records.map(function (record) {
            var obj = remapFields(record.field);

            var relatedSets = record.relatedset
            if(relatedSets){
                obj.relatedSets = handleRelatedSets(relatedSets)
            }
            obj.modid= record.$['mod-id'];
            obj.recid = record.$['record-id'];
            return obj
        })
    }else{
        data = [];
    }

    return data


    /*return {
        totalRecords : recordset.$.count ,
        error : error,
        fetchSize : recordset.$['fetch-size'],
        data : data
    }*/

};


/**
 * change the Object structure into { field : value, field2 , value2 }
 * @param fields
 * @returns {{}}
 */
var remapFields = function (fields) {
    var obj = {};
    fields.forEach(function (field) {
        obj[field.$.name] = field.data[0]
    });
    return obj
};


/**
 * handle all the relatedSets ie Portals
 * @param relatedSets
 * @returns {Array}
 */
var handleRelatedSets = function(relatedSets){
    var result = [];
    relatedSets.forEach(function(relatedSet){
        var obj = {
            count: relatedSet.$.count,
            table: relatedSet.$.table
        }
        var records = relatedSet.record
        var data
        if (records){
            data = records.map(function (record) {
                var obj = remapFields(record.field);
                obj.modid= record.$['mod-id'];
                obj.recid = record.$['record-id'];
                return obj
            })
        }else{
            data = [];
        }

        obj.data = data
        result.push(obj)
    });

    return result

}


module.exports = parseFMResponse
