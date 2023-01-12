sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                functionCode: "Z1",
                functionCodeText: "Fiador",
                CPFAndCNPJ: "",
                name: "",
                mobile: "",
                email: "",
                phone: "",
                sex: "",
                maritalStatus: "",
                birth: "",
                RG: "",
                RGIssuer: "",
                UF: "",
                naturalness: "",
                nationality: "",
                motherName: "",
                fatherName: "",
                monthlyIncome: "",
                profession: "",
                registryOffice: "",
                company: {
                    companyName: "",
                    office: "",
                    admissionDate: "",
                    telePhone: "",
                    CEP: "",
                    publicPlace: "",
                    number: "",
                    complement: "",
                    neighborhood: "",
                    county: "",
                    UF: "",
                    State: {
                        company: {
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
                biddersSpouseData: {
                    functionCode: "Z8",
                    functionCodeText: "Cônjuge Fiador",
                    cpf: "",
                    name: "",
                    proportion: "",
                    mobile: "",
                    email: "",
                    telePhone: "",
                    sex: "",
                    birth: "",
                    RG: "",
                    RGIssuer: "",
                    UF: "",
                    naturalness:"",
                    nationality: "",
                    motherName: "",
                    fatherName: "",
                    monthlyIncome: "",
                    profession: "",
                    registryOffice: "",
                    professionalDataBidderSpouse: {
                        companyName: "",
                        office: "",
                        admissionDate: "",
                        telePhone: "",
                        CEP: "",
                        publicPlace: "",
                        number: "",
                        complement: "",
                        neighborhood: "",
                        county: "",
                        UF: "",
                        State: {
                            company: {
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
                    State: {
                        cpf: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        name: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        proportion: {
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
                        telePhone: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        sex: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        birth: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        RG: {
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
                    RG: {
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