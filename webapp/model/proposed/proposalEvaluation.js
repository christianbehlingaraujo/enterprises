sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initModel: function() {
			return {
                buttonSaveProposal: false,
                buttonUpdateProposal: false,
                discountAdditionText: "",
			    items: [
                    {
                        unitValue: "R$180.000,00",
                        discountAddition: "R$0,00 (0,0000%)",
                        proposalValue: "",
                        finalEvaluation: "",
                        State: {
                            finalEvaluation: {
                                ValueState: sap.ui.core.ValueState.None,
                                Icon: ""
                            }
                        }
                    }
                ]
            };
		}
	};
});