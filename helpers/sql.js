const { BadRequestError } = require("../expressError");

/** This takes in data to update and json to sql object.
 *
 * restructures the data to update into a sanatized sql query
 *
 * returns sql query syntax and an array of the object values
 * for sql queries for partial data updates. saves having to write
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
