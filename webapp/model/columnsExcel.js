sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";
    return {	
		initModel: function(i18n, sModelProperty) {
			return [
                {
                    label: i18n.unit,
					property: "blockUnit",
					type: sap.ui.export.EdmType.String,
                    width: "6rem"
                },
                {
                    label: i18n.status,
					property: "statusText",
					type: sap.ui.export.EdmType.String,
                    width: "10rem"
                },
                {
                    label: i18n.feature,
					property: "feature",
				    type: sap.ui.export.EdmType.String,
                    width: "10rem"
                },
                {
                    label: i18n.area,
					property: "area",
				    type: sap.ui.export.EdmType.String,
                    width: "6rem"
                },
                {
                    label: i18n.price,
					property: "price",
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },
                {
                    label: i18n.vacancies,
					property: "vacancies",
				    type: sap.ui.export.EdmType.String,
                    width: "25rem"
                },
                {
                    label: i18n.signal,
				    property: sModelProperty.signal,
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },
                {
                    label: i18n.FGTS,
				    property: sModelProperty.FGTS,
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },
                {
                    label: i18n.financing,
				    property: sModelProperty.financing,
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },
                /*{
                    label: i18n.subsidy,
				    property: "tableParms/subsidy",
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },*/
                {
                    label: i18n.readjustableTable,
				    property: sModelProperty.readjustableTable,
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },
                {
                    label: i18n.intermediateValue,
				    property: sModelProperty.intermediateValue,
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },
                {
                    label: i18n.netValue,
				    property: sModelProperty.netValue,
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                },
                {
                    label: i18n.unitValue,
				    property: "tableValue",
					type: sap.ui.export.EdmType.String,
                    width: "8rem"
                }
            ]
		}
	};
});