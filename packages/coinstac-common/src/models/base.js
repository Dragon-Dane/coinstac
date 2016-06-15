'use strict';

const joi = require('joi');
const omitBy = require('lodash/omitBy');
const forOwn = require('lodash/forOwn');
const pick = require('lodash/pick');
const isFunction = require('lodash/isFunction');
const isUndefined = require('lodash/isUndefined');

/**
 * @constructor
 * @class Base
 * @description common class extended by all coinstac models. provides
 * basic utilities, including type validation for model attributes and
 * serialization
 */
function Base(attrs) {
  attrs = this._validate(attrs);
  this._validateOnSet();
  Object.assign(this, attrs);
}

Base.schema = {};

/**
 * validates a schema, or, requested fields of a schema
 * @private
 * @param {object} attrs pojo or coinstac model
 * @param {object=} opts
 * @param {boolean} opts.fields only validate the fields present in `attrs`, vs
 *                              validating against the full model schema
 * @returns {undefined}
 */
Base.prototype._validate = function (attrs, opts) {
  const validateOpts = { abortEarly: false };
  let uncompiledSchema;
  opts = opts || {};
  uncompiledSchema = opts.schema || this.constructor.schema;
  if (!uncompiledSchema || !Object.keys(uncompiledSchema).length) { return null; }

  if (opts.fields) {
    return Object.keys(attrs).forEach(function validateEachField(field) {
      joi.validate(
        attrs[field],
        uncompiledSchema[field],
        validateOpts,
        function (err) {
          if (err) { throw err; }
        }
      );
    });
  }

  let rslt = joi.validate(
    attrs || {},
    joi.compile(uncompiledSchema),
    validateOpts
  );
  if (rslt.error) { throw rslt.error; }

  return rslt.value;
};

/**
 * Creates setters for each item in schema instance.  Each time a schema attr is
 * changed, it is validated.
 * @private
 * @returns {undefined}
 */
Base.prototype._validateOnSet = function () {
  const schemaKeys = Object.keys(this.constructor.schema || {});
  schemaKeys.forEach((key) => {
    // stash schema var values in _values...
    Object.defineProperty(this, '_values', {
      value: {},
      enumerable: false,
      writable: true,
    });

    // so that we can do model.key = someVal, and trigger the setter on
    // key.  i.e. the setter can't set this.key, or else ==> infinite loop
    /* istanbul ignore if */
    if (key in this) {
      throw new Error(`requested to add ${key} to schema, but it's already present`);
    } else {
      Object.defineProperty(this, key, {
        get: () => (this._values[key]),
        set: (val) => {
          let attrs = {};
          attrs[key] = val;
          this._validate(attrs, { fields: true });
          this._values[key] = val;
        },
        configurable: true,
        enumerable: true,
      });
    }
  });
};

/**
 * returns a pojo of model data
 * @returns {object}
 */
Base.prototype.serialize = function () {
  const toExtract = Object.keys(this.constructor.schema);
  let serialized = omitBy(pick(this, toExtract), isUndefined);

  // recursively serialize any child Models
  forOwn(serialized, (value, key) => {
    if (value && isFunction(value.serialize)) {
      serialized[key] = value.serialize();
    }
  });
  return serialized;
};

/**
 * returns a string version of a `serialize`d model
 * @returns {string}
 */
Base.prototype.toJSON = function () {
  return this.serialize();
};

module.exports = Base;