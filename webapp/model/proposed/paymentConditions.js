sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";
    return {	
		initModel: function() {
			return {
                selectionComponents: "",
                selectionValueIntermediate: "",
                selectionSaleForm: "Z01",
                selectionPaymentPlan: "MR",
                selectionPurchaseMethod: "",
                State: {
                    buttonAdd: {
                        Visible: true
                    },
                    selectionComponents: {
                        Visible: true,
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionSaleForm:{
                        Visible: true,
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionPurchaseMethod:{
                        Visible: true,
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionDifference: {
                        Visible: true,
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionPaymentPlan:{
                        Visible: true,
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionValueIntermediate:{
                        Visible: false,
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    }
                },
                itemsPaymentPlanInit: [
                    {
                        key: "MR",
                        text: "Mensal - Reajustável"
                    }/*,
                    {
                        key: "MF",
                        text: "Mensal Fixa"
                    },
                    {
                        key: "MDR",
                        text: "Mensal Decrescente - Reajustável"
                    }*/
                ],
                itemsPaymentPlan: [
                    {
                        key: "MR",
                        text: "Mensal - Reajustável"
                    }/*,
                    {
                        key: "MF",
                        text: "Mensal Fixa"
                    },
                    {
                        key: "MDR",
                        text: "Mensal Decrescente - Reajustável"
                    }*/
                ],
			    items: []
			};
		}
	};
});