"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var API = _axios["default"].create({
  baseURL: "".concat(_config["default"], "/api")
});

API.interceptors.request.use(function (req) {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = "Bearer ".concat(localStorage.getItem('token'));
  }

  return req;
});
var _default = API;
exports["default"] = _default;
//# sourceMappingURL=api.dev.js.map
