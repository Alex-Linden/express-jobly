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

/**This takes an object of optional search params.
 *
 * restructures the data to update into a sanatized sql query
 *
 * it returns an object with SQL query string for the WHERE clause
 *  and an array of matching sanitized data
 */
function sqlForFilterSearch(filterParams){
  const {minEmployees, maxEmployees, name} = filterParams
  //test to make sure filter params were passed

  if (minEmployees > maxEmployees) {
    throw new BadRequestError("Min emplyees is greater than Max");
  }

  const whereParams = [];
  const values = [];

    if (minEmployees) {
      values.push(minEmployees);
      whereParams.push(`num_employees>= $${values.indexOf(minEmployees) + 1}`);
    }
    if (maxEmployees) {
      values.push(maxEmployees);
      whereParams.push(`num_employees<= $${values.indexOf(maxEmployees) + 1}`);
    }
    if (name){
      let sqlName = `%${name}%`;
      values.push(sqlName);
      whereParams.push(`name ILIKE $${values.indexOf(sqlName) + 1}`);
    }

    return {
      whereParams,
      values
    }
}

module.exports = { sqlForPartialUpdate, sqlForFilterSearch };
