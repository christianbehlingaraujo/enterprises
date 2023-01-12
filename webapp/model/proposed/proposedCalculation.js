sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
				percentage: "",
				valueTotal: "",
				validationTitle: "",
				validationText: "",
				validationTextTwo: "",
				validationTextThree: "",
				State: {
					validationTitle: {
						ValueState: sap.ui.core.ValueState.None,
						Icon: "",
						Visible: false
					},
					validationText: {
						ValueState: sap.ui.core.ValueState.None,
						Icon: "",
						Visible: false
					},
					validationTextTwo: {
						ValueState: sap.ui.core.ValueState.None,
						Icon: "",
						Visible: false
					},
					validationTextThree: {
						ValueState: sap.ui.core.ValueState.None,
						Icon: "",
						Visible: false
					}
				}
			};
		}
	};
});