sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                objectID: "",
                customerID: "",
                opportunityParty: { objectID: "" },
                roleCode: "BUP002",
                functionCode: "ZR",
                functionCodeText: "Responsável Financeiro",
                CPFAndCNPJ: "",
                name: "",
                surname: "",
                mobileDDI: "+55",
                mobile: "",
                email: "",
                phoneDDI: "+55",
                phone: "",
                sex: "",
                maritalStatus: "",
                birth: null,
                RGNumber: "",
                RGIssuer: "",
                UF: "",
                naturalness: "",
                nationality: "",
                motherName: "",
                fatherName: "",
                monthlyIncome: "R$ 0,00",
                profession: "",
                registryOffice: "",
                OwnerID: "",
                company: {
                    companyName: "",
                    office: "",
                    admissionDate: null,
                    telePhone: "",
                    CEP: "",
                    publicPlace: "",
                    number: "",
                    complement: "",
                    neighborhood: "",
                    county: "",
                    UF: "",
                    State: {
                        companyName: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        office: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        admissionDate: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        telePhone: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        CEP: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        publicPlace: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        number: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        complement: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        neighborhood: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        county: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        UF: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						}
                    }
                },
                homeAddress:{
                    CEP: "",
                    publicPlace: "",
                    number: "",
                    complement: "",
                    neighborhood: "",
                    county: "",
                    UF: "",
                    State: {
                        CEP: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        publicPlace: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        number: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        complement: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        neighborhood: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        county: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        UF: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						}
                    }
                },
                State: {
                    CPFAndCNPJ: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    name: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    surname: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    mobileDDI: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    mobile: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    email: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    phoneDDI: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    phone: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    sex: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    maritalStatus: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    birth: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    RGNumber: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    RGIssuer: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    UF: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    naturalness: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    nationality: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    motherName: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    fatherName: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    monthlyIncome: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    profession: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    registryOffice: {
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    }
                }
            };
		}
	};
});