sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                nameEnterprise: "",
				numberLine: 0,
				numberColumn: 0,
				imagesrc: "",
				radioButtonTableValue: true,
				radioButtonSBPEValue: false,
				radioButtonCVAValue: false,
				State: {
					radioButtonTableValue: {
                        Enabled: true,
						Visible: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
					radioButtonSBPEValue: {
                        Enabled: true,
						Visible: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
					radioButtonCVAValue: {
                        Enabled: true,
						Visible: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
					incomeAgreementUnits: {
						Enabled: true,
						Visible: false,
						ValueState: sap.ui.core.ValueState.None,
						ValueStateText: ""
					}
				},
                items: []
            };
		}
	};
});