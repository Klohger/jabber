"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var SOURCE_CONNECTOR;
(function (SOURCE_CONNECTOR) {
    var _this = this;
    var ServerMessage;
    (function (ServerMessage) {
        var _a;
        var Type;
        (function (Type) {
            Type["RecieveMessageFrom"] = "0";
            Type["RecieveRecordFrom"] = "1";
            Type["VesselEntered"] = "2";
            Type["VesselLeft"] = "3";
            Type["Disconnect"] = "4";
            Type["Unworthy"] = "5";
        })(Type = ServerMessage.Type || (ServerMessage.Type = {}));
        ServerMessage.events = (_a = {},
            _a[Type.RecieveMessageFrom] = function (ev) {
                var message = JSON.parse(ev.data);
                console.log("RecieveMessageFrom", message);
            },
            _a[Type.RecieveRecordFrom] = function (ev) {
                var message = JSON.parse(ev.data);
                console.log("RecieveRecordFrom", message);
            },
            _a[Type.VesselEntered] = function (ev) {
                var message = JSON.parse(ev.data);
                THE_LIST.appendChild(CreateVesselHTMLElement(message.moniker));
                console.log("VesselEntered", message);
            },
            _a[Type.VesselLeft] = function (ev) {
                var message = JSON.parse(ev.data);
                document.getElementById(message.moniker).remove();
                console.log("VesselLeft", message);
            },
            _a[Type.Disconnect] = function (ev) {
                var message = JSON.parse(ev.data);
                THE_LIST.innerHTML = "";
                console.log("Disconnect", message);
                SOURCE_CONNECTOR.eventSource.close();
            },
            _a[Type.Unworthy] = function (ev) {
                var message = JSON.parse(ev.data);
                console.log("Unworthy", message);
                SOURCE_CONNECTOR.eventSource.close();
            },
            _a);
    })(ServerMessage || (ServerMessage = {}));
    var Status;
    (function (Status) {
        Status[Status["ACCEPTED"] = 202] = "ACCEPTED";
        Status[Status["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    })(Status || (Status = {}));
    var THE_LIST = document.getElementById("THE_LIST");
    function AttemptSourceEntrance(args) {
        var _this = this;
        return fetch("ATTEMPT_SOURCE_ENTRANCE/".concat(args.moniker_suggestion)).then(function (response) { return __awaiter(_this, void 0, void 0, function () {
            var _a, details;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = response.status;
                        switch (_a) {
                            case Status.ACCEPTED: return [3 /*break*/, 1];
                            case Status.UNAUTHORIZED: return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, response.json()];
                    case 2:
                        details = (_b.sent());
                        return [2 /*return*/, details];
                    case 3: return [4 /*yield*/, response.text()];
                    case 4: throw _b.sent();
                    case 5: return [2 /*return*/];
                }
            });
        }); }, function (err) {
            throw err;
        });
    }
    function GetSourceEntranceDetails() {
        return __awaiter(this, void 0, void 0, function () {
            var details, error_message_1, moniker_suggestion, promise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        error_message_1 = null;
                        moniker_suggestion = void 0;
                        promise = void 0;
                        _a.label = 1;
                    case 1:
                        moniker_suggestion = prompt(error_message_1 === null
                            ? "Choose a moniker to wield for THE SOURCE."
                            : error_message_1);
                        promise = AttemptSourceEntrance({ moniker_suggestion: moniker_suggestion });
                        _a.label = 2;
                    case 2: return [4 /*yield*/, promise.then(function (res) {
                            details = res;
                            return false;
                        }, function (err) {
                            error_message_1 = err;
                            return true;
                        })];
                    case 3:
                        if (_a.sent()) return [3 /*break*/, 1];
                        _a.label = 4;
                    case 4: return [2 /*return*/, details];
                }
            });
        });
    }
    function EnterSource(vessel) {
        SOURCE_CONNECTOR.eventSource = new EventSource("THE_SOURCE/".concat(vessel.moniker, "/").concat(vessel.password));
        SOURCE_CONNECTOR.eventSource.onopen = function (ev) {
            console.log("entered THE SOURCE");
        };
        Object.keys(ServerMessage.Type)
            .map(function (key) { return ServerMessage.Type[key]; })
            .forEach(function (type) {
            console.log(type);
            SOURCE_CONNECTOR.eventSource.addEventListener(type, ServerMessage.events[type]);
        });
    }
    function SendMessageTo(other, message) { }
    function SendRecordTo(other, record) { }
    function ProcessSourceEntranceDetails(details) {
        details.otherVessels.forEach(function (v) {
            return THE_LIST.appendChild(CreateVesselHTMLElement(v));
        });
        return __assign({}, details);
    }
    function CreateVesselHTMLElement(vessel) {
        var div = document.createElement("div");
        div.id = vessel;
        var img = document.createElement("img");
        img.src = "COMPUTER_ICON";
        div.appendChild(img);
        div.innerText = vessel;
        return div;
    }
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = EnterSource;
                    _b = ProcessSourceEntranceDetails;
                    return [4 /*yield*/, GetSourceEntranceDetails()];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.apply(void 0, [_c.sent()])])];
            }
        });
    }); })();
})(SOURCE_CONNECTOR || (SOURCE_CONNECTOR = {}));
