sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                bSave: false,
                bEdit: false,
                buttonsPhysicalPerson: false,
                buttonsLegalPerson: false,
				mainBuyerKey: "",
                items: []
            };
		}
	};
});