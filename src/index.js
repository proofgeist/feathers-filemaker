'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = init;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _feathersQueryFilters = require('feathers-query-filters');

var _feathersQueryFilters2 = _interopRequireDefault(_feathersQueryFilters);

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fms = require('./fms/FMServerClient');
var Joi = require('joi');
var debug = (0, _debug2.default)('fms');

debug('loading');

/**
 * cheap lodash
 * @type {{pick: (function(*, ...[*]))}}
 * @private
 */
var _ = {
  pick: function pick(source) {
    var result = {};

    for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      keys[_key - 1] = arguments[_key];
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        result[key] = source[key];
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  }
};

var optionsSchema = Joi.object().keys({
  model: Joi.object().required().keys({
    layout: Joi.string().required(),
    idField: Joi.string().default('id')
  }),
  paginate: Joi.object(),
  connection: Joi.object().required().keys({
    host: Joi.string().required(),
    db: Joi.string().required(),
    user: Joi.string().required(),
    pass: Joi.any().default('')
  }),
  scriptService: [Joi.object()],
  id: [Joi.string().default('id')]
});

var Service = function () {
  function Service() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Service);

    var _Joi$validate = Joi.validate(options, optionsSchema);

    var value = _Joi$validate.value;
    var error = _Joi$validate.error;

    if (error) {

      throw new Error(error);
    }

    this.paginate = options.paginate || {};
    this.connection = value.connection;
    this.model = value.model;
    this.id = this.model.idField; 

    fms.setURL(this.connection.host);
  }

  _createClass(Service, [{
    key: 'extend',
    value: function extend(obj) {
      return _uberproto2.default.extend(obj, this);
    }
  }, {
    key: 'fmsQuery',
    value: function fmsQuery(command, params) {

      var db = params._db ? params._db : this.connection.db;
      var layout = params._lay ? params._lay : this.model.layout;

      return _defineProperty({
        '-db': db,
        '-lay': layout
      }, command, '');
    }
  }, {
    key: 'fmsAuth',
    value: function fmsAuth(params) {
      if (!params) {
        params = {};
      }
      var auth = params.auth || {};
      return {
        user: auth.user || this.connection.user,
        pass: auth.pass || this.connection.pass
      };
    }
  }, {
    key: 'buildGetOptions',
    value: function buildGetOptions(qs, params) {
      return {
        qs: qs,
        method: 'get',
        auth: this.fmsAuth(params)
      };
    }
  }, {
    key: 'buildPostOptions',
    value: function buildPostOptions(qs, data, params) {
      Object.assign(qs, data);
      var obj = {
        form: qs,
        method: 'post',
        auth: this.fmsAuth(params)
      };
      return obj;
    }
  }, {
    key: 'handleFilters',
    value: function handleFilters(obj, filters) {
      if (filters.$limit) {
        obj['-max'] = filters.$limit;
      }
      if (filters.$skip) {
        obj['-skip'] = filters.$skip;
      }
      if (filters.$sort) {
        var sortfFields = Object.keys(filters.$sort);
        sortfFields.map(function (key, i) {
          var n = i + 1;
          var sortMethod = filters.$sort[key];

          var sortOrder = sortMethod === 1 ? 'ascend' : sortMethod === -1 ? 'descend' : sortMethod;
          obj['-sortfield.' + n] = key;
          obj['-sortorder.' + n] = sortOrder;
        });
      }
      return obj;
    }
  }, {
    key: 'fmOperator',
    value: function fmOperator(operator) {
      switch (operator) {
        case '$lt':
          return 'lt';
        case '$lte':
          return 'lte';
        case '$gt':
          return 'gt';
        case '$gte':
          return 'gte';
        case '$ne':
          return 'neq';
        case 'cn':
          return 'cn';
        default:
          return 'eq';
      }
    }
  }, {
    key: 'expandQueryWithOperators',
    value: function expandQueryWithOperators(query) {
      var _this = this;

      if (!query) {
        return query;
      }
      var newQ = {};
      Object.keys(query).map(function (queryKey) {
        var queryItem = query[queryKey];

        if (queryKey.startsWith('$')) {
          newQ = Object.assign(newQ, queryItem); // return with no change
        } else if ((typeof queryItem === 'undefined' ? 'undefined' : _typeof(queryItem)) !== 'object') {
            newQ[queryKey] = queryItem; // rebuild the original
          } else {
              // theres an operator to add to the query
              var operator = Object.keys(queryItem)[0];
              var value = queryItem[operator];
              newQ[queryKey] = value;
              newQ[queryKey + '.op'] = _this.fmOperator(operator);
            }
      });
      return newQ;
    }
  }, {
    key: 'buildFindOptions',
    value: function buildFindOptions(qs, params, filters) {
      var query = params.query;
      var expandedQ = this.expandQueryWithOperators(query);
      var obj = Object.assign({}, qs, expandedQ);
      obj = this.handleFilters(obj, filters);

      return {
        qs: obj,
        method: 'get',
        auth: this.fmsAuth(params)
      };
    }
  }, {
    key: 'buildOrFindOptions',
    value: function buildOrFindOptions(qs, params, filters) {
      var query = params.query;
      var orArray = query.$or;
      delete query.$or;

      var qArray = [];
      orArray.map(function (orCriteria, i) {
        var n = i + 1;
        //assuming one field in each Or
        var fieldName = Object.keys(orCriteria)[0];
        qArray.push('q' + n);
        query['-q' + n] = fieldName;
        query['-q' + n + '.value'] = orCriteria[fieldName];
      });
      query['-query'] = '(' + qArray.join(');(') + ')';

      var obj = Object.assign({}, qs, query);
      obj = this.handleFilters(obj, filters);
      return {
        qs: obj,
        method: 'get',
        auth: this.fmsAuth(params)
      };
    }

    // Find without hooks and mixins that can be used internally and always returns
    // a pagination object

  }, {
    key: '_find',
    value: function _find(params) {
      var getFilter = arguments.length <= 1 || arguments[1] === undefined ? _feathersQueryFilters2.default : arguments[1];


      var query = params.query || {};

      var filters = getFilter(query);

      var options = void 0;
      if (query.$or) {
        options = this.buildOrFindOptions(this.fmsQuery('-findquery', params), params, filters);
      } else {

        var command = Object.keys(query).length === 0 ? '-findall' : '-find';

        options = this.buildFindOptions(this.fmsQuery(command, params), params, filters);
      }

      var totalFound = void 0;

      return fms.request(options)

      //handle select
      .then(function (response) {
        totalFound = response.total;
        var result = response.data;
        if (filters.$select) {

          return result.map(function (record) {
            return _.pick.apply(_, [record].concat(_toConsumableArray(filters.$select)));
          });
        }
        return result;
      }).then(function (result) {

        return {
          total: totalFound,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data: result
        };
      });
    }
  }, {
    key: 'find',
    value: function find(params) {
      var _this2 = this;

      var handle401 = function handle401(data) {
        if (data.error === '401') {
          return [];
        } else {
          return data;
        }
      };

      // Call the internal find with query parameter that include pagination
      var result = this._find(params, function (query) {
        return (0, _feathersQueryFilters2.default)(query, _this2.paginate);
      });

      if (!this.paginate.default) {

        return result.then(function (page) {
          return page.data;
        }).then(handle401);
      }

      return result.then(handle401);
    }

    /**
     * private get to use internally
     * @param id
     * @returns {Promise.<TResult>}
     * @private
     */

  }, {
    key: '_get',
    value: function _get(id, params) {

      var qs = this.fmsQuery('-find', params);
      qs[this.model.idField] = id;
      qs[this.model.idField + '.op'] = 'eq';

      var options = this.buildGetOptions(qs, params);

      return fms.request(options).then(function (response) {
        var data = response.data;
        if (response.error !== '0') {
          if (response.error === '401') {
            throw new _feathersErrors2.default.NotFound('No record found for id \'' + id + '\'');
          }
          throw new _feathersErrors2.default.BadRequest('FMS error: ' + response.error);
        }
        return data[0];
      });
    }

    /**
     * public get
     * @param id
     */

  }, {
    key: 'get',
    value: function get(id, params) {
      return this._get(id, params);
    }
  }, {
    key: '_create',
    value: function _create(data, params) {
      var qs = this.fmsQuery('-new', params);
      var options = this.buildPostOptions(qs, data, params);
      return fms.request(options).then(function (response) {
        var data = response.data;
        return data[0];
      });
    }
  }, {
    key: 'create',
    value: function create(data, params) {
      var _this3 = this;

      if (Array.isArray(data)) {
        return Promise.all(data.map(function (current) {
          return _this3._create(current, params);
        }));
      }
      return this._create(data, params);
    }

    // Update without hooks and mixins that can be used internally

  }, {
    key: '_update',
    value: function _update(id, data, params) {
      var _this4 = this;

      return this.get(id, params)
      // find the record to get its record id
      .then(function (record) {
        var qs = _this4.fmsQuery('-edit', params);
        qs['-recid'] = record.recid;
        return _this4.buildPostOptions(qs, data, params);
      })

      //update it
      .then(function (options) {
        return fms.request(options).then(function (response) {
          return response.data[0];
        });
      });
    }
  }, {
    key: 'update',
    value: function update(id, data, params) {
      if (id === null || Array.isArray(data)) {
        return Promise.reject(new _feathersErrors2.default.BadRequest('You can not replace multiple instances. Did you mean \'patch\'?'));
      }

      return this._update(id, data, params);
    }

    // Patch without hooks and mixins that can be used internally

  }, {
    key: '_patch',
    value: function _patch(id, data, params) {
      var _this5 = this;

      return this.get(id, params)
      // find the record to get its record id
      .then(function (record) {
        var qs = _this5.fmsQuery('-edit', params);
        qs['-recid'] = record.recid;
        return _this5.buildPostOptions(qs, data, params);
      })

      //update it
      .then(function (options) {
        return fms.request(options).then(function (response) {
          return response.data[0];
        });
      });
    }
  }, {
    key: 'patch',
    value: function patch(id, data, params) {
      var _this6 = this;

      if (id === null) {
        return this._find(params).then(function (page) {
          return Promise.all(page.data.map(function (current) {
            return _this6._patch(current[_this6.model.idField], data, params);
          }));
        });
      }

      return this._patch(id, data, params);
    }
  }, {
    key: '_remove',
    value: function _remove(id, params) {
      var _this7 = this;

      var deletedRecord = void 0;

      return this.get(id, params).then(function (record) {
        deletedRecord = record;
        var qs = _this7.fmsQuery('-delete', params);
        qs['-recid'] = record.recid;
        return _this7.buildGetOptions(qs, params);
      }).then(function (options) {
        return fms.request(options).then(function () {
          return deletedRecord;
          //  I need to deal with record locks etc here.
          /*const result = response.data
          if(result.error){
            // throw new errors.BadRequest(result.error)
          }else{
            return deletedRecord;
          };*/
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var _this8 = this;

      if (id && id.query) {
        throw new _feathersErrors2.default.BadRequest('First parameter of remove() contained a \'query\' object. Did you mean to pass null?');
      }

      if (id === null) {
        return this._find(params).then(function (page) {

          return Promise.all(page.data.map(function (current) {
            return _this8._remove(current[_this8.model.idField], params);
          }));
        });
      }

      return this._remove(id, params);
    }
  }, {
    key: 'setup',
    value: function setup(app) {
      this.app = app;
    }
  }]);

  return Service;
}();

function init(options) {
  return new Service(options);
}

init.Service = Service;
init.ScriptService = require('./script');
init.AutoService = require('./auto');
module.exports = exports['default'];
