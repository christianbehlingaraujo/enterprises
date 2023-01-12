sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                selectionPropertyType: "Todas",
                selectionWorkStage: "Todas",
                selectionTypology: "Todas",
                selectionCity: "Todas",
                State: {
                    selectionPropertyType: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionWorkStage: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionTypology: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionCity: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                }
            };
		}
	};
});