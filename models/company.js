"use strict";

const { max } = require("pg/lib/defaults");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /**Find filtered list of companies.
   *
   * takes in at least 1 but up to 3 optional filtering params
   * of name, min employees and/or max employees
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * for results matching filter
   *
   * Throws an error if min employees is greater than max
   */
  static async filter(filterParams) {

    const { whereParams, values } = sqlForFilterSearch(filterParams);

    const query = `SELECT handle,
    name,
    description,
    num_employees AS "numEmployees",
    logo_url AS "logoUrl"
      FROM companies
      WHERE ${whereParams.join(" AND ")}
      ORDER BY name`;

    const companiesRes = await db.query(query, values);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


/**This takes an object of optional search params.
 *
 * restructures the data to update into a sanatized sql query
 *
 * it returns an object with SQL query string for the WHERE clause
 *  and an array of matching sanitized data
 *
 */
 function sqlForFilterSearch(filterParams) {
  const { minEmployees, maxEmployees, name } = filterParams;
  //test to make sure filter params were passed

  if (minEmployees > maxEmployees) {
    throw new BadRequestError("Min emplyees is greater than Max");
  }

  const whereParams = [];
  const values = [];
  if (minEmployees !== undefined) {
    values.push(minEmployees);
    whereParams.push(`num_employees>= $${values.length}`);
  }
  if (maxEmployees !== undefined) {
    values.push(maxEmployees);
    whereParams.push(`num_employees<= $${values.length}`);
  }
  if (name) {
    let sqlName = `%${name}%`;
    values.push(sqlName);
    whereParams.push(`name ILIKE $${values.length}`);
  }

  return {
    whereParams,
    values
  };
}

module.exports = { Company, sqlForFilterSearch };
