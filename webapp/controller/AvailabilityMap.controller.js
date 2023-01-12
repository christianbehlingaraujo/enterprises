sap.ui.define([
	"./BaseController",
    "../model/formatter",
    "../model/blocks",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    'sap/ui/core/Fragment',
    "sap/m/Text",
    "sap/ui/Device",
    "sap/m/MessageBox"
], function(
	BaseController,
	Formatter,
	Blocks,
	Filter,
	FilterOperator,
	JSONModel,
	Fragment,
	Text,
	Device,
	MessageBox
) {
	"use strict";

	return BaseController.extend("com.itsgroup.brz.enterprises.controller.AvailabilityMap", {
        /* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
        onInit: function() {
            this.getRouter().getRoute("availabilityMap").attachPatternMatched(this._onObjectMatched.bind(this), this);
        },

        /* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
        onPress: function (oEvent) {
            this._pressFragmentMenu(oEvent, this.userBusinessReservedVisible);            
        },

        onNavFinishProposal: function(oEvent){
            let oOrgID     = oEvent.getSource().getDependents()[0].getProperty("text"),
                //oObjectID  = oEvent.getSource().getDependents()[1].getProperty("text"),
                oProductID = oEvent.getSource().getDependents()[2].getProperty("text");

            this.getRouter().navTo("finishProposal", {
                orgID: oOrgID,
                productID: oProductID,
                opportunityID: "0"
            });
        },

        onReservedUnit: async function(oEvent){
            this.setAppBusy(true);

            let oObjectID  = oEvent.getSource().getDependents()[1].getProperty("text"),
                oProductID = oEvent.getSource().getDependents()[2].getProperty("text");

            //Reserva a unidade para a empresa
            let bValid = await this._reservedUnit(oObjectID);

            if(bValid){
                let oModel = this.getModel("blocks").getData().items;

                for(let oItem of oModel){
                    for(let oUnit of oItem.units){
                        if(oUnit.productID == oProductID){
                            oUnit.type    = "Default";
                            oUnit.enabled = false;
                        }
                    }
                };

                this.getModel("blocks").refresh(true);

            }
            else MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProduct"));

            this.setAppBusy(false);
        },

        onQuickFilter: function(oEvent){
            let oKey = oEvent.getParameter("selectedKey");

            this._quickFilter(oKey);
        },


        onSelectFilterSuggestions: function(oEvent){
            let oModelBlocks    = this.getModel("blocks").getData(),
                oFilterSelected = this.byId("iconTabBar").getSelectedKey();

            if(oModelBlocks.radioButtonSBPEValue ||
               oModelBlocks.radioButtonCVAValue )
            {
                if(oFilterSelected === "incomeAgreementUnits"){
                    this._quickFilter(oFilterSelected);
                }
            }else{
                this._quickFilter(oFilterSelected);
            }
        },

        onUpdateFinished: function(oEvent) {
           this._updateFinished(oEvent);
        },

        /* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
        _onObjectMatched: async function(oEvent) {
            let oOrgID = oEvent.getParameter("arguments").orgId;

            let oUserInfo,
                oEmail;

            this.userBusinessReservedVisible = false;

            try {
                oUserInfo = sap.ushell.Container.getService("UserInfo");
            } catch (error) {}
            
            
            if (oUserInfo != undefined && oUserInfo != "") {
                oEmail = oUserInfo.getEmail();
            } else {
                oEmail = "EDLEY@BRZ.ENG.BR" //"alexandre.andrade@itsgroup.com.br";
            }

            let oObjectRoles = await this._searchUserBusinessRoles(oEmail);

            this.userBusinessReservedVisible = oObjectRoles.VisibleReserved;

            await this._initAvailabilityMap(oOrgID);

            if(this.byId("containerGridDinamicList").getVisible()){
                let oModelBlocks = this.getModel("blocks").getData();

                this.byId("gridContainer011").setGridTemplateColumns(`reapet(${oModelBlocks.numberColumn}, 28rem)`);
                this.byId("gridContainer011").setGridTemplateRows(`reapet(${oModelBlocks.numberLine}, 1fr)`);

                this.byId("plantEnterprise")
            }

            


        }
	});
});