sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function(i18n) {
			return {
				items: [
                   {
                        key: "Sinal",
                        text: i18n.textSignal
                   },
                   {
                        key: "FGTS",
                        text: i18n.textFGTS
                   },
                   {
                        key: "Financiamento CEF",
                        text: i18n.textCEF
                   },
                   {
                        key: "Subsídio",
                        text: i18n.textSubsidy
                   },
                   {
                        key: "Desconto de Venda",
                        text: i18n.textDiscountSale
                   },
                   {
                        key: "Entrega de Chaves",
                        text: i18n.textDeliveryKeys
                   },
                   {
                        key: "Mensal - Reajustável",
                        text: i18n.textAdjustableMonthly
                   },
                   /*{
                        key: "Mensal Fixa",
                        text: i18n.textFixedMonthly
                   },
                   {
                        key: "Mensal Decrescente - Reajustável",
                        text: i18n.textDescendingMonthly
                   },*/
                   {
                        key: "Intermediária",
                        text: i18n.textIntermediate
                   }
                ]
			};
		}
	};
});