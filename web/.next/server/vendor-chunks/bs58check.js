"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/bs58check";
exports.ids = ["vendor-chunks/bs58check"];
exports.modules = {

/***/ "(ssr)/./node_modules/bs58check/base.js":
/*!****************************************!*\
  !*** ./node_modules/bs58check/base.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar base58 = __webpack_require__(/*! bs58 */ \"(ssr)/./node_modules/bs58/index.js\")\nvar Buffer = (__webpack_require__(/*! safe-buffer */ \"(ssr)/./node_modules/safe-buffer/index.js\").Buffer)\n\nmodule.exports = function (checksumFn) {\n  // Encode a buffer as a base58-check encoded string\n  function encode (payload) {\n    var checksum = checksumFn(payload)\n\n    return base58.encode(Buffer.concat([\n      payload,\n      checksum\n    ], payload.length + 4))\n  }\n\n  function decodeRaw (buffer) {\n    var payload = buffer.slice(0, -4)\n    var checksum = buffer.slice(-4)\n    var newChecksum = checksumFn(payload)\n\n    if (checksum[0] ^ newChecksum[0] |\n        checksum[1] ^ newChecksum[1] |\n        checksum[2] ^ newChecksum[2] |\n        checksum[3] ^ newChecksum[3]) return\n\n    return payload\n  }\n\n  // Decode a base58-check encoded string to a buffer, no result if checksum is wrong\n  function decodeUnsafe (string) {\n    var buffer = base58.decodeUnsafe(string)\n    if (!buffer) return\n\n    return decodeRaw(buffer)\n  }\n\n  function decode (string) {\n    var buffer = base58.decode(string)\n    var payload = decodeRaw(buffer, checksumFn)\n    if (!payload) throw new Error('Invalid checksum')\n    return payload\n  }\n\n  return {\n    encode: encode,\n    decode: decode,\n    decodeUnsafe: decodeUnsafe\n  }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYnM1OGNoZWNrL2Jhc2UuanMiLCJtYXBwaW5ncyI6IkFBQVk7O0FBRVosYUFBYSxtQkFBTyxDQUFDLGdEQUFNO0FBQzNCLGFBQWEsNEZBQTZCOztBQUUxQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGVmaWdodGVyLXdlYi8uL25vZGVfbW9kdWxlcy9iczU4Y2hlY2svYmFzZS5qcz8zYTVkIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTU4ID0gcmVxdWlyZSgnYnM1OCcpXG52YXIgQnVmZmVyID0gcmVxdWlyZSgnc2FmZS1idWZmZXInKS5CdWZmZXJcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY2hlY2tzdW1Gbikge1xuICAvLyBFbmNvZGUgYSBidWZmZXIgYXMgYSBiYXNlNTgtY2hlY2sgZW5jb2RlZCBzdHJpbmdcbiAgZnVuY3Rpb24gZW5jb2RlIChwYXlsb2FkKSB7XG4gICAgdmFyIGNoZWNrc3VtID0gY2hlY2tzdW1GbihwYXlsb2FkKVxuXG4gICAgcmV0dXJuIGJhc2U1OC5lbmNvZGUoQnVmZmVyLmNvbmNhdChbXG4gICAgICBwYXlsb2FkLFxuICAgICAgY2hlY2tzdW1cbiAgICBdLCBwYXlsb2FkLmxlbmd0aCArIDQpKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlUmF3IChidWZmZXIpIHtcbiAgICB2YXIgcGF5bG9hZCA9IGJ1ZmZlci5zbGljZSgwLCAtNClcbiAgICB2YXIgY2hlY2tzdW0gPSBidWZmZXIuc2xpY2UoLTQpXG4gICAgdmFyIG5ld0NoZWNrc3VtID0gY2hlY2tzdW1GbihwYXlsb2FkKVxuXG4gICAgaWYgKGNoZWNrc3VtWzBdIF4gbmV3Q2hlY2tzdW1bMF0gfFxuICAgICAgICBjaGVja3N1bVsxXSBeIG5ld0NoZWNrc3VtWzFdIHxcbiAgICAgICAgY2hlY2tzdW1bMl0gXiBuZXdDaGVja3N1bVsyXSB8XG4gICAgICAgIGNoZWNrc3VtWzNdIF4gbmV3Q2hlY2tzdW1bM10pIHJldHVyblxuXG4gICAgcmV0dXJuIHBheWxvYWRcbiAgfVxuXG4gIC8vIERlY29kZSBhIGJhc2U1OC1jaGVjayBlbmNvZGVkIHN0cmluZyB0byBhIGJ1ZmZlciwgbm8gcmVzdWx0IGlmIGNoZWNrc3VtIGlzIHdyb25nXG4gIGZ1bmN0aW9uIGRlY29kZVVuc2FmZSAoc3RyaW5nKSB7XG4gICAgdmFyIGJ1ZmZlciA9IGJhc2U1OC5kZWNvZGVVbnNhZmUoc3RyaW5nKVxuICAgIGlmICghYnVmZmVyKSByZXR1cm5cblxuICAgIHJldHVybiBkZWNvZGVSYXcoYnVmZmVyKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlIChzdHJpbmcpIHtcbiAgICB2YXIgYnVmZmVyID0gYmFzZTU4LmRlY29kZShzdHJpbmcpXG4gICAgdmFyIHBheWxvYWQgPSBkZWNvZGVSYXcoYnVmZmVyLCBjaGVja3N1bUZuKVxuICAgIGlmICghcGF5bG9hZCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNoZWNrc3VtJylcbiAgICByZXR1cm4gcGF5bG9hZFxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBlbmNvZGU6IGVuY29kZSxcbiAgICBkZWNvZGU6IGRlY29kZSxcbiAgICBkZWNvZGVVbnNhZmU6IGRlY29kZVVuc2FmZVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/bs58check/base.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/bs58check/index.js":
/*!*****************************************!*\
  !*** ./node_modules/bs58check/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar createHash = __webpack_require__(/*! create-hash */ \"(ssr)/./node_modules/create-hash/index.js\")\nvar bs58checkBase = __webpack_require__(/*! ./base */ \"(ssr)/./node_modules/bs58check/base.js\")\n\n// SHA256(SHA256(buffer))\nfunction sha256x2 (buffer) {\n  var tmp = createHash('sha256').update(buffer).digest()\n  return createHash('sha256').update(tmp).digest()\n}\n\nmodule.exports = bs58checkBase(sha256x2)\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYnM1OGNoZWNrL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaLGlCQUFpQixtQkFBTyxDQUFDLDhEQUFhO0FBQ3RDLG9CQUFvQixtQkFBTyxDQUFDLHNEQUFROztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZGVmaWdodGVyLXdlYi8uL25vZGVfbW9kdWxlcy9iczU4Y2hlY2svaW5kZXguanM/OTQ4NyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxudmFyIGNyZWF0ZUhhc2ggPSByZXF1aXJlKCdjcmVhdGUtaGFzaCcpXG52YXIgYnM1OGNoZWNrQmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpXG5cbi8vIFNIQTI1NihTSEEyNTYoYnVmZmVyKSlcbmZ1bmN0aW9uIHNoYTI1NngyIChidWZmZXIpIHtcbiAgdmFyIHRtcCA9IGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShidWZmZXIpLmRpZ2VzdCgpXG4gIHJldHVybiBjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUodG1wKS5kaWdlc3QoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJzNThjaGVja0Jhc2Uoc2hhMjU2eDIpXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/bs58check/index.js\n");

/***/ })

};
;