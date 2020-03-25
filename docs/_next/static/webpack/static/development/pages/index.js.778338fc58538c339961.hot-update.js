webpackHotUpdate("static\\development\\pages\\index.js",{

/***/ "./pages/index.js":
/*!************************!*\
  !*** ./pages/index.js ***!
  \************************/
/*! exports provided: __N_SSG, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__N_SSG", function() { return __N_SSG; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _default; });
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/regenerator */ "./node_modules/@babel/runtime/regenerator/index.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/esm/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime/helpers/esm/inherits */ "./node_modules/@babel/runtime/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime/helpers/esm/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_8__);








var _jsxFileName = "D:\\gitRepos\\aoe2-de-elo-histogram\\pages\\index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_8___default.a.createElement;

function _createSuper(Derived) { return function () { var Super = Object(_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(Derived), result; if (_isNativeReflectConstruct()) { var NewTarget = Object(_babel_runtime_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return Object(_babel_runtime_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }



var _default = /*#__PURE__*/function (_Component) {
  Object(_babel_runtime_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_6__["default"])(_default, _Component);

  var _super = _createSuper(_default);

  function _default() {
    var _this;

    Object(_babel_runtime_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, _default);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    Object(_babel_runtime_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_7__["default"])(Object(_babel_runtime_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_3__["default"])(_this), "state", {});

    return _this;
  }

  Object(_babel_runtime_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__["default"])(_default, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var histogramArray = this.props.histogram;
      var timestamp = this.props.timestamp ? this.props.timestamp : 0;
      var xmin = this.props.xmin;
      var xmax = this.props.xmax; // Common chart variables

      var FONT = "Roboto, Arial, sans-serif"; // Random Map Histogram

      var randomMapScores = [];

      for (var i = 0; i < histogramArray.length; i++) {
        randomMapScores[i] = histogramArray[i][1];
      }

      var trace = {
        x: randomMapScores,
        type: "histogram"
      };
      var layout = {
        title: {
          text: "Age of Empires II: Definitive Edition Ratings<br>1v1 Random Map",
          font: {
            family: FONT,
            size: 24
          },
          xref: "paper",
          x: 0.05
        },
        xaxis: {
          title: {
            text: "Rating",
            font: {
              family: FONT,
              size: 18,
              color: "#7f7f7f"
            }
          },
          range: [xmin, xmax]
        },
        yaxis: {
          title: {
            text: "Number of Players",
            font: {
              family: FONT,
              size: 18,
              color: "#7f7f7f"
            }
          }
        }
      };
      var data = [trace];
      Plotly.newPlot("random_map_histogram", data, layout); // Team Random Map Histogram

      var teamRandomMapScores = [];

      for (var i = 0; i < histogramArray.length; i++) {
        teamRandomMapScores[i] = histogramArray[i][2];
      }

      var trace = {
        x: teamRandomMapScores,
        type: "histogram"
      };
      var layout = {
        title: {
          text: "Age of Empires II: Definitive Edition Ratings<br>Team Random Map",
          font: {
            family: FONT,
            size: 24
          },
          xref: "paper",
          x: 0.05
        },
        xaxis: {
          title: {
            text: "Rating",
            font: {
              family: FONT,
              size: 18,
              color: "#7f7f7f"
            }
          },
          range: [xmin, xmax]
        },
        yaxis: {
          title: {
            text: "Number of Players",
            font: {
              family: FONT,
              size: 18,
              color: "#7f7f7f"
            }
          }
        }
      };
      var data = [trace];
      Plotly.newPlot("team_random_map_histogram", data, layout); // Combo Scatterplot

      var trace1 = {
        x: randomMapScores,
        y: teamRandomMapScores,
        mode: "markers",
        type: "scatter",
        textposition: "top center",
        textfont: {
          family: FONT
        },
        marker: {
          size: 2
        }
      };
      var data = [trace1];
      var layout = {
        legend: {
          y: 0.5,
          yref: "paper",
          font: {
            family: FONT,
            size: 20,
            color: "grey"
          }
        },
        title: {
          text: "Age of Empires II: Definitive Edition Ratings<br>Random Map vs Team Random Map Ratings",
          font: {
            family: FONT,
            size: 24
          },
          xref: "paper",
          x: 0.05
        },
        xaxis: {
          title: {
            text: "Random Map Rating",
            font: {
              family: FONT,
              size: 18,
              color: "#7f7f7f"
            }
          },
          range: [xmin, xmax]
        },
        yaxis: {
          title: {
            text: "Team Random Map Rating",
            font: {
              family: FONT,
              size: 18,
              color: "#7f7f7f"
            }
          }
        }
      };
      Plotly.newPlot("combo_scatterplot", data, layout);
      var lastUpdatedDiv = document.getElementById("last_updated");
      lastUpdatedDiv.textContent = "Updated at ".concat(new Date(timestamp));
    }
  }, {
    key: "render",
    value: function render() {
      return __jsx("html", {
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 173,
          columnNumber: 7
        }
      }, __jsx("head", {
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 174,
          columnNumber: 9
        }
      }, __jsx("script", {
        type: "text/javascript",
        src: "https://cdn.plot.ly/plotly-latest.min.js",
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 175,
          columnNumber: 11
        }
      })), __jsx("body", {
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 180,
          columnNumber: 9
        }
      }, __jsx("div", {
        id: "random_map_histogram",
        style: {
          width: "900px",
          height: "500px"
        },
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 181,
          columnNumber: 11
        }
      }), __jsx("div", {
        id: "team_random_map_histogram",
        style: {
          width: "900px",
          height: "500px"
        },
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 185,
          columnNumber: 11
        }
      }), __jsx("div", {
        id: "combo_scatterplot",
        style: {
          width: "900px",
          height: "500px"
        },
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 189,
          columnNumber: 11
        }
      }), __jsx("div", {
        id: "last_updated",
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 193,
          columnNumber: 11
        }
      }), __jsx("div", {
        id: "github_footer",
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 194,
          columnNumber: 11
        }
      }, "Source code on", " ", __jsx("a", {
        href: "https://github.com/thbrown/aoe2-de-elo-histogram",
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 196,
          columnNumber: 13
        }
      }, "github"), __jsx("br", {
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 199,
          columnNumber: 13
        }
      }), "Data taken from", " ", __jsx("a", {
        href: "https://aoe2.net/#api",
        __self: this,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 201,
          columnNumber: 13
        }
      }, "https://aoe2.net/#api"))));
    }
  }]);

  return _default;
}(react__WEBPACK_IMPORTED_MODULE_8__["Component"]);

var __N_SSG = true;

/**
 * This function only gets called when the page is built. It does not become a part of the web page. The return value of this function is
 * sent to the React component above as props.
 */

/***/ })

})
//# sourceMappingURL=index.js.778338fc58538c339961.hot-update.js.map