sap.ui.define([
	"../services/Service",
	"sap/ui/core/UIComponent",
	"sap/m/library",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/blocks",
    "sap/ui/model/json/JSONModel",
    'sap/ui/core/Fragment',
    "sap/m/Text",
    "sap/ui/Device",
    "../model/formatter"
], function (
    Service, 
    UIComponent, 
    mobileLibrary, 
    Filter, 
    FilterOperator,
    Blocks,
    JSONModel,
    Fragment,
    Text,
    Device,
    Formatter
) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	return Service.extend("com.itsgroup.brz.enterprises.controller.BaseController", {
        /**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},
		/**
		 * Convenience method to define the busy State
		 * @public
		 * @param {Boolean} bBusy Busy State 
		 */
		setAppBusy: function(bBusy) {
			this.getModel("appView").setProperty("/busy", bBusy);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

        _formatedDate: function(sDate){
            if(sDate != null){
                let newDeliveryDate = new Date(parseInt(sDate.substring(6,19)));
                return sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "dd/MM/yyyy",
                    UTC: true
                }).format(newDeliveryDate);
            }
            else return null;

        },

        _clearFormatting: function(sValue){
            return sValue.replaceAll(".", "")
                         .replaceAll(" ", "")
                         .replace("-", "")
                         .replace(",", "")
                         .replace("/", "")
                         .replace("(", " ")
                         .replace(")", "");
        },

        _clearFormattingValue: function(sValue){
            return sValue.replaceAll(".", "")
                         .replaceAll(" ", "")
                         .replace(",", "")
                         .replace("R$", "");
        },

        _formatTheValueInRealWithoutDot: function(sValue, sNumberOfDigits){
            if(sValue != "" && sValue != undefined){
                let oPositionSValue = sValue.indexOf(".");

                if(oPositionSValue != -1) return Number(sValue.replace(".", "").substring(0, oPositionSValue + sNumberOfDigits));
                else return Number(sValue);
            }
        },

		_formateValue: function(oValueInit, oId) {
            let position = oValueInit.indexOf("-"),
                oCifrao  = "";

            if(position === -1){
                oCifrao = "R$ ";
            }else {
                oCifrao = "R$ -";
            }

            let oValue = Number(oValueInit.replace("R$ ", "").replace("-","").replaceAll(".","").replace(",","").replaceAll("_","")).toString();
            let one, two, three, oFor;

            switch (oValue.length) {
                case 2:
                    one = 0;
                    two = oValue.substring(0, 2);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one},${two}`);
                    }else {
                        return `${oCifrao}${one},${two}`
                    }
                    break
                case 3:
                    one = oValue.substring(0, 1);
                    two = oValue.substring(1, 3);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one},${two}`);
                    }else {
                        return `${oCifrao}${one},${two}`
                    }
                    break
                case 4:
                    one = oValue.substring(0, 2);
                    two = oValue.substring(2, 4);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one},${two}`);
                    }else {
                        return `${oCifrao}${one},${two}`
                    }
                    break
                case 5:
                    one = oValue.substring(0, 3);
                    two = oValue.substring(3, 5);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one},${two}`);
                    }else {
                        return `${oCifrao}${one},${two}`
                    }
                    break
                case 6:
                    one   = oValue.substring(0, 1);
                    two   = oValue.substring(1, 4);
                    three = oValue.substring(4, 6);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one}.${two},${three}`);
                    }else {
                        return `${oCifrao}${one}.${two},${three}`
                    }
                    break
                case 7:
                    one   = oValue.substring(0, 2);
                    two   = oValue.substring(2, 5);
                    three = oValue.substring(5, 7);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one}.${two},${three}`);
                    }else {
                        return `${oCifrao}${one}.${two},${three}`
                    }
                    break
                case 8:
                    one   = oValue.substring(0, 3);
                    two   = oValue.substring(3, 6);
                    three = oValue.substring(6, 8);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one}.${two},${three}`);
                    }else {
                        return `${oCifrao}${one}.${two},${three}`
                    }
                    break
                case 9:
                    one   = oValue.substring(0, 1);
                    two   = oValue.substring(1, 4);
                    three = oValue.substring(4, 7);
                    oFor  = oValue.substring(7, 9);
                    if(oId){
                         this.byId(oId).setValue(`${oCifrao}${one}.${two}.${three},${oFor}`);
                    }else {
                        return `${oCifrao}${one}.${two}.${three},${oFor}`
                    }
                    break;
                case 10:
                    one   = oValue.substring(0, 2);
                    two   = oValue.substring(2, 5);
                    three = oValue.substring(5, 8);
                    oFor  = oValue.substring(8, 10);
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one}.${two}.${three},${oFor}`);
                    }else {
                        return `${oCifrao}${one}.${two}.${three},${oFor}`
                    }
                    break
                default:
                    one = "0";
                    two = "00";
                    if(oId){
                        this.byId(oId).setValue(`${oCifrao}${one},${two}`);
                    }else {
                        return `${oCifrao}${one},${two}`
                    }
                    break
            }
        },

        _formatedPercentageParms: function(sValue){
            if(sValue != "" && sValue != undefined){
                let position = sValue.indexOf("."),
                    oValue   = sValue.substring(0, position);

                if(position === 1){
                    return {
                        percentage: Number(oValue),
                        percentageCalculo: Number(`0.0${oValue}`)
                    }
                }else
                if(position > 1){
                    return {
                        percentage: Number(oValue),
                        percentageCalculo: Number(`0.${oValue}`)
                    }
                }else {
                    return {
                        percentage: Number(sValue),
                        percentageCalculo: Number(`0.0${sValue}`)
                    }
                }

            }else{
                /*
                title: "Parâmetros obrigatórios!",
                text: "Parâmetros não encontrados na simulação. Favor revisar!";
                */
            }
        },

        _creatingFiltersincomeAgreementUnits: function(sValue){
            return {
                    "AteSBPE": new Filter("SBPEValueAte", FilterOperator.LE, sValue),
                    "AteCVA": new Filter("CVAValueAte", FilterOperator.LE, sValue)
                };
        },

        _creatingFilters: function() {
            return{
                //"excNeg":  [new Filter("status", FilterOperator.EQ, "50" )],
				"available": [new Filter("status", FilterOperator.EQ, "100" ),
                               new Filter("status", FilterOperator.EQ, "444"),
                               new Filter("status", FilterOperator.EQ, "445")],
                //"availableRent":  [new Filter("status", FilterOperator.EQ, "101" )],
                //"reservedSales": [new Filter("status", FilterOperator.EQ, "200")],
                "reserved": [new Filter("status", FilterOperator.EQ, "200"),
                             new Filter("status", FilterOperator.EQ, "250")],
                //"reservedRent": [new Filter("status", FilterOperator.EQ, "201")],
                //"blocked": [new Filter("status", FilterOperator.EQ, "250")],
                //"notAvailable": [new Filter("status", FilterOperator.EQ, "251")],
                //"technicalReserve": [new Filter("status", FilterOperator.EQ, "300")],
				"reservedCompany": [new Filter("status", FilterOperator.EQ, "400"),
                                    new Filter("status", FilterOperator.EQ, "300")],
                "signature": [new Filter("status", FilterOperator.EQ, "441"),
                              new Filter("status", FilterOperator.EQ, "443")],
                "signedContract": [new Filter("status", FilterOperator.EQ, "442")],
                //"signingContract": [new Filter("status", FilterOperator.EQ, "443")],
                //"proposalCanceled": [new Filter("status", FilterOperator.EQ, "444")],
                //"distracted": [new Filter("status", FilterOperator.EQ, "445")],
                //"donated": [new Filter("status", FilterOperator.EQ, "500")],
                //"legallyBlocked": [new Filter("status", FilterOperator.EQ, "600")],
                "exchange":  [new Filter("status", FilterOperator.EQ, "700" ),
                              new Filter("status", FilterOperator.EQ, "50" )],
                "inNegociation":  [ new Filter("status", FilterOperator.EQ, "800"),
                                    new Filter("status", FilterOperator.EQ, "801"),
                                    new Filter("status", FilterOperator.EQ, "802")],
                //"contracCorrection":  [ new Filter("status", FilterOperator.EQ, "801" )],
                //"inProposal":  [new Filter("status", FilterOperator.EQ, "802") ],
                "sold": [new Filter("status", FilterOperator.EQ, "900" )],
                //"rented": [new Filter("status", FilterOperator.EQ, "901" )],
                "countAll":  [
                            new Filter({
                                path: 'status',
                                operator: FilterOperator.EQ,
                                value1: "50",
                                and: true
                            }),
							new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "100",
                                and: true
                            }),
                            /*new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "101",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "201",
                                and: true
                            }),*/
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "250",
                                and: true
                            }),
                            /*new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "251",
                                and: true
                            }),*/
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "300",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "400",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "441",
                                and: true
                            }),
							new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "442",
                                and: true
                            }),
							new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "443",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "444",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "445",
                                and: true
                            }),
                            /*new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "500",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "600",
                                and: true
                            }),*/
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "700",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "800",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "801",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "802",
                                and: true
                            }),
                            new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "900",
                                and: true
                            }),
                            /*new Filter({
								path: 'status',
								operator: FilterOperator.EQ,
								value1: "901",
                                and: true
                            })*/
                        ] 
            };
        },

        _searchSalesPriceLists: async function(sOrgID){
            let oDate = new Date(),
                oPriceList,
                oPriceList01,
                oPriceList02,
                oPriceListExist   = false,
                oPriceListExist01 = false,
                oPriceListExist02 = false;

            let oDateCurrent = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}T00:00:00`;            

            let oPriceLists = await this.callService(`InternalPriceDiscountListCollection?$expand=InternalPriceDiscountListItems&$format=json&$select=ObjectID,Description,ValidityStartDate,ValidityEndDate,ReleaseStatusCode,DistributionChannel,InternalPriceDiscountListItems/ObjectID,InternalPriceDiscountListItems/Amount,InternalPriceDiscountListItems/ProductID&$filter=SalesOrgID eq '${sOrgID}' and ValidityEndDate ge datetime'${oDateCurrent}'`).method('GET');

            if(oPriceLists.length != 0){
                oDate.setHours(0, 0, 0, 0);

                //TABELA DE AVALIAÇÃO CEF
                oPriceList = oPriceLists.find(sList => {
                    if(sList.DistributionChannel === "" &&
                       sList.ReleaseStatusCode   === "3") return sList;
                });

                if(oPriceList === undefined) oPriceListExist = true;
                
                //-------------------------------------------------------------------------------------------//
                //TABELA DE VENDA - SBPE
                oPriceList01 = oPriceLists.find(sList01 => {
                    if(sList01.DistributionChannel === "01" && 
                       sList01.ReleaseStatusCode   === "3" ) return sList01;
                });

                if(oPriceList01 === undefined) oPriceListExist01 = true;

                //-------------------------------------------------------------------------------------------//
                //TABELA DE VENDA - CVA
                oPriceList02 = oPriceLists.find(sList02 => {
                    if(sList02.DistributionChannel === "02" && 
                       sList02.ReleaseStatusCode   === "3"  ) return sList02;
                });

                if(oPriceList02 === undefined) oPriceListExist02 = true;

                if(oPriceListExist === false){
                    if(oPriceListExist01 != false &&  oPriceListExist02 != false){
                        let oTitle = "Tabelas de vendas não cadastradas",
                            oText  = "Tabelas SBPE e CVA não encontradas. Favor revisar!";

                        this.toPageNotFound(oTitle, oText);
                    }
                }else{
                    let oTitle = "Tabelas de vendas não cadastradas",
                        oText  = "Tabela de avaliação não encontrada. Favor revisar!";

                    this.toPageNotFound(oTitle, oText);
                }
                
            }

            return { oPriceList, oPriceList01, oPriceList02 };
        },

        toPageNotFound: function(sTitle, sText){
            this.getModel("notFoundView").setData(
                {
                    title: sTitle,
                    text: sText,
                    description: ""
                }
            );
            this.getModel("notFoundView").refresh(true);

            this.getRouter().navTo("notFound");

            this.setAppBusy(false);
        },

        //------------------------------------------------------------------------------------------------//
        //------------------------------------- Main Controller ------------------------------------------//
        //------------------------------------------------------------------------------------------------//

        _filterTheData: function(sModelPartnerAttachment, sField, sValue){
            let oImages = [], oWidth, oHeight;

            if(Device.system.phone){
                oWidth  = "320px";
                oHeight = "280px";
            }else if(Device.system.tablet){
                oWidth  = "720px";
                oHeight = "480px";
            }else{
                //960 x 720 pixels
                oWidth  = "960px";
                oHeight = "720px";
            }

            if(sModelPartnerAttachment != undefined){
                sModelPartnerAttachment.map(sItem => {
                    if(sItem[sField]  === sValue) {
                        const byteCharacters = atob(sItem.Binary);
                        const byteNumbers    = new Array(byteCharacters.length);

                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }

                        const byteArray = new Uint8Array(byteNumbers);
                        let blob        = new Blob([byteArray], {type: "image/png"});
                        let _imageUrl   = URL.createObjectURL(blob);

                        oImages.push({ name: sItem.Name, src: _imageUrl, width: oWidth, height: oHeight });
                    }
                });
            }
        
            return oImages
        },

        //-------------------------------- Busca Roles dos usuário ---------------------------------------//

        _searchUserBusinessRoles: async function(sEmail){
            let oUserAgent = await this.callServiceFormatedJSON(`BusinessUserCollection?$filter=EmailURI eq '${sEmail}' and UserLockedIndicator eq false&$format=json`).method('GET');

            let oObject = {
                RoleID: "",
                EmployeeID: oUserAgent.EmployeeID != undefined ? oUserAgent.EmployeeID : "",
                BusinessPartnerID: oUserAgent.BusinessPartnerID != undefined ? oUserAgent.BusinessPartnerID : "",
                EnabledBRE: false,
                VisibleSave: false,
                VisibleReserved: false
            };

            if(oUserAgent != undefined){
                let oUserBusinessRoles = await this.callService(`BusinessUserBusinessRoleAssignmentCollection?$filter=EmployeeID eq '${oUserAgent.EmployeeID}'&$format=json`).method('GET');
                if(oUserBusinessRoles.length != 0){
                    //permitir a edição do corretor e permitir gravar nova oportunidade
                    //BusinessRoleID": "EST_COM_SUP",
                    let oUserRoleESTCOMSUP = oUserBusinessRoles.find(sRole => {
                        if(sRole.BusinessRoleID === "EST_COM_SUP") return sRole;
                    });

                    if(oUserRoleESTCOMSUP != undefined){
                        oObject.RoleID          = "EST_COM_SUP";
                        oObject.EnabledBRE      = true;
                        oObject.VisibleSave     = true;
                        oObject.VisibleReserved = true;
                    }else{
                        // bloquear o campo de edição do corretor e permitir gravar nova oportunidade
                        //BusinessRoleID": "PARCEIRO_IMOB",
                        let oUserRolePARCEIROIMOB = oUserBusinessRoles.find(sRole => {
                            if(sRole.BusinessRoleID === "PARCEIRO_IMOB") return sRole;
                        });

                        if(oUserRolePARCEIROIMOB != undefined){
                            oObject.RoleID          = "PARCEIRO_IMOB";
                            oObject.EnabledBRE      = false;
                            oObject.VisibleSave     = true;
                            oObject.VisibleReserved = false;
                        }else{
                            //bloquear o campo de edição do corretor e bloquear gravar nova oportunidade
                            //BusinessRoleID": "PARCEIRO_CORRETOR",
                            let oUserRolePARCEIROCORRETOR = oUserBusinessRoles.find(sRole => {
                                if(sRole.BusinessRoleID === "PARCEIRO_CORRETOR") return sRole;
                            });

                            if(oUserRolePARCEIROCORRETOR != undefined){
                                oObject.RoleID          = "PARCEIRO_CORRETOR";
                                oObject.EnabledBRE      = false;
                                oObject.VisibleSave     = false;
                                oObject.VisibleReserved = false;
                            }
                        }
                    }
                }
            }

            return oObject;
        },


        //------------------------------------------------------------------------------------------------//
        //------------------------------------- Availability Map -----------------------------------------//
        //------------------------------------------------------------------------------------------------//

        _initAvailabilityMap: async function(oOrgID){
            let oGridList          = this.byId("gridListBlock"),
                iOriginalBusyDelay = oGridList.getBusyIndicatorDelay();

            this._mFilters = this._creatingFilters();

            let gridListProperties = new JSONModel({
                gridLisBusyDelay: 0,
                exchange: 0,
                available: 0,
                reserved: 0,
                reservedCompany: 0,
                signature: 0,
                signedContract: 0,
                inNegociation: 0,
                sold: 0,
                countAll: 0,
                incomeAgreementUnits: 0
            });

            this.setModel(gridListProperties ,"gridListProperty");

            this.getModel("blocks").setData(Blocks.initSelectionModel());
            this.getModel("blocks").refresh(true);

            oGridList.attachEventOnce("updateFinished", function(oItem){
				// Restore original busy indicator delay for priceList table
				gridListProperties.setProperty("/gridLisBusyDelay", iOriginalBusyDelay);
			});
            
            await this._fetchBlocks(oOrgID || "");

            if(Device.system.phone || Device.system.tablet){
                this.byId("containerGridDinamicList").setVisible(false);
                this.byId("gridListBlock").setVisible(true);
            }
            
            
            if(this.byId("containerGridDinamicList").getVisible()){
                let oModelBlocks = this.getModel("blocks").getData();
                    
                //coloca verdadeiro para cada bloco em linha e coluna
                this._setVisibleTrueLineColumn(oModelBlocks.numberLine, oModelBlocks.numberColumn);
                //this._setVisibleTrueLineColumn(5, 5);

                for(let oItem of oModelBlocks.items){
                    this._fillGridList(oItem);
                }
            }
        },

        _pressFragmentMenu: async function(oEvent, oVisibleReserved){
            let oButton     = this.byId(oEvent.getParameter("id")),
                oOrgID      = oEvent.getSource().getDependents()[0].getProperty("text"),
                oObjectID   = oEvent.getSource().getDependents()[1].getProperty("text"),
                oProductID  = oEvent.getSource().getDependents()[2].getProperty("text"),
                oTableValue = oEvent.getSource().getDependents()[3].getProperty("text"),
                oSBPEValue  = oEvent.getSource().getDependents()[4].getProperty("text"),
                oCVAValue   = oEvent.getSource().getDependents()[5].getProperty("text");

            if(this._oMenuFragment){
                this._oMenuFragment.destroy();
            }
            
            await Fragment.load({
                id: this.getView().getId(),
                name: "com.itsgroup.brz.enterprises.view.fragments.availabilityMap.Menu",
                controller: this
            }).then(function(sMenu) {
                let oMenu                  = sMenu.mAggregations.items[0],
                    oIDLocal               = "container-enterprises---availabilityMap--textValue",
                    oIDAvailabilityMap     = "application-Enterprises-Display-component---availabilityMap--textValue",
                    oIDLocalFinishProposal = "container-enterprises---finishProposal--textValue",
                    oIDFinishProposal      = "application-Enterprises-Display-component---finishProposal--textValue";

                for(let item of oMenu.mAggregations.items){
                    if(item.getProperty("icon") === "sap-icon://simulate"){
                        item.setProperty("text", this.getResourceBundle().getText("availabilityMapSimulate"));
                        item.addDependent(new Text({ id: "simulateOrg",     text: oOrgID }));
                        item.addDependent(new Text({ id: "simuleteObject",  text: oObjectID }));
                        item.addDependent(new Text({ id: "simuleteProduct", text: oProductID }));
                    }else if(item.getProperty("icon") === "sap-icon://add-activity-2") {
                        item.setProperty("text", this.getResourceBundle().getText("availabilityMapReserved"));
                        item.setProperty("visible", oVisibleReserved);
                        item.addDependent(new Text({ id: "reservedOrg",     text: oOrgID }));
                        item.addDependent(new Text({ id: "reservedObject",  text: oObjectID }));
                        item.addDependent(new Text({ id: "reservedProduct", text: oProductID }));
                    }else {
                        let oModel = this.getModel("blocks").getData();

                        if(oModel.radioButtonTableValue){
                            if(item.sId === oIDLocal           ||
                               item.sId === oIDAvailabilityMap ||
                               item.sId === oIDFinishProposal  ||
                               item.sId === oIDLocalFinishProposal)
                            {
                                item.setProperty("text", this.getResourceBundle().getText("finishProposalTableValue"));
                            }else{
                                item.setProperty("text", oTableValue);
                            }
                        }else
                        if(oModel.radioButtonSBPEValue){
                            if(item.sId === oIDLocal           ||
                               item.sId === oIDAvailabilityMap ||
                               item.sId === oIDFinishProposal  ||
                               item.sId === oIDLocalFinishProposal)
                            {
                                item.setProperty("text", this.getResourceBundle().getText("finishProposalSBPEValue"));
                            }else{
                                item.setProperty("text", oSBPEValue);
                            }
                        }else{
                            if(item.sId === oIDLocal           ||
                               item.sId === oIDAvailabilityMap ||
                               item.sId === oIDFinishProposal  ||
                               item.sId === oIDLocalFinishProposal)
                            {
                                item.setProperty("text", this.getResourceBundle().getText("finishProposalCVAValue"));
                            }else{
                                item.setProperty("text", oCVAValue);
                            }
                        }                            
                    }
                }

                oMenu.openBy(oButton);
                this._oMenuFragment = oMenu;
            }.bind(this));
        },

        _fetchBlocks: async function(sOrgID){
            this.setAppBusy(true);

            let oBlocksList  = await this.callServiceZMapFormatedJSON(`ZMapaDisponibilidadeRootCollection?$filter=ZIDEMPREENDIMENTO eq '${sOrgID}'&$expand=ZMapaDisponibilidadeMatriz&$format=json`).method('GET');

            let oDataParms   = await this.callServiceZFormatedJSON(`BusinessPartnerCollection?$filter=IDEmpreendimento_KUT eq '${sOrgID}'&$format=json`).method('GET');

            let oItemPartner = await this.callServiceFormatedJSON(`PartnerCollection?$filter=ClassificacaoParceiro_KUT eq '6' and Empreendimentovisvel_KUT eq true and  IDEmpreendimento_KUT eq '${sOrgID}'&$expand=PartnerAttachment&$format=json`).method('GET');

            if(oItemPartner === undefined){
                let oTitle = "Empreendimento não Cadastrado!",
                    oText  = "Empreendimento não encontrado. Favor revisar!";

                this.toPageNotFound(oTitle, oText);
            }else{
                let oItemIcon        = this._filterTheData(oItemPartner.PartnerAttachment, "TypeCode", "Z52");
                let oImageEnterprise = this._filterTheData(oItemPartner.PartnerAttachment, "TypeCode", "Z54");

                if(oBlocksList.ZMapaDisponibilidadeMatriz.length != 0 && oImageEnterprise != 0){
                    this.getModel("blocks").getData().numberLine      = Number(oBlocksList.ZMAXCOLUNA);
                    this.getModel("blocks").getData().numberColumn    = Number(oBlocksList.ZMAXLINHA);
                    this.getModel("blocks").getData().imagesrc        = oImageEnterprise[0].src;
                    this.getModel("blocks").refresh(true);

                    this.byId("containerGridDinamicList").setVisible(true);
                    this.byId("gridListBlock").setVisible(false);
                }else{
                    if(oBlocksList.ZMapaDisponibilidadeMatriz.length === 0){
                        let oTitle = "Matriz não cadastrada!",
                            oText  = "Matriz de blocos não cadastrada. Favor revisar!";
        
                        this.toPageNotFound(oTitle, oText);
                    }

                    this.byId("containerGridDinamicList").setVisible(false);
                    this.byId("gridListBlock").setVisible(true);
                }

                let oPercResourcesCEFDe,
                    oPercResourcesCEFAte;

                if(oDataParms.PercentualrecursosCEFDe_KUT != '100'){
                    if(Number(oDataParms.PercentualrecursosCEFDe_KUT) < 10) oPercResourcesCEFDe = Number(`0.${oDataParms.PercentualrecursosCEFDe_KUT.padStart(2, '0')}`);
                        else oPercResourcesCEFDe = Number(`0.${oDataParms.PercentualrecursosCEFDe_KUT}`);
                }
                else oPercResourcesCEFDe = Number(oDataParms.PercentualrecursosCEFDe_KUT);

                if(oDataParms.PercentualrecursosCEFAte_KUT != "100"){
                        if(Number(oDataParms.PercentualrecursosCEFAte_KUT) < 10) oPercResourcesCEFAte = Number(`0.${oDataParms.PercentualrecursosCEFAte_KUT.padStart(2, '0')}`);
                        else oPercResourcesCEFAte = Number(`0.${oDataParms.PercentualrecursosCEFAte_KUT}`);
                }
                else oPercResourcesCEFAte = Number(oDataParms.PercentualrecursosCEFAte_KUT);
                
                //busca as tabelas de preços
                let { oPriceList, oPriceList01, oPriceList02 } = await this._searchSalesPriceLists(sOrgID);

                //if(oPriceLists.length != 0){
                let oPriceListItem,
                    oPriceListItem01,
                    oPriceListItem02;

                //TABELA DE AVALIAÇÃO CEF
                if(oPriceList.InternalPriceDiscountListItems.length === 0){
                    this.getModel("blocks").getData().State.radioButtonTableValue.Visible = false;
                }
                        
                //-------------------------------------------------------------------------------------------//
                //TABELA DE VENDA - SBPE
                if(oPriceList01 != undefined){
                    if(oPriceList01.InternalPriceDiscountListItems.length === 0){
                        this.getModel("blocks").getData().State.radioButtonSBPEValue.Visible = false;
                    }
                }else this.getModel("blocks").getData().State.radioButtonSBPEValue.Visible = false;
                //-------------------------------------------------------------------------------------------//
                //TABELA DE VENDA - CVA
                if(oPriceList02 != undefined){
                    if(oPriceList02.InternalPriceDiscountListItems.length === 0){
                        this.getModel("blocks").getData().State.radioButtonCVAValue.Visible = false;
                    }
                }else this.getModel("blocks").getData().State.radioButtonCVAValue.Visible = false;
                    
                this.getModel("blocks").refresh(true);

                let oldOneBlock;

                if(oItemPartner != undefined){
                    this.getModel("blocks").getData().nameEnterprise = oItemPartner.Name;
                    let blockNumber,
                        aQntdUnit;

                    let oDataProducts = await this.callService(`ProductCollection?$filter=startswith(ProductID, 'E${String(sOrgID).padStart(4, "0")}')&$orderby=ProductID asc&$format=json`).method('GET');

                    if(oDataProducts.length != 0){
                            
                        for(let oProduct of oDataProducts){

                            if(oProduct != undefined){
                                //variaveis
                                let oValueSBPEDe  = 0,
                                    oValueSBPEAte = 0,
                                    oValueCVADe   = 0,
                                    oValueCVAAte  = 0,
                                    oNetValueSBPE = 0,
                                    oNetValueCVA  = 0;

                                //TABELA DE AVALIAÇÃO CEF
                                if(oPriceList != undefined){
                                    oPriceListItem = oPriceList.InternalPriceDiscountListItems.find(sItem => {
                                        if(sItem.ProductID === oProduct.ProductID) return sItem;
                                    });
                                }

                                //TABELA DE VENDA - SBPE
                                if(oPriceList01 != undefined){
                                    oPriceListItem01 = oPriceList01.InternalPriceDiscountListItems.find(sItem => {
                                        if(sItem.ProductID === oProduct.ProductID) return sItem;
                                    });

                                    if(oPriceListItem01 != undefined){
                                        oNetValueSBPE = this._formatTheValueInRealWithoutDot(oPriceListItem01.Amount, 2);

                                        //Valores para filtro de unidade de acordo com o valor da rendas dos proponentes
                                        oValueSBPEDe  = oNetValueSBPE * oPercResourcesCEFDe;

                                        let oPositionValueSBPEDe = `${oValueSBPEDe}`.indexOf(".");
                                        if(oPositionValueSBPEDe != -1) oValueSBPEDe = Number(`${oValueSBPEDe}`.substring(0, oPositionValueSBPEDe));

                                        oValueSBPEAte = oNetValueSBPE * oPercResourcesCEFAte;

                                        let oPositionValueSBPEAte = `${oValueSBPEAte}`.indexOf(".");
                                        if(oPositionValueSBPEAte != -1) oValueSBPEAte = Number(`${oValueSBPEAte}`.substring(0, oPositionValueSBPEAte));
                                    }
                                }

                                //TABELA DE VENDA - CVA
                                if(oPriceList02 != undefined){
                                    oPriceListItem02 = oPriceList02.InternalPriceDiscountListItems.find(sItem => {
                                        if(sItem.ProductID === oProduct.ProductID) return sItem;
                                    });

                                    if(oPriceListItem02 != undefined){
                                        oNetValueCVA = this._formatTheValueInRealWithoutDot(oPriceListItem02.Amount, 2);

                                        //Valores para filtro de unidade de acordo com o valor da rendas dos proponentes
                                        //Valor De
                                        oValueCVADe  = oNetValueCVA * oPercResourcesCEFDe;

                                        let oPositionValueCVADe = `${oValueCVADe}`.indexOf(".");
                                        if(oPositionValueCVADe != -1) oValueCVADe = Number(`${oValueCVADe}`.substring(0, oPositionValueCVADe));

                                        //valor Até
                                        oValueCVAAte = oNetValueCVA * oPercResourcesCEFAte;

                                        let oPositionValueCVAAte = `${oValueCVAAte}`.indexOf(".");
                                        if(oPositionValueCVAAte != -1) oValueCVAAte = Number(`${oValueCVAAte}`.substring(0, oPositionValueCVAAte));
                                    }
                                }

                                if(oPriceListItem != undefined){
                                    let oBlock = undefined;

                                    if(oBlocksList != undefined){
                                        oBlock = oBlocksList.ZMapaDisponibilidadeMatriz.find(sItem => {
                                            if(sItem.ZBLOCO === oProduct.Bloco_KUT.padStart(2, '0')) return sItem;
                                        });
                                    }

                                    if(oBlock != undefined){
                                        if(oProduct.Bloco_KUT != "" && oBlock.ZVISIVEL != false){
                                            let oBlockVisible  = true,
                                                oBlockEnabled  = true,
                                                oBlockPosition = 0;

                                            if(oBlock != undefined){
                                                oBlockVisible  = oBlock.ZVISIVEL;
                                                oBlockEnabled  = oBlock.ZSTATUS;
                                                oBlockPosition = Number(oBlock.ZPOSICAO);
                                            }
                                                
                                            if(!oldOneBlock){
                                                var oObject = {   
                                                    blockNumber: oProduct.Bloco_KUT,
                                                    blockName: "",
                                                    blockNameText: oProduct.Bloco_KUTText,
                                                    blockVisible: oBlockVisible,
                                                    blockEnabled: oBlockEnabled,
                                                    blockPosition: oBlockPosition,
                                                    units: []
                                                };

                                                oldOneBlock = oProduct.Bloco_KUT;

                                            }else if(oldOneBlock != oProduct.Bloco_KUT){
                                                oObject.blockName = `${oObject.blockNumber} (${oObject.units.length})`;
                                                this.getModel("blocks").getData().items.push(oObject);

                                                var oObject = {   
                                                    blockNumber: oProduct.Bloco_KUT,
                                                    blockName: "",
                                                    blockNameText: oProduct.Bloco_KUTText,
                                                    blockVisible: oBlockVisible,
                                                    blockEnabled: oBlockEnabled,
                                                    blockPosition: oBlockPosition,
                                                    units: []
                                                };

                                                oldOneBlock = oProduct.Bloco_KUT;
                                            }
                            
                                            let oType,
                                                oEnabled;

                                            if(oProduct.ZSalesStat_KUT === "50" || //Negociado Como Permuta
                                            oProduct.ZSalesStat_KUT === "700" ) //Permuta
                                            {
                                                oType    = "Unstyled";
                                                oEnabled = false;

                                            }else
                                            if(oProduct.ZSalesStat_KUT === "100"|| //Disponível para Venda
                                            oProduct.ZSalesStat_KUT === "444"|| //Proposta Cancelada
                                            oProduct.ZSalesStat_KUT === "445" ) //Distratada
                                            {
                                                oType    = "Accept";
                                                oEnabled = oBlockEnabled;//true
                                            }else
                                            if(oProduct.ZSalesStat_KUT === "200"|| //Reservado para Venda
                                            oProduct.ZSalesStat_KUT === "250" ) //Bloqueado
                                            {
                                                oType    = "Default";
                                                oEnabled = false;
                                            }else
                                            if(oProduct.ZSalesStat_KUT === "300"|| //Reserva Técnica/Caucionado
                                            oProduct.ZSalesStat_KUT === "400" ) //Reservado pela Empresa
                                            {
                                                oType    = "Default";
                                                oEnabled = false;
                                            }else
                                            if(oProduct.ZSalesStat_KUT === "441"|| //Em Assinatura
                                            oProduct.ZSalesStat_KUT === "443" ) //Contrato em assinatura
                                            {
                                                oType    = "Attention";
                                                oEnabled = oBlockEnabled;//true
                                            }else
                                            if(oProduct.ZSalesStat_KUT === "442") //Contrato Assinado
                                            {
                                                oType    = "Critical";
                                                oEnabled = false;
                                            }else
                                            if(oProduct.ZSalesStat_KUT === "800"|| //Em negociação
                                            oProduct.ZSalesStat_KUT === "801"|| //Contrato em Correção
                                            oProduct.ZSalesStat_KUT === "802" ) //Em Proposta
                                            {
                                                oType    = "Attention";
                                                oEnabled = oBlockEnabled;//true
                                            }else
                                            if(oProduct.ZSalesStat_KUT === "900") //Vendido
                                            {
                                                oType    = "Critical";
                                                oEnabled = false;
                                            }
                                                
                                            let oIcon = {
                                                icon: "",
                                                Visible: false
                                            }

                                            if(oProduct.Caracteristica_KUT === "4" || 
                                            oProduct.Caracteristica_KUT === "6")
                                            {
                                                if(oItemIcon.length != 0){
                                                    oIcon.icon    = oItemIcon[0].src;
                                                    oIcon.Visible = true;
                                                }
                                            }

                                            oObject.units.push({
                                                orgID: sOrgID,
                                                objectID: oProduct.ObjectID,
                                                productID: oProduct.ProductID,
                                                unitNumber: oProduct.Unidade_KUT,
                                                characteristic: oProduct.Caracteristica_KUT,
                                                characteristicText: oProduct.Caracteristica_KUTText,
                                                status: oProduct.ZSalesStat_KUT,
                                                statusText: oProduct.ZSalesStat_KUTText,
                                                SBPEValue: this._formateValue(`${oNetValueSBPE}`, undefined),
                                                SBPEValueDe: oValueSBPEDe,
                                                SBPEValueAte: oValueSBPEAte,
                                                CVAValue: this._formateValue(`${oNetValueCVA}`, undefined),
                                                CVAValueDe: oValueCVADe,
                                                CVAValueAte: oValueCVAAte,
                                                unitValue: this._formateValue(oPriceListItem.Amount.replace(".", "").substring(0, 8), ""),
                                                icon: oIcon.icon,
                                                iconVisible: oIcon.Visible, 
                                                type: oType,
                                                enabled: oEnabled
                                            });

                                            blockNumber = oProduct.Bloco_KUT;
                                            aQntdUnit   = oObject.units.length;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    oObject.blockName = `${blockNumber} (${aQntdUnit})`;
                    this.getModel("blocks").getData().items.push(oObject);
                    this.getModel("blocks").refresh(true);
                }
                
                this.setAppBusy(false);
            }
        },

        _reservedUnit: async function(sObjectID){
            //ProductCollection
            //ZSalesStat_KUT com valor 400
            //product/update
            let oToken = await this._getToken("leadpf05@getnada.com").method('GET'),
                bValid = true;

            let oProduct = { 
                //ProductCollection: { 
                    Product: {
                        ObjectID: sObjectID,
                        ZSalesStat_KUT: "400"
                    }
                //} 
            };

            let oResponse = await this.callServiceSCPIPATCH(`/product/update`, oProduct, oToken);

            if(oResponse.status >= 200 && oResponse.status <= 300) bValid = true;
            else bValid = false;
        },

        _setVisibleTrueLineColumn: function(sLine, sColumn){
            let oSize = sLine * sColumn;

            for(let i=1; i <= oSize; i++){
                this.byId(`column${i}`).setVisible(true);
            }
        },

        _fillGridList: function(sItem){
            let oModel = new JSONModel(sItem);

            //sItem.blockVisible
            this.byId(`grid${sItem.blockPosition}`).setVisible(sItem.blockVisible);

            this.setModel(oModel, `block${sItem.blockPosition}`);
        },

        _quickFilter: function(sKey){
            let oBindingBlock = this.byId("gridListBlock").getBinding("items"),
                oModelBlocks  = this.getModel("blocks").getData(),
                //sKey          = oEvent.getParameter("selectedKey"),
                oStatus       = Formatter.keyStatus(sKey),
                oFilterBlock  = [];

            let oModelFinishProposal = this.getModel("finishProposal").getData();

            for(let oItem of oModelBlocks.items){
                let oBlock = "";
                //for(let oUnit of oItem.units){
                oItem.units.find(oUnit => {
                    if(oStatus != ""){
                        let oBlockUnit = oStatus.find(status =>{
                            if(oUnit.status === status){
                                oBlock = oItem.blockNumber;
                                oFilterBlock.push(new Filter("blockNumber", FilterOperator.EQ, oBlock));
                                return status;
                            }
                        });

                        if(oBlockUnit != undefined){
                            return oUnit;
                        }
                    }else{
                        if(sKey === "incomeAgreementUnits"){
                            if(oModelBlocks.radioButtonSBPEValue){
                                //SBPE
                                if(oModelFinishProposal.CCAValueAssessment > oUnit.SBPEValueAte) {
                                    oBlock = oItem.blockNumber;
                                    oFilterBlock.push(new Filter("blockNumber", FilterOperator.EQ, oBlock));
                                }
                            }else if(oModelBlocks.radioButtonCVAValue){
                                //CVA
                                if(oModelFinishProposal.CCAValueAssessment > oUnit.CVAValueAte){
                                    oBlock = oItem.blockNumber;
                                    oFilterBlock.push(new Filter("blockNumber", FilterOperator.EQ, oBlock));
                                }
                            }
                        }

                        if(oBlock != ""){
                            return oUnit;
                        }
                    }
                });
            }

            oBindingBlock.filter(oFilterBlock, "Application");

            for(let i=0; i < oModelBlocks.items.length; i++){
                let oFilterID = this.byId(`container-enterprises---availabilityMap--gridListUnits-container-enterprises---availabilityMap--gridListBlock-${i}`),
                    oBinding;

                if(oFilterID === undefined){
                    oFilterID = this.byId(`application-Enterprises-Display-component---availabilityMap--gridListUnits-application-Enterprises-Display-component---availabilityMap--gridListBlock-${i}`);
                                         // `application-Enterprises-Display-component---availabilityMap--gridListUnits-application-Enterprises-Display-component---availabilityMap--gridListBlock-1`
                    
                    if(oFilterID === undefined){
                        oFilterID = this.byId( `container-enterprises---finishProposal--gridListUnits-container-enterprises---finishProposal--gridListBlock-${i}`);

                        if(oFilterID === undefined) {
                            oFilterID = this.byId(`application-Enterprises-Display-component---finishProposal--gridListUnits-application-Enterprises-Display-component---finishProposal--gridListBlock-${i}`);
                        
                            if(oFilterID != undefined) oBinding  = oFilterID.getBinding("items");
                        }else{
                            oBinding  = oFilterID.getBinding("items");
                        }
                    }else{
                        oBinding  = oFilterID.getBinding("items");
                    }
                }else{
                    oBinding = oFilterID.getBinding("items");
                }

                if(oBinding){
                    if(sKey === "incomeAgreementUnits"){
                        let oFilters = [];

                        if(oModelBlocks.radioButtonSBPEValue){
                            oFilters.push(this._creatingFiltersincomeAgreementUnits(oModelFinishProposal.CCAValueAssessment)["AteSBPE"]);
                        }else if(oModelBlocks.radioButtonCVAValue){
                            oFilters.push(this._creatingFiltersincomeAgreementUnits(oModelFinishProposal.CCAValueAssessment)["AteCVA"]);
                        }

                        oBinding.filter(oFilters, "Application");
                    }else{
                        oBinding.filter(this._mFilters[sKey], "Application");
                    }
                }
            }

            //--------------------------------------------------------------------------------------------------//
            //-------------------------- Filtro do mapa de disponibilidade novo --------------------------------//
            //--------------------------------------------------------------------------------------------------//
            if(this.byId("containerGridDinamicList").getVisible()){
                for(let oItem of oModelBlocks.items){
                       let oBinding = this.byId(`gridList${oItem.blockPosition}`).getBinding("items");
    
                    if(sKey === "incomeAgreementUnits"){
                        let oFilters = [];

                        if(oModelBlocks.radioButtonSBPEValue){
                            oFilters.push(this._creatingFiltersincomeAgreementUnits(oModelFinishProposal.CCAValueAssessment)["AteSBPE"]);
                        }else if(oModelBlocks.radioButtonCVAValue){
                            oFilters.push(this._creatingFiltersincomeAgreementUnits(oModelFinishProposal.CCAValueAssessment)["AteCVA"]);
                        }

                        oBinding.filter(oFilters, "Application");
                    }else{
                        oBinding.filter(this._mFilters[sKey], "Application");
                    }
    
                    if(this.byId(`gridList${oItem.blockPosition}`).getBinding("items").iLength === 0){
                        this.byId(`grid${oItem.blockPosition}`).setVisible(false);
                    }else{
                        this.byId(`grid${oItem.blockPosition}`).setVisible(true);
                    }
                }
            }
        },

        _updateFinished: function(oEvent){
            let oGridListSouce = oEvent.getSource(),
                oViewModel     = this.getModel("gridListProperty"),
                oModelBlocks   = this.getModel("blocks").getData();

            // only update the counter if the length is final and
            // the table is not empty
            if (oGridListSouce.getBinding("items").isLengthFinal()) {
                let countEXC =0,/*50, 700*/
                    countA   =0,/*100*/ 
                    countR   =0,/*200, 250*/
                    countRC  =0,/*300, 400*/
                    countSig =0,/*441, 443*/ 
                    countSC  =0,/*442*/ 
                    countIN  =0,/*800, 801, 802*/
                    countS   =0,/*900*/
                    countAll =0;

                for(let oItem of oModelBlocks.items){  
                    for(let oUnit of oItem.units){
                        if(oUnit.status === "50" || //Negociado Como Permuta
                        oUnit.status === "700" ) //Permuta
                        {
                            countEXC++;
                        }else
                        if(oUnit.status === "100"|| //Disponível para Venda
                        oUnit.status === "444"|| //Proposta Cancelada
                        oUnit.status === "445" ) //Distratada
                        {
                            countA++;
                        }else
                        if(oUnit.status === "200"|| //Reservado para Venda
                        oUnit.status === "250" ) //Bloqueado
                        {
                            countR++;
                        }else
                        if(oUnit.status === "300"|| //Reserva Técnica/Caucionado
                        oUnit.status === "400" ) //Reservado pela Empresa
                        {
                            countRC++;
                        }else
                        if(oUnit.status === "441"|| //Em Assinatura
                        oUnit.status === "443" ) //Contrato em assinatura
                        {
                            countSig++;
                        }else
                        if(oUnit.status === "442") //Contrato Assinado
                        {
                            countSC++;
                        }else
                        if(oUnit.status === "800"|| //Em negociação
                        oUnit.status === "801"|| //Contrato em Correção
                        oUnit.status === "802" ) //Em Proposta
                        {
                            countIN++;
                        }else
                        if(oUnit.status === "900") //Vendido
                        {
                            countS++;
                        }
                        countAll++;
                    }               
                }

                let oModelFinishProposal = this.getModel("finishProposal").getData(),
                    oCountSBPE = 0,
                    oCountCVA  = 0;
                /*
                SBPEValueDe
                SBPEValueAte
                CVAValueDe
                CVAValueAte
                */

                if(oModelFinishProposal != undefined){
                    if(oModelFinishProposal.CCAValueAssessment != 0){
                        oModelBlocks.items.map(sItem => {
                            sItem.units.map(sUnit => {
                                if(oModelBlocks.radioButtonSBPEValue){
                                    //SBPE
                                    if(oModelFinishProposal.CCAValueAssessment > sUnit.SBPEValueAte){
                                        oCountSBPE++;
                                    }
                                }else if(oModelBlocks.radioButtonCVAValue){
                                    //CVA
                                    if(oModelFinishProposal.CCAValueAssessment > sUnit.CVAValueAte){
                                        oCountCVA++;
                                    }
                                }
                            });
                        });

                        if(oModelBlocks.radioButtonSBPEValue){
                            oViewModel.setProperty("/incomeAgreementUnits", oCountSBPE);
                        }else if(oModelBlocks.radioButtonCVAValue){
                            oViewModel.setProperty("/incomeAgreementUnits", oCountCVA);
                        }else{
                            oViewModel.setProperty("/incomeAgreementUnits", 0);
                        }
                    }   
                }

                if(oViewModel != undefined){
                    oViewModel.setProperty("/exchange", countEXC);
                    oViewModel.setProperty("/available", countA);
                    oViewModel.setProperty("/reserved", countR);
                    oViewModel.setProperty("/reservedCompany", countRC);
                    oViewModel.setProperty("/signature", countSig);
                    oViewModel.setProperty("/signedContract", countSC);
                    oViewModel.setProperty("/inNegociation", countIN);
                    oViewModel.setProperty("/sold", countS);
                    oViewModel.setProperty("/countAll", countAll);
                }
            }
        }
	})
});