sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";
    return {	
		initModel: function() {
			return {
                rowCount: 0,
			    items: []
			};
		}
	};
});