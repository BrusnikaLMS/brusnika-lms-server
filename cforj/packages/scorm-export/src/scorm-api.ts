// SCORM 1.2 API bridge — injected into the SCORM package iframe
// This script exposes the LMSInitialize/LMSSetValue/etc. API on window

export const SCORM_API_SCRIPT = `
(function() {
  var data = {};
  var initialized = false;
  var finished = false;

  window.API = {
    LMSInitialize: function(param) {
      initialized = true;
      return 'true';
    },
    LMSFinish: function(param) {
      finished = true;
      return 'true';
    },
    LMSGetValue: function(element) {
      return data[element] || '';
    },
    LMSSetValue: function(element, value) {
      data[element] = value;
      return 'true';
    },
    LMSCommit: function(param) {
      return 'true';
    },
    LMSGetLastError: function() {
      return '0';
    },
    LMSGetErrorString: function(errorCode) {
      return '';
    },
    LMSGetDiagnostic: function(errorCode) {
      return '';
    }
  };

  // SCORM 2004 API adapter
  window.API_1484_11 = {
    Initialize: function(param) { return window.API.LMSInitialize(param); },
    Terminate: function(param) { return window.API.LMSFinish(param); },
    GetValue: function(element) { return window.API.LMSGetValue(element); },
    SetValue: function(element, value) { return window.API.LMSSetValue(element, value); },
    Commit: function(param) { return window.API.LMSCommit(param); },
    GetLastError: function() { return window.API.LMSGetLastError(); },
    GetErrorString: function(errorCode) { return window.API.LMSGetErrorString(errorCode); },
    GetDiagnostic: function(errorCode) { return window.API.LMSGetDiagnostic(errorCode); }
  };
})();
`
