sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                nameEnterprise: "",
				namePriceList: "",
				priceListSBPEValidityStartDate: "",
				priceListSBPEValidityEndDate: "",
				priceListCVAValidityStartDate: "",
				priceListCVAValidityEndDate: "",
				priceListSaleText: "",
				radioButtonSBPEValue: true,
				radioButtonCVAValue: false,
				SBPEVisible: false,
				CVAVisible: false,
				tableVisible: true,
				tetoVisible: false,
			    items: [],
				State: {
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
                    }
				}
			};
		}
	};
});