"use strict";

const _ = require('lodash');


module.exports.includesFields = (obj)=>{

    if(obj === undefined || Object.keys(obj).length === 0 ){
        return false
    }

    // finds the first property that doesn't begin with '-'
    // which will be a field
    let foundOne = false
    Object.keys(obj).map( (property)=>{
        if(!_.startsWith(property, '-') ){
            foundOne = true
        }
    })

    return foundOne

};