'use strict';
/**
 * Created by toddgeist on 4/23/16.
 */



const Promise = require('bluebird');  // jshint ignore:line
const xml2js = require('xml2js');
var FileMakerServerError = require('./FileMakerServerError');



Promise.promisifyAll( xml2js );

module.exports = (xml)=>{
  const fieldArray = (json)=>{
    return json.FMPXMLRESULT.METADATA.map((fields)=>{
      return fields.FIELD.map((item)=>{

        const fieldName = item.$.NAME;
        const splitName = fieldName.split('::');
        const table = splitName.length===2 ? splitName[0] : '';

        const typer = {
          name : fieldName,
          type : item.$.TYPE,
          table : table
        };
        return typer;
      });

    })[0];
  };


  let error;
  return xml2js.parseStringAsync(xml)
    .then((json)=>{


      error = json.FMPXMLRESULT.ERRORCODE[0];
      if(error !== '0'){
        return new FileMakerServerError(error);
      }

      let fieldsArray =  fieldArray(json);
      let dataNode =  json.FMPXMLRESULT.RESULTSET[0];

      let totalFound = parseInt(dataNode.$.FOUND);

      let rows = dataNode.ROW;

      let data = [];
      if(totalFound > 0 && rows ){
        data = rows.map((row)=>{
          const record = {
            modid: parseInt(row.$.MODID),
            recid: parseInt(row.$.RECORDID)
          };

          fieldsArray.map((fieldDef, i)=>{

            if(fieldDef.table===''){
              let value = record[fieldDef.name] = row.COL[i].DATA[0];

              if(fieldDef.type==='NUMBER'){
                if(value){
                  value = parseFloat(value);
                }else{
                  value=null;
                }
              }
              record[fieldDef.name] = value;
            }else{
              // relatedRecords
            }
          });
          return record;
        });

      }

      return  {
        total:totalFound,
        error: error,
        data
      };


    });
};

