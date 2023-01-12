sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
				objectID: "",
				ID: "",
				CCAValueAssessment: 0,
				CCA: {
					PartyID: "",
					RoleCode: ""
				},
				approvalStatusCode: "",
				ValidaOportPelaAtividade: 0,
				messageStatus: "",
				product: {
					objectID: "",
					productID: ""
				},
				selectionValidatedSimulate: false,
				opportunityValidatedSimulate: false,
				broker: "",
				reservations: "",
				exterior: null,
				realEstate: "",
				itemsBrokers: [],
				itemsRealEstate: [],
				State: {
					messageStatus: {
						Enabled: true,
						Visible: false,
						ValueState: sap.ui.core.ValueState.None,
						ValueStateText: ""
					},
					broker: {
						Enabled: true,
						Visible: true,
						ValueState: sap.ui.core.ValueState.None,
						ValueStateText: ""
					},
					reservations: {
						Enabled: false,
						Visible: true,
						ValueState: sap.ui.core.ValueState.None,
						ValueStateText: ""
					},
					exterior: {
						Enabled: true,
						Visible: true,
						ValueState: sap.ui.core.ValueState.None,
						ValueStateText: ""
					},
					realEstate: {
						Enabled: true,
						Visible: true,
						ValueState: sap.ui.core.ValueState.None,
						ValueStateText: ""
					}
				},
				proposalInformation: {
						media: "",
						reasonForPurchase: "",
						comments: "",
						State: {
							media: {
								Enabled: true,
								ValueState: sap.ui.core.ValueState.None,
								ValueStateText: ""
							},
							reasonForPurchase: {
								Enabled: true,
								ValueState: sap.ui.core.ValueState.None,
								ValueStateText: ""
							},
							comments: {
								Enabled: true,
								ValueState: sap.ui.core.ValueState.None,
								ValueStateText: ""
							}
						}
				},	
				viewTable: {
					selectionViewPaymentPlan: false,
                    selectionViewProposedAnalysis: false,
					selectionAutomaticValidation: false,
					State: {
						selectionViewPaymentPlan: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
						},
						selectionViewProposedAnalysis: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
						},
						selectionAutomaticValidation: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
						},
						selectionButtonValidate: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
						}
					}
				}
			};
		}
	};
});