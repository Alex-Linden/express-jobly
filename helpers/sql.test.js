"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

const dataToUpdate = { firstTest: "test", secondTest: "test2" };
const jsToSql = {
  firstTest: "first_test",
  secondTest: "second_test",
  thirdTest: "third_test",
};


describe("sqlForPartialUpdate", function () {
  test("works with only provided data", async function () {
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
    const restults = sqlForPartialUpdate(dataToUpdate, {});
    expect(restults).toEqual({
      setCols: `"firstTest"=$1, "secondTest"=$2`,
      values: ["test", "test2"]
    });
  });
});