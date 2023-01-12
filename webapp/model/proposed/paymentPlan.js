sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initModel: function() {
			return {
				buttonPrintPaymentPlan: false,
                rowCount: 0,
				State: {
					signal: {
						Visible: false
					},
					FGTS: {
						Visible: false
					},
					CEF: {
						Visible: false
					},
					subsidy: {
						Visible: false
					},
					discountSale: {
						Visible: false
					},
					deliveryKeys: {
						Visible: false
					},
					preKey: {
						Visible: false
					},
					proKey: {
						Visible: false
					},
					percIncome:{
						Visible: false
					},
					fixedMonthly: {
						Visible: false
					},
					intermediate: {
						Visible: false
					}
				},
			    items: []
            };
		}
	};
});