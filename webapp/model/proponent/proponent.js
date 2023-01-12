sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                physicalPerson: {
                    key: Math.random(),
                    objectID: "",
                    customerID: "",
                    opportunityParty: { objectID: "" },
                    roleCode: "BUP002",
                    functionCode: "31",
                    functionCodeText: "Pessoa Física",
                    radioButtonCPF: true,
                    proportion: "100",
					checkBoxMainBuyer: true,
                    CPFAndCNPJ: "",
                    name: "",
                    surname: "",
                    sex: "",
                    birth: null,
                    maritalStatus: "",
                    marriageRegime: "",
                    weddingDate: null,
                    RGNumber: "",
                    RGIssuer: "",
                    UF: "",
                    naturalness: "",
                    nationality: "",
                    motherName: "",
                    fatherName: "",
                    profession: "",
                    notaryRegistryFirm: "",
                    currentHousing: "",
                    housingTime: "",
                    mobileDDI: "+55",
                    mobile: "",
					email: "",
                    phoneDDI: "+55",
					phone: "",
                    OwnerID: "",
                    State: {
                        radioButtonCPF: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        proportion: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
						checkBoxMainBuyer: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
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
                        maritalStatus: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        marriageRegime: {
                            Enabled: false,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        weddingDate: {
                            Enabled: false,
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
                        profession: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        notaryRegistryFirm: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        currentHousing: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        housingTime: {
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
						}
                    },
                    homeAddress: {
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
                    financialInformation: {
                        monthlyIncome: "R$ 0,00",
                        incomeType: "",
                        committedIncome: "R$ 0,00",
                        informalIncome: "R$ 0,00",
                        creditFinancing: "R$ 0,00",
                        subsidyCredit: "R$ 0,00",
                        FGTSCredit: "R$ 0,00",
                        creditOwnResources: "R$ 0,00",
                        numberInstallments: "0",
                        amortization: "",
                        State: {
                            monthlyIncome: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            incomeType: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            committedIncome: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            informalIncome: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            creditFinancing: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            subsidyCredit: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            FGTSCredit: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            creditOwnResources: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            numberInstallments: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            amortization: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                        }
                    },
                    biddersProfessionalData:{
						company: "",
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
                    biddersSpouseData:{
                        objectID: "",
                        customerID: "",
                        opportunityParty: { objectID: "" },
                        roleCode: "BUP002",
                        functionCode: "Z2",
                        functionCodeText:"Cônjuge",
						cpf: "",
						name: "",
                        surname: "",
						proportion: "",
                        mobileDDI: "+55",
						mobile: "",
						email: "",
                        phoneDDI: "+55",
						phone: "",
						sex: "",
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
						notaryRegistryFirm: "",
                        OwnerID: "",
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
                            surname: {
								Enabled: true,
								ValueState: sap.ui.core.ValueState.None,
								ValueStateText: ""
							},
							proportion: {
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
							notaryRegistryFirm: {
								Enabled: true,
								ValueState: sap.ui.core.ValueState.None,
								ValueStateText: ""
							}
						},
                        professionalData: {
                            companyName: "",
                            office: "",
                            admissionDate: null,
                            telePhoneDDI: "+55",
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
                                telePhoneDDI: {
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
                        }
					}
                },
                legalPerson: {
                    key: Math.random(),
                    objectID: "",
                    customerID: "",
                    opportunityParty: { objectID: "" },
                    roleCode: "BUP002",
                    functionCode: "31",
                    functionCodeText: "Pessoa Jurídica",
                    radioButtonCNPJ: false,
                    proportion: "100",
					checkBoxMainBuyer: true,
                    CPFAndCNPJ: "",
                    name: "",
                    mobileDDI: "+55",
                    mobile: "",
					email: "",
                    phoneDDI: "+55",
					phone: "",
                    municipalRegistration: "",
                    stateRegistration: "",
                    notaryRegistryOffice: "",
                    State: {
                        radioButtonCNPJ: {
                            Enabled: true,
                            ValueState: sap.ui.core.ValueState.None,
                            ValueStateText: ""
                        },
                        proportion: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
						checkBoxMainBuyer: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
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
                        municipalRegistration: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        stateRegistration: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                        notaryRegistryOffice: {
							Enabled: true,
							ValueState: sap.ui.core.ValueState.None,
							ValueStateText: ""
						},
                    },
                    companyAddress: {
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
                    financialInformation: {
                        monthlyIncome: "R$ 0,00",
                        incomeType: "",
                        committedIncome: "R$ 0,00",
                        informalIncome: "R$ 0,00",
                        creditFinancing: "R$ 0,00",
                        subsidyCredit: "R$ 0,00",
                        FGTSCredit: "R$ 0,00",
                        creditOwnResources: "R$ 0,00",
                        numberInstallments: "0",
                        amortization: "",
                        State: {
                            monthlyIncome: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            incomeType: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            committedIncome: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            informalIncome: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            creditFinancing: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            subsidyCredit: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            FGTSCredit: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            creditOwnResources: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            numberInstallments: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                            amortization: {
                                Enabled: true,
                                ValueState: sap.ui.core.ValueState.None,
                                ValueStateText: ""
                            },
                        }
                    }
                }
            }
        }
	}
});