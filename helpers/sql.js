"use strict";

const { BadRequestError } = require("../expressError");

/** This takes in a object of data to update and an optional object of json to sql.
 *
 * restructures the data to update into a sanatized sql query
 *
 * returns sql query syntax and an array of the object values
 * for the query for partial data updates. saves having to write
 * queries for every use case
 *
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
