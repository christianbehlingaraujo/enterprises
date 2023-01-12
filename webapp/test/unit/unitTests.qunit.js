/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comitsgroup.brz./enterprises/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
