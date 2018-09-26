const util = require('util');
const TypeChecker = require('./TypeChecker');


const TypeCheckerMap = {
  array: TypeChecker.checkArray,
  boolean: TypeChecker.checkBoolean,
  integer: TypeChecker.checkInteger,
  number: TypeChecker.checkNumber,
  string: TypeChecker.checkString,

  uint4: TypeChecker.checkUint4,
  ufloat: TypeChecker.checkUnsignedFloat,
  uint64: TypeChecker.checkUnsignedInt,
};


class SchemaChecker {
  static check(schema, value) {
    schema.forEach((field) => {
      const v = value[field.name];
      const checker = TypeCheckerMap[field.type];
      if (!checker) {
        throw new Error(util.format('UnSupported data schema type: %s', field.type));
      }

      if (field.required) {
        if (v === undefined) {
          throw new Error(util.format('Missing Required property %s', field.name));
        }
        if (!checker(v)) {
          throw new Error(util.format('%o is not of type %s', v, field.type));
        }
      } else if (v !== undefined && v !== null && !checker(v)) {
        throw new Error(util.format('%s check failed, %o is not of type %s', field.name, v, field.type));
      }
    });
  }
}

module.exports = SchemaChecker;
