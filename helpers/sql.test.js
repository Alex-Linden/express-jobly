"use strict";

const { sqlForPartialUpdate, sqlForFilterSearch } = require("./sql");
const { BadRequestError } = require("../expressError");

const dataToUpdate = { firstTest: "test", secondTest: "test2" };
const jsToSql = {
  firstTest: "first_test",
  secondTest: "second_test",
  thirdTest: "third_test",
};

const filterData = { name: "test", minEmployees: 1, maxEmployees: 3 };


describe("sqlForPartialUpdate", function () {
  test("works with only provided data", function () {
    const results = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(results).toEqual({
      setCols: `"first_test"=$1, "second_test"=$2`,
      values: ["test", "test2"]
    });
  });

  test("fails if no keys provided to update", function () {
    try {
      sqlForPartialUpdate({}, jsToSql);
      throw new Error("Fail test, you shouldn't get here");
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("works if no jsToSql provided", function () {
    const results = sqlForPartialUpdate(dataToUpdate, {});
    expect(results).toEqual({
      setCols: `"firstTest"=$1, "secondTest"=$2`,
      values: ["test", "test2"]
    });
  });
});

describe("sqlForFilterSearch", function () {
  test("works with all provided params", function () {
    const results = sqlForFilterSearch(filterData);
    expect(results).toEqual({
      whereParams: [
        "num_employees>= $1",
        "num_employees<= $2",
        "name ILIKE $3",
      ],
      values: [1, 3, "%test%"]
    });
  });

  test("fails if min employees is greater than maxEmployees", function () {
    try {
      sqlForFilterSearch({ minEmployees: 4, maxEmployees: 3 });
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
