sap.ui.define([
	"./BaseController",
    "../model/formatter",
    "../model/enterprises",
    "../model/proposed/entity",
    "../model/componentsValues",
    "../model/proposed/proposedCalculation",
    "../model/proposed/paymentConditions",
    "../model/proposed/paymentPlan",
    "../model/proposed/proposalEvaluation",
    "../model/resultProposed",
    "../model/states",
    "../model/proponent/physicalPerson/attorney",
    "../model/proponent/physicalPerson/financialOfficer",
    "../model/proponent/physicalPerson/guarantor",
    "../model/proponent/legalPerson/legalRepresentative",
    "../model/proponent/proponent",
    "../model/proponent/involvedParties",
    "../model/paisesDDI",
    "sap/ui/table/library",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/ui/Device",
    "sap/ui/model/SimpleType"
], function(
	BaseController,
	Formatter,
	Enterprises,
	Entity,
	ComponentsValues,
	ProposedCalculation,
	PaymentConditions,
	PaymentPlan,
	ProposalEvaluation,
	ResultProposed,
	States,
	Attorney,
	FinancialOfficer,
	Guarantor,
	LegalRepresentative,
	Proponent,
	InvolvedParties,
    PaisesDDI,
	library,
	JSONModel,
	MessageToast,
	MessageBox,
	Fragment,
	Dialog,
	Button,
	ButtonType,
	Device,
    SimpleType
) {
	"use strict";

	return BaseController.extend("com.itsgroup.brz.enterprises.controller.FinishProposal", {
        /* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
        onInit: function() {
            this.getRouter().getRoute("finishProposal").attachPatternMatched(this._onObjectMatched.bind(this), this);
        },

        /* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
        onPress: function (oEvent) {
            this._pressFragmentMenu(oEvent, this.userBusinessReservedVisible);            
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
                if(oFilterSelected === "incomeAgreementUnits"){
                    this._quickFilter("countAll");

                    this.byId("iconTabBar").setSelectedKey("countAll");
                }
            }
        },

        onUpdateFinished: function(oEvent) {
           this._updateFinished(oEvent);
        },

        onNavFinishProposal: async function(oEvent){
            let oOrgID     = oEvent.getSource().getDependents()[0].getProperty("text"),
                //oObjectID  = oEvent.getSource().getDependents()[1].getProperty("text"),
                oProductID = oEvent.getSource().getDependents()[2].getProperty("text");

            this.setAppBusy(true);

            let oModel                   = this.getModel("paymentConditions").getData(),
                oModelFinishProposal     = this.getModel("finishProposal").getData(),
                oItemsPurchaseMethod     = this.getModel("purchaseMethod").getData().items,
                oModelProposalEvaluation = this.getModel("proposalEvaluation").getData();
 
            if(oModelFinishProposal.objectID === ""){
                oModel.selectionSaleForm = "Z01";
            }

            oModelFinishProposal.opportunityValidatedSimulate = false;
            oModelFinishProposal.selectionValidatedSimulate   = false;
            oModelFinishProposal.State.messageStatus.Visible  = false;
            oModelFinishProposal.messageStatus                = "";

            this.getModel("finishProposal").refresh(true);

            oModel.selectionComponents        = "";
            oModel.selectionValueIntermediate = "";

            this.getModel("enterprises").getData().items = [];
            this.getModel("enterprises").refresh(true);

            let { oTableValue, oNetValueSBPE, oNetValueCVA, oDataParms } = await this._initFinishProposal(oOrgID, oProductID);

            this.getModel("paymentConditions").refresh(true);

            let oModelEnterprises = this.getModel("enterprises").getData();

            this.getModel("enterprises").refresh(true);

            oModelProposalEvaluation.buttonUpdateProposal = false;
            oModelProposalEvaluation.buttonSaveProposal   = false;
            oModelProposalEvaluation.discountAdditionText = this.getResourceBundle().getText("paymentConditionsDiscount");

            if(oModel.selectionPurchaseMethod === ""){
                await this._fulfillPaymentCondition(oItemsPurchaseMethod, Number(oTableValue), Number(oNetValueSBPE), Number(oNetValueCVA), oDataParms);            
            }else{
                if(oModel.items.length === 0){
                    await this._fulfillPaymentCondition(oItemsPurchaseMethod, Number(oTableValue), Number(oNetValueSBPE), Number(oNetValueCVA), oDataParms);
                }
            }

            //Verifica qual o metodo de financiamento
            if(oModel.selectionPurchaseMethod === "2"){
                oModelEnterprises.tableVisible = false;
                oModelEnterprises.tetoVisible  = true;

                oModelProposalEvaluation.items[0].unitValue   = this._formateValue(`${oModelEnterprises.items[0].tableValueTetoCVA}`, undefined);
            }else if(oModel.selectionPurchaseMethod === "1"){
                oModelEnterprises.tableVisible = true;
                oModelEnterprises.tetoVisible  = false;

                oModelProposalEvaluation.items[0].unitValue   = this._formateValue(`${oTableValue}`, undefined);
            }else{
                oModelEnterprises.tableVisible = true;
                oModelEnterprises.tetoVisible  = false;

                oModelProposalEvaluation.items[0].unitValue   = this._formateValue(`${oTableValue}`, undefined);
            }

            this.getModel("proposalEvaluation").refresh(true);

            this._oNavContainer.back();
            this.setAppBusy(false);
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
        
        onPressChangeUnit: async function(oEvent){
            this.setAppBusy(true);
            let oOrgID               = this.getModel("enterprises").getData().items[0].orgID,
                oModelFinishProposal = this.getModel("finishProposal").getData();

            await this._initAvailabilityMap(oOrgID);

            let oModelBlocks = this.getModel("blocks").getData();

            if(oModelFinishProposal.CCAValueAssessment != 0){
                oModelBlocks.State.incomeAgreementUnits.Visible  = true;
            } 
            else oModelBlocks.State.incomeAgreementUnits.Visible = false;

            this.getModel("blocks").refresh(true);

            this.setAppBusy(false);
            this._oNavContainer.to(this._oAvailabilityMap);
            this.byId("iconTabBar").setSelectedKey("countAll");
        },

        onBackChangeUnit: function(oEvent){ 
            this._oNavContainer.back();
        },

        onChangeBroker: function(oEvent){
            let oModel = this.getModel("finishProposal").getData();
            
            this._searchRealEstate(oModel);
        },

        onChangeRealEstate: function(oEvent){
            let oModel = this.getModel("finishProposal").getData();

            if(oModel.broker === ""){
                let oItemsBrokers = this.getModel("broker").getData().items,
                    oBrokers      = [];

                for(let oItem of oItemsBrokers){
                    if(oItem.partnerID === oModel.realEstate) oBrokers.push(oItem);
                }

                this.getModel("broker").getData().items = oBrokers;
                this.getModel("broker").refresh(true);
            }
        },

        onPressResetBrokerAndRealEstate: async function(oEvent){
            this.setAppBusy(true);

            if(this.objectRoles.RoleID === "EST_COM_SUP"){
                let oModel = this.getModel("finishProposal").getData(),
                    oOrgID = this.getModel("enterprises").getData().items[0].orgID;

                if(oModel.itemsRealEstate.length === 0 &&
                   oModel.itemsBrokers.length    === 0 )
                {   
                    //Relação entre corretor x imobiliárias
                    let oDataPartnerOrg = await this.callService(`PartnerSalesOrganisationCollection?$filter=SalesOrganisationID eq '${oOrgID}'&$format=json&$expand=Partner&$select=PartnerID,Partner/BusinessPartnerFormattedName`).method('GET');//&$select=PartnerID,Partner/BusinessPartnerFormattedName

                    //Busca relação de corretor x imobiliaria
                    await this._searchBrokerRelationshipXRealEstate(oDataPartnerOrg);
                }
            }

            let oModel = this.getModel("finishProposal").getData();

            oModel.broker     = "";
            oModel.realEstate = "";

            this.getModel("realEstate").getData().items = oModel.itemsRealEstate;
            this.getModel("realEstate").refresh(true);

            this.getModel("broker").getData().items = oModel.itemsBrokers;
            this.getModel("broker").refresh(true);

            this.getModel("finishProposal").refresh(true);

            this.setAppBusy(false);
        },

        onSelectValidatedSimulate: function(oEvent){
            let oModel = this.getModel("finishProposal").getData();

            if(oModel.selectionValidatedSimulate){
                MessageBox.warning(this.getResourceBundle().getText("messageWarningvalidatedSimulate"));
            }
        },
        
        onPurchaseMethod: function(oEvent){
            let oValue        = oEvent.getParameter("value"),
                oModel        = this.getModel("enterprises").getData(),
                oTableValue   = Number(this._clearFormattingValue(oModel.items[0].tableValue)),
                oNetValueSBPE = Number(this._clearFormattingValue(oModel.items[0].SBPEValue)),
                oNetValueCVA  = Number(this._clearFormattingValue(oModel.items[0].CVAValue));

            if(oValue === "SBPE"){
                oModel.tableVisible = true;
				oModel.tetoVisible  = false;
                this.getModel("enterprises").refresh(true);

                this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValue}`, undefined);
                this.getModel("proposalEvaluation").refresh(true);

                //Remove o item do comboBox, para não aparecer mais
                this._addRemoveComponents(this.subsidy, "remove");

                this.getModel("componentsValues").getData().items = [];
                this.getModel("componentsValues").refresh(true);

                this.getModel("paymentConditions").getData().selectionPaymentPlan = "MR";

                this._addRemoveComponents(this.deliveryKeys, "add");
                this._addRemoveComponents(this.adjustableMonthly, "add");

                this.getModel("paymentConditions").getData().items = this._fillInSBPESalesForm(oTableValue, oNetValueSBPE);
            }else{
                let oTableValueTeto = Number(this._clearFormattingValue(oModel.items[0].tableValueTetoCVA));

                this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValueTeto}`, undefined);
                this.getModel("proposalEvaluation").refresh(true);

                oModel.tableVisible = false;
				oModel.tetoVisible  = true;
                this.getModel("enterprises").refresh(true);

                this.getModel("componentsValues").getData().items = [];
                this.getModel("componentsValues").refresh(true);

                this.getModel("paymentConditions").getData().selectionPaymentPlan = "MR";

                this._addRemoveComponents(this.deliveryKeys, "add");
                this._addRemoveComponents(this.adjustableMonthly, "add");

                this.getModel("paymentConditions").getData().items = this._fillInCVASalesForm(oTableValueTeto, oNetValueCVA);
            }

            this.getModel("paymentConditions").refresh(true);

            let oModelPaymentCdtns = this.getModel("paymentConditions").getData();

            oModelPaymentCdtns.items.map(sItem =>{
                if(sItem.selectionComponents === this.intermediate &&
                   sItem.selectionValueTotal != ""){
                    oModelPaymentCdtns.selectionValueIntermediate               = sItem.selectionValueTotal;
                    oModelPaymentCdtns.State.selectionValueIntermediate.Visible = true;
                }
            });

            this.getModel("paymentConditions").refresh(true);

            //Calcula os valore da proposta
            this._calculationProposed(oModelPaymentCdtns.items, "");            
        },
        
        onSaleForm: function(oEvent){
            let oValue           = oEvent.getParameter("value"),
                oModel           = this.getModel("paymentConditions").getData(),
                oModelEnterprise = this.getModel("enterprises").getData(),
                oTableValue      = Number(this._clearFormattingValue(oModelEnterprise.items[0].tableValue)),
                oNetValueSBPE    = Number(this._clearFormattingValue(oModelEnterprise.items[0].SBPEValue)),
                oNetValueCVA     = Number(this._clearFormattingValue(oModelEnterprise.items[0].CVAValue));
            
            //Valido se a forma de venda for financiada, mostra o campo modalidade
            if(oValue != ""){
                if(oValue === "Financiada"){
                    oModel.State.selectionPurchaseMethod.Visible = true;
    
                    if(oNetValueSBPE != 0){
                        this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValue}`, undefined);
                        this.getModel("proposalEvaluation").refresh(true);

                        oModelEnterprise.tableVisible = true;
                        oModelEnterprise.tetoVisible  = false;
                        this.getModel("enterprises").refresh(true);

                        oModel.selectionPurchaseMethod = "1";
                        oModel.items = this._fillInSBPESalesForm(oTableValue, oNetValueSBPE);
    
                        this.getModel("componentsValues").getData().items = [];
                        this.getModel("componentsValues").refresh(true);
                        
                        this._addRemoveComponents(this.deliveryKeys, "add");
                    }else{
                        let oTableValueTeto = Number(this._clearFormattingValue(oModelEnterprise.items[0].tableValueTetoCVA));

                        this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValueTeto}`, undefined);
                        this.getModel("proposalEvaluation").refresh(true);

                        oModelEnterprise.tableVisible = false;
                        oModelEnterprise.tetoVisible  = true;
                        this.getModel("enterprises").refresh(true);

                        oModel.selectionPurchaseMethod = "2";
                        oModel.items = this._fillInCVASalesForm(oTableValueTeto, oNetValueCVA);

    
                        this.getModel("componentsValues").getData().items = [];
                        this.getModel("componentsValues").refresh(true);
    
                        this._addRemoveComponents(this.deliveryKeys, "add");
                    }
    
                    this.getModel("paymentConditions").refresh(true);

                    let oModelPaymentCdtns = this.getModel("paymentConditions").getData();

                    oModelPaymentCdtns.items.map(sItem =>{
                        if(sItem.selectionComponents === this.intermediate &&
                        sItem.selectionValueTotal != ""){
                            oModelPaymentCdtns.selectionValueIntermediate               = sItem.selectionValueTotal;
                            oModelPaymentCdtns.State.selectionValueIntermediate.Visible = true;
                        }
                    });

                    this.getModel("paymentConditions").refresh(true);
    
                    //Calcula os valores da propostaa
                    this._calculationProposed(oModelPaymentCdtns.items, "");
                }else {
                    oModel.selectionPurchaseMethod                  = "";
                    oModel.State.selectionPurchaseMethod.Visible    = false;
                    oModel.State.selectionValueIntermediate.Visible = false;
                    oModel.State.selectionPaymentPlan.Visible       = false;
                    
    
                    //chama o method de verificação do item selecionado e já preenchendo de acordo
                    this._selectionSaleForm(oValue, oModel, oModelEnterprise);
    
                    this.getModel("paymentConditions").refresh(true);
    
                    let oItemsCdtns = this.getModel("paymentConditions").getData().items;
    
                    //Calcula os valore da proposta
                    this._calculationProposed(oItemsCdtns, "");
                }
            }
        },

        onPressPaymentPlan: function(oEvent){
            let oKeyPaymentPlan    = oEvent.getSource().getProperty("selectedKey"),
                oTextPaymentPlan   = oEvent.getParameter("newValue"),
                oModelPaymentCndts = this.getModel("paymentConditions").getData();

            let oItems = oModelPaymentCndts.itemsPaymentPlan.filter(sItem =>{
                if(sItem.key != oKeyPaymentPlan) return sItem;
            });

            this.getModel("paymentConditions").getData().itemsPaymentPlanInit = oItems;
            this.getModel("paymentConditions").refresh(true);

            let oItemsPaymentCdts = oModelPaymentCndts.items.filter(sItem => {
                if(sItem.selectionComponents != this.adjustableMonthly &&
                   sItem.selectionComponents != this.fixedMonthly      &&
                   sItem.selectionComponents != this.descendingMonthly) return sItem;
            });

            oModelPaymentCndts.items = oItemsPaymentCdts;
            this.getModel("paymentConditions").refresh(true);

            //Mensal - Reajustável
            if(oTextPaymentPlan === this.adjustableMonthly){
                this._addComponentAccordingToSalesTable(oModelPaymentCndts, oTextPaymentPlan);

                this._addRemoveComponents(this.adjustableMonthly, "add");

                //--------------------- Mensal Fixa ------------------------------------//
                let oExistMF = oModelPaymentCndts.items.filter(sItem => {
                    if(sItem.selectionComponents != this.fixedMonthly) return sItem;
                });

                if(oExistMF != undefined) this._addRemoveComponents(this.fixedMonthly, "remove");

                //--------------------- Mensal Decrescente - Reajustável ---------------//
                let oExistMDR = oModelPaymentCndts.items.filter(sItem => {
                    if(sItem.selectionComponents != this.descendingMonthly) return sItem;
                });

                if(oExistMDR != undefined) this._addRemoveComponents(this.descendingMonthly, "remove");
            
            }else 
            //Mensal Fixa
            if(oTextPaymentPlan === this.fixedMonthly){
                this._addComponentAccordingToSalesTable(oModelPaymentCndts, oTextPaymentPlan);

                this._addRemoveComponents(this.fixedMonthly, "add");

                //--------------------- Mensal - Reajustável ---------------------------//
                let oExistMR = oModelPaymentCndts.items.filter(sItem => {
                    if(sItem.selectionComponents != this.adjustableMonthly) return sItem;
                });

                if(oExistMR != undefined) this._addRemoveComponents(this.adjustableMonthly, "remove");

                //--------------------- Mensal Decrescente - Reajustável ---------------//
                let oExistMDR = oModelPaymentCndts.items.filter(sItem => {
                    if(sItem.selectionComponents != this.descendingMonthly) return sItem;
                });

                if(oExistMDR != undefined) this._addRemoveComponents(this.descendingMonthly, "remove");
            }else 
            //Mensal Decrescente - Reajustável
            if(oTextPaymentPlan === this.descendingMonthly){
                this._addComponentAccordingToSalesTable(oModelPaymentCndts, oTextPaymentPlan);
                
                this._addRemoveComponents(this.descendingMonthly, "add");
                
                //--------------------- Mensal - Fixa------ ---------------------------//
                let oExistMF = oModelPaymentCndts.items.filter(sItem => {
                    if(sItem.selectionComponents != this.fixedMonthly) return sItem;
                });

                if(oExistMF != undefined) this._addRemoveComponents(this.fixedMonthly, "remove");

                //--------------------- Mensal - Reajustável ---------------------------//
                let oExistMR = oModelPaymentCndts.items.filter(sItem => {
                    if(sItem.selectionComponents != this.adjustableMonthly) return sItem;
                });

                if(oExistMR != undefined) this._addRemoveComponents(this.adjustableMonthly, "remove");
            }
        },

        onSelectedMarried: function(oEvent) {
            let oValue          = oEvent.getParameter("value"),
                oID             = oEvent.getParameter("id"),
                oPositionID     = oID.indexOf("guarantor");

            if(oValue === "Casado(a)"){
                

                if(oPositionID != -1){
                    this.byId("buttonShowHideSpouseGuarantor").setVisible(true);
                }else{
                    let oPhysicalPerson = this.byId("proponentInstance").getModel("fragment").getData().physicalPerson;

                    oPhysicalPerson.State.marriageRegime.Enabled = true;
                    oPhysicalPerson.State.weddingDate.Enabled    = true;

                    this.byId("buttonShowHideSpouse").setVisible(true);
                    
                    this._validationProponent(oPhysicalPerson);
                }
            }else{              
                if(oPositionID != -1) this.byId("buttonShowHideSpouseGuarantor").setVisible(false);
                else {
                    let oPhysicalPerson = this.byId("proponentInstance").getModel("fragment").getData().physicalPerson;

                    oPhysicalPerson.State.marriageRegime.Enabled = false;
                    oPhysicalPerson.State.weddingDate.Enabled    = false;

                    this.byId("buttonShowHideSpouse").setVisible(false);

                    this._validationProponent(oPhysicalPerson);
                }
            }
        },

        onAddRowInTable: function(oEvent){
            let oComponent = oEvent.getSource().getDependents()[0].getProperty("text");
            
            if(oComponent != ""){
                if(oComponent === this.intermediate){
                    this.getModel("paymentConditions").getData().State.selectionValueIntermediate.Visible = true;
                    this.getModel("paymentConditions").refresh(true);
                }

                let oModelPaymentCndts = this.getModel("paymentConditions").getData();

                this._addComponentAccordingToSalesTable(oModelPaymentCndts, oComponent);
            }else{
                MessageBox.warning(this.getResourceBundle().getText("messageWarningSelectionComponents"));
            }
        },

        onRemoveRowInTable: function(oEvent) {
            let oKey = Number(oEvent.getSource().getDependents()[0].getProperty("text"));

            let oComponent = this._removeRowInTable(oKey);

            if(oComponent != this.adjustableMonthly &&
               oComponent != this.fixedMonthly      &&
               oComponent != this.descendingMonthly  )
            {
                //adiciona o componente no comboBox novamente
                this._addRemoveComponents(oComponent, "add");

                if(oComponent === this.intermediate){
                    this.getModel("paymentConditions").getData().State.selectionValueIntermediate.Visible = false;
                    this.getModel("paymentConditions").refresh(true);
                }
            }

            let oItemsCdtns = this.getModel("paymentConditions").getData().items;

            //Calcula os valore da proposta
            this._calculationProposed(oItemsCdtns, "");

            let oSelectedValidation = this.getModel("finishProposal").getData().viewTable.selectionAutomaticValidation;
                
            if(oSelectedValidation){
                this._validationProposal();
            }
        },

        onSpouseShowHide:function(oEvent) {
            let oClass = oEvent.getSource().aCustomStyleClasses[0];

            if(oClass === "buttonShowSpouseAccept"){
                let oTextReject = this.getResourceBundle().getText("proponentButtonHideSpouse");
                this.getModel("texts").setProperty("/buttonShowHideSpouse", oTextReject);

                this.byId("buttonShowHideSpouse").removeStyleClass("buttonShowSpouseAccept");
                this.byId("buttonShowHideSpouse").addStyleClass("buttonHideSpouseReject");
                this.byId("SpousePhysicalPerson").setVisible(true);

            }else {
                let oTextAccept = this.getResourceBundle().getText("proponentButtonShowSpouse");
                this.getModel("texts").setProperty("/buttonShowHideSpouse", oTextAccept);

                this.byId("buttonShowHideSpouse").removeStyleClass("buttonHideSpouseReject");
                this.byId("buttonShowHideSpouse").addStyleClass("buttonShowSpouseAccept");
                this.byId("SpousePhysicalPerson").setVisible(false);
            }

            this.getModel("texts").refresh(true);
        },

        onSpouseShowHideGuarantor:function(oEvent) {
            let oClass = oEvent.getSource().aCustomStyleClasses[0];

            if(oClass === "buttonShowSpouseAccept"){
                let oTextReject = this.getResourceBundle().getText("proponentButtonHideSpouse");
                this.getModel("texts").setProperty("/buttonShowHideSpouseGuarantor", oTextReject);

                this.byId("buttonShowHideSpouseGuarantor").removeStyleClass("buttonShowSpouseAccept");
                this.byId("buttonShowHideSpouseGuarantor").addStyleClass("buttonHideSpouseReject");
                this.byId("spousePhysicalPersonGuarantor").setVisible(true);

            }else {
                let oTextAccept = this.getResourceBundle().getText("proponentButtonShowSpouse");
                this.getModel("texts").setProperty("/buttonShowHideSpouseGuarantor", oTextAccept);

                this.byId("buttonShowHideSpouseGuarantor").removeStyleClass("buttonHideSpouseReject");
                this.byId("buttonShowHideSpouseGuarantor").addStyleClass("buttonShowSpouseAccept");
                this.byId("spousePhysicalPersonGuarantor").setVisible(false);
            }

            this.getModel("texts").refresh(true);
        },

        onSelectRadioButton: function(oEvent){
            let oPhysicalPerson = this.byId("proponentInstance").getModel("fragment").getData().physicalPerson;
            
            if(oPhysicalPerson.radioButtonCPF){
                this._additionalDataPhysicalPerson(true);
                this._additionalDataLegalPerson(false);
            }else{
                this._additionalDataLegalPerson(true);
                this._additionalDataPhysicalPerson(false);
            }
        },

        onUpdateFinishedProponents: function(oEvent){
            let sTitle,
                oTable      = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");

            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("proponentTableInvolvedPartiesParms", [iTotalItems]);
            }else{
                sTitle = this.getResourceBundle().getText("proponentTableInvolvedParties");
            }

            this.getModel("texts").setProperty("/involvedPartiesTableTitle", sTitle);
        },

        onCalculationDifference: function(oEvent) {
            this.setAppBusy(true);

            let oKey             = Number(oEvent.getSource().getDependents()[0].getProperty("text")),
                oModelEvaluation = this.getModel("proposalEvaluation").getData(),
                oItemsPayCond    = this.getModel("paymentConditions").getData().items,
                discountText     = this.getResourceBundle().getText("paymentConditionsDiscount"),
                posisionArray    = 0;

            let oItem = oItemsPayCond.find(sItem => {
                if(sItem.key === oKey){
                    return sItem;
                }
                posisionArray++;
            });

            let proposalValue   = Number(this._clearFormattingValue(this.getModel("proposedCalculation").getData().valueTotal)),
                unitValue       = Number(this._clearFormattingValue(oModelEvaluation.items[0].unitValue)),
                unitaryValue    = Number(this._clearFormattingValue(oItem.selectionUnitaryValue)),
                oValueTotal     = Number(this._clearFormattingValue(oItemsPayCond[posisionArray].selectionValueTotal));

            if(oModelEvaluation.discountAdditionText === discountText){
                let differenceValue = unitValue - proposalValue;

                if(oItemsPayCond[posisionArray].selectionComponents === this.adjustableMonthly ||
                   oItemsPayCond[posisionArray].selectionComponents === this.fixedMonthly){
                    let oResult = oValueTotal + differenceValue;

                    let oValuePortion = oResult / oItemsPayCond[posisionArray].selectionTheAmount,
                        oPosition     = `${oValuePortion}`.indexOf(".")

                    if(oPosition != -1){
                        oItemsPayCond[posisionArray].selectionValueTotal   = this._formateValue(`${oResult}`, undefined);
                        oItemsPayCond[posisionArray].selectionUnitaryValue = this._formateValue(`${oValuePortion}`.substring(0, oPosition), undefined);
                    }else{
                        oItemsPayCond[posisionArray].selectionValueTotal   = this._formateValue(`${oResult}`, undefined);
                        oItemsPayCond[posisionArray].selectionUnitaryValue = this._formateValue(`${oValuePortion}`, undefined);
                    }
                }else{
                    //discountAddition
                    oItemsPayCond[posisionArray].selectionValueTotal   = this._formateValue(`${unitaryValue + differenceValue}`, undefined);
                    oItemsPayCond[posisionArray].selectionUnitaryValue = this._formateValue(`${unitaryValue + differenceValue}`, undefined);
                }
            }else {
                let differenceValue = Number(`${unitValue - proposalValue}`.replace("-", ""));

                if(oItemsPayCond[posisionArray].selectionComponents === this.adjustableMonthly ||
                   oItemsPayCond[posisionArray].selectionComponents === this.fixedMonthly){
                    let oResult = oValueTotal - differenceValue;

                    if(oResult < 0){
                        oItemsPayCond[posisionArray].selectionValueTotal   = this._formateValue(`${0.00}`, undefined);
                        oItemsPayCond[posisionArray].selectionUnitaryValue = this._formateValue(`${0.00}`, undefined);
                    }else {
                        let oValuePortion = oResult / oItemsPayCond[posisionArray].selectionTheAmount,
                            oPosition     = `${oValuePortion}`.indexOf(".")

                        if(oPosition != -1){
                            oItemsPayCond[posisionArray].selectionValueTotal   = this._formateValue(`${oResult}`, undefined);
                            oItemsPayCond[posisionArray].selectionUnitaryValue = this._formateValue(`${oValuePortion}`.substring(0, oPosition), undefined);
                        }else{
                            oItemsPayCond[posisionArray].selectionValueTotal   = this._formateValue(`${oResult}`, undefined);
                            oItemsPayCond[posisionArray].selectionUnitaryValue = this._formateValue(`${oValuePortion}`, undefined);
                        }
                    }
                    
                }else{
                    //discountAddition
                    oItemsPayCond[posisionArray].selectionValueTotal   = this._formateValue(`${unitaryValue - differenceValue}`, undefined);
                    oItemsPayCond[posisionArray].selectionUnitaryValue = this._formateValue(`${unitaryValue - differenceValue}`, undefined);
                }
            }

            this.getModel("paymentConditions").refresh(true);

            this._calculationProposed(oItemsPayCond, "");

            let oSelectedValidation = this.getModel("finishProposal").getData().viewTable.selectionAutomaticValidation;

            if(oSelectedValidation){
                this._validationProposal();
            }

            this.setAppBusy(false);
        },

        onSelectAutomaticValidation: function(oEvent){
            let oSelectedValidation = oEvent.getParameter("selected");

            if(oSelectedValidation){
                this.getModel("finishProposal").getData().viewTable.State.selectionButtonValidate = false;
                this.getModel("finishProposal").refresh(true);

                this._validationProposal();
            }else {
                this.getModel("finishProposal").getData().viewTable.State.selectionButtonValidate = true;
                this.getModel("finishProposal").refresh(true);
            }
        },

        onCalculationProposed: function(oEvent){
            this.setAppBusy(true);

            let payCdtns = this.getModel("paymentConditions").getData().items;

            this._calculationProposed(payCdtns, oEvent.getParameter("id"));

            this.setAppBusy(false);
        },

        onCalculationIntermediate: function(oEvent){
            this.setAppBusy(true);

            let oID    = oEvent.getParameter("id"),
                oValue = this._clearFormattingValue(oEvent.getParameter("value"));

            this._formateValue(oValue, oID);

            let oModel = this.getModel("paymentConditions").getData();

            for(let oItem of oModel.items){
                if(oItem.selectionComponents === this.intermediate &&
                   oItem.selectionValueTotal != ""){
                    oItem.selectionValueTotal = this._formateValue(oValue);
                }
            }

            this._calculationProposed(oModel.items, "");

            this.setAppBusy(false);
        },

        //Formata o valor para o valor em reais com pontos e virgula
        onFormatedValue: function(oEvent) {
            let oInput = oEvent.getParameters();

            this._formateValue(oInput.value, oInput.id);     
            
            let payCdtns            = this.getModel("paymentConditions").getData().items,
                oSelectedValidation = this.getModel("finishProposal").getData().viewTable.selectionAutomaticValidation;
            
            this._calculationProposed(payCdtns, "");

            if(oSelectedValidation){
                this._validationProposal();
            }
        },

        onFormatedAmount: function(oEvent) {
            let oId    = oEvent.getParameter("id"),
                oValue = oEvent.getParameter("value"),
                oPositionID = oId.indexOf("monthlyIncomePhysicalPerson");

            this._formateValue(oValue, oId);

            if(oPositionID != -1){
                let oModel = this.byId("proponentInstance").getModel("fragment").getData().physicalPerson;

                this._validationProponent(oModel);

                this.byId("proponentInstance").getModel("fragment").refresh(true);
            }
        },

        onFormatedCPFAndCNPJ: function(oEvent){
            let oId           = oEvent.getParameter("id"),
                oValue        = this._clearFormatting(oEvent.getParameter("value")),
                oCPFIdentical = oId.indexOf("CPF");

            if(oCPFIdentical != -1){
                //000.000.000-00
                this.byId(oId).setValue(this._formateCPF(oValue));

                if(oValue.length === 11){
                    this.onFillsPhysicalBidder(oEvent);
                }
            }else{
                //00.000.000/0000-00
                this.byId(oId).setValue(this._formateCNPJ(oValue));

                if(oValue.length === 14){
                    this.onSearchLegalPerson(oEvent);
                }
            }
        },

        onFormatePhone: function(oEvent){
            let oId    = oEvent.getParameter("id"),
                oValue = oEvent.getParameter("value");

            this.byId(oId).setValue(this._formatePhone(oValue));
        },

        //Valida o tamanho dos campos
        onValidateField: function(oEvent){
            this._validateField(oEvent.getSource());
        },

        //Busca o cliente e preenche os campos da tela
        onFillsPhysicalBidder: async function(oEvent){
            this.setAppBusy(true);

            let oValue = this._clearFormatting(oEvent.getParameter("value"));

            if(oValue != ""){
                //Formato o campo CPF
                let oCPF = this._formateCPF(oValue);

                //seto o cpf formatado no input
                //this.byId(oEvent.getParameter("id")).setValue(oCPF)

                //Busca proponente para carregar os campos na tela
                let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oValue}'&$format=json`).method('GET'),
                    oProponent          = this.byId("proponentInstance").getModel("fragment").getData();


                    //BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq
                if(oIndividualCustomer){
                    let oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET'),
                        oBusinessPartnerCustomerID;

                    if(oBusinessPartner === undefined){
                        oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET');
                    
                        if(oBusinessPartner != undefined){
                            oBusinessPartnerCustomerID = oBusinessPartner.FirstBusinessPartnerID;
                        }
                    }else{
                        oBusinessPartnerCustomerID = oBusinessPartner.SecondBusinessPartnerID;
                    }

                    if(oBusinessPartner != undefined){
                        let oIndividualCustomerSpouse = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${oBusinessPartnerCustomerID}'&$format=json`).method('GET')
                    
                        if(oIndividualCustomerSpouse != undefined){
                            this._fillInSpouseFields(oProponent.physicalPerson.biddersSpouseData, oIndividualCustomerSpouse);

                            let oTextReject = this.getResourceBundle().getText("proponentButtonHideSpouse");
                            this.getModel("texts").setProperty("/buttonShowHideSpouse", oTextReject);

                            this.byId("buttonShowHideSpouse").removeStyleClass("buttonShowSpouseAccept");
                            this.byId("buttonShowHideSpouse").addStyleClass("buttonHideSpouseReject");
                            this.byId("SpousePhysicalPerson").setVisible(true);
                            
                            this.getModel("texts").refresh(true);
                        }
                    }else{
                        let oTextAccept = this.getResourceBundle().getText("proponentButtonShowSpouse");
                        this.getModel("texts").setProperty("/buttonShowHideSpouse", oTextAccept);

                        this.byId("buttonShowHideSpouse").removeStyleClass("buttonHideSpouseReject");
                        this.byId("buttonShowHideSpouse").addStyleClass("buttonShowSpouseAccept");
                        this.byId("SpousePhysicalPerson").setVisible(false);
                    
                        this.getModel("texts").refresh(true);
                    }

                    let aProposed = this.getModel("finishProposal").getData();
                    
                    //campos pessoa fisica
                    this._fillsPhysicalProponentFields(oProponent, oIndividualCustomer, true); 

                    this.getModel("finishProposal").refresh(true);

                    //Valida se os campos obrigatórios estáo preenchidos
                    this._validationProponent(oProponent.physicalPerson);

                    this.byId("proponentInstance").getModel("fragment").refresh(true);
                }else{
                    let oFieldClass = ["objectID", "customerID", "name", "surname", "sex", "birth", "maritalStatus",
                                       "marriageRegime", "weddingDate", "RGNumber", "RGIssuer", "UF", "naturalness",
                                       "nationality", "motherName", "fatherName", "profession", "notaryRegistryFirm",
                                       "currentHousing", "housingTime", "mobile", "email", "phone"
                                      ]
                        
                    oFieldClass.forEach(sField =>{
                        if(sField === "birth" || 
                           sField === "weddingDate") oProponent.physicalPerson[sField] = null;
                        else oProponent.physicalPerson[sField] = "";
                    });

                    //Limpa campos de informação financeira
                    this._clearModelFinancialInformation(oProponent.physicalPerson.financialInformation);

                    //Limpa dados da empresa
                    this._clearModelCompany(oProponent.physicalPerson.biddersProfessionalData);

                    //Limpa Endereço residencial
                    this._clearModelAddress(oProponent.physicalPerson.homeAddress);

                    //Limpa dados do cônjuge
                    this._clearModelBidderSpouse(oProponent.physicalPerson.biddersSpouseData, "professionalData");

                    oProponent.physicalPerson.CPFAndCNPJ = oCPF;

                    //Valida se os campos obrigatórios estáo preenchidos
                    this._validationProponent(oProponent.physicalPerson);

                    this.byId("proponentInstance").getModel("fragment").refresh(true);
                }
            }

            this.setAppBusy(false);
        },

        onSearchLegalPerson: async function(oEvent){
            this.setAppBusy(true);

            let oValue = this._clearFormatting(oEvent.getParameter("value"));

            if(oValue != ""){
                //Formato o campo CPF
                let oCNPJ = this._formateCNPJ(oValue);

                //seto o cpf formatado no input
                //this.byId(oEvent.getParameter("id")).setValue(oCNPJ)

                //Busca proponente para carregar os campos na tela
                let oCorporateAccount = await this.callServiceFormatedJSON(`CorporateAccountCollection?$filter=CPFCNPJ_KUT eq '${oValue}'&$format=json`).method('GET'),
                    oLegalPerson      = this.byId("proponentInstance").getModel("fragment").getData().legalPerson;
                
                if(oCorporateAccount){
                    let aProposed = this.getModel("finishProposal").getData();

                    oLegalPerson.objectID              = oCorporateAccount.ObjectID;
                    oLegalPerson.customerID            = oCorporateAccount.IDCliente_KUT;
                    oLegalPerson.roleCode              = oCorporateAccount.RoleCode;
                    oLegalPerson.CPFAndCNPJ            = this._formateCNPJ(oCorporateAccount.CPFCNPJ_KUT);
                    oLegalPerson.name                  = oCorporateAccount.Name + oCorporateAccount.AdditionalName + oCorporateAccount.AdditionalName2 + oCorporateAccount.AdditionalName3;
					oLegalPerson.email                 = oCorporateAccount.Email;
                    oLegalPerson.municipalRegistration = oCorporateAccount.Inscriomunicipal_KUT;
                    oLegalPerson.stateRegistration     = oCorporateAccount.Inscrioestadual_KUT;
                    oLegalPerson.notaryRegistryOffice  = "";
                    oLegalPerson.OwnerID               = oCorporateAccount.OwnerID;

                    //preenche telefone
                    this._fillsPhoneFields(oLegalPerson, oIndividualCustomer);

                    //Preenche os campos de Informação Financeiras
                    oLegalPerson.financialInformation.monthlyIncome      = this._formateValue(oCorporateAccount.Rendamensal_KUT, undefined);
                    oLegalPerson.financialInformation.incomeType         = oCorporateAccount.Tiporenda_KUT;
                    oLegalPerson.financialInformation.committedIncome    = this._formateValue(oCorporateAccount.Rendacomprometida_KUT, undefined);
                    oLegalPerson.financialInformation.informalIncome     = this._formateValue(oCorporateAccount.Rendainformal_KUT, undefined);
                    oLegalPerson.financialInformation.creditFinancing    = this._formateValue(oCorporateAccount.Creditofinanciamento_KUT, undefined);
                    oLegalPerson.financialInformation.subsidyCredit      = this._formateValue(oCorporateAccount.Creditosubsidio_KUT, undefined);
                    oLegalPerson.financialInformation.FGTSCredit         = this._formateValue(oCorporateAccount.CreditoFGTS_KUT, undefined);
                    oLegalPerson.financialInformation.creditOwnResources = this._formateValue(oCorporateAccount.Creditorecursosproprios_KUT, undefined);
                    oLegalPerson.financialInformation.numberInstallments = oCorporateAccount.Quantidademaximaparcelas_KUT;
                    oLegalPerson.financialInformation.amortization       = oCorporateAccount.Amortizacao_KUT;

                    //Preenche os campos de endereço
                    oLegalPerson.companyAddress.CEP          = oCorporateAccount.StreetPostalCode;
                    oLegalPerson.companyAddress.publicPlace  = oCorporateAccount.Street;
                    oLegalPerson.companyAddress.number       = Number(oCorporateAccount.HouseNumber);
                    oLegalPerson.companyAddress.complement   = oCorporateAccount.AddressLine4;
                    oLegalPerson.companyAddress.neighborhood = oCorporateAccount.District;
                    oLegalPerson.companyAddress.county       = oCorporateAccount.City;
                    oLegalPerson.companyAddress.UF           = oCorporateAccount.StateCode;


                    this.getModel("finishProposal").refresh(true);

                    //Valida se os campos obrigatórios estáo preenchidos
                    this._validationProponent(oLegalPerson);


                    this.byId("proponentInstance").getModel("fragment").refresh(true);
                }else{
                    oLegalPerson.CPFAndCNPJ = oCNPJ;

                    let oFieldClass = ["name", "mobile", "email", "phone",
                                       "municipalRegistration", "stateRegistration", "notaryRegistryOffice"];

                    oFieldClass.forEach(sField =>{
                        oLegalPerson[sField] = "";
                    });

                    //Limpa campos de informação financeira
                    this._clearModelFinancialInformation(oLegalPerson.financialInformation);

                    //Limpa dados da empresa
                    this._clearModelCompany(oLegalPerson.companyAddress);

                    //Valida se os campos obrigatórios estáo preenchidos
                    this._validationProponent(oLegalPerson);
                }
            }

            this.setAppBusy(false);
        },

        onSearchAttorney: async function(oEvent){
            this.setAppBusy(true);

            let oValue = this._clearFormatting(oEvent.getParameter("value"));

            if(oValue != ""){
                //Formato o campo CPF
                let oCPF = this._formateCPF(oValue);

                //seto o cpf formatado no input
                this.byId(oEvent.getParameter("id")).setValue(oCPF)

                //Busca proponente para carregar os campos na tela
                let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oValue}'&$format=json`).method('GET'),
                    oAttorney           = this.byId("attorneyPhysicalPersonInstance").getModel("fragment").getData();
            
                if(oIndividualCustomer){
                    oAttorney.objectID      = oIndividualCustomer.ObjectID;
                    oAttorney.customerID    = oIndividualCustomer.CustomerID;
                    oAttorney.roleCode      = oIndividualCustomer.RoleCode;
                    oAttorney.CPFAndCNPJ    = this._formateCPF(oIndividualCustomer.CPFCNPJ_KUT);
                    oAttorney.name          = oIndividualCustomer.FirstName;
                    oAttorney.surname       = oIndividualCustomer.LastName;
                    oAttorney.email         = oIndividualCustomer.Email;
                    oAttorney.sex           = oIndividualCustomer.GenderCode;
                    oAttorney.maritalStatus = oIndividualCustomer.MaritalStatusCode;
                    oAttorney.birth         = this._formatedDate(oIndividualCustomer.BirthDate);
                    oAttorney.RGNumber      = oIndividualCustomer.CIDENTIDADE_KUT;
                    oAttorney.RGIssuer      = oIndividualCustomer.OrgaoExpedidor_KUT;
                    oAttorney.UF            = oIndividualCustomer.Estadoorgaoemissor_KUT;
                    oAttorney.naturalness   = oIndividualCustomer.NacionalidadeCode_SDK;
                    oAttorney.nationality   = oIndividualCustomer.NationalityCountryCode;
                    oAttorney.motherName    = oIndividualCustomer.Nomedamae_KUT;
                    oAttorney.fatherName    = oIndividualCustomer.Nomedopai_KUT;
                    oAttorney.monthlyIncome = this._formateValue(oIndividualCustomer.Rendamensal_KUT, undefined);
                    oAttorney.profession    = oIndividualCustomer.ProfessionCode;
                    oAttorney.OwnerID       = oIndividualCustomer.OwnerID;
                    oAttorney.notaryPublic  = "";
                    oAttorney.recordBook    = "";
                    oAttorney.recordSheets  = "";

                    //preenche telefone
                    this._fillsPhoneFields(oAttorney, oIndividualCustomer);

                    //Endereço
                    oAttorney.homeAddress.CEP          = oIndividualCustomer.StreetPostalCode;
                    oAttorney.homeAddress.publicPlace  = oIndividualCustomer.Street;
                    oAttorney.homeAddress.number       = Number(oIndividualCustomer.HouseNumber);
                    oAttorney.homeAddress.complement   = oIndividualCustomer.AddressLine4;
                    oAttorney.homeAddress.neighborhood = oIndividualCustomer.District;
                    oAttorney.homeAddress.county       = oIndividualCustomer.City;
                    oAttorney.homeAddress.UF           = oIndividualCustomer.StateCode;


                    //Valida Campos obrigatórios do Fragment
                    this._validationFragment(oAttorney);

                    this.byId("attorneyPhysicalPersonInstance").getModel("fragment").refresh(true);
                }else{
                    let aFieldClass = ["name", "surname", "mobile", "email", "phone", "sex", "maritalStatus", "birth", "RG",
                                       "RGIssuer", "UF", "naturalness", "nationality",  "motherName", "fatherName", "monthlyIncome",
                                       "profession", "notaryPublic", "recordBook", "recordSheets", "objectID", "customerID"];

                    aFieldClass.forEach(sField =>{
                        if(sField === "birth") oAttorney[sField] = null;
                        else if(sField === "monthlyIncome") oAttorney[sField] = "R$ 0,00";
                        else oAttorney[sField] = "";
                    });

                    //Limpa Endereço residencial
                    this._clearModelAddress(oAttorney.homeAddress);

                    oAttorney.CPFAndCNPJ = oCPF;

                    //Valida Campos obrigatórios do Fragment
                    this._validationFragment(oAttorney);

                    this.byId("attorneyPhysicalPersonInstance").getModel("fragment").refresh(true);
                }
            }

            this.setAppBusy(false);
        },

        onSearchFinancialOfficer: async function(oEvent){
            this.setAppBusy(true);

            let oID               = oEvent.getParameter("id"),
                oPositionFinacial = oID.indexOf("financialOfficer"),
                oValue            = this._clearFormatting(oEvent.getParameter("value"));

            if(oValue != ""){
                //Formato o campo CPF
                let oCPF = this._formateCPF(oValue);

                //seto o cpf formatado no input
                this.byId(oEvent.getParameter("id")).setValue(oCPF)

                //Busca proponente para carregar os campos na tela
                let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oValue}'&$format=json`).method('GET'),
                    oFinancialOfficer;
                
                if(oPositionFinacial != -1) oFinancialOfficer = this.byId("financialOfficerPhysicalPersonInstance").getModel("fragment").getData();
                else oFinancialOfficer = this.byId("legalRepresentativeInstance").getModel("fragment").getData();
                    //legalRepresentativeInstance

                if(oIndividualCustomer){
                    oFinancialOfficer.objectID       = oIndividualCustomer.ObjectID;
                    oFinancialOfficer.customerID     = oIndividualCustomer.CustomerID;
                    oFinancialOfficer.roleCode       = oIndividualCustomer.RoleCode;
                    oFinancialOfficer.CPFAndCNPJ     = this._formateCPF(oIndividualCustomer.CPFCNPJ_KUT);
                    oFinancialOfficer.name           = oIndividualCustomer.FirstName;
                    oFinancialOfficer.surname        = oIndividualCustomer.LastName;
                    oFinancialOfficer.email          = oIndividualCustomer.Email;
                    oFinancialOfficer.sex            = oIndividualCustomer.GenderCode;
                    oFinancialOfficer.maritalStatus  = oIndividualCustomer.MaritalStatusCode;
                    oFinancialOfficer.birth          = this._formatedDate(oIndividualCustomer.BirthDate);
                    oFinancialOfficer.RGNumber       = oIndividualCustomer.CIDENTIDADE_KUT;
                    oFinancialOfficer.RGIssuer       = oIndividualCustomer.OrgaoExpedidor_KUT;
                    oFinancialOfficer.UF             = oIndividualCustomer.Estadoorgaoemissor_KUT;
                    oFinancialOfficer.naturalness    = oIndividualCustomer.NacionalidadeCode_SDK;
                    oFinancialOfficer.nationality    = oIndividualCustomer.NationalityCountryCode;
                    oFinancialOfficer.motherName     = oIndividualCustomer.Nomedamae_KUT;
                    oFinancialOfficer.fatherName     = oIndividualCustomer.Nomedopai_KUT;
                    oFinancialOfficer.monthlyIncome  = this._formateValue(oIndividualCustomer.Rendamensal_KUT, undefined);
                    oFinancialOfficer.profession     = oIndividualCustomer.ProfessionCode;
                    oFinancialOfficer.OwnerID        = oIndividualCustomer.OwnerID;
                    oFinancialOfficer.registryOffice = "";

                    //preenche telefone
                    this._fillsPhoneFields(oFinancialOfficer, oIndividualCustomer);

                    //Dados profissionais
                    oFinancialOfficer.company.companyName   = oIndividualCustomer.Empresa_KUT
                    oFinancialOfficer.company.office        = oIndividualCustomer.Cargo_KUT
                    oFinancialOfficer.company.admissionDate = this._formatedDate(oIndividualCustomer.Dataadmissao_KUT);
                    oFinancialOfficer.company.telePhone     = "";
                    oFinancialOfficer.company.CEP           = oIndividualCustomer.CEPEmpresa_KUT;
                    oFinancialOfficer.company.publicPlace   = oIndividualCustomer.Logradouroempresa_KUT;
                    oFinancialOfficer.company.number        = oIndividualCustomer.Numeroempresa_KUT;
                    oFinancialOfficer.company.complement    = oIndividualCustomer.Complementoempresa_KUT;
                    oFinancialOfficer.company.neighborhood  = oIndividualCustomer.Bairroempresa_KUT;
                    oFinancialOfficer.company.county        = oIndividualCustomer.Municipioempresa_KUT;
                    oFinancialOfficer.company.UF            = oIndividualCustomer.ZEstadoEmpresa_KUT;

                    //Endereço
                    oFinancialOfficer.homeAddress.CEP          = oIndividualCustomer.StreetPostalCode;
                    oFinancialOfficer.homeAddress.publicPlace  = oIndividualCustomer.Street;
                    oFinancialOfficer.homeAddress.number       = Number(oIndividualCustomer.HouseNumber);
                    oFinancialOfficer.homeAddress.complement   = oIndividualCustomer.AddressLine4;
                    oFinancialOfficer.homeAddress.neighborhood = oIndividualCustomer.District;
                    oFinancialOfficer.homeAddress.county       = oIndividualCustomer.City;
                    oFinancialOfficer.homeAddress.UF           = oIndividualCustomer.StateCode;


                    //Valida Campos obrigatórios do Fragment
                    this._validationFragment(oFinancialOfficer);

                    this.byId("financialOfficerPhysicalPersonInstance").getModel("fragment").refresh(true);
                }else{
                    let aFieldClass = ["objectID", "customerID", "name", "surname", "mobile", "email", "phone", "sex",
                                       "maritalStatus", "birth", "RG", "RGIssuer", "UF", "naturalness", "nationality",
                                       "motherName", "fatherName", "monthlyIncome", "profession", "registryOffice"];

                    aFieldClass.forEach(sField =>{
                        if(sField === "birth") oFinancialOfficer[sField] = null;
                        else if(sField === "monthlyIncome") oFinancialOfficer[sField] = "R$ 0,00";
                        else oFinancialOfficer[sField] = "";
                    });

                    //Limpa dados da empresa
                    this._clearModelCompany(oFinancialOfficer.company);

                    //Limpa Endereço residencial
                    this._clearModelAddress(oFinancialOfficer.homeAddress);

                    oFinancialOfficer.CPFAndCNPJ = oCPF;

                    //Valida Campos obrigatórios do Fragment
                    this._validationFragment(oFinancialOfficer);

                    this.byId("financialOfficerPhysicalPersonInstance").getModel("fragment").refresh(true);
                }
            }

            this.setAppBusy(false);
        },

        onSearchGuarantor: async function(oEvent){
            this.setAppBusy(true);

            let oValue = this._clearFormatting(oEvent.getParameter("value"));

            if(oValue != ""){
                //Formato o campo CPF
                let oCPF = this._formateCPF(oValue);

                //seto o cpf formatado no input
                this.byId(oEvent.getParameter("id")).setValue(oCPF)

                //Busca proponente para carregar os campos na tela
                let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oValue}'&$format=json`).method('GET'),
                    oGuarantor          = this.byId("guarantorPhysicalPersonInstance").getModel("fragment").getData();

                if(oIndividualCustomer){
                    let oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET'),
                        oBusinessPartnerCustomerID;

                    if(oBusinessPartner === undefined){
                        oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET');
                    
                        if(oBusinessPartner != undefined){
                            oBusinessPartnerCustomerID = oBusinessPartner.FirstBusinessPartnerID;
                        }
                    }else{
                        oBusinessPartnerCustomerID = oBusinessPartner.SecondBusinessPartnerID;
                    }

                    if(oBusinessPartner != undefined){
                        let oIndividualCustomerSpouse = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${oBusinessPartnerCustomerID}'&$format=json`).method('GET')
                    
                        if(oIndividualCustomerSpouse != undefined){
                            this._fillInSpouseFields(oGuarantor.biddersSpouseData, oIndividualCustomerSpouse);

                            let oTextReject = this.getResourceBundle().getText("proponentButtonHideSpouse");
                            this.getModel("texts").setProperty("/buttonShowHideSpouseGuarantor", oTextReject);

                            this.byId("buttonShowHideSpouseGuarantor").removeStyleClass("buttonShowSpouseAccept");
                            this.byId("buttonShowHideSpouseGuarantor").addStyleClass("buttonHideSpouseReject");
                            this.byId("spousePhysicalPersonGuarantor").setVisible(true);
                                
                            this.getModel("texts").refresh(true);
                        }
                    }else{
                        let oTextAccept = this.getResourceBundle().getText("proponentButtonShowSpouse");
                        this.getModel("texts").setProperty("/buttonShowHideSpouseGuarantor", oTextAccept);

                        this.byId("buttonShowHideSpouseGuarantor").removeStyleClass("buttonHideSpouseReject");
                        this.byId("buttonShowHideSpouseGuarantor").addStyleClass("buttonShowSpouseAccept");
                        this.byId("spousePhysicalPersonGuarantor").setVisible(false);
                    
                        this.getModel("texts").refresh(true);
                    }

                    oGuarantor.objectID       = oIndividualCustomer.ObjectID;
                    oGuarantor.customerID     = oIndividualCustomer.CustomerID;
                    oGuarantor.roleCode       = oIndividualCustomer.RoleCode;
                    oGuarantor.CPFAndCNPJ     = this._formateCPF(oIndividualCustomer.CPFCNPJ_KUT);
                    oGuarantor.name           = oIndividualCustomer.FirstName;
                    oGuarantor.surname        = oIndividualCustomer.LastName;
                    //oGuarantor.mobile         = this._formatePhone(oIndividualCustomer.Mobile);
                    oGuarantor.email          = oIndividualCustomer.Email;
                    //oGuarantor.phone          = this._formatePhone(oIndividualCustomer.Phone);
                    oGuarantor.sex            = oIndividualCustomer.GenderCode;
                    oGuarantor.maritalStatus  = oIndividualCustomer.MaritalStatusCode;

                    //preenche telefone
                    this._fillsPhoneFields(oGuarantor, oIndividualCustomer);

                    if(oIndividualCustomer.MaritalStatusCode === '2'){
                        this.byId("buttonShowHideSpouseGuarantor").setVisible(true);
                    }else{
                        this.byId("buttonShowHideSpouseGuarantor").setVisible(false);
                    }

                    oGuarantor.birth          = this._formatedDate(oIndividualCustomer.BirthDate);
                    oGuarantor.RGNumber       = oIndividualCustomer.CIDENTIDADE_KUT;
                    oGuarantor.RGIssuer       = oIndividualCustomer.OrgaoExpedidor_KUT;
                    oGuarantor.UF             = oIndividualCustomer.Estadoorgaoemissor_KUT;
                    oGuarantor.naturalness    = oIndividualCustomer.NacionalidadeCode_SDK;
                    oGuarantor.nationality    = oIndividualCustomer.NationalityCountryCode;
                    oGuarantor.motherName     = oIndividualCustomer.Nomedamae_KUT;
                    oGuarantor.fatherName     = oIndividualCustomer.Nomedopai_KUT;
                    oGuarantor.monthlyIncome  = this._formateValue(oIndividualCustomer.Rendamensal_KUT, undefined);
                    oGuarantor.profession     = oIndividualCustomer.ProfessionCode;
                    oGuarantor.OwnerID        = oIndividualCustomer.OwnerID;
                    oGuarantor.registryOffice = "";

                    //Dados profissionais
                    oGuarantor.company.companyName   = oIndividualCustomer.Empresa_KUT
                    oGuarantor.company.office        = oIndividualCustomer.Cargo_KUT
                    oGuarantor.company.admissionDate = this._formatedDate(oIndividualCustomer.Dataadmissao_KUT);
                    oGuarantor.company.telePhone     = "";
                    oGuarantor.company.CEP           = oIndividualCustomer.CEPEmpresa_KUT;
                    oGuarantor.company.publicPlace   = oIndividualCustomer.Logradouroempresa_KUT;
                    oGuarantor.company.number        = oIndividualCustomer.Numeroempresa_KUT;
                    oGuarantor.company.complement    = oIndividualCustomer.Complementoempresa_KUT;
                    oGuarantor.company.neighborhood  = oIndividualCustomer.Bairroempresa_KUT;
                    oGuarantor.company.county        = oIndividualCustomer.Municipioempresa_KUT;
                    oGuarantor.company.UF            = oIndividualCustomer.ZEstadoEmpresa_KUT;

                    //Endereço
                    oGuarantor.homeAddress.CEP          = oIndividualCustomer.StreetPostalCode;
                    oGuarantor.homeAddress.publicPlace  = oIndividualCustomer.Street;
                    oGuarantor.homeAddress.number       = Number(oIndividualCustomer.HouseNumber);
                    oGuarantor.homeAddress.complement   = oIndividualCustomer.AddressLine4;
                    oGuarantor.homeAddress.neighborhood = oIndividualCustomer.District;
                    oGuarantor.homeAddress.county       = oIndividualCustomer.City;
                    oGuarantor.homeAddress.UF           = oIndividualCustomer.StateCode;


                    //Valida Campos obrigatórios do Fragment
                    this._validationFragment(oGuarantor);

                    this.byId("guarantorPhysicalPersonInstance").getModel("fragment").refresh(true);
                }else{
                    let aFieldClass = ["objectID", "customerID", "name", "surname", "mobile","email", "phone", "sex",
                                       "maritalStatus", "birth", "RG", "RGIssuer", "UF", "naturalness", "nationality",
                                       "motherName", "fatherName", "monthlyIncome", "profession", "registryOffice"
                                      ];
                    
                    aFieldClass.forEach(sField =>{
                        if(sField === "birth") oGuarantor[sField] = null;
                        else if(sField === "monthlyIncome") oGuarantor[sField] = "R$ 0,00";
                        else oGuarantor[sField] = "";
                    });

                    //Limpa dados da empresa
                    this._clearModelCompany(oGuarantor.company);

                    //Limpa Endereço residencial
                    this._clearModelAddress(oGuarantor.homeAddress);   
                    
                    //Limpa dados do cônjuge
                    this._clearModelBidderSpouse(oGuarantor.biddersSpouseData, "professionalData");

                    oGuarantor.CPFAndCNPJ = oCPF;

                    //Valida Campos obrigatórios do Fragment
                    this._validationFragment(oGuarantor);

                    this.byId("guarantorPhysicalPersonInstance").getModel("fragment").refresh(true);
                }
            }

            this.setAppBusy(false);
        },

        onSearchBiddersSpouse: async function(oEvent){
            this.setAppBusy(true);

            let oValue = this._clearFormatting(oEvent.getParameter("value"));

            if(oValue != ""){
                //Formato o campo CPF
                let oCPF = this._formateCPF(oValue);

                //seto o cpf formatado no input
                this.byId(oEvent.getParameter("id")).setValue(oCPF)

                //Busca proponente para carregar os campos na tela
                let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oValue}'&$format=json`).method('GET'),
                    oInstance           = this.byId("guarantorPhysicalPersonInstance"),
                    oModel;

                    if(oInstance === undefined){
                        oInstance = this.byId("proponentInstance")
                        oModel     = oInstance.getModel("fragment").getData().physicalPerson;
                    }else{
                        oModel = oInstance.getModel("fragment").getData();
                    }
            
                if(oIndividualCustomer){
                    this._fillInSpouseFields(oModel.biddersSpouseData, oIndividualCustomer);

                    //Valida Campos obrigatórios do Fragment
                    this._validationBidderSpouse(oModel, "biddersSpouseData", oInstance);

                    oInstance.getModel("fragment").refresh(true);
                }else{
                    //Limpa dados do cônjuge
                    this._clearModelBidderSpouse(oModel.biddersSpouseData, "professionalData");

                    oModel.biddersSpouseData.cpf = oCPF;

                    //Valida Campos obrigatórios do Fragment
                    this._validationBidderSpouse(oModel, "biddersSpouseData", oInstance);
                }
            }

            this.setAppBusy(false);
        },

        onSearchCEP: async function(oEvent){
            this.setAppBusy(true);

            let oID        = oEvent.getParameter("id"),
                oNumberCEP = oEvent.getParameter("value"),
                oPositionProponent = oID.indexOf("phisicalPerson");

            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            let oInstance, oModel;

            if(oPositionProponent === -1){
                let oPositionFinancial = oID.indexOf("financialOfficer");
                
                if(oPositionFinancial === -1){
                    let oPositionGuarantor = oID.indexOf("Guarantor");

                    if(oPositionGuarantor === -1){
                        oInstance = this.byId("legalRepresentativeInstance");

                        oModel = oInstance.getModel("fragment").getData().company;//company
                    }else{
                        oInstance = this.byId("guarantorPhysicalPersonInstance");

                        let oPositionBidderSpouse = oID.indexOf("BidderSpouseGuarantorCompanyCEP");

                        if(oPositionBidderSpouse != -1) oModel = oInstance.getModel("fragment").getData().biddersSpouseData.professionalData;
                        else oModel = oInstance.getModel("fragment").getData().company;//company
                    }
                }
                else{
                    oInstance = this.byId("financialOfficerPhysicalPersonInstance");

                    oModel = oInstance.getModel("fragment").getData().company;//company
                }
            }else{
                oInstance = this.byId("proponentInstance");

                let oPositionBidderSpouse = oID.indexOf("BidderSpouseCEP");

                if(oPositionBidderSpouse != -1) oModel = oInstance.getModel("fragment").getData().physicalPerson.biddersSpouseData.professionalData;
                else oModel = oInstance.getModel("fragment").getData().physicalPerson.biddersProfessionalData; //biddersProfessionalData
            }

            await this._searchCEP(oNumberCEP, oModel);

            oInstance.getModel("fragment").refresh(true);

            let oPositionProfessional = oID.indexOf("professionalDataBidderSpouseGuarantor");

            if(oPositionProfessional != -1){
                this._validationBidderSpouse(oInstance.getModel("fragment").getData(), "biddersSpouseData", undefined);
            }else{
                let oPositionProfessionalPhysical = oID.indexOf("ProfessionalDataBidderSpouse");

                if(oPositionProfessionalPhysical != -1){
                    this._validationBidderSpouse(oInstance.getModel("fragment").getData().physicalPerson, "biddersSpouseData", undefined);
                }
            }

            oInstance.getModel("fragment").refresh(true);

            this.setAppBusy(false);
        },

        onValidationPhysicalPerson: async function(oEvent){
            this.setAppBusy(true);
            //Pego o model a ser validado
            let oProponent = this.byId("proponentInstance").getModel("fragment").getData();

            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            let oID          = oEvent.getParameter("id"),
                oPositionCEP = oID.indexOf("CEP");

            //Busca o endereço pelo cep digitado
            if(oPositionCEP != -1){
                let oNumberCEP = oEvent.getParameter("value");

                await this._searchCEP(oNumberCEP, oProponent.physicalPerson.homeAddress);

                this.byId("proponentInstance").getModel("fragment").refresh(true);
            }

            //Chamo o method de validação passando o model
            this._validationProponent(oProponent.physicalPerson);

            if(oProponent.physicalPerson.biddersSpouseData.cpf != ""){
                this._validationBidderSpouse(oProponent.physicalPerson, "biddersSpouseData", this.byId("proponentInstance"));
            }

            this.setAppBusy(false);
        },

        onValidationLegalPerson: async function(oEvent){
            this.setAppBusy(true);
            //Pego o model a ser validado
            let oProponent = this.byId("proponentInstance").getModel("fragment").getData();

            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            let oID          = oEvent.getParameter("id"),
                oPositionCEP = oID.indexOf("CEP");

            //Busca o endereço pelo cep digitado
            if(oPositionCEP != -1){
                let oNumberCEP = oEvent.getParameter("value");

                await this._searchCEP(oNumberCEP, oProponent.legalPerson.companyAddress);
                this.byId("proponentInstance").getModel("fragment").refresh(true);
            }

            //Chamo o method de validação passando o model
            this._validationProponent(oProponent.legalPerson);

            this.setAppBusy(false);
        },

        onValidationFragmentAttorney: async function(oEvent){
            this.setAppBusy(true);

            let oModel = this.byId("attorneyPhysicalPersonInstance").getModel("fragment").getData();
            
            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            let oID          = oEvent.getParameter("id"),
                oPositionCEP = oID.indexOf("CEP");

            //Busca o endereço pelo cep digitado
            if(oPositionCEP != -1){
                let oNumberCEP = oEvent.getParameter("value");

                await this._searchCEP(oNumberCEP, oModel.homeAddress);
                this.byId("attorneyPhysicalPersonInstance").getModel("fragment").refresh(true);
            }

            //Valida Campos obrigatórios do Fragment
            this._validationFragment(oModel);

            this.setAppBusy(false);
        },

        onValidationFragmentFinancialOfficer: async function(oEvent){
            this.setAppBusy(true);

            let oModel = this.byId("financialOfficerPhysicalPersonInstance").getModel("fragment").getData();
            
            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            let oID          = oEvent.getParameter("id"),
                oPositionCEP = oID.indexOf("CEP");

            //Busca o endereço pelo cep digitado
            if(oPositionCEP != -1){
                let oNumberCEP = oEvent.getParameter("value");

                await this._searchCEP(oNumberCEP, oModel.homeAddress);
                this.byId("financialOfficerPhysicalPersonInstance").getModel("fragment").refresh(true);
            }

            //Valida Campos obrigatórios do Fragment
            this._validationFragment(oModel);

            this.setAppBusy(false);
        },

        onValidationFragmentGuarantor: async function(oEvent){
            this.setAppBusy(true);

            let oModel = this.byId("guarantorPhysicalPersonInstance").getModel("fragment").getData();
            
            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            let oID          = oEvent.getParameter("id"),
                oPositionCEP = oID.indexOf("CEP");

            //Busca o endereço pelo cep digitado
            if(oPositionCEP != -1){
                let oNumberCEP = oEvent.getParameter("value");

                await this._searchCEP(oNumberCEP, oModel.homeAddress);
                this.byId("guarantorPhysicalPersonInstance").getModel("fragment").refresh(true);
            }

            //Valida Campos obrigatórios do Fragment
            this._validationFragment(oModel);

            if(oModel.biddersSpouseData.cpf != ""){
                this._validationBidderSpouse(oModel, "biddersSpouseData", this.byId("guarantorPhysicalPersonInstance"));
            }

            this.setAppBusy(false);
        },

        onValidationBidderSpouse: function(oEvent){
            this.setAppBusy(true);

            let oId         = oEvent.getParameter("id"),
                oValue      = oEvent.getParameter("value"),
                oPositionID = oId.indexOf("MonthlyIncome");

            if(oPositionID != -1){
                this._formateValue(oValue, oId);
            }

            let oInstance = this.byId("guarantorPhysicalPersonInstance"),
                oData;

            if(oInstance === undefined){
                oInstance = this.byId("proponentInstance")
                oData     = oInstance.getModel("fragment").getData().physicalPerson;
            }else{
                oData = oInstance.getModel("fragment").getData();
            }
            
            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            //Valida Campos obrigatórios do Cônjugue
            this._validationBidderSpouse(oData, "biddersSpouseData", oInstance);

            this.setAppBusy(false);
        },

        onValidationFragmentLegalRepresentative: async function(oEvent){
            this.setAppBusy(true);

            let oModel = this.byId("legalRepresentativeInstance").getModel("fragment").getData();
            
            //Formata o campo de acordo com qual campos esteja sendo requisitado
            this._formateRequiredFields(oEvent);

            let oID          = oEvent.getParameter("id"),
                oPositionCEP = oID.indexOf("CEP");

            //Busca o endereço pelo cep digitado
            if(oPositionCEP != -1){
                let oNumberCEP = oEvent.getParameter("value");

                await this._searchCEP(oNumberCEP, oModel.homeAddress);
                this.byId("legalRepresentativeInstance").getModel("fragment").refresh(true);
            }

            //Valida Campos obrigatórios do Fragment
            this._validationFragment(oModel);

            this.setAppBusy(true);
        },

        onCheckMainBuyer: function(oEvent){
            let oKey      = oEvent.getSource().getDependents()[0].getProperty("text"),
                oSelected = oEvent.getParameter("selected");

            if(oSelected){
                let oProponent = this.byId("proponentInstance").getModel("fragment").getData(),
                    oId        = oEvent.getParameter("id"),
                    oPosition  = oId.indexOf("PhysicalPerson");
                
                if(oPosition === -1){
                    if(oProponent.physicalPerson != undefined) oProponent.physicalPerson.checkBoxMainBuyer = false;
                }else{
                    if(oProponent.legalPerson != undefined) oProponent.legalPerson.checkBoxMainBuyer = false;
                }

                //this.getModel("involvedParties").getData().mainBuyerKey = Number(oKey);
                //this.getModel("involvedParties").refresh(true);
            }
        },

        onValidateProposal: function(oEvent) {
            this._validationProposal();
        },

        onResetPaymentConditions: function(oEvent){
            let oModel           = this.getModel("paymentConditions").getData(), 
                oModelEnterprise = this.getModel("enterprises").getData();
                oTableValue      = Number(this._clearFormattingValue(oModelEnterprise.items[0].tableValue)),
                oNetValueSBPE    = Number(this._clearFormattingValue(oModelEnterprise.items[0].SBPEValue)),
                oNetValueCVA     = Number(this._clearFormattingValue(oModelEnterprise.items[0].CVAValue));

            switch (oModel.selectionSaleForm) {
                case "Z01": //Financiada
                    if(oModel.selectionPurchaseMethod === "1"){
                        this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValue}`, undefined);
                        this.getModel("proposalEvaluation").refresh(true);

                        oModelEnterprise.tableVisible = true;
                        oModelEnterprise.tetoVisible  = false;
                        this.getModel("enterprises").refresh(true);

                        oModel.items = this._fillInSBPESalesForm(oTableValue, oNetValueSBPE);
                    }else
                    if(oModel.selectionPurchaseMethod === "2"){
                        let oTableValueTeto = Number(this._clearFormattingValue(oModel.items[0].tableValueTetoCVA));

                        this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValueTeto}`, undefined);
                        this.getModel("proposalEvaluation").refresh(true);

                        oModelEnterprise.tableVisible = false;
                        oModelEnterprise.tetoVisible  = true;
                        this.getModel("enterprises").refresh(true);

                        oModel.items = this._fillInCVASalesForm(oTableValueTeto, oNetValueCVA)
                    }
                    break;
                case "Z02": //Direta
                    oModel.items = this._fillOutDirectSalesForm(oTableValue, oNetValueSBPE);
                    break;
                case "Z03": //À vista
                    oModel.items = this._fillInCashSaleForm(oTableValue);
                    break;
                case "Z04": //FGTS
                    oModel.items = this._fillInFGTSSalesForm(oTableValue, oNetValueSBPE);
                    break;
            }

            this.getModel("paymentConditions").refresh(true);
        },

        onPressItemInvolvedParties: function(oEvent){
            let oModelPath = oEvent.getSource().getBindingContext("involvedParties").getPath(),
                oPath      = oModelPath.split("/").slice(-1).pop(),
                oItems     = this.getModel("involvedParties").getData().items,
                oItem      = oItems[oPath];

            switch (oItem.functionCode) {
                case "31":
                    this._pressItemProponent(oItem);
                    break;
                case "ZP":
                    this._pressItemAttorney(oItem);
                    break;
                case "ZR":
                    this._pressItemFinancialOfficer(oItem);
                    break;
                case "Z1":
                    this._pressItemGuarantor(oItem);
                    break;
                case "ZRL":
                    this._pressItemLegalRepresentative(oItem);
                    break;
            }
        },

        onAddItemProponent: function(oEvent){
            this._oProponentPage.removeAllContent();

            this.getModel("involvedParties").getData().bSave = false;
            this.getModel("involvedParties").getData().bEdit = false;
            this.getModel("involvedParties").refresh(true);

            let oObject               = Proponent.initSelectionModel(),
                oItemsInvolvedParties = this.getModel("involvedParties").getData().items;

            if(oItemsInvolvedParties.length != 0){
                for(let oItem of oItemsInvolvedParties){
                    if(oItem.functionCode === "31"){
                        if(oItem.checkBoxMainBuyer === true){
                            oObject.physicalPerson.checkBoxMainBuyer = false;
                            oObject.legalPerson.checkBoxMainBuyer    = false;
                        }
                    }
                }
            }else{
                oObject.legalPerson.checkBoxMainBuyer = false;

                this.getModel("involvedParties").getData().mainBuyerKey = oObject.physicalPerson.key;
                this.getModel("involvedParties").refresh(true);
            }

            let oModel = new JSONModel(oObject);

            this._oNavContainer.to(this._oProponentPage);

            this._getFragment("ProponentInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");

                this._oProponentPage.insertContent(oFragment);

                this.byId("rbg1").setEnabled(true);
            }.bind(this));
        },

        onCloseItemProponent: function(oEvent) {
            this._oNavContainer.back();

            this._oProponentPage.removeAllContent();
        },

        onSaveProponent: async function(oEvent){
            this.setAppBusy(true);

            let oProponent = this.byId("proponentInstance").getModel("fragment").getData();
                
            if(oProponent.physicalPerson.radioButtonCPF){
                this._checkMainBuyer(oProponent.physicalPerson);

                if(oProponent.physicalPerson.OwnerID === ""){
                    oProponent.physicalPerson.OwnerID = this.objectRoles.EmployeeID;

                    this.byId("proponentInstance").getModel("fragment").refresh();
                }

                let oObject = this._createObjectPhysicalPerson(oProponent.physicalPerson, "POST");
                
                //verifico se o cpf do conjuge foi inserido, 
                //se sim faço outra validação para saber se o cliente é novo ou se é um cliente já existente
                if(oProponent.physicalPerson.biddersSpouseData.cpf != ""){

                    if(oProponent.physicalPerson.biddersSpouseData.OwnerID === ""){
                        oProponent.physicalPerson.biddersSpouseData.OwnerID = this.objectRoles.EmployeeID;

                        this.byId("proponentInstance").getModel("fragment").refresh();
                    }

                    let oObjectSpouse = this._createObjectBidderSpouse(oProponent.physicalPerson.biddersSpouseData, oProponent.physicalPerson,"PATCH");

                    if(oProponent.physicalPerson.biddersSpouseData.objectID != ""){
                        oObjectSpouse.ObjectID = oProponent.physicalPerson.biddersSpouseData.objectID;

                        let oCustomerSpouse = { IndividualCustomer: oObjectSpouse };

                        let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                            oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomerSpouse, oToken);

                        if(oResponse.status >= 200 && oResponse.status <= 300){
                            let oBidderSpouse  = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObjectSpouse.CPFCNPJ_KUT}'&$format=json`).method('GET');

                            let oPromiseClient = new Promise(
                                    function(resolve, reject){
                                        this.getModel().create("/IndividualCustomerCollection", oObject, {
                                            success: function(oData){
                                                resolve(oData);
                                            }.bind(this),
                                            error: function(oError){
                                                reject(oError);
                                            }.bind(this)
                                        });
                                    }.bind(this)
                                );

                            oPromiseClient.then(
                                async function(oData){
                                    oProponent.physicalPerson.objectID   = oData.ObjectID;
                                    oProponent.physicalPerson.customerID = oData.CustomerID;


                                    let oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${oData.CustomerID}'&$format=json`).method('GET'),
                                        oRelationshipCustomerID;

                                    if(oRelationship === undefined){
                                        oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${oData.CustomerID}'&$format=json`).method('GET');
                                    
                                        if(oRelationship != undefined){
                                            oRelationshipCustomerID = oRelationship.FirstBusinessPartnerID;
                                        }
                                    }else{
                                        oRelationshipCustomerID = oRelationship.SecondBusinessPartnerID;
                                    }

                                    if(oRelationship === undefined){
                                        let oObjectRelationship = {
                                                RelationshipType: "ZCRM02",
                                                FirstBusinessPartnerID: oData.CustomerID,
                                                SecondBusinessPartnerID: oBidderSpouse.CustomerID,
                                                MainIndicator: true,
                                            };

                                        this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                            success: function(oDataBusines){                       
                                                let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                                                this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
                                                
                                                this.getModel("involvedParties").refresh(true);
                        
                                                this.setAppBusy(false);

                                                if(bValid){
                                                    this._oProponentPage.removeAllContent();
                            
                                                    this._oNavContainer.back();
                                                }
                                            }.bind(this),
                                            error: function(oError){
                                                this.setAppBusy(false);

                                                MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                            }.bind(this)
                                        });
                                    }else{
                                        oProponent.physicalPerson.objectID   = oData.ObjectID;
                                        oProponent.physicalPerson.customerID = oData.CustomerID;
                
                                        let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                                        this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
                                        
                                        this.getModel("involvedParties").refresh(true);
                
                                        this.setAppBusy(false);

                                        if(bValid){
                                            this._oProponentPage.removeAllContent();
                    
                                            this._oNavContainer.back();
                                        }
                                    }
                                }.bind(this)
                            )
                            .catch(
                                function(oError){
                                    this.setAppBusy(false);
    
                                    //console.log(oError);
                                    let sError = JSON.parse(oError.responseText);
            
                                    MessageBox.error(sError.error.message.value); 
                                }.bind(this)
                            )
                        }else{
                            this.setAppBusy(false);

                            MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                        }
                    }else{
                        let oPromiseAll = [];

                        //Cliente Principal
                        oPromiseAll.push(
                            new Promise(
                                function(resolve, reject){
                                    this.getModel().create("/IndividualCustomerCollection", oObject, {
                                        success: function(oData){
                                            oProponent.physicalPerson.objectID   = oData.ObjectID;
                                            oProponent.physicalPerson.customerID = oData.CustomerID;
                                            resolve(oData);
                                        }.bind(this),
                                        error: function(oError){
                                            reject(oError);
                                        }.bind(this)
                                    });
                                }.bind(this)
                            )
                        );
                        
                        //Cônjuge do Cliente
                        oPromiseAll.push(
                            new Promise(
                                function(resolve, reject){
                                    this.getModel().create("/IndividualCustomerCollection", oObjectSpouse, {
                                        success: function(oData){
                                            oProponent.physicalPerson.biddersSpouseData.objectID   = oData.ObjectID;
                                            oProponent.physicalPerson.biddersSpouseData.customerID = oData.CustomerID;

                                            resolve(oData);
                                        }.bind(this),
                                        error: function(oError){
                                            reject(oError);
                                        }.bind(this)
                                    });
                                }.bind(this)
                            )
                        );

                        Promise.all(oPromiseAll)
                        .then(
                            function(oData){
                                let oObjectRelationship = {
                                    RelationshipType: "ZCRM02",
                                    FirstBusinessPartnerID: oData[0].CustomerID,
                                    SecondBusinessPartnerID: oData[1].CustomerID,
                                    MainIndicator: true,
                                };

                                this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                    success: function(oDataBusiness){                       
                                        let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                                        this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
                                                
                                        this.getModel("involvedParties").refresh(true);
                        
                                        this.setAppBusy(false);

                                        if(bValid){
                                            this._oProponentPage.removeAllContent();
                            
                                            this._oNavContainer.back();
                                        }
                                    }.bind(this),
                                    error: function(oError){
                                        this.setAppBusy(false);

                                        MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                    }.bind(this)
                                });
                            }.bind(this)
                        ).catch(
                            function(oError){
                                this.setAppBusy(false);
    
                                let sError = JSON.parse(oError.responseText);
        
                                MessageBox.error(sError.error.message.value); 
                            }.bind(this)
                        );
                    }
                }else{
                    this.getModel().create("/IndividualCustomerCollection", oObject, {
                        success: function(oData){
                            oProponent.physicalPerson.objectID   = oData.ObjectID;
                            oProponent.physicalPerson.customerID = oData.CustomerID;
    
                            let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                            this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
                            
                            this.getModel("involvedParties").refresh(true);
    
                            this.setAppBusy(false);

                            if(bValid){
                                this._oProponentPage.removeAllContent();
        
                                this._oNavContainer.back();
                            }
    
                            MessageToast.show(this.getResourceBundle().getText("messageSuccessSaveProponent"));
                        }.bind(this),
                        error: function(oError){
                            this.setAppBusy(false);
    
                            //console.log(oError);
                            let sError = JSON.parse(oError.responseText);
    
                            MessageBox.error(sError.error.message.value);
                        }.bind(this)
                    });
                }
            }else{
                this._checkMainBuyer(oProponent.legalPerson);

                if(oProponent.legalPerson.OwnerID === ""){
                    oProponent.legalPerson.OwnerID = this.objectRoles.EmployeeID;

                    this.byId("proponentInstance").getModel("fragment").refresh();
                }
                
                let oObject = this._createObjectLegalPerson(oProponent.legalPerson, "POST");

                this.setAppBusy(true);

                this.getModel().create("/CorporateAccountCollection", oObject, {
                    success: function(oData){
                        oProponent.legalPerson.objectID   = oData.ObjectID;
                        oProponent.legalPerson.customerID = oData.IDCliente_KUT;

                        let bValid = this._editInvolvedParties(oProponent.legalPerson);
                        this.getModel("involvedParties").getData().legalPerson = true;
                        
                        this.getModel("involvedParties").refresh(true);

                        this.setAppBusy(false);

                        if(bValid){
                            this._oProponentPage.removeAllContent();

                            this._oNavContainer.back();
                        }

                        MessageToast.show(this.getResourceBundle().getText("messageSuccessSaveProponent"));
                    }.bind(this),
                    error: function(oError){
                        this.setAppBusy(false);

                        //console.log(oError);
                        let sError = JSON.parse(oError.responseText);

                        MessageBox.error(sError.error.message.value);
                    }.bind(this)
                });
            }
        },

        onEditProponent: async function(oEvent){
            let oProponent = this.byId("proponentInstance").getModel("fragment").getData();

            this.setAppBusy(true);

            if(oProponent.physicalPerson != undefined){
                if(oProponent.physicalPerson.radioButtonCPF){
                    this._checkMainBuyer(oProponent.physicalPerson);

                    if(oProponent.physicalPerson.OwnerID === ""){
                        oProponent.physicalPerson.OwnerID = this.objectRoles.EmployeeID;

                        this.byId("proponentInstance").getModel("fragment").refresh();
                    }

                    let oObject = this._createObjectPhysicalPerson(oProponent.physicalPerson, "PATCH");

                    if(oProponent.physicalPerson.biddersSpouseData.cpf != ""){

                        if(oProponent.physicalPerson.biddersSpouseData.OwnerID === ""){
                            oProponent.physicalPerson.biddersSpouseData.OwnerID = this.objectRoles.EmployeeID;

                            this.byId("proponentInstance").getModel("fragment").refresh();
                        }

                        let oObjectSpouse = this._createObjectBidderSpouse(oProponent.physicalPerson.biddersSpouseData, oProponent.physicalPerson, "PATCH");

                        if(oProponent.physicalPerson.biddersSpouseData.objectID != ""){
                            oObjectSpouse.ObjectID = oProponent.physicalPerson.biddersSpouseData.objectID;

                            let oCustomerSpouse = { IndividualCustomer: oObjectSpouse };

                            let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                                oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomerSpouse, oToken);

                            if(oResponse.status >= 200 && oResponse.status <= 300){
                                let oBidderSpouse  = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObjectSpouse.CPFCNPJ_KUT}'&$format=json`).method('GET');
                            
                                oObject.ObjectID = oProponent.physicalPerson.objectID;

                                let oCustomer = { IndividualCustomer: oObject };

                                let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                                    oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);

                                if(oResponse.status >= 200 && oResponse.status <= 300){
                                    let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObject.CPFCNPJ_KUT}'&$format=json`).method('GET');
                               
                                    let oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET'),
                                        oRelationshipCustomerID;

                                    if(oRelationship === undefined){
                                        oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET');
                                    
                                        if(oRelationship != undefined){
                                            oRelationshipCustomerID = oRelationship.FirstBusinessPartnerID;
                                        }
                                    }else{
                                        oRelationshipCustomerID = oRelationship.SecondBusinessPartnerID;
                                    }

                                    if(oRelationship === undefined){
                                        let oObjectRelationship = {
                                                RelationshipType: "ZCRM02",
                                                FirstBusinessPartnerID: oIndividualCustomer.CustomerID,
                                                SecondBusinessPartnerID: oBidderSpouse.CustomerID,
                                                MainIndicator: true,
                                            };

                                        this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                            success: function(oDataBusines){                       
                                                let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                                                this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
                                                
                                                this.getModel("involvedParties").refresh(true);
                        
                                                this.setAppBusy(false);

                                                if(bValid){
                                                    this._oProponentPage.removeAllContent();
                            
                                                    this._oNavContainer.back();
                                                }
                                            }.bind(this),
                                            error: function(oError){
                                                this.setAppBusy(false);

                                                MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                            }.bind(this)
                                        });
                                    }else{
                                        let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                                        this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
                                        
                                        this.getModel("involvedParties").refresh(true);
                
                                        this.setAppBusy(false);

                                        if(bValid){
                                            this._oProponentPage.removeAllContent();
                    
                                            this._oNavContainer.back();
                                        }
                                    }
                                }else{
                                    this.setAppBusy(false);

                                    MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                                }
                            }else{
                                this.setAppBusy(false);

                                MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent"));
                            }
                        }else{
                            oObject.ObjectID = oProponent.physicalPerson.objectID;

                            let oCustomer = { IndividualCustomer: oObject };

                            let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                                oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);

                            if(oResponse.status >= 200 && oResponse.status <= 300){
                                let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObject.CPFCNPJ_KUT}'&$format=json`).method('GET');

                                this.getModel().create("/IndividualCustomerCollection", oObjectSpouse, {
                                    success: function(oData){
                                        oProponent.physicalPerson.biddersSpouseData.objectID   = oData.ObjectID;
                                        oProponent.physicalPerson.biddersSpouseData.customerID = oData.CustomerID;

                                        let oObjectRelationship = {
                                            RelationshipType: "ZCRM02",
                                            FirstBusinessPartnerID: oIndividualCustomer.CustomerID,
                                            SecondBusinessPartnerID: oData.CustomerID,
                                            MainIndicator: true,
                                        };
                                        
                                        //cria a relação entre o cliente e cônjuge
                                        this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                            success: function(oDataBusiness){                       
                                                let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                                                this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
                                                        
                                                this.getModel("involvedParties").refresh(true);
                                                
                                                this.setAppBusy(false);

                                                if(bValid){
                                                    this._oProponentPage.removeAllContent();
                                    
                                                    this._oNavContainer.back();
                                                }
                                            }.bind(this),
                                            error: function(oError){
                                                this.setAppBusy(false);
    
                                                MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                            }.bind(this)
                                        });
                                    }.bind(this),
                                    error: function(oError){
                                        this.setAppBusy(false);
        
                                        let sError = JSON.parse(oError.responseText);
                
                                        MessageBox.error(sError.error.message.value);
                                    }.bind(this)
                                });
                            }else{
                                this.setAppBusy(false);

                                MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                            }
                        }
                    }else{
                        oObject.ObjectID = oProponent.physicalPerson.objectID;

                        let oCustomer = { IndividualCustomer: oObject };

                        let oToken = await this._getToken("leadpf05@getnada.com").method('GET');

                        let oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);

                        if(oResponse.status >= 200 && oResponse.status <= 300){
                            let bValid = this._editInvolvedParties(oProponent.physicalPerson);
                            this.getModel("involvedParties").refresh(true);

                            if(bValid){
                                this._oNavContainer.back();

                                this._oProponentPage.removeAllContent();
                            }

                            this.setAppBusy(false);

                            MessageToast.show(this.getResourceBundle().getText("messageSuccessUpdateProponent"));
                        }else{
                            this.setAppBusy(false);

                            MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                        }
                    }
                }
            }
            
            if(oProponent.legalPerson != undefined){
                if(oProponent.legalPerson.radioButtonCNPJ){
                    this._checkMainBuyer(oProponent.legalPerson);

                    if(oProponent.legalPerson.OwnerID === ""){
                        oProponent.legalPerson.OwnerID = this.objectRoles.EmployeeID;
                    }

                    let oObject = this._createObjectLegalPerson(oProponent.legalPerson, "PATCH");

                    oObject.ObjectID = oProponent.legalPerson.objectID;

                    let oToken = await this._getToken("leadpf05@getnada.com").method('GET');

                    let oCustomer = { CorporateAccount: oObject },
                        oResponse = await this.callServiceSCPIPATCH(`/corporate/account/update`, oCustomer, oToken);

                    if(oResponse.status >= 200 && oResponse.status <= 300){
                        let bValid = this._editInvolvedParties(oProponent.legalPerson);
                        this.getModel("involvedParties").refresh(true);

                        if(bValid){
                            this._oNavContainer.back();

                            this._oProponentPage.removeAllContent();
                        }

                        this.setAppBusy(false);

                        MessageToast.show(this.getResourceBundle().getText("messageSuccessUpdateProponent"));
                    }else{
                        this.setAppBusy(false);

                        MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                    }
                }
            }
        },

        onAddItemAttorney: function(oEvent) {
            let oModel = new JSONModel(Attorney.initSelectionModel());

            this.getModel("involvedParties").getData().bSave = false;
            this.getModel("involvedParties").getData().bEdit = false;
            this.getModel("involvedParties").refresh(true);

            this._oNavContainer.to(this._oAttorneyPage);

            this._getFragment("physicalPerson.attorney.AttorneyInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");

                this._oAttorneyPage.removeAllContent();
                this._oAttorneyPage.insertContent(oFragment);
            }.bind(this));
        },

        onCloseItemAttorney: function(oEvent) {
            this._oNavContainer.back();

            this._oAttorneyPage.removeAllContent();
        },

        onSaveAttorney: function(oEvent){
            let oAttorney = this.byId("attorneyPhysicalPersonInstance").getModel("fragment").getData();

            if(oAttorney.OwnerID === ""){
                oAttorney.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObjectAttorney(oAttorney, "POST");

            this.setAppBusy(true);

            this.getModel().create("/IndividualCustomerCollection", oObject, {
                success: function(oData){
                    oAttorney.objectID   = oData.ObjectID;
                    oAttorney.customerID = oData.CustomerID;

                    let bValid = this._editInvolvedParties(oAttorney);
                    this.getModel("involvedParties").refresh(true);

                    if(bValid){
                        this._oNavContainer.back();

                        this._oAttorneyPage.removeAllContent();
                    }

                    this.setAppBusy(false);

                    MessageToast.show(this.getResourceBundle().getText("messageSuccessSaveAttorney"));
                }.bind(this),
                error: function(oError){
                    this.setAppBusy(false);

                    //console.log(oError);
                    let sError = JSON.parse(oError.responseText);

                    MessageBox.error(sError.error.message.value);
                }.bind(this)
            });
        },

        onEditAttorney: async function(oEvent){
            this.setAppBusy(true);

            let oData = this.byId("attorneyPhysicalPersonInstance").getModel("fragment").getData();

            if(oData.OwnerID === ""){
                oData.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObjectAttorney(oData, "PATCH");

            oObject.ObjectID = oData.objectID;

            let oToken = await this._getToken("leadpf05@getnada.com").method('GET');

            let oCustomer = { IndividualCustomer: oObject },
                oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);

            if(oResponse.status >= 200 && oResponse.status <= 300){
                let bValid = this._editInvolvedParties(oData);

                this.getModel("involvedParties").refresh(true);

                if(bValid){
                    this._oNavContainer.back();

                    this._oAttorneyPage.removeAllContent();
                }

                this.setAppBusy(false);

                MessageToast.show(this.getResourceBundle().getText("messageSuccessUpdateAttorney"));
            }else{
                this.setAppBusy(false);

                MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateAttorney")); 
            }
        },

        onAddItemFinancialOfficer: function(oEvent) {
            let oModel = new JSONModel(FinancialOfficer.initSelectionModel());

            this.getModel("involvedParties").getData().bSave = false;
            this.getModel("involvedParties").getData().bEdit = false;
            this.getModel("involvedParties").refresh(true);

            this._oNavContainer.to(this._oFinancialOfficerPage);

            this._getFragment("physicalPerson.financialOfficer.FinancialOfficerInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");

                this._oFinancialOfficerPage.removeAllContent();
                this._oFinancialOfficerPage.insertContent(oFragment);
            }.bind(this));
        },
        onCloseItemFinancialOfficer: function(oEvent) {
            this._oNavContainer.back();

            this._oFinancialOfficerPage.removeAllContent();
        },

        onSaveFinancialOfficer: function(oEvent){
            let oFinancialOfficer = this.byId("financialOfficerPhysicalPersonInstance").getModel("fragment").getData();

            if(oFinancialOfficer.OwnerID === ""){        
                oFinancialOfficer.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObject(oFinancialOfficer, "POST");

            this.setAppBusy(true);

            this.getModel().create("/IndividualCustomerCollection", oObject, {
                success: function(oData){
                    oFinancialOfficer.objectID   = oData.ObjectID;
                    oFinancialOfficer.customerID = oData.CustomerID;

                    let bValid = this._editInvolvedParties(oFinancialOfficer);
                    this.getModel("involvedParties").refresh(true);

                    if(bValid){
                        this._oNavContainer.back();

                        this._oFinancialOfficerPage.removeAllContent();
                    }

                    this.setAppBusy(false);

                    MessageToast.show(this.getResourceBundle().getText("messageSuccessSaveFinancialOfficer"));
                }.bind(this),
                error: function(oError){
                    this.setAppBusy(false);

                    //console.log(oError);
                    let sError = JSON.parse(oError.responseText);

                    MessageBox.error(sError.error.message.value);
                }.bind(this)
            });
        },

        onEditFinancialOfficer: async function(oEvent){
            this.setAppBusy(true);

            let oData = this.byId("financialOfficerPhysicalPersonInstance").getModel("fragment").getData();

            if(oData.OwnerID === ""){
                oData.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObject(oData, "PATCH");

            oObject.ObjectID = oData.objectID;

            let oToken    = await this._getToken("leadpf05@getnada.com").method('GET');

            let oCustomer = { IndividualCustomer: oObject },
                oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);

            if(oResponse.status >= 200 && oResponse.status <= 300){
                let bValid = this._editInvolvedParties(oData);
                this.getModel("involvedParties").refresh(true);

                if(bValid){
                    this._oNavContainer.back();

                    this._oFinancialOfficerPage.removeAllContent();
                }
                this.setAppBusy(false);

                MessageToast.show(this.getResourceBundle().getText("messageSuccessUpdateFinancialOfficer"));
            }else{
                this.setAppBusy(false);

                MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateFinancialOfficer")); 
            }
        },

        onAddItemGuarantor: function(oEvent) {
            let oModel = new JSONModel(Guarantor.initSelectionModel());

            this.getModel("involvedParties").getData().bSave = false;
            this.getModel("involvedParties").getData().bEdit = false;
            this.getModel("involvedParties").refresh(true);

            this._oNavContainer.to(this._oGuarantorPage);

            this._getFragment("physicalPerson.guarantor.GuarantorInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");

                this._oGuarantorPage.removeAllContent();
                this._oGuarantorPage.insertContent(oFragment);
            }.bind(this));
        },

        onCloseItemGuarantor: function(oEvent) {
            this._oNavContainer.back();

            this._oGuarantorPage.removeAllContent();
        },

        onSaveGuarantor: async function(oEvent){
            this.setAppBusy(true);

            let oGuarantor = this.byId("guarantorPhysicalPersonInstance").getModel("fragment").getData();

            if(oGuarantor.OwnerID === ""){
                oGuarantor.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObjectGuarantor(oGuarantor, "POST");

            oObject.Fiador_KUT = true;

            //verifico se o cpf do conjuge foi inserido, 
            //se sim faço outra validação para saber se o cliente é novo ou se é um cliente já existente
            if(oGuarantor.biddersSpouseData.cpf != ""){
                if(oGuarantor.biddersSpouseData.OwnerID === ""){
                    oGuarantor.biddersSpouseData.OwnerID = this.objectRoles.EmployeeID;
                }

                let oObjectSpouse = this._createObjectBidderSpouse(oGuarantor.biddersSpouseData, oGuarantor, "PATCH");

                oObjectSpouse.Fiador_KUT = true;

                if(oGuarantor.biddersSpouseData.objectID != ""){
                    oObjectSpouse.ObjectID = oGuarantor.biddersSpouseData.objectID;

                    let oCustomerSpouse = { IndividualCustomer: oObjectSpouse };

                    let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                        oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomerSpouse, oToken);

                    if(oResponse.status >= 200 && oResponse.status <= 300){
                        let oBidderSpouse  = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObjectSpouse.CPFCNPJ_KUT}'&$format=json`).method('GET');

                        let oPromiseClient = new Promise(
                                function(resolve, reject){
                                    this.getModel().create("/IndividualCustomerCollection", oObject, {
                                        success: function(oData){
                                            resolve(oData);
                                        }.bind(this),
                                        error: function(oError){
                                            reject(oError);
                                        }.bind(this)
                                    });
                                }.bind(this)
                            );

                        oPromiseClient.then(
                            async function(oData){
                                oGuarantor.objectID   = oData.ObjectID;
                                oGuarantor.customerID = oData.CustomerID;


                                let oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${oData.CustomerID}'&$format=json`).method('GET'),
                                    oRelationshipCustomerID;

                                if(oRelationship === undefined){
                                    oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${oData.CustomerID}'&$format=json`).method('GET');
                                    
                                    if(oRelationship != undefined){
                                        oRelationshipCustomerID = oRelationship.FirstBusinessPartnerID;
                                    }
                                }else{
                                    oRelationshipCustomerID = oRelationship.SecondBusinessPartnerID;
                                }

                                if(oRelationship === undefined){
                                    let oObjectRelationship = {
                                            RelationshipType: "ZCRM02",
                                            FirstBusinessPartnerID: oData.CustomerID,
                                            SecondBusinessPartnerID: oBidderSpouse.CustomerID,
                                            MainIndicator: true,
                                        };

                                    this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                        success: function(oDataBusines){                       
                                            let bValid = this._editInvolvedParties(oGuarantor);
                                            this.getModel("involvedParties").refresh(true);
                    
                                            this.setAppBusy(false);

                                            if(bValid){
                                                this._oGuarantorPage.removeAllContent();
                            
                                                this._oNavContainer.back();
                                            }
                                        }.bind(this),
                                        error: function(oError){
                                            this.setAppBusy(false);

                                            MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                        }.bind(this)
                                    });
                                }else{
                                    oGuarantor.objectID   = oData.ObjectID;
                                    oGuarantor.customerID = oData.CustomerID;
                
                                    let bValid = this._editInvolvedParties(oGuarantor);                                        
                                    this.getModel("involvedParties").refresh(true);
                
                                    this.setAppBusy(false);

                                    if(bValid){
                                        this._oGuarantorPage.removeAllContent();
                    
                                        this._oNavContainer.back();
                                    }
                                }
                            }.bind(this)
                        )
                        .catch(
                            function(oError){
                                this.setAppBusy(false);

                                let sError = JSON.parse(oError.responseText);
            
                                MessageBox.error(sError.error.message.value); 
                            }.bind(this)
                        )
                    }else{
                        this.setAppBusy(false);

                        MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                    }
                }else{
                    let oPromiseAll = [];

                    //Cliente Principal
                    oPromiseAll.push(
                        new Promise(
                            function(resolve, reject){
                                this.getModel().create("/IndividualCustomerCollection", oObject, {
                                    success: function(oData){
                                        oGuarantor.objectID   = oData.ObjectID;
                                        oGuarantor.customerID = oData.CustomerID;
                                        resolve(oData);
                                    }.bind(this),
                                    error: function(oError){
                                        reject(oError);
                                    }.bind(this)
                                });
                            }.bind(this)
                        )
                    );
                        
                    //Cônjuge do Cliente
                    oPromiseAll.push(
                        new Promise(
                            function(resolve, reject){
                                this.getModel().create("/IndividualCustomerCollection", oObjectSpouse, {
                                    success: function(oData){
                                        oGuarantor.biddersSpouseData.objectID   = oData.ObjectID;
                                        oGuarantor.biddersSpouseData.customerID = oData.CustomerID;

                                        resolve(oData);
                                    }.bind(this),
                                    error: function(oError){
                                        reject(oError);
                                    }.bind(this)
                                });
                            }.bind(this)
                        )
                    );

                    Promise.all(oPromiseAll)
                    .then(
                        function(oData){
                            let oObjectRelationship = {
                                RelationshipType: "ZCRM02",
                                FirstBusinessPartnerID: oData[0].CustomerID,
                                SecondBusinessPartnerID: oData[1].CustomerID,
                                MainIndicator: true,
                            };

                            this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                success: function(oDataBusiness){                       
                                    let bValid = this._editInvolvedParties(oGuarantor);                                                
                                    this.getModel("involvedParties").refresh(true);
                    
                                    this.setAppBusy(false);

                                    if(bValid){
                                        this._oGuarantorPage.removeAllContent();
                        
                                        this._oNavContainer.back();
                                    }
                                }.bind(this),
                                error: function(oError){
                                    this.setAppBusy(false);

                                    MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                }.bind(this)
                            });
                        }.bind(this)
                    ).catch(
                        function(oError){
                            this.setAppBusy(false);
    
                            let sError = JSON.parse(oError.responseText);
        
                            MessageBox.error(sError.error.message.value); 
                        }.bind(this)
                    );
                }
            }else{
                this.getModel().create("/IndividualCustomerCollection", oObject, {
                    success: function(oData){
                        oGuarantor.objectID   = oData.ObjectID;
                        oGuarantor.customerID = oData.CustomerID;
        
                        let bValid = this._editInvolvedParties(oGuarantor);
                        this.getModel("involvedParties").refresh(true);
        
                        this._oNavContainer.back();

                        if(bValid){
                            this._oGuarantorPage.removeAllContent();
            
                            this.setAppBusy(false);
                        }

                        MessageToast.show(this.getResourceBundle().getText("messageSuccessSaveLegalGuarantor"));
                    }.bind(this),
                    error: function(oError){
                        this.setAppBusy(false);
        
                        let sError = JSON.parse(oError.responseText);
    
                        MessageBox.error(sError.error.message.value);
                    }.bind(this)
                });
            }
        },

        onEditGuarantor: async function(oEvent){
            this.setAppBusy(true);

            let oGuarantor = this.byId("guarantorPhysicalPersonInstance").getModel("fragment").getData();

            if(oGuarantor.OwnerID === ""){
                oGuarantor.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObjectGuarantor(oGuarantor, "PATCH");

            oObject.ObjectID   = oGuarantor.objectID;
            oObject.Fiador_KUT = true;

            if(oGuarantor.biddersSpouseData.cpf != ""){

                if(oGuarantor.biddersSpouseData.OwnerID === ""){
                    oGuarantor.biddersSpouseData.OwnerID = this.objectRoles.EmployeeID;
                }

                let oObjectSpouse = this._createObjectBidderSpouse(oGuarantor.biddersSpouseData, oGuarantor, "PATCH");

                oObjectSpouse.Fiador_KUT = true;

                if(oGuarantor.biddersSpouseData.objectID != ""){
                    oObjectSpouse.ObjectID = oGuarantor.biddersSpouseData.objectID;

                    let oCustomerSpouse = { IndividualCustomer: oObjectSpouse };

                    let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                        oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomerSpouse, oToken);

                    if(oResponse.status >= 200 && oResponse.status <= 300){
                        let oBidderSpouse  = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObjectSpouse.CPFCNPJ_KUT}'&$format=json`).method('GET');

                        let oCustomer = { IndividualCustomer: oObject };

                        let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                            oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);

                        if(oResponse.status >= 200 && oResponse.status <= 300){
                            let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObject.CPFCNPJ_KUT}'&$format=json`).method('GET');
                           
                            let oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET'),
                                oRelationshipCustomerID;

                            if(oRelationship === undefined){
                                oRelationship = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${oIndividualCustomer.CustomerID}'&$format=json`).method('GET');
                                
                                if(oRelationship != undefined){
                                    oRelationshipCustomerID = oRelationship.FirstBusinessPartnerID;
                                }
                            }else{
                                oRelationshipCustomerID = oRelationship.SecondBusinessPartnerID;
                            }

                            if(oRelationship === undefined){
                                let oObjectRelationship = {
                                        RelationshipType: "ZCRM02",
                                        FirstBusinessPartnerID: oIndividualCustomer.CustomerID,
                                        SecondBusinessPartnerID: oBidderSpouse.CustomerID,
                                        MainIndicator: true,
                                    };

                                this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                    success: function(oDataBusines){                       
                                        let bValid = this._editInvolvedParties(oGuarantor);
                                        this.getModel("involvedParties").refresh(true);
                    
                                        this.setAppBusy(false);
                                        if(bValid){
                                            this._oGuarantorPage.removeAllContent();
                        
                                            this._oNavContainer.back();
                                        }
                                    }.bind(this),
                                    error: function(oError){
                                        this.setAppBusy(false);

                                        MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                    }.bind(this)
                                });
                            }else{
                                let bValid = this._editInvolvedParties(oGuarantor);
                                this.getModel("involvedParties").refresh(true);
            
                                this.setAppBusy(false);

                                if(bValid){
                                    this._oGuarantorPage.removeAllContent();
                
                                    this._oNavContainer.back();
                                }
                            }
                        }else{
                            this.setAppBusy(false);

                            MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                        }
                    }else{
                        this.setAppBusy(false);

                        MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent"));
                    }
                }else{
                    let oCustomer = { IndividualCustomer: oObject };

                    let oToken    = await this._getToken("leadpf05@getnada.com").method('GET'),
                        oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);

                    if(oResponse.status >= 200 && oResponse.status <= 300){
                        let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CPFCNPJ_KUT eq '${oObject.CPFCNPJ_KUT}'&$format=json`).method('GET');

                        this.getModel().create("/IndividualCustomerCollection", oObjectSpouse, {
                            success: function(oData){
                                oGuarantor.biddersSpouseData.objectID   = oData.ObjectID;
                                oGuarantor.biddersSpouseData.customerID = oData.CustomerID;

                                let oObjectRelationship = {
                                    RelationshipType: "ZCRM02",
                                    FirstBusinessPartnerID: oIndividualCustomer.CustomerID,
                                    SecondBusinessPartnerID: oData.CustomerID,
                                    MainIndicator: true,
                                };
                                    
                                //cria a relação entre o cliente e cônjuge
                                this.getModel().create("/BusinessPartnerRelationshipCollection", oObjectRelationship, {
                                    success: function(oDataBusiness){                       
                                        let bValid = this._editInvolvedParties(oGuarantor);                              
                                        this.getModel("involvedParties").refresh(true);
                            
                                        this.setAppBusy(false);

                                        if(bValid){
                                            this._oGuarantorPage.removeAllContent();
                            
                                            this._oNavContainer.back();
                                        }
                                    }.bind(this),
                                    error: function(oError){
                                        this.setAppBusy(false);

                                        MessageBox.error(this.getResourceBundle().getText("messageErrorCreateRelationship"));
                                    }.bind(this)
                                });
                            }.bind(this),
                            error: function(oError){
                                this.setAppBusy(false);

                                let sError = JSON.parse(oError.responseText);
                
                                MessageBox.error(sError.error.message.value);
                            }.bind(this)
                        });
                    }else{
                        this.setAppBusy(false);

                        MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProponent")); 
                    }
                }
            }else{
                let oToken    = await this._getToken("leadpf05@getnada.com").method('GET');

                let oCustomer = { IndividualCustomer: oObject },
                    oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);
            
                if(oResponse.status >= 200 && oResponse.status <= 300){
                    let bValid = this._editInvolvedParties(oGuarantor);
                    this.getModel("involvedParties").refresh(true);
                        
                    this.setAppBusy(false);

                    if(bValid){
                        this._oGuarantorPage.removeAllContent();

                        this._oNavContainer.back();
                    }

                    MessageToast.show(this.getResourceBundle().getText("messageSuccessUpdateGuarantor"));
                }else{
                    this.setAppBusy(false);

                    MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateGuarantor")); 
                }
            }
        },

        //--------------------------------------------------------------------------------------------------//
        //--------------------------- Pessoa Jurídica ------------------------------------------------------//
        //--------------------------------------------------------------------------------------------------//
        onAddItemLegalRepresentative: function(oEvent) {
            let oModel = new JSONModel(LegalRepresentative.initSelectionModel());

            this.getModel("involvedParties").getData().bSave = false;
            this.getModel("involvedParties").getData().bEdit = false;
            this.getModel("involvedParties").refresh(true);

            this._oNavContainer.to(this._oLegalRepresentativePage);

            this._getFragment("legalPerson.legalRepresentative.LegalRepresentativeInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");

                this._oLegalRepresentativePage.removeAllContent();
                this._oLegalRepresentativePage.insertContent(oFragment);
            }.bind(this));
        },

        onCloseItemLegalRepresentative: function(oEvent) {
            this._oNavContainer.back();

            this._oLegalRepresentativePage.removeAllContent();
        },

        onSaveLegalRepresentative: function(oEvent){
            let oLegalRepresentative = this.byId("legalRepresentativeInstance").getModel("fragment").getData();

            if(oLegalRepresentative.OwnerID === ""){
                oLegalRepresentative.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObject(oLegalRepresentative, "POST");

            this.setAppBusy(true);

            this.getModel().create("/IndividualCustomerCollection", oObject, {
                success: function(oData){
                    oLegalRepresentative.objectID   = oData.ObjectID;
                    oLegalRepresentative.customerID = oData.CustomerID;

                    let bValid = this._editInvolvedParties(oLegalRepresentative);
                    this.getModel("involvedParties").refresh(true);

                    if(bValid){
                        this._oNavContainer.back();

                        this._oLegalRepresentativePage.removeAllContent();
                    }
                    this.setAppBusy(false);

                    MessageToast.show(this.getResourceBundle().getText("messageSuccessSaveLegalRepresentative"));
                }.bind(this),
                error: function(oError){
                    this.setAppBusy(false);

                    let sError = JSON.parse(oError.responseText);

                    MessageBox.error(sError.error.message.value);
                }.bind(this)
            });
        },

        onEditLegalRepresentative: async function(oEvent){
            this.setAppBusy(true);

            let oData = this.byId("legalRepresentativeInstance").getModel("fragment").getData();

            if(oData.OwnerID === ""){
                oData.OwnerID = this.objectRoles.EmployeeID;
            }

            let oObject = this._createObject(oData, "PATCH");

            oObject.ObjectID = oData.objectID;

            let oToken    = await this._getToken("leadpf05@getnada.com").method('GET');

            let oCustomer = { IndividualCustomer: oObject },
                oResponse = await this.callServiceSCPIPATCH(`/customer/update`, oCustomer, oToken);
        
            if(oResponse.status >= 200 && oResponse.status <= 300){
                let bValid = this._editInvolvedParties(oData);

                this.getModel("involvedParties").refresh(true);

                this.setAppBusy(false);

                if(bValid){
                    this._oLegalRepresentativePage.removeAllContent();

                    this._oNavContainer.back();
                }

                MessageToast.show(this.getResourceBundle().getText("messageSuccessUpdateLegalRepresentative"));
            }else{
                this.setAppBusy(false);

                MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateLegalRepresentative")); 
            }
        },
        
        onSaveProposal: function(oEvent){
            let oItemsInvolvedParties = this.getModel("involvedParties").getData().items,
                oModelPaymentCndts    = this.getModel("paymentConditions").getData(),
                oModelEnterprises     = this.getModel("enterprises").getData().items[0];
            
            this.setAppBusy(true);

            let { oModelFinishProposal, oModelInvolvedCreate, oModelInvolvedUpdate, oModelOpportunityParcSDK } = this._mountProposal(oModelPaymentCndts, oModelEnterprises, oItemsInvolvedParties, "Create");

            if(oModelInvolvedUpdate.length != 0){
                /*oModelInvolvedUpdate.map(sParty => {
                    oModelInvolvedCreate.push({
                        PartyID: sParty.PartyID,
                        RoleCode: sParty.RoleCode,
                        MainIndicator: sParty.MainIndicator,
                        Phone: sParty.Phone,
                        Mobile: sParty.Mobile,
                        Email: sParty.Email
                    });
                })*/

                oModelFinishProposal.OpportunityParty = oModelInvolvedUpdate;
            }

            oModelFinishProposal.OpportunityItem = [{
                ProductID: oModelEnterprises.productID
            }];

            oModelFinishProposal.OpportunityParcelas_SDK = oModelOpportunityParcSDK;

            this.getModel().create("/OpportunityCollection", oModelFinishProposal, {
                success: async function(oData){
                    //console.log(oData);
                    let oModelEvaluation = this.getModel("proposalEvaluation").getData();

                    oModelEvaluation.buttonSaveProposal   = false;
                    oModelEvaluation.buttonUpdateProposal = true;

                    this.getModel("proposalEvaluation").refresh(true);

                    this.getModel("finishProposal").getData().objectID = oData.ObjectID;
                    this.getModel("finishProposal").getData().ID       = oData.ID;
                    this.getModel("finishProposal").refresh(true);

                    this.getModel("paymentConditions").getData().State.selectionSaleForm.Enabled = false;
                    this.getModel("paymentConditions").refresh(true);

                    let aOpportunityParty   = await this.callService(`OpportunityCollection('${oData.ObjectID}')/OpportunityParty?$format=json`).method('GET'),
                        oItemsInvolvedParty = this.getModel("involvedParties").getData().items;
                    
                    if(aOpportunityParty.length != 0){
                        for(let oInvolvedParty of oItemsInvolvedParty){
                            if(oInvolvedParty.functionCode === "31" ||
                               oInvolvedParty.functionCode === "Z1" ||
                               oInvolvedParty.functionCode === "ZR" ||
                               oInvolvedParty.functionCode === "ZP" ||
                               oInvolvedParty.functionCode === "ZRL" )
                            {
                                let aOpportunity = aOpportunityParty.find(sParty => {
                                    if(sParty.PartyID === oInvolvedParty.customerID) return sParty;
                                });
    
                                if(aOpportunity != undefined) oInvolvedParty.opportunityParty.objectID = aOpportunity.ObjectID;
                            }
                        }

                        this.getModel("involvedParties").refresh(true);
                    }
                    
                    this.setAppBusy(false);

                    if(oData.MensagemValidacao_KUT != "") {
                        let oDataMessages = oData.MensagemValidacao_KUT.split(";"),
                            oMessages     = "";

                        for(let i=0; i < oDataMessages.length; i++){
                            if(oDataMessages[i] != ""){
                                if(i < oDataMessages.length){
                                    oMessages += oDataMessages[i] + "\n";
                                }else oMessages += oDataMessages[i];
                            }
                        }

                        MessageBox.warning(oMessages, {
                            actions: [MessageBox.Action.CLOSE],
                            onClose: function(sAction){
                                this.getRouter().navTo("availabilityMap",{
                                    orgId: oModelEnterprises.orgID,
                                });
                            }.bind(this)
                        });
                    }else MessageBox.success(this.getResourcesBundle().getText("messageSuccessSaveOpportunity"));
                }.bind(this),
                error: function(oError){
                    this.setAppBusy(false);

                    MessageBox.error(this.getResourceBundle().getText("messageErrorSaveOpportunity"));
                }.bind(this)
            });
            
        },

        onUpdateProposal: async function(oEvent){
            // /opportunity/update
            // /opportunity/party/update
            let oItemsInvolvedParties = this.getModel("involvedParties").getData().items,
                oModelPaymentCndts    = this.getModel("paymentConditions").getData(),
                oModelEnterprises     = this.getModel("enterprises").getData().items[0],
                oModel                = this.getModel("finishProposal").getData();
            
            this.setAppBusy(true);

            let { oModelFinishProposal, oModelInvolvedCreate, oModelInvolvedUpdate, oModelOpportunityParcSDK } = this._mountProposal(oModelPaymentCndts, oModelEnterprises, oItemsInvolvedParties, "PUT");

            if(oModelInvolvedUpdate.length != 0){
                oModelFinishProposal.SimuladorAppEventsPartesEnvolvidas = oModelInvolvedUpdate;
            }

            oModelFinishProposal.ObjetoID = oModel.objectID;

            oModelFinishProposal.SimuladorAppEventsProdutos = [{
                ProdutoID: oModelEnterprises.productID
            }];

            oModelFinishProposal.SimuladorAppEventsParcelas = oModelOpportunityParcSDK;

            this.getModel("C4C_SDK").create("/SimuladorAppEventsCollection", oModelFinishProposal, {
                success: async function(oData){

                    //Atualiza um campo para ativação de workflow
                    let oValidOportunity = `${oModel.ValidaOportPelaAtividade + 2}`;

                    let oObjectOpportunity = {
                            Opportunity: {
                                ObjectID: oModel.objectID, 
                                AtualizarWorkflow_KUT: true ,
                                ValidaOportPelaAtividade_KUT: oValidOportunity
                            } 
                        },
                        oResponse = await this.callServiceSCPIPATCH(`/opportunity/update`, oObjectOpportunity, "");


                    let aOpportunity = await this.callServiceFormatedJSON(`OpportunityCollection?$filter=ObjectID eq '${oModel.objectID}'&$format=json`).method('GET');

                    // mensagem de aviso
                    if(aOpportunity.MensagemValidacao_KUT != ""){
                        let oDataMessages = aOpportunity.MensagemValidacao_KUT.split(";"),
                            oMessages     = "";

                        for(let i=0; i < oDataMessages.length; i++){
                            if(oDataMessages[i] != ""){
                                if(i < oDataMessages.length){
                                    oMessages += oDataMessages[i] + "\n";
                                }else oMessages += oDataMessages[i];
                            }
                        }

                        MessageBox.warning(oMessages, {
                            actions: [MessageBox.Action.CLOSE],
                            onClose: function(sAction){
                                this.getRouter().navTo("availabilityMap",{
                                    orgId: oModelEnterprises.orgID,
                                });
                            }.bind(this)
                        });
                    }else{
                        MessageBox.success(this.getResourcesBundle().getText("messageSuccessSaveOpportunity"));
                    }

                    this.setAppBusy(false);
                }.bind(this),
                error: function(oError){
                    this.setAppBusy(false);
                    let oPositionErrorImob = oError.responseText.indexOf("{");
                    
                    if(oPositionErrorImob != -1){
                        let oObjectMessage = JSON.parse(oError.responseText),
                            oArrayMessages = oObjectMessage.error.message.value.split(".::"),
                            oMessages      = "";

                        for(let i=0; i < oArrayMessages.length; i++){
                            if(oArrayMessages[i] != ""){
                                if(i < oArrayMessages.length){
                                    oMessages += oArrayMessages[i] + "\n";
                                }else oMessages += oArrayMessages[i];
                            }
                        }

                        MessageBox.error(oMessages);
                    }else{
                        MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateOpportunity"));
                    }
                }.bind(this)
            });
        },

        onPrintPaymentPlan: function(oEvent){
            let oModelEnterprises     = this.getModel("enterprises").getData().items[0],
                oModelInvolvedparties = this.getModel("involvedParties").getData().items,
                oModelPaymentCndts    = this.getModel("paymentConditions").getData().items,
                oModelPaymentPlan     = this.getModel("paymentPlan").getData().items;

            let oProponent = oModelInvolvedparties.find(sItem =>{
                if(sItem.functionCode === "31" && sItem.checkBoxMainBuyer === true) return sItem;
            });

            if(oProponent === undefined){
                oProponent = {
                    name: "",
                    surname: "",
                    mobile: "",
                    email: "",
                    phone: ""
                };
            }

            let oDay   = String(new Date().getDate()).padStart(2, '0'),
                oMonth = String(new Date().getMonth() + 1).padStart(2, '0'),
                oYear  = new Date().getFullYear();

            let divMain = `<div style="width: 1024px; height: auto; position: relative; ">`;

            let oHeader = `<div style="width: 1024px; height: 80px; top: -1px; left: -1px; justify-content: center; align-items: center; border: 1px solid black; position: absolute; display: flex; "> 
                                <div style="width: 33%;">              
                                    <p style="text-align: left; margin-left: 5px">logo</p>
                                </div>
                                <div style="width: 33%; ">              
                                    <p style="text-align: center; font-weight: bold; ">SIMULAÇÃO DE PLANO DE PAGAMENTO</p>
                                </div>
                                <div style="width: 33%; ">
                                    <p style="text-align: left; margin-left: 100px; margin-block-start: 0px; margin-block-end: 0px; font-size: 14px;">
                                        Número: 0
                                    </p>
                                    <p style="text-align: left; margin-left: 100px; margin-block-start: 0px; margin-block-end: 0px; margin-top: 0px; font-size: 14px;">
                                        Data da Simulação: ${oDay}/${oMonth}/${oYear}
                                    </p>
                                </div>
                           </div>`;

            oHeader += `<div style="width: 1024px; height: 30px; margin-top: 80px; left: -1px; border: 1px solid black; position: absolute; background-color: rgba(229, 229, 229, 1); ">
                            <p style="text-align: left; margin-block-start: 5px; font-weight: bold;  margin-left: 5px">Dados do Empreendimento, Bloco, Unidade e Corretor</p>
                        </div>`;
            
            oHeader += `<div style="width: 700px; height: 30px; margin-top: 111px; left: -1px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px;  margin-left: 5px">Empreendimento: ${oModelEnterprises.nameEnterprise}</p>
                            </div>
                        </div> `;
            
            oHeader += `<div style="width: 323px; height: 30px; margin-top: 111px; left: 700px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px; margin-left: 5px; ">Unidade: ${oModelEnterprises.unit}</p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 700px; height: 30px; margin-top: 142px; left: -1px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px; margin-left: 5px; ">Bloco: ${oModelEnterprises.block}</p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 323; height: 30px; margin-top: 142px; left: 700px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px; margin-left: 5px; ">Corretor: </p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 1024px; height: 30px; margin-top: 173px; left: -1px; border: 1px solid black; position: absolute; "> 
                            <p style="text-align: left; margin-block-start: 7px; margin-left: 5px; font-size: 13px;">Cobertura VPL: </p>
                        </div>`;

            oHeader += `<div style="width: 1024px; height: 28px; margin-top: 204px; left: -1px; border: 1px solid black; position: absolute; background-color: rgba(229, 229, 229, 1); "> 
                            <p style="text-align: left; margin-block-start: 7px; font-weight: bold; font-size: 13px; margin-left: 5px; ">Dados do Proponente 1</p>
                        </div>`;

            oHeader += `<div style="width: 462px; height: 30px; margin-top: 233px; left: -1px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px;  margin-left: 5px">Nome: ${oProponent.name} ${oProponent.surname != undefined ? oProponent.surname : ""}</p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 306px; height: 30px; margin-top: 233px; left: 462px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px;  margin-left: 5px">E-mail: ${oProponent.email}</p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 254px; height: 30px; margin-top: 233px; left: 769px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px;  margin-left: 5px">Proporção: </p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 462px; height: 30px; margin-top: 264px; left: -1px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px;  margin-left: 5px">Telefone Residencial: ${oProponent.phone}</p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 306px; height: 30px; margin-top: 264px; left: 462px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px;  margin-left: 5px">Telefone Comercial: </p>
                            </div>
                        </div>`;

            oHeader += `<div style="width: 254px; height: 30px; margin-top: 264px; left: 769px; border: 1px solid black; position: absolute; ">
                            <div style="width: 100%;">              
                                <p style="text-align: left; margin-block-start: 5px;  margin-left: 5px">Celular: ${oProponent.mobile}</p>
                            </div>
                        </div> `;

            let oComponentDescendding = oModelPaymentCndts.find(sItem => {
                if(sItem.selectionComponents === this.adjustableMonthly ||
                   sItem.selectionComponents === this.fixedMonthly      ||
                   sItem.selectionComponents === this.descendingMonthly) return sItem;
            });

            oHeader += `<div style="width: 1024px; height: 28px; margin-top: 295px; left: -1px; position: absolute; background-color: rgba(229, 229, 229, 1); border: 1px black solid; "> 
                            <p style="text-align: center; margin-block-start: 7px; font-weight: bold; font-size: 16px; margin-left: 5px; ">
                                Plano de Pagamento - ${oComponentDescendding.selectionComponents}
                            </p>
                        </div>`;

            divMain += oHeader;

            let oCabecalho = `<div style="width: 1025px; height: 45px; margin-top: 325px; left: 0px; border: 0px; padding: 0px; position: absolute; display: flex;"> 
                                    <div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                        <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">Data</p>
                                    </div>
                            
                                    <div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                        <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">Período</p>
                                    </div> `;            

            let oFieldClass = ["dueDate", "timeCourse"];

            for(let oItem of oModelPaymentCndts){
                let exist;

                switch(oItem.selectionComponents){
                    case this.signal:
                        oFieldClass.push("signal");
                        oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">${oItem.selectionComponents}</p>
                                       </div>`
                        break;
                    case this.discountSale:
                        oFieldClass.push("discountSale");
                        oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">${oItem.selectionComponents}</p>
                                       </div>`
                        break;
                    case this.deliveryKeys:
                        oFieldClass.push("deliveryKeys");
                        oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">${oItem.selectionComponents}</p>
                                       </div>`
                        break;
                    case this.FGTS:
                        oFieldClass.push("FGTS");
                        oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">${oItem.selectionComponents}</p>
                                       </div>`
                        break;
                    case this.CEF:
                        oFieldClass.push("CEF");
                        oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">${oItem.selectionComponents}</p>
                                       </div>`
                        break;
                    case this.subsidy:
                        oFieldClass.push("subsidy");
                        oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">${oItem.selectionComponents}</p>
                                       </div>`
                        break;
                    case this.intermediate:
                        exist = oFieldClass.find(sItem => {
                            if(sItem === "intermediate") return sItem;
                        })

                        if(exist === undefined) {
                            oFieldClass.push("intermediate");
                            oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                                <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">${oItem.selectionComponents}</p>
                                           </div>`;
                        }
                        break;
                }

                if(oItem.selectionComponents === this.adjustableMonthly ||
                   oItem.selectionComponents === this.fixedMonthly      ||
                   oItem.selectionComponents === this.descendingMonthly)
                {
                    let oItemEnterprise = this.getModel("enterprises").getData().items[0],
                        oComponent      = "";
    
                    exist = oFieldClass.find(sItem => {
                        if(sItem === "preKey") {
                            return sItem;
                        }else oComponent = "preKey";
                    });

                    if(exist === undefined) {
                        oFieldClass.push(oComponent);
                        oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                        <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">
                                            ${this.getResourceBundle().getText("paymentConditionsPreKey")}
                                        </p>
                                </div>`
                    }

                    if(Number(oItem.selectionTheAmount) > oItemEnterprise.estimatedDeliveryMonth){
                        exist = oFieldClass.find(sItem => {
                            if(sItem === "proKey") {
                                return sItem;
                            }else oComponent = "proKey";
                        });

                        if(exist === undefined) {
                            oFieldClass.push(oComponent);
                            oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px;">
                                                ${this.getResourceBundle().getText("paymentConditionsProKey")}
                                            </p>
                                    </div>`
                        }
                    }
                    
                    
                }
            }

            oFieldClass.push("ValueTotal");

            oCabecalho += `<div style="width: 100%; height: 45px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                <p style="text-align: center; margin-block-start: 5px; font-size: 14px;">Total</p>
                            </div>
                    </div>`;

            divMain += oCabecalho;


            let oCountLine = 0,
                oPages     = "";

            //div principal dos itens
            let oItems = `<div style="width: 1025px; height: auto; margin-top: 371px; left: 0px; border: 0px; padding: 0px; position: absolute;">`;

            for(let oItem of oModelPaymentPlan){

                //if(oCountLine < 30){
                    //linha
                    oItems += `<div style="width: 100%; height: auto; left: -1px; border: 0px; display: flex;">`;

                    oFieldClass.forEach(sField => {
                        if(sField === "signal"       ||
                        sField === "discountSale" ||
                        sField === "deliveryKeys" ||
                        sField === "preKey"       ||
                        sField === "proKey"       ||
                        sField === "FGTS"         ||
                        sField === "CEF"          ||
                        sField === "subsidy"      ||
                        sField === "intermediate" ||
                        sField === "ValueTotal")
                        {
                            oItems += `<div style="width: 100%; height: 30px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: right; margin-right: 5px; margin-block-start: 5px; font-size: 16px; margin-left: 5px;">
                                                ${oItem[sField]}
                                            </p>
                                    </div>`;
                        }else{
                            oItems += `<div style="width: 100%; height: 30px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px; margin-left: 5px;">
                                                ${oItem[sField]}
                                            </p>
                                    </div>`;
                        }
                    });

                    oItems += `</div>`;

                    /*oCountLine++;
                }else{
                    //fecha a div dos items/linha;
                    oItems += `</div>`;

                    //passa o header do print
                    oPages += divMain;
                    //passa o items da tabela
                    oPages += oItems;

                    //coloca a parte de assinaturas
                    oPages += `<div style="width: 1024px; height: auto; margin-top: 1340px; position: absolute;">
                                    <p style="text-align: start; font-size: 14px;">
                                        BRZ Empreendimentos e Construções Ltda
                                    </p>
                               </div>
                            
                               <div style="width: 1024px; height: auto; margin-top: 1450px; position: absolute; display: flex; align-items: center; justify-content: center;"> 
                                    <div style="width: 100%; margin-right: 120px; align-items: center; display: block; justify-content: center;">
                                        <hr width="300px" color="#363636"/>
                            
                                        <p style="text-align: center; margin-block-start: 5px; font-size: 24px;">
                                            Cliente
                                        </p>
                                    </div>
                            
                                    <div style="width: 100%; margin-right: 120px; align-items: center; display: block; justify-content: center;">
                                        <hr width="300px" color="#363636"/>
                            
                                        <p style="text-align: center; margin-block-start: 5px; font-size: 24px;">
                                            Supervisor Comercial
                                        </p>
                                    </div>
                            
                                    <div style="width: 100%; align-items: center; display: block; justify-content: center;">
                                        <hr width="300px" color="#363636"/>
                            
                                        <p style="text-align: center; margin-block-start: 5px; font-size: 24px;">
                                            Corretor
                                        </p>
                                    </div>
                               </div>`;
                    //fecha a div principal
                    //oPages += `</div>`;

                    oPages += `<br></br><br></br><br></br>`
                    
                    //linha quando igual a 30
                    oItems = `<div style="width: 1025px; height: auto; margin-top: 371px; left: 0px; border: 0px; padding: 0px; position: absolute;">`;
                    //linha
                    oItems += `<div style="width: 100%; height: auto; left: -1px; border: 0px; display: flex;">`;

                    oFieldClass.forEach(sField => {
                        if(sField === "signal"       ||
                        sField === "discountSale" ||
                        sField === "deliveryKeys" ||
                        sField === "preKey"       ||
                        sField === "proKey"       ||
                        sField === "FGTS"         ||
                        sField === "CEF"          ||
                        sField === "subsidy"      ||
                        sField === "intermediate" ||
                        sField === "ValueTotal")
                        {
                            oItems += `<div style="width: 100%; height: 30px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: right; margin-right: 5px; margin-block-start: 5px; font-size: 16px; margin-left: 5px;">
                                                ${oItem[sField]}
                                            </p>
                                    </div>`;
                        }else{
                            oItems += `<div style="width: 100%; height: 30px; justify-content: center; border: 1px solid black; margin-left: -1px; margin-top: -1px "> 
                                            <p style="text-align: center; margin-block-start: 5px; font-size: 16px; margin-left: 5px;">
                                                ${oItem[sField]}
                                            </p>
                                    </div>`;
                        }
                    });

                    oItems += `</div>`;
                    
                    oCountLine = 1;
                }*/
            }
            

            //let oResult = oCountLine / 30;
            
            oItems += `</div>`;

            //oPages += divMain;
            //oPages += oItems;
            divMain += oItems;

            /*divMain += `<div style="width: 1024px; height: auto; margin-top: 1340px; position: absolute;">
                            <p style="text-align: start; font-size: 14px;">
                                BRZ Empreendimentos e Contruções Ltda
                            </p>
                        </div>
                    
                        <div style="width: 1024px; height: auto; margin-top: 1450px; position: absolute; display: flex; align-items: center; justify-content: center;"> 
                            <div style="width: 100%; margin-right: 120px; align-items: center; display: block; justify-content: center;">
                                <hr width="300px" color="#363636"/>
                    
                                <p style="text-align: center; margin-block-start: 5px; font-size: 24px;">
                                    Cliente
                                </p>
                            </div>
                    
                            <div style="width: 100%; margin-right: 120px; align-items: center; display: block; justify-content: center;">
                                <hr width="300px" color="#363636"/>
                    
                                <p style="text-align: center; margin-block-start: 5px; font-size: 24px;">
                                    Supervisor Comercial
                                </p>
                            </div>
                    
                            <div style="width: 100%; align-items: center; display: block; justify-content: center;">
                                <hr width="300px" color="#363636"/>
                    
                                <p style="text-align: center; margin-block-start: 5px; font-size: 24px;">
                                    Corretor
                                </p>
                            </div>
                        </div>`*/

            divMain += `</div>`;

            let janela = window.open("","","width=100%,heigth=auto");
            janela.document.write(`<html><head><title>Plano de Pagamento-${Math.random()}</title></head>`);
            janela.document.write("<body style='margin-left: 8px; margin-rigth: 8px;'>");
            janela.document.write(divMain);
            janela.document.write("</body></html>");
            janela.document.close();
            janela.print();
        },

        //--------------------------------------------------------------------------------------------------//
        
        /* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
        _onObjectMatched: async function(oEvent) {
            this.setAppBusy(true);
            let orgID         = oEvent.getParameter("arguments").orgID,
                objectID      = oEvent.getParameter("arguments").objectID,
                productID     = oEvent.getParameter("arguments").productID,
                opportunityID = oEvent.getParameter("arguments").opportunityID.replaceAll("=", "");

            this.opportunityID = opportunityID;

            let oUserInfo,
                oEmail;

            try {
                oUserInfo = sap.ushell.Container.getService("UserInfo");
            } catch (error) {}
            
            if (oUserInfo != undefined && oUserInfo != "") {
                oEmail = oUserInfo.getEmail();
            } else {
                //oEmail = "alexandre.andrade@itsgroup.com.br";
                oEmail = "corretor.teste8@getnada.com";
            }

            this._oFragment                 = {};
            this._oAvailabilityMap          = this.byId("changeUnitPage");
            this._oProponentPage            = this.byId("proponentPage");
            this._oAttorneyPage             = this.byId("attorneyPage");
            this._oFinancialOfficerPage     = this.byId("financialOfficerPage");
            this._oGuarantorPage            = this.byId("guarantorPage");
            this._oLegalRepresentativePage  = this.byId("legalRepresentativePage");
            this._oNavContainer             = this.byId("oNavContainerFinishProposal");

            this.getModel("involvedParties").setData(InvolvedParties.initSelectionModel());
            this.getModel("involvedParties").refresh(true);

            let oModel = new JSONModel({
                involvedPartiesTableTitle: this.getResourceBundle().getText("proponentTableInvolvedParties"),
                buttonShowHideSpouse: this.getResourceBundle().getText("proponentButtonShowSpouse"),
                buttonShowHideSpouseGuarantor: this.getResourceBundle().getText("proponentButtonShowSpouse")
            });
            this.setModel(oModel, "texts");

            this.getModel("enterprises").setData(Enterprises.initModel());
            this.getModel("enterprises").refresh(true);

            this.getModel("finishProposal").setData(Entity.initSelectionModel());
            this.getModel("finishProposal").refresh(true);

            this.getModel("states").setData(States.initSelectionModel());
            this.getModel("states").refresh(true);

            this.getModel("paymentConditions").setData(PaymentConditions.initModel());
            this.getModel("paymentConditions").refresh(true);

            this.getModel("paymentPlan").setData(PaymentPlan.initModel());
            this.getModel("paymentPlan").refresh(true);

            this.getModel("proposedCalculation").setData(ProposedCalculation.initSelectionModel());
            this.getModel("proposedCalculation").refresh(true);

            this.getModel("proposalEvaluation").setData(ProposalEvaluation.initModel());
            this.getModel("proposalEvaluation").refresh(true);

            this.getModel("resultProposed").setData(ResultProposed.initModel());
            this.getModel("resultProposed").refresh(true);

            this.getModel("paisesDDI").setData(PaisesDDI.initModel());
            this.getModel("paisesDDI").refresh(true);

            this._i18nComponents = {
                "Sinal": {
                    key: "Sinal",
                    text: this.getResourceBundle().getText("paymentConditionsSignal")
                },
                "FGTS": {
                    key: "FGTS",
                    text: this.getResourceBundle().getText("paymentConditionsFGTS")
                },
                "Financiamento CEF": {
                    key: "Financiamento CEF",
                    text: this.getResourceBundle().getText("paymentConditionsCEF")
                },
                "Subsídio": {
                    key: "Subsídio",
                    text: this.getResourceBundle().getText("paymentConditionsSubsidy")
                },
                "Desconto de Venda": {
                    key: "Desconto de Venda",
                    text: this.getResourceBundle().getText("paymentConditionsDiscountSale")
                },
                "Entrega de Chaves": {
                    key: "Entrega de Chaves",
                    text: this.getResourceBundle().getText("paymentConditionsDeliveryKeys")
                },
                "Mensal - Reajustável": {
                    key: "Mensal - Reajustável",
                    text: this.getResourceBundle().getText("paymentConditionsAdjustableMonthly")
                },
                "Mensal Fixa": {
                    key: "Mensal Fixa",
                    text: this.getResourceBundle().getText("paymentConditionsFixedMonthly"),
                },
                "Mensal Decrescente - Reajustável": {
                    key: "Mensal Decrescente - Reajustável",
                    text: this.getResourceBundle().getText("paymentConditionsDescendingMonthly"),
                },
                "Intermediária": {
                    key: "Intermediária",
                    text: this.getResourceBundle().getText("paymentConditionsIntermediate")
                },
                i18n: {
                    textSignal: this.getResourceBundle().getText("paymentConditionsSignal"),
                    textFGTS: this.getResourceBundle().getText("paymentConditionsFGTS"),
                    textCEF: this.getResourceBundle().getText("paymentConditionsCEF"),
                    textSubsidy: this.getResourceBundle().getText("paymentConditionsSubsidy"),
                    textDiscountSale: this.getResourceBundle().getText("paymentConditionsDiscountSale"),
                    textDeliveryKeys: this.getResourceBundle().getText("paymentConditionsDeliveryKeys"),
                    textAdjustableMonthly: this.getResourceBundle().getText("paymentConditionsAdjustableMonthly"),
                    textFixedMonthly: this.getResourceBundle().getText("paymentConditionsFixedMonthly"),
                    textDescendingMonthly: this.getResourceBundle().getText("paymentConditionsDescendingMonthly"),
                    textIntermediate: this.getResourceBundle().getText("paymentConditionsIntermediate"),
                }
            }

            //Variaveis de components
            this.signal            = "Sinal";
            this.FGTS              = "FGTS";
            this.CEF               = "Financiamento CEF";
            this.subsidy           = "Subsídio";
            this.discountSale      = "Desconto de Venda";
            this.deliveryKeys      = "Entrega de Chaves";
            this.adjustableMonthly = "Mensal - Reajustável";
            this.fixedMonthly      = "Mensal Fixa";
            this.descendingMonthly = "Mensal Decrescente - Reajustável";
            this.intermediate      = "Intermediária";

            this.getModel("componentsValues").setData(ComponentsValues.initSelectionModel(this._i18nComponents.i18n));
            this.getModel("componentsValues").refresh(true);

            //Buscar as modalidades de compra
            let oDataPurchaseMethod  = await this.callService(`OpportunityModalidadefinanciamento_KUTCollection?&$orderby=Description asc&$format=json`).method('GET');

            this.getModel("purchaseMethod").setData({ items: oDataPurchaseMethod });
            this.getModel("purchaseMethod").refresh(true);

            let oDataSaleForm = await this.callService(`OpportunitySalesCycleCodeCollection?$filter=Code ne '001'&$orderby=Description asc&$format=json`).method('GET');

            this.getModel("saleForm").setData({ items: oDataSaleForm });
            this.getModel("saleForm").refresh(true);

            this.objectRoles = await this._searchUserBusinessRoles(oEmail);

            this.userBusinessReservedVisible = this.objectRoles.VisibleReserved;

            let oModelFinishProposal = this.getModel("finishProposal").getData();

            oModelFinishProposal.State.broker.Enabled     = this.objectRoles.EnabledBRE;
            oModelFinishProposal.State.realEstate.Enabled = this.objectRoles.EnabledBRE;

            if(opportunityID === "0"){
                //Busca relação de corretor x imobiliaria
                let oBroker = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=RelationshipType eq 'ZCRM08' and FirstBusinessPartnerID eq '${this.objectRoles.BusinessPartnerID}'&$format=json&$select=SecondBusinessPartnerID,FirstBusinessPartnerName_SDK,FirstBusinessPartnerID`).method('GET');

                if(oBroker != undefined){
                     //Relação entre imobiliárias e empreendimento
                    let oPartnerOrg = await this.callServiceFormatedJSON(`PartnerSalesOrganisationCollection?$format=json&$expand=Partner&$select=PartnerID,Partner/BusinessPartnerFormattedName&$filter=SalesOrganisationID eq '${orgID}' and PartnerID eq '${oBroker.SecondBusinessPartnerID}'`).method('GET');

                    if(oBroker != undefined && oPartnerOrg != undefined){
                        oModelFinishProposal.broker = oBroker.FirstBusinessPartnerID;
                    
                        //Adiciona os corretores no modelo
                        this.getModel("broker").setData({ 
                            items: [
                                { 
                                    brokerID: oBroker.FirstBusinessPartnerID,
                                    name: oBroker.FirstBusinessPartnerName_SDK,
                                    partnerID: oPartnerOrg.PartnerID
                                }
                            ]
                        });
                        this.getModel("broker").refresh(true);
                    
                        oModelFinishProposal.realEstate = oPartnerOrg.PartnerID;
                
                        //Adiciona as imobiliárias no modelo
                        this.getModel("realEstate").setData({ 
                            items: [
                                {
                                    partnerID: oPartnerOrg.PartnerID,
                                    name: oPartnerOrg.Partner.BusinessPartnerFormattedName,
                                    brokers: [{ brokerID: oBroker.FirstBusinessPartnerID }]
                                }
                            ]
                        });
                        this.getModel("realEstate").refresh(true);

                        this.getModel("finishProposal").refresh(true);

                        let bInvalid = this._searchRealEstate(oModelFinishProposal);

                        if(bInvalid){
                            MessageBox.warning(this.getResourceBundle().getText("messageWarningBrokerInvalid"));
                        }
                    }
                }else{
                    MessageBox.warning(this.getResourceBundle().getText("messageWarningBrokerInvalid"));
                }

                let { oTableValue, oNetValueSBPE, oNetValueCVA, oDataParms } = await this._initFinishProposal(orgID, productID);

                this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValue}`, undefined);

                await this._fulfillPaymentCondition(oDataPurchaseMethod, Number(oTableValue), Number(oNetValueSBPE), Number(oNetValueCVA), oDataParms);
            
                this.getModel("proposalEvaluation").getData().discountAdditionText = this.getResourceBundle().getText("paymentConditionsDiscount");
                this.getModel("proposalEvaluation").refresh(true);
            }else{
                let oModelPaymentCndts   = this.getModel("paymentConditions").getData(),
                    oModelInvParties     = this.getModel("involvedParties").getData(),
                    oMessageWarning      = "";

                //opportunityID
                let oOpportunity = await this.callServiceFormatedJSON(`OpportunityCollection?$filter=ID eq '${opportunityID}'&$expand=OpportunityItem,OpportunityParty,OpportunityParcelas_SDK&$format=json`).method('GET');
                    
                oModelFinishProposal.objectID           = oOpportunity.ObjectID;
                oModelFinishProposal.ID                 = oOpportunity.ID;
                oModelFinishProposal.approvalStatusCode = oOpportunity.ApprovalStatusCode;
				oModelFinishProposal.messageStatus      = oOpportunity.Tarefaanterior_KUT;
                oModelFinishProposal.ValidaOportPelaAtividade     = Number(oOpportunity.ValidaOportPelaAtividade_KUT);
                oModelFinishProposal.opportunityValidatedSimulate = oOpportunity.Simulaoconcluidda_KUT
                
                oModelFinishProposal.proposalInformation.reasonPurchase = oOpportunity.Qualoobjetivodacompra_KUT;
                oModelFinishProposal.proposalInformation.media          = oOpportunity.Midia_KUT;

                oModelFinishProposal.CCAValueAssessment = this._formatTheValueInRealWithoutDot(oOpportunity.ValoravaliacaoCCAContent_KUT, 2);
                oModelFinishProposal.broker             = oOpportunity.MainEmployeeResponsiblePartyID;
                
                //pega corretor
                let oBroker = oOpportunity.OpportunityParty.find(sParty => {
                    if(sParty.RoleCode === "39") return sParty;
                });

                //Pega a imobiária
                let aRealEstate = oOpportunity.OpportunityParty.find(sParty => {
                    if(sParty.RoleCode === "ZIMOB") return sParty;
                });

                if(oBroker != undefined && aRealEstate != undefined){
                    oModelFinishProposal.broker = oBroker.PartyID;
                
                    //Adiciona os corretores no modelo
                    this.getModel("broker").setData({ 
                        items: [
                            { 
                                brokerID: oBroker.PartyID,
                                name: oBroker.PartyName,
                                partnerID: aRealEstate.PartyID
                            }
                        ]
                    });
                    this.getModel("broker").refresh(true);

                    oModelFinishProposal.realEstate = aRealEstate.PartyID;
            
                    //Adiciona as imobiliárias no modelo
                    this.getModel("realEstate").setData({ 
                        items: [
                            {
                                partnerID: aRealEstate.PartyID,
                                name: aRealEstate.PartyName,
                                brokers: [{ brokerID: oBroker.PartyID }]
                            }
                        ]
                    });
                    this.getModel("realEstate").refresh(true);

                    let bInvalid = this._searchRealEstate(oModelFinishProposal);

                    if(bInvalid){
                        oMessageWarning += this.getResourceBundle().getText("messageWarningBrokerInvalid");
                    }
                }else{
                    MessageBox.warning(this.getResourceBundle().getText("messageWarningBrokerInvalid"));
                }

                

                let oPositionIntermediate = oOpportunity.IntermediariaContent_KUT.indexOf("."),
                    aIntermediate         = 0;

                if(oPositionIntermediate != -1) aIntermediate = oOpportunity.IntermediariaContent_KUT.replace(".", "").substring(0, oPositionIntermediate + 2);
                else aIntermediate = oOpportunity.IntermediariaContent_KUT;

                oModelPaymentCndts.selectionValueIntermediate      = this._formateValue(aIntermediate, undefined);
                oModelPaymentCndts.selectionSaleForm               = oOpportunity.SalesCycleCode;
                oModelPaymentCndts.selectionPurchaseMethod         = oOpportunity.Modalidadefinanciamento_KUT;

                oModelPaymentCndts.State.selectionSaleForm.Enabled = false;

                //Caso o CAA já esteja nas partes envolvidas, 
                //eu pego para nao perder a refencia depois quando eu atualizar novamente
                let oCCA = oOpportunity.OpportunityParty.find(sParty => {
                    if(sParty.RoleCode === "Z3") return sParty;
                });

                if(oCCA != undefined){
                    oModelFinishProposal.PartyID  = oCCA.PartyID;
                    oModelFinishProposal.RoleCode = oCCA.RoleCode;
                }


                for(let sParty of oOpportunity.OpportunityParty){
                    if(sParty.RoleCode === "31" || sParty.RoleCode === "Z4"|| 
                       sParty.RoleCode === "Z5" || sParty.RoleCode === "Z6"||
                       sParty.RoleCode === "Z7")
                    {   
                        //Busca proponente para carregar as partes envolvidas
                        let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${sParty.PartyID}'&$format=json`).method('GET');

                        let oModelProponent = Proponent.initSelectionModel();

                        if(oIndividualCustomer != undefined){
                            await this._searchAndFillProponent(oModelProponent, oIndividualCustomer);
                            
                            oModelInvParties.items.push(oModelProponent.physicalPerson);

                            oModelProponent.physicalPerson.opportunityParty.objectID = sParty.ObjectID;

                            oModelInvParties.buttonsPhysicalPerson = true;
                        }else{
                            //Busca proponente para carregar os campos na tela
                            let oCorporateAccount = await this.callServiceFormatedJSON(`CorporateAccountCollection?$filter=AccountID eq '${sParty.PartyID}'&$format=json`).method('GET');

                            if(oCorporateAccount != undefined){
                                this._fillLegalPerson(oModelProponent.legalPerson, oCorporateAccount);

                                oModelProponent.legalPerson.opportunityParty.objectID = sParty.ObjectID;

                                oModelInvParties.items.push(oModelProponent.legalPerson);

                                oModelInvParties.buttonsLegalPerson = true;
                            }
                        }
                    }else
                    if(sParty.RoleCode === "ZP"){
                        //Busca proponente para carregar as partes envolvidas
                        let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${sParty.PartyID}'&$format=json`).method('GET');

                        if(oIndividualCustomer != undefined){
                            let oModelAttorney = Attorney.initSelectionModel();

                            this._fillAttorney(oModelAttorney, oIndividualCustomer);

                            oModelAttorney.opportunityParty.objectID = sParty.ObjectID;

                            oModelInvParties.items.push(oModelAttorney);
                        }
                    }else
                    if(sParty.RoleCode === "ZR"){
                        //Busca proponente para carregar as partes envolvidas
                        let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${sParty.PartyID}'&$format=json`).method('GET');

                        if(oIndividualCustomer != undefined){
                            let oModelFinancialOfficer = FinancialOfficer.initSelectionModel();

                            this._fillInFinancialOfficer(oModelFinancialOfficer, oIndividualCustomer);

                            oModelFinancialOfficer.opportunityParty.objectID = sParty.ObjectID;

                            oModelInvParties.items.push(oModelFinancialOfficer);
                        }
                    }else
                    if(sParty.RoleCode === "Z1" || sParty.RoleCode === "ZF2"){
                        //Busca proponente para carregar as partes envolvidas
                        let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${sParty.PartyID}'&$format=json`).method('GET');

                        if(oIndividualCustomer != undefined){
                            let oModelGuarantor = Guarantor.initSelectionModel();

                            await this._findGuarantorAndSpouse(oModelGuarantor, oIndividualCustomer);

                            oModelGuarantor.opportunityParty.objectID = sParty.ObjectID;

                            oModelInvParties.items.push(oModelGuarantor);
                        }
                    }else
                    if(sParty.RoleCode === "ZRL"){
                        //Busca proponente para carregar as partes envolvidas
                        let oIndividualCustomer = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${sParty.PartyID}'&$format=json`).method('GET');
                        
                        if(oIndividualCustomer != undefined){
                            let oModelLegalRepresentative = LegalRepresentative.initSelectionModel();

                            this._fillInFinancialOfficer(oModelLegalRepresentative, oIndividualCustomer);

                            oModelLegalRepresentative.opportunityParty.objectID = sParty.ObjectID;

                            oModelInvParties.items.push(oModelLegalRepresentative);
                        }
                    }
                }

                if(oOpportunity.OpportunityItem.length != 0){
                    oModelFinishProposal.product.objectID  = oOpportunity.OpportunityItem[0].ObjectID;
                    oModelFinishProposal.product.productID = oOpportunity.OpportunityItem[0].ProductID;

                    let { oTableValue, oNetValueSBPE, oNetValueCVA, oDataParms } = await this._initFinishProposal(oOpportunity.SalesUnitPartyID, oOpportunity.OpportunityItem[0].ProductID);

                    if(oModelPaymentCndts.selectionPurchaseMethod === "2"){
                        let oModelEnterprises = this.getModel("enterprises").getData();

                        let oTableValueTeto = Number(this._clearFormattingValue(oModelEnterprises.items[0].tableValueTetoCVA));

                        this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValueTeto}`, undefined);
                        this.getModel("proposalEvaluation").refresh(true);

                        oModelEnterprises.tableVisible = false;
                        oModelEnterprises.tetoVisible  = true;
                        this.getModel("enterprises").refresh(true);
                    }
                    else this.getModel("proposalEvaluation").getData().items[0].unitValue   = this._formateValue(`${oTableValue}`, undefined);

                    
                    this.getModel("proposalEvaluation").getData().discountAdditionText = this.getResourceBundle().getText("paymentConditionsDiscount");
                    this.getModel("proposalEvaluation").refresh(true);

                    if(oOpportunity.OpportunityParcelas_SDK.length != 0){                
                        let oItemEnterprise         = this.getModel("enterprises").getData().items[0],
                            oModelPaymentCdtns      = this.getModel("paymentConditions").getData(),
                            oItemsMonthlyDescending = [],
                            oItemsIntermediate      = [],
                            oValueTotalIntermediate = 0;

                        //verifico se tem mais de uma parcela intermediaria
                        let oItemsIntermediateToCheck = oOpportunity.OpportunityParcelas_SDK.filter(sItem => {
                            if(sItem.codigoComponento_SDK === "27") return sItem;
                        }) 

                        //pega as parcelas para o plano de pagamento
                        for(let oItem of oOpportunity.OpportunityParcelas_SDK){
                            let oObject = {
                                codComponent: oItem.Z_COD_COMPN_SDK,
                                dueDate: this._formatedDate(oItem.Z_DAT_INI_CALC_SDK),
                                deadline: oItemEnterprise.estimatedDeliveryDate,
                                unitaryValue: this._formateValue(`${this._formatTheValueInRealWithoutDot(oItem.Z_VALOR_PARCELAcontent_SDK, 2)}`, undefined),
                                oValueTotal: this._formateValue(`${this._formatTheValueInRealWithoutDot(oItem.Z_VALOR_FINANCIAMENTOcontent_SDK, 2)}`, undefined),
                                theAmount: oItem.Z_QTD_PARC_SDK,
                                State: {
                                    buttonRemove: {
                                        Visible: true
                                    },
                                    theAmount: {
                                        Enabled: false,
                                    },
                                    valueTotal: {
                                        Enabled: false,
                                    },
                                    dueDate: {
                                        Enabled: false,
                                    },
                                    unitaryValue: {
                                        Enabled: false,
                                    }
                                }
                            }

                            let oValueTotal = Number((this._formatTheValueInRealWithoutDot(oItem.Z_VALOR_FINANCIAMENTOcontent_SDK, 2)));

                            let percentage = `${(oValueTotal/ oTableValue) * 100}`;

                            let oObjectPercentage = this._formatedPercentage(percentage);

                            let oObjectFinish,
                                oObjectDescending;

                            switch (oItem.codigoComponento_SDK) {
                                case "1"://Sinal
                                    //Sinal
                                    oObject.State.dueDate.Enabled      = true;
                                    oObject.State.unitaryValue.Enabled = true;
                                    oObject.State.buttonRemove.Visible = false;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.signal, oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.signal, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "899"://Desconto de venda
                                    //desconto de venda
                                    oObject.State.dueDate.Enabled      = true;
                                    oObject.State.unitaryValue.Enabled = true;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.discountSale , oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.discountSale, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "61"://Entrega de chaves
                                    //entrega de chaves
                                    oObject.State.theAmount.Enabled    = true;
                                    oObject.State.dueDate.Enabled      = true;
                                    oObject.State.unitaryValue.Enabled = true;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.deliveryKeys , oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.deliveryKeys, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "62"://FGTS
                                    //FGTS
                                    oObject.State.unitaryValue.Enabled = true;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.FGTS, oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.FGTS, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "500"://Financiamento CEF
                                    //CEF
                                    oObject.State.unitaryValue.Enabled = true;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.CEF, oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.CEF, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "55"://Subsídio
                                    //Subsídio
                                    oObject.State.unitaryValue.Enabled = true;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.subsidy, oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.subsidy, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "34"://Mensa - Reajustável
                                    oModelPaymentCndts.selectionPaymentPlan = "MR";

                                    oObject.State.theAmount.Enabled    = true;
                                    oObject.State.dueDate.Enabled      = true;
                                    oObject.State.unitaryValue.Enabled = true;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.adjustableMonthly, oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.adjustableMonthly, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "2"://Mensal Fixa
                                    oModelPaymentCndts.selectionPaymentPlan = "MF";

                                    oObject.State.theAmount.Enabled    = true;
                                    oObject.State.dueDate.Enabled      = true;
                                    oObject.State.unitaryValue.Enabled = true

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.fixedMonthly, oObject, oObjectPercentage);

                                    this._orderComponentsInPaymentConditions(this.fixedMonthly, oModelPaymentCdtns.items, oObjectFinish);
                                    break;
                                case "44"://Mensal Decrescente - Reajustável
                                    oModelPaymentCndts.selectionPaymentPlan = "MDR";
                                    oObject.State.theAmount.Enabled    = true;
                                    oObject.State.dueDate.Enabled      = true;
                                    oObject.State.unitaryValue.Enabled = true;

                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.descendingMonthly, oObject, oObjectPercentage);

                                    oItemsMonthlyDescending.push(oObjectFinish);
                                    break;
                                case "27"://Intermediária
                                    oObjectFinish = this._createObjectItemPaymentConditions(Math.random(), this.intermediate, oObject, oObjectPercentage);

                                    if(oItemsIntermediateToCheck.length != 1){
                                        oValueTotalIntermediate += Number(this._clearFormattingValue(oObjectFinish.selectionUnitaryValue));

                                        oItemsIntermediate.push(oObjectFinish);
                                    }else{
                                        oModelPaymentCdtns.selectionValueIntermediate = this._formateValue(`${this._formatTheValueInRealWithoutDot(oItem.Z_VALOR_FINANCIAMENTOcontent_SDK, 2)}`, undefined);
                                        oModelPaymentCdtns.State.selectionValueIntermediate.Visible = true;
                                    
                                        this._orderComponentsInPaymentConditions(this.intermediate, oModelPaymentCdtns.items, oObjectFinish);
                                    }
                                    break;
                            }
                        }

                        //Verifico se tem mais de uma intermediaria, pois se tiver quer dizer que a divisão das parcelas não deu exata
                        if(oItemsIntermediate.length != 0){
                            //Ordena as datas em ordem crescente
                            /*oItemsIntermediate.sort(function(sDateOne, sDateTwo){
                                return sDateOne.selectionDueDate === sDateTwo.selectionDueDate ? 0 : sDateOne.selectionDueDate > sDateTwo.selectionDueDate ? 1 : -1
                            });*/

                            //Divide para ver se tem parcelas quebradas
                            let aDifference = oValueTotalIntermediate / oItemsIntermediate.length,
                                oPositionDiff = `${aDifference}`.indexOf(".");

                            if(oPositionDiff != -1){
                                aDifference = Number(`${aDifference}`.substring(0, oPositionDiff));
                        
                                //Parcela com o total de todas as parcelas da intermediaria
                                let oObjectFinishTotal = oItemsIntermediate[1],
                                    percentage         = `${(oValueTotalIntermediate/ oTableValue) * 100}`,
                                    oObjectPercentage  = this._formatedPercentage(percentage);
                                
                                oObjectFinishTotal.selectionPercentage         = oObjectPercentage.percentage;
                                oObjectFinishTotal.selectionPercentageFormated = oObjectPercentage.percentageFormated;
                                oObjectFinishTotal.selectionTheAmount          = oItemsIntermediate.length - 1;
                                oObjectFinishTotal.selectionValueTotal         = this._formateValue(`${oValueTotalIntermediate}`, undefined);
                                    
                                this._orderComponentsInPaymentConditions(this.intermediate, oModelPaymentCdtns.items, oObjectFinishTotal);
                            
                                //Primeira parcela com a diferença entre as outras
                                let oObjectFinishOne = oItemsIntermediate[0];
                                
                                oObjectFinishOne.selectionValueTotal = "";

                                this._orderComponentsInPaymentConditions(this.intermediate, oModelPaymentCdtns.items, oObjectFinishOne);

                            }else{
                                oModelPaymentCdtns.selectionValueIntermediate = this._formateValue(`${oValueTotalIntermediate}`, undefined);
                                oModelPaymentCdtns.State.selectionValueIntermediate.Visible = true;

                                let oObjectFinish     = oItemsIntermediate[0],
                                    percentage        = `${(oValueTotalIntermediate/ oTableValue) * 100}`,
                                    oObjectPercentage = this._formatedPercentage(percentage);
                                
                                oObjectFinish.selectionPercentage         = oObjectPercentage.percentage;
                                oObjectFinish.selectionPercentageFormated = oObjectPercentage.percentageFormated;
                                oObjectFinish.selectionTheAmount          = oItemsIntermediate.length;
                                oObjectFinish.selectionValueTotal         = this._formateValue(`${oValueTotalIntermediate}`, undefined);
                                    
                                this._orderComponentsInPaymentConditions(this.intermediate, oModelPaymentCdtns.items, oObjectFinish);
                            }

                            oModelPaymentCdtns.selectionValueIntermediate               = this._formateValue(`${oValueTotalIntermediate}`, undefined);
                            oModelPaymentCdtns.State.selectionValueIntermediate.Visible = true;
                        }

                        //Remove os componentes já existentes no modelo, com exceção das mensais
                        for(let oItem of oModelPaymentCndts.items){
                            if(oItem.selectionComponents != this.adjustableMonthly &&
                               oItem.selectionComponents != this.fixedMonthly      &&
                               oItem.selectionComponents != this.descendingMonthly)
                            {
                                this._addRemoveComponents(oItem.selectionComponents, "remove");
                            }
                        }

                        //verifica se a modalidade é SBPE, se for remove o componente subsídio
                        if(oModelPaymentCndts.selectionPurchaseMethod === "1"){
                            this._addRemoveComponents(this.subsidy, "remove");
                            this._addRemoveComponents(this.discountSale, "remove");
                        }

                        //Remove os componentes já existentes no modelo, de acordo com a forma de venda
                        this._removeComponents(oModelPaymentCndts);

                        if(oItemsMonthlyDescending.length != 0){
                            //Ordena as datas em ordem crescente
                            oItemsMonthlyDescending.sort(function(sDateOne, sDateTwo){
                                return sDateOne.selectionDueDate == sDateTwo.selectionDueDate ? 0 : sDateOne.selectionDueDate > sDateTwo.selectionDueDate ? 1 : -1
                            });

                            let oValueTotalDescending = 0,
                                oCountPortion         = 0,
                                oObjectFinish         = oItemsMonthlyDescending[0];

                            oOpportunity.OpportunityParcelas_SDK.map(sItem => {
                                if(sItem.codigoComponento_SDK === "44"){//Mensal Decrescente - Reajustável)
                                    oValueTotalDescending += Number((this._formatTheValueInRealWithoutDot(sItem.Z_VALOR_FINANCIAMENTOcontent_SDK, 2)));
                                    oCountPortion++;
                                }
                            });

                            let percentage = `${(oValueTotalDescending/ oTableValue) * 100}`;

                            let oObjectPercentage = this._formatedPercentage(percentage);

                            oObjectFinish.selectionPercentage = oObjectPercentage.percentage;
                            oObjectFinish.selectionPercentageFormated = oObjectPercentage.percentageFormated;
                            oObjectFinish.selectionTheAmount  = oCountPortion;
                            oObjectFinish.selectionValueTotal = this._formateValue(`${oValueTotalDescending}`, undefined);

                            this._orderComponentsInPaymentConditions(this.descendingMonthly, oModelPaymentCdtns.items, oObjectFinish);
                        }

                        this._calculationProposed(oModelPaymentCdtns.items, "");           
                    }else{
                        await this._fulfillPaymentCondition(oDataPurchaseMethod, Number(oTableValue), Number(oNetValueSBPE), Number(oNetValueCVA), oDataParms);
                    }
                }else{
                    this.getModel("paymentConditions").refresh(true);

                    await this._initAvailabilityMap(oOpportunity.SalesUnitPartyID);
                    this._oNavContainer.to(this._oAvailabilityMap);
                }

                if(oMessageWarning != ""){
                    MessageBox.warning(oMessageWarning);
                }
                
            }

            this.getModel("paymentConditions").refresh(true);
            this.getModel("finishProposal").refresh(true);
            this.getModel("involvedParties").refresh(true);

            let oItemsInvParties = this.getModel("involvedParties").getData().items;

            //Define o proponente principal de acordo com a renda
            this._setMainBidder(oItemsInvParties);

            this.setAppBusy(false);

            //Busca dados dos campos relacionado aos cadastro de cliente
            await this._searchRelatedRegistrationFields();
        },

        _removeComponents: function(sModelPaymentCndts){
            //Remove os componentes já existentes no modelo, de acordo com a forma de venda
            switch (sModelPaymentCndts.selectionSaleForm) {
                case "Z02"://Direta
                    this._addRemoveComponents(this.subsidy, "remove");
                    this._addRemoveComponents(this.FGTS, "remove");
                    this._addRemoveComponents(this.CEF, "remove");
                    this._addRemoveComponents(this.discountSale, "remove");

                    sModelPaymentCndts.State.selectionPurchaseMethod.Visible = false;
                    break;
                case "Z03"://Á Vista
                    //this.signal, this.discountSale;

                    this._addRemoveComponents(this.subsidy, "remove");
                    this._addRemoveComponents(this.FGTS, "remove");
                    this._addRemoveComponents(this.CEF, "remove");
                    this._addRemoveComponents(this.deliveryKeys, "remove");
                    this._addRemoveComponents(this.adjustableMonthly, "remove");
                    this._addRemoveComponents(this.intermediate, "remove");

                    sModelPaymentCndts.State.selectionPurchaseMethod.Visible = false;
                    sModelPaymentCndts.State.selectionPaymentPlan.Visible    = false;
                    break;
                case "Z04"://FGTS
                    //this.signal, this.adjustableMonthly, this.FGTS, this.intermediate, this.deliveryKeys;
                    this._addRemoveComponents(this.subsidy, "remove");
                    this._addRemoveComponents(this.CEF, "remove");
                    this._addRemoveComponents(this.discountSale , "remove");

                    sModelPaymentCndts.State.selectionPurchaseMethod.Visible = false;
                    break;
            }
        },

        _searchBrokerRelationshipXRealEstate: async function(sPartnerOrg){
            let oRealEstate = [],
                oBroker     = [];    

            for(let oPartnerOrg of sPartnerOrg){
                let oDataRelationCI   = await this.callService(`BusinessPartnerRelationshipCollection?$filter=RelationshipType eq 'ZCRM08' and SecondBusinessPartnerID eq '${oPartnerOrg.PartnerID}'&$format=json&$select=FirstBusinessPartnerName_SDK,FirstBusinessPartnerID`).method('GET'),
                    oBrokers          = [],
                    oObjectRealEstate = {};
                
                for(let oRelationCI of oDataRelationCI){
                    let oObject = {};

                    oObject.brokerID  = oRelationCI.FirstBusinessPartnerID;
                    oObject.name      = oRelationCI.FirstBusinessPartnerName_SDK;

                    //é adicionado ID da imobiliária ao corretor
                    oObject.partnerID = oPartnerOrg.PartnerID;

                    if(oBroker.length != 0){
                        let oExist = oBroker.find(sExist => {
                            if(oObject.brokerID === sExist.brokerID) return sExist;
                        });

                        if(oExist === undefined) {
                            oBroker.push(oObject);
                        }
                    }else oBroker.push(oObject);

                    //adiciona os corretores com o id da imobiliaria que ele está relacionado
                    oBrokers.push({ brokerID: oObject.brokerID });
                }
                
                //adiciona a imobiliaria com os corretores que ela possui
                oObjectRealEstate.partnerID = oPartnerOrg.PartnerID;
                oObjectRealEstate.name      = oPartnerOrg.Partner.BusinessPartnerFormattedName;
                oObjectRealEstate.brokers   = oBrokers;
                oRealEstate.push(oObjectRealEstate);
            }

            //Adiciona os corretores no modelo
            this.getModel("broker").setData({ items: oBroker });
            this.getModel("broker").refresh(true);

            //Adiciona as imobiliárias no modelo
            this.getModel("realEstate").setData({ items: oRealEstate });
            this.getModel("realEstate").refresh(true);

            this.getModel("finishProposal").getData().itemsBrokers    = oBroker;
            this.getModel("finishProposal").getData().itemsRealEstate = oRealEstate;
            this.getModel("finishProposal").refresh(true);
        },

        _initFinishProposal: async function(sOrgID, sProductID){
            let oPriceListItem,
                oPriceListItem01,
                oPriceListItem02;

            let oModelPurchaseMethod = this.getModel("purchaseMethod").getData().items;
            
            //Busca as tabelas de venda
            let { oPriceList, oPriceList01, oPriceList02 } = await this._searchSalesPriceLists(sOrgID);

            if(oPriceList != undefined){
                oPriceListItem = oPriceList.InternalPriceDiscountListItems.find(sItem => {
                    if(sItem.ProductID === sProductID) return sItem;
                });

                if(oPriceListItem === undefined){
                    let oTitle = "Tabelas de vendas não cadastradas",
                        oText  = "Tabela de avaliação não encontrada. Favor revisar!";

                    this.toPageNotFound(oTitle, oText);
                }
            }
                
            //-------------------------------------------------------------------------------------------//
            //TABELA DE VENDA - SBPE
            if(oPriceList01 != undefined){
                oPriceListItem01 = oPriceList01.InternalPriceDiscountListItems.find(sItem => {
                    if(sItem.ProductID === sProductID) return sItem;
                });

                if(oPriceListItem01 === undefined){
                    let oItems = oModelPurchaseMethod.filter(sItem => {
                        if(sItem.Code != "1") return sItem;
                    });
    
                    this.getModel("purchaseMethod").getData().items = oItems;
                    this.getModel("purchaseMethod").refresh(true);
                }
            }else{
                let oItems = oModelPurchaseMethod.filter(sItem => {
                    if(sItem.Code != "1") return sItem;
                });

                this.getModel("purchaseMethod").getData().items = oItems;
                this.getModel("purchaseMethod").refresh(true);
            }

            //-------------------------------------------------------------------------------------------//
            //TABELA DE VENDA - CVA
            if(oPriceList02 != undefined){
                oPriceListItem02 = oPriceList02.InternalPriceDiscountListItems.find(sItem => {
                    if(sItem.ProductID === sProductID) return sItem;
                });

                if(oPriceListItem02 === undefined){
                    let oItems = oModelPurchaseMethod.filter(sItem => {
                        if(sItem.Code != "2") return sItem;
                    });
    
                    this.getModel("purchaseMethod").getData().items = oItems;
                    this.getModel("purchaseMethod").refresh(true);
                }
            }else{
                let oItems = oModelPurchaseMethod.filter(sItem => {
                    if(sItem.Code != "2") return sItem;
                });

                this.getModel("purchaseMethod").getData().items = oItems;
                this.getModel("purchaseMethod").refresh(true);
            }

            let oDataProduct = await this.callServiceFormatedJSON(`ProductCollection?$filter=ProductID eq '${sProductID}'&$select=ObjectID,ProductID,Empreendimento_KUT,ZSalesStat_KUT,ZSalesStat_KUTText,Bloco_KUT,Unidade_KUT,ZAream2_KUT,DescricaoVaga_KUT&$format=json`).method('GET');
           
            let oSelect    = "&$select=Sinal_KUT,Mensal_KUT,FGTS2_KUT,FinanciamentoCEF_KUT,Subsidio1_KUT,Percdescontovendavista_KUT,Numeroparcelaintermediarias_KUT,Taxaanualreajuste1_KUT,Prestacoesbase1_KUT,Percrendamaximacomprometer_KUT,PercentualrendaCEF_KUT,Resultadoempreendimento_KUT,TaxadejurosdosJurosdeobra_KUT,ValordosegurodosJurosdeobracontent_KUT,Prestacaomaximaassumidacontent_KUT,TetolimitedoCVAdaCidadecontent_KUT,Datadaentrega_KUT,DataPrevissoEntregaInterna_KUT,Numeromaximoparcelas_KUT";

            let oDataParms = await this.callServiceZFormatedJSON(`BusinessPartnerCollection?$filter=IDEmpreendimento_KUT eq '${sOrgID}'${oSelect}&$format=json`).method('GET');

            //Valida se os campos obrigatórios estão preenchidos
            let oMessage = this._checkParametersTable(oDataParms);

            if(oMessage != ""){
                this.getModel("notFoundView").setData(
                    {
                        title: "Parâmetros obrigatórios!",
                        text: "Parâmetros não encontrados na simulação!",
                        description: oMessage
                    }
                );
                this.getModel("notFoundView").refresh(true);

                this.getRouter().navTo("notFound");
                
                this.setAppBusy(false);
            }else{

                let oSignal                   = this._formatedPercentageParms(oDataParms.Sinal_KUT),
                    oReadjustableTable        = this._formatedPercentageParms(oDataParms.Mensal_KUT),
                    oFGTS                     = this._formatedPercentageParms(oDataParms.FGTS2_KUT),
                    oFinancing                = this._formatedPercentageParms(oDataParms.FinanciamentoCEF_KUT),
                    oSubsidy                  = this._formatedPercentageParms(oDataParms.Subsidio1_KUT),
                    oDiscountInCash           = this._formatedPercentageParms(oDataParms.Percdescontovendavista_KUT),
                    oIntermediate             = Number(oDataParms.Numeroparcelaintermediarias_KUT),
                    oAnnualRateReadjustment   = this._formatedPercentageParms(oDataParms.Taxaanualreajuste1_KUT),
                    oBasicBenefits            = Number(oDataParms.Prestacoesbase1_KUT),
                    oPercMaximumIncomeCommit  = this._formatedPercentageParms(oDataParms.Percrendamaximacomprometer_KUT),
                    oPercIncomeCEF            = this._formatedPercentageParms(oDataParms.PercentualrendaCEF_KUT),
                    //oMinimumDemandDate        = this._formatedDate(oDataParms.Datademandaminima_KUT),
                    oEnterpriseResult         = oDataParms.Resultadoempreendimento_KUT,
                    oInterestRateInterestWork = this._formatedPercentageParms(oDataParms.TaxadejurosdosJurosdeobra_KUT),
                    sNumberOfDigits           = 2,
                    oNetValueSBPE             = 0,
                    oNetValueCVA              = 0;

                //Valor do seguro dos Juros de obra
                let oAmountInsuranceInterestWorkContent = this._formatTheValueInRealWithoutDot(oDataParms.ValordosegurodosJurosdeobracontent_KUT, sNumberOfDigits);

                //Prestação máxima assumida
                let oMaximumInstallmentAssumed = this._formatTheValueInRealWithoutDot(oDataParms.Prestacaomaximaassumidacontent_KUT, sNumberOfDigits);

                //Valor máximo do Teto CVA
                let oValueTetoCVA = this._formatTheValueInRealWithoutDot(oDataParms.TetolimitedoCVAdaCidadecontent_KUT, sNumberOfDigits);

                //Valor líquido da tabela
                let oNetValueTable = this._formatTheValueInRealWithoutDot(oPriceListItem.Amount, sNumberOfDigits);

                //Valor de avaliação do produto
                let oTableValue = this._formatTheValueInRealWithoutDot(oPriceListItem.Amount, sNumberOfDigits);

                //Valor líquido SBPE
                if(oPriceListItem01 != undefined){
                    oNetValueSBPE = this._formatTheValueInRealWithoutDot(oPriceListItem01.Amount, sNumberOfDigits);
                }

                //Valor líquido CVA
                if(oPriceListItem02 != undefined){
                    oNetValueCVA = this._formatTheValueInRealWithoutDot(oPriceListItem02.Amount, sNumberOfDigits);
                 
                    if(oNetValueTable <= oValueTetoCVA) oNetValueTable = oNetValueTable;
                    else if(oNetValueTable > oValueTetoCVA) oNetValueTable = oValueTetoCVA;
                }
                 

                if(oDataProduct){
                    let deliveryDate           = this._formatedDate(oDataParms.Datadaentrega_KUT),
                        oEstimatedDeliveryDate = this._formatedDate(oDataParms.DataPrevissoEntregaInterna_KUT),
                        oMonthEstimatedDate    = Number(oEstimatedDeliveryDate.substring(3,5)),
                        oYearEstimatedDate     = Number(oEstimatedDeliveryDate.substring(6, 10)),
                        oEstimatedDateMonth    = this._calculationTimeCourse(oMonthEstimatedDate, oYearEstimatedDate, 0),
                        oMonth                 = Number(deliveryDate.substring(3,5)),
                        oYear                  = Number(deliveryDate.substring(6, 10)),
                        oDeliveryMonth         = this._calculationTimeCourse(oMonth, oYear, 0),
                        newDate                = new Date(),
                        dayDate                = sap.ui.core.format.DateFormat.getDateTimeInstance({
                            pattern: "dd/MM/yyyy HH:mm:ss",
                            UTC: false
                        }).format(newDate),
                        oArea                  = Number(oDataProduct.ZAream2_KUT.replace(".", "")),
                        oPriceArea             = oTableValue / oArea;
                        

                    this.getModel("enterprises").getData().items.push({
                        orgID: sOrgID,
                        objectID: oDataProduct.ObjectID,
                        productID: oDataProduct.ProductID,
                        nameEnterprise: oDataProduct.Empreendimento_KUT,
                        status: oDataProduct.ZSalesStat_KUT,
                        statusText: oDataProduct.ZSalesStat_KUTText,
                        block: oDataProduct.Bloco_KUT,
                        unit: oDataProduct.Unidade_KUT,
                        area: oDataProduct.ZAream2_KUT,
                        estimatedDeliveryDate: oEstimatedDeliveryDate,
                        estimatedDeliveryMonth: oEstimatedDateMonth,
                        maximumNumberInstallments: Number(oDataParms.Numeromaximoparcelas_KUT),
                        annualRateReadjustment: oAnnualRateReadjustment,
                        basicBenefits: oBasicBenefits,
                        percMaximumIncomeCommit: oPercMaximumIncomeCommit,
                        percIncomeCEF: oPercIncomeCEF,
                        maximumInstallmentAssumed: oMaximumInstallmentAssumed,
                        //minimumDemandDate: oMinimumDemandDate,
                        enterpriseResult: oEnterpriseResult,
                        interestRateInterestWork: oInterestRateInterestWork,
                        amountInsuranceInterestWorkContent: oAmountInsuranceInterestWorkContent,
                        valueTetoCVA: oValueTetoCVA,
                        deliveryDate: deliveryDate,
                        deliveryDateMonth: `${deliveryDate} (${oDeliveryMonth} meses)`,
                        price: this._formateValue(oPriceArea.toString().substring(0, 7), undefined),
                        vacancies: oDataProduct.DescricaoVaga_KUT,
                        SBPEValue: oPriceListItem01 != undefined ? this._formateValue(`${oNetValueSBPE}`, undefined) : this._formateValue("000", undefined),
                        SBPEValueNotModify: oPriceListItem01 != undefined ? this._formateValue(`${oNetValueSBPE}`, undefined) : this._formateValue("000", undefined),
                        CVAValue: oPriceListItem02 != undefined ? this._formateValue(`${oNetValueCVA}`, undefined) : this._formateValue("000", undefined),
                        CVAValueNotModify: oPriceListItem02 != undefined ? this._formateValue(`${oNetValueCVA}`, undefined) : this._formateValue("000", undefined),
                        tableValueTetoCVA: this._formateValue(`${oNetValueTable}` , undefined),
                        tableValue: this._formateValue(`${oTableValue}` , undefined),
                        proposalDate: dayDate,
                        showIntermediate: (oNetValueTable > oTableValue ? true : false),
                        tableParms: {
                            signal: oSignal,
                            readjustableTable: oReadjustableTable,
                            FGTS: oFGTS,
                            financing: oFinancing,
                            subsidy: oSubsidy,
                            intermediate: oIntermediate,
                            discountInCash: oDiscountInCash
                        }
                    });

                    this.getModel("enterprises").getData().SBPEVisible  = oPriceListItem01 != undefined ? true  : false;
                    this.getModel("enterprises").getData().CVAVisible   = oPriceListItem02 != undefined ? true  : false;
                    this.getModel("enterprises").getData().tableVisible = oPriceListItem01 != undefined ? true  : false;
				    this.getModel("enterprises").getData().tetoVisible  = oPriceListItem01 != undefined ? false : true;

                    this.getModel("enterprises").refresh(true);

                    oPriceListItem01 === undefined ? oTableValue = oNetValueTable : "";
                }

                this._initGraphicSituation();

                return { oTableValue, oNetValueSBPE, oNetValueCVA, oDataParms };
            }
        },

        _checkParametersTable: function(sParms){
            //console.log(sParms)

            let oMessage = "";

            if(sParms.Datadaentrega_KUT === null ||
               sParms.Datadaentrega_KUT === "")
            {
                oMessage = "Data da Entrega não preenchido!";
            }

            if(sParms.DataPrevissoEntregaInterna_KUT === null ||
               sParms.DataPrevissoEntregaInterna_KUT === "")
            {
                if(oMessage != ""){
                    oMessage += "\nData previsão entrega interna não preenchido!"
                }else{
                    oMessage = "Data previsão entrega interna não preenchido!"
                }
            }

            if(sParms.TetolimitedoCVAdaCidadecontent_KUT === "0.000000" ||
               sParms.TetolimitedoCVAdaCidadecontent_KUT === "")
            {
                if(oMessage != ""){
                    oMessage += "\nValor limite teto CVA não preenchido!"
                }else{
                    oMessage = "Valor limite teto CVA não preenchido!"
                }
            }

            if(sParms.Numeroparcelaintermediarias_KUT === "0" ||
               sParms.Numeroparcelaintermediarias_KUT === "")
            {
                if(oMessage != ""){
                    oMessage += "\nNúmero de intervalo para intermediária não preenchido!"
                }else{
                    oMessage = "Número de intervalo para intermediária não preenchido!"
                }
            }

            if(sParms.Numeromaximoparcelas_KUT === "0" ||
               sParms.Numeromaximoparcelas_KUT === "")
            {
                if(oMessage != ""){
                    oMessage += "\nNúmero máximo de parcelas não preenchido!"
                }else{
                    oMessage = "Número máximo de parcelas não preenchido!"
                }
            }

            if(sParms.Prestacoesbase1_KUT === "0" ||
               sParms.Prestacoesbase1_KUT === "")
            {
                if(oMessage != ""){
                    oMessage += "\nPrestação base não preenchido!"
                }else{
                    oMessage = "Prestação base não preenchido!"
                } 
            }

            /*
            sParms.TetolimitedoCVAdaCidadecontent_KUT === "0.000000"
            sParms.Prestacaomaximaassumidacontent_KUT === "0.000000"
            sParms.Resultadoempreendimento_KUT === "0.00"
            
            sParms.Percrendamaximacomprometer_KUT === "0.00"
            sParms.PercentualrendaCEF_KUT === "0.00"
            sParms.TaxadejurosdosJurosdeobra_KUT === "0.00"
            sParms.ValordosegurodosJurosdeobracontent_KUT === "0.000000"
            */

            return oMessage;
        },

        _fillInSBPESalesForm: function(sTableValue, sNetValue){
            //----------------------------------------------------------------------------------------//
            //--------------------------- Condição de pagamento SBPE ---------------------------------//
            let aFieldClassSBPE    = [this.signal, this.adjustableMonthly, this.FGTS, this.CEF],
                oValueIntermediate = sTableValue > sNetValue ? true : false,
                oItemsSBPE         = [],
                oItemsComponents   = this.getModel("componentsValues").getData().items,
                aFieldComponents   = [this.deliveryKeys];

            if(oValueIntermediate) aFieldClassSBPE.push(this.intermediate);
            else aFieldComponents.push(this.intermediate);

            //Inicia a tabela de condição de pagamento
            aFieldClassSBPE.forEach(sField => {
                this._addRowInTable(sField, oItemsSBPE, sNetValue, sTableValue, "SBPE");
            });
            
            this._addRemoveComponents(this.subsidy, "remove");
            this._addRemoveComponents(this.discountSale, "remove");

            return oItemsSBPE;
        },

        _fillInCVASalesForm: function(sTableValue, sNetValue){
            //----------------------------------------------------------------------------------------//
            //--------------------------- Condição de pagamento CVA ----------------------------------//
            let oFieldClassCVA     = [this.signal, this.adjustableMonthly, 
                                      this.FGTS, this.CEF, this.subsidy],
                oValueIntermediate = sTableValue > sNetValue ? true : false,
                oItemsCVA      = [];

            if(oValueIntermediate){
                oFieldClassCVA.push(this.intermediate);
            }

            //Inicia a tabela de condição de pagamento
            oFieldClassCVA.forEach(sField => {
                this._addRowInTable(sField, oItemsCVA, sNetValue, sTableValue, "CVA");
            });

            return oItemsCVA;
        },

        _fillOutDirectSalesForm: function(sTableValue, sNetValue){
            //----------------------------------------------------------------------------------------//
            //--------------------------- Condição de pagamento Direta -------------------------------//
            let aFieldClassDirect  = [this.signal, this.adjustableMonthly],
                oValueIntermediate = sTableValue > sNetValue ? true : false,
                oItemsDirect       = [];

            if(oValueIntermediate){
                aFieldClassDirect.push(this.intermediate);
            }

            aFieldClassDirect.forEach(sField => {
                this._addRowInTable(sField, oItemsDirect, sNetValue, sTableValue, "Direct")
            });

            return oItemsDirect;
        },

        _fillInFGTSSalesForm: function(sTableValue, sNetValue){
            //----------------------------------------------------------------------------------------//
            //--------------------------- Condição de pagamento FGTS ---------------------------------//
            let aFieldClassFGTS    = [this.signal, this.adjustableMonthly, this.FGTS],
                oValueIntermediate = sTableValue > sNetValue ? true : false,
                oItemsFGTS          = [];

            if(oValueIntermediate){
                aFieldClassFGTS.push(this.intermediate);
            }

            aFieldClassFGTS.forEach(sField => {
                this._addRowInTable(sField, oItemsFGTS, sNetValue, sTableValue, this.FGTS)
            });
            
            return oItemsFGTS;

        },

        _fillInCashSaleForm: function(sTableValue){
            let oParms = this.getModel("enterprises").getData().items[0].tableParms;

            //----------------------------------------------------------------------------------------//
            //--------------------------- Condição de pagamento À vista ------------------------------//
            let aFieldClassInCash   = [this.signal, this.discountSale],
                oItemsInCash        = [],
                oValueDiscount      = sTableValue * oParms.discountInCash.percentageCalculo,
                oNetValueInCash     = sTableValue - oValueDiscount;

            aFieldClassInCash.forEach(sField => {
                this._addRowInTable(sField, oItemsInCash, oNetValueInCash, sTableValue, "InCash");
            });

            return oItemsInCash;
        },

        //Preenche condição de pagamento de acordo com a forma  de venda
        _fulfillPaymentCondition: async function(sModelPurchaseMethod, sTableValue, sNetValueSBPE, sNetValueCVA, sParms){
            let oModelPaymentCdtns   = this.getModel("paymentConditions").getData(),
                oModelEnterprise     = this.getModel("enterprises").getData().items[0],
                oItems;

            if(oModelPaymentCdtns.selectionSaleForm === "Z01"){
                if(oModelPaymentCdtns.selectionPurchaseMethod === "1"){
                    oItems = this._fillInSBPESalesForm(sTableValue, sNetValueSBPE);
                }else if(oModelPaymentCdtns.selectionPurchaseMethod === "2"){
                    oItems = this._fillInCVASalesForm(sTableValue, sNetValueCVA);
                }else{
                    if(sModelPurchaseMethod != undefined){
                        for(let oItem of sModelPurchaseMethod){
                            if(oItem.Code === "1"){
                                if(sNetValueSBPE != 0){
                                    oModelPaymentCdtns.selectionPurchaseMethod = "1";
        
                                    oItems = this._fillInSBPESalesForm(sTableValue, sNetValueSBPE);
                                }
                            }else
                            if(oItem.Code === "2"){
                                if(sNetValueCVA != 0){
                                    if(sNetValueSBPE === 0) {
                                        oModelPaymentCdtns.selectionPurchaseMethod = "2";
        
                                        oItems = this._fillInCVASalesForm(sTableValue, sNetValueCVA);
                                    }
                                }
                            }
                        }
                    }
                }
            }else if(oModelPaymentCdtns.selectionSaleForm === "Z02"){
                //Direta
                oItems = this._fillOutDirectSalesForm(sTableValue, sNetValueSBPE);
                
                oModelPaymentCdtns.State.selectionPurchaseMethod.Visible = false;
            }else if(oModelPaymentCdtns.selectionSaleForm === "Z03"){
                //À vista
                oItems = this._fillInCashSaleForm(sTableValue);

                oModelPaymentCdtns.State.selectionPurchaseMethod.Visible = false;
                oModelPaymentCdtns.State.selectionPaymentPlan.Visible    = false;
            }else if(oModelPaymentCdtns.selectionSaleForm === "Z04"){
                //FGTS
                oItems = this._fillInFGTSSalesForm(sTableValue, sNetValueSBPE);

                oModelPaymentCdtns.State.selectionPurchaseMethod.Visible = false;
            }

            oItems.map(sItem =>{
                if(sItem.selectionComponents === this.intermediate &&
                   sItem.selectionValueTotal != ""){
                    oModelPaymentCdtns.selectionValueIntermediate               = sItem.selectionValueTotal;
                    oModelPaymentCdtns.State.selectionValueIntermediate.Visible = true;
                }
            });

            //Remove os componentes já existentes no modelo, de acordo com a forma de venda
            this._removeComponents(oModelPaymentCdtns);

            oModelPaymentCdtns.items = oItems;
            this.getModel("paymentConditions").refresh(true);


            //Faz a soma dos valore pré denifidos
            this._calculationProposed(oItems, "");
        },

        _searchMonthly: function(sModelPaymentCndts, sComponent){
            let oNumberQntd    = 0,
                oItemComponent = undefined;
            
            let oItemsMonthly = sModelPaymentCndts.items.filter(sItem =>{
                if( sItem.selectionComponents === sComponent) return sItem;
            });

            if(oItemsMonthly.length != 0){
                //Ordena as datas em ordem crescente
                oItemsMonthly.sort(function(sDateOne, sDateTwo){
                    return sDateOne.selectionDueDate == sDateTwo.selectionDueDate ? 0 : sDateOne.selectionDueDate > sDateTwo.selectionDueDate ? 1 : -1
                });

                oItemsMonthly.map(sItem =>{
                    oNumberQntd += Number(sItem.selectionTheAmount);
                });

                oItemComponent = oItemsMonthly[0];
            }

            return { oItemComponent, oNumberQntd };
        },

        _mountProposal: function(sModelPaymentCndts, sModelEnterprises, sItemsInvolvedParties, sPATH){
            let oModel                   = this.getModel("finishProposal").getData(),
                oModelProposal           = {},
                oModelInvolvedCreate     = [],
                oModelInvolvedUpdate     = [],
                oModelOpportunityParcSDK = [],
                oModelFinishProposal,
                oCountGroup              = 1,
                oValueMonthly            = 0,
                oDayDueDateIntermediate  = "",
                oCodIntermediate         = "";
            
            oModelProposal.saleForm          = sModelPaymentCndts.selectionSaleForm;
            oModelProposal.organizationID    = sModelEnterprises.orgID;
            oModelProposal.deliveryDate      = sModelEnterprises.deliveryDate;
            oModelProposal.validatedSimulate = oModel.selectionValidatedSimulate;
            oModelProposal.reasonPurchase    = oModel.proposalInformation.reasonPurchase;
            oModelProposal.comments          = oModel.proposalInformation.comments;
            oModelProposal.media             = oModel.proposalInformation.media;

            if(sModelPaymentCndts.selectionSaleForm === "Z01"){
                if(sModelPaymentCndts.selectionPurchaseMethod === "1") {
                    oModelProposal.unitValue = sModelEnterprises.tableValue;
                    oModelProposal.netValue  = sModelEnterprises.SBPEValue;
                }else{
                    oModelProposal.unitValue = sModelEnterprises.tableValueTetoCVA;
                    oModelProposal.netValue  = sModelEnterprises.CVAValue;
                }

                oModelProposal.purchaseMethod = sModelPaymentCndts.selectionPurchaseMethod;
            }else // ----------------- Direta --------------------------
            if(sModelPaymentCndts.selectionSaleForm === "Z02"){
                oModelProposal.unitValue = sModelEnterprises.tableValue;
                oModelProposal.netValue  = sModelEnterprises.SBPEValue;

                oModelProposal.purchaseMethod = "";
            }else // ----------------- À vista -------------------------
            if(sModelPaymentCndts.selectionSaleForm === "Z03"){
                oModelProposal.unitValue = sModelEnterprises.tableValue;
                oModelProposal.netValue  = sModelEnterprises.tableValue;

                oModelProposal.purchaseMethod = "";
            }else // ------------------ FGTS ---------------------------
            if(sModelPaymentCndts.selectionSaleForm === "Z04"){
                oModelProposal.unitValue = sModelEnterprises.tableValue;
                oModelProposal.netValue  = sModelEnterprises.SBPEValue;

                oModelProposal.purchaseMethod = "";
            }
    
            for(let oItem of sModelPaymentCndts.items){
                if(oItem.selectionComponents === this.signal){
                    oModelProposal.signal = oItem.selectionValueTotal;

                    if(sPATH === "PUT"){
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }else{
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }

                    oCountGroup++;
                }else 
                if(oItem.selectionComponents === this.FGTS){
                    oModelProposal.FGTS = oItem.selectionValueTotal;
                    
                    if(sPATH === "PUT"){
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }else{
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }

                    oCountGroup++;
                }else 
                if(oItem.selectionComponents === this.CEF){
                    oModelProposal.CEF = oItem.selectionValueTotal;

                    if(sPATH === "PUT"){
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }else{
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }

                    oCountGroup++;
                }else 
                if(oItem.selectionComponents === this.intermediate){
                    if(oItem.selectionValueTotal != ""){
                        oModelProposal.intermediate = oItem.selectionValueTotal;
                        oDayDueDateIntermediate     = oItem.selectionDueDate.substring(0, 2);
                    }
                    else oDayDueDateIntermediate = oItem.selectionDueDate.substring(0, 2);


                    oCodIntermediate = oItem.codComponent;
                }else 
                if(oItem.selectionComponents === this.subsidy){
                    oModelProposal.subsidy= oItem.selectionValueTotal;

                    if(sPATH === "PUT"){
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }else{
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }

                    oCountGroup++;
                }else 
                if(oItem.selectionComponents === this.adjustableMonthly){
                    oValueMonthly += Number(this._clearFormattingValue(oItem.selectionValueTotal));

                    let { oItemComponent, oNumberQntd } = this._searchMonthly(sModelPaymentCndts, this.adjustableMonthly);

                    oModelProposal.monthlyDate         =  oItemComponent.selectionDueDate;
                    oModelProposal.monthlyInstallments = Number(oNumberQntd);

                    if(sPATH === "PUT"){
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }else{
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }

                    oCountGroup++;
                }else 
                if(oItem.selectionComponents === this.fixedMonthly){
                    oValueMonthly += Number(this._clearFormattingValue(oItem.selectionValueTotal));
                    oModelProposal.monthlyInstallments = oItem.selectionTheAmount;

                    let { oItemComponent, oNumberQntd } = this._searchMonthly(sModelPaymentCndts, this.fixedMonthly);

                    oModelProposal.monthlyDate         =  oItemComponent.selectionDueDate;
                    oModelProposal.monthlyInstallments = Number(oNumberQntd);

                    if(sPATH === "PUT"){
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }else{
                        oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                    }

                    oCountGroup++;
                }else 
                if(oItem.selectionComponents === this.descendingMonthly){
                    oValueMonthly += Number(this._clearFormattingValue(oItem.selectionValueTotal));
                }
            }

            //Busca o plano de pagamento
            let oItemsPaymentPlan = this.getModel("paymentPlan").getData().items;

            //Manda as parcelas da intermediaria
            if(oModelProposal.intermediate != undefined){
                //oDayDueDateIntermediate
                oItemsPaymentPlan.map(sItem => {
                    if(sItem.dueDate != ""){
                        if(sItem.intermediate != ""  &&
                           sItem.intermediate != "-" && 
                           sItem.intermediate != "R$ 0,00")
                        {   
                            let oDatePayPlan = sItem.dueDate.split("/"),
                                oDueDate     = `${oDayDueDateIntermediate}/${oDatePayPlan[0]}/${oDatePayPlan[1]}`

                            let oObjectItem = {
                                codComponent: oCodIntermediate,
                                selectionDueDate: oDueDate,
                                selectionTheAmount: "1",
                                selectionUnitaryValue: sItem.intermediate,
                                selectionValueTotal: sItem.intermediate
                            }

                            if(sPATH === "PUT"){
                                oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oObjectItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                            }else{
                                oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oObjectItem, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                            }

                            
                        
                            oCountGroup++;
                        }
                    }
                });
            }

            oModelProposal.valueMonthly              = oValueMonthly;
            oModelProposal.maximumNumberInstallments = sModelEnterprises.maximumNumberInstallments;

            let oItemsDescendingMonthly = sModelPaymentCndts.items.filter(sItem =>{
                if( sItem.selectionComponents === this.descendingMonthly) return sItem;
            });

            if(oItemsDescendingMonthly.length != 0){
                let { oItemComponent, oNumberQntd } = this._searchMonthly(sModelPaymentCndts, this.descendingMonthly);

                oModelProposal.monthlyDate         = oItemComponent.selectionDueDate;
                oModelProposal.monthlyInstallments = oNumberQntd;

                let oDay = oItemComponent.selectionDueDate.substring(0, 2);

                for(let oItem of oItemsPaymentPlan){
                    let oMonth = oItem.dueDate.substring(0, 2),
                        oYear  = oItem.dueDate.substring(3, 7);

                    let oSelectionDueDate = `${oDay}/${oMonth}/${oYear}`; 

                    if(oItem.dueDate != ""){
                        if(oItem.preKey != "-" && oItem.preKey != ""){   
                            oItemComponent.selectionDueDate      = oSelectionDueDate;
                            oItemComponent.selectionUnitaryValue = oItem.preKey
                            oItemComponent.selectionValueTotal   = oItem.preKey;
                            oItemComponent.selectionTheAmount    = 1;
                            
                            if(sPATH === "PUT"){
                                oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItemComponent, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                            }else{
                                oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItemComponent, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                            }

                            oCountGroup++;
                        }else
                        if(oItem.proKey != "-" && oItem.proKey != ""){
                            oItemComponent.selectionDueDate      = oSelectionDueDate;
                            oItemComponent.selectionUnitaryValue = oItem.proKey;
                            oItemComponent.selectionValueTotal   = oItem.proKey;
                            oItemComponent.selectionTheAmount    = 1;

                            if(sPATH === "PUT"){
                                oModelOpportunityParcSDK.push(this._mountOpportunityPortionPATH(oItemComponent, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                            }else{
                                oModelOpportunityParcSDK.push(this._mountOpportunityPortionSDK(oItemComponent, sModelEnterprises.proposalDate, oModel.objectID, oCountGroup));
                            }

                            oCountGroup++;
                        }
                    }

                    
                }
            }


            //Soma os valores de pró-chaves
            //proChaves
            let oValueProChaves = 0;

            for(let oItem of oItemsPaymentPlan){
                if(oItem.dueDate != ""){
                    if(oItem.proKey != "-" && oItem.proKey != "" ){
                        oValueProChaves += Number(this._clearFormattingValue(oItem.proKey));
                    }
                }
            }
            //Valor de pró-chaves
            oModelProposal.proChaves = oValueProChaves;

            let oNumberProponent       = 4,
                oNumberProponentSpouse = 2,
                oNumberGuarantor       = 1;
            
            //Adiciona no array as partes envolvidas
            for(let oItem of sItemsInvolvedParties){
                if(oItem.functionCode === "31"){
                    if(oItem.checkBoxMainBuyer === true){
                        if(sPATH === "PUT"){
                            oModelFinishProposal = this._createObjectOpportunityPATH(oItem, oModelProposal, oModel.broker, "PATCH");
                        }else{
                            oModelFinishProposal = this._createObjectOpportunity(oItem, oModelProposal, oModel.broker, "");
                        }

                        if(oItem.radioButtonCPF != undefined){
                            if(oItem.biddersSpouseData.cpf != ""){
                                let oObjectSpouse;

                                if(sPATH === "PUT"){
                                    oObjectSpouse = this._createObjectOpportunityPartyPATH(oItem.biddersSpouseData);
                                }else{
                                    oObjectSpouse = this._createObjectOpportunityParty(oItem.biddersSpouseData);
                                } 
                                    
                                oModelInvolvedUpdate.push(oObjectSpouse);
                            }
                        }
                    }else{
                        let oObject;

                        if(sPATH === "PUT"){
                            oObject = this._createObjectOpportunityPartyPATH(oItem);
                            oObject.Funcao = `Z${oNumberProponent}`
                        }else{
                            oObject = this._createObjectOpportunityParty(oItem);
                            oObject.RoleCode = `Z${oNumberProponent}`
                            //oObject.ParentObjectID = oModel.objectID;
                        }

                        oModelInvolvedUpdate.push(oObject);

                        oNumberProponent++;

                        if(oItem.radioButtonCPF != undefined){
                            if(oItem.biddersSpouseData.cpf != ""){
                                let oObjectSpouse;

                                if(sPATH === "PUT"){
                                    oObjectSpouse = this._createObjectOpportunityPartyPATH(oItem.biddersSpouseData);
                                    oObjectSpouse.Funcao = `ZPC${oNumberProponentSpouse}`
                                }else{
                                    oObjectSpouse = this._createObjectOpportunityParty(oItem.biddersSpouseData);
                                    oObjectSpouse.RoleCode = `ZPC${oNumberProponentSpouse}`
                                    //oObjectSpouse.ParentObjectID = oModel.objectID;
                                } 
                                    
                                oModelInvolvedUpdate.push(oObjectSpouse);
                            }
                        }

                        oNumberProponentSpouse++;
                    }
                }else if(oItem.functionCode === "Z1"){
                    let oObject;

                    if(sPATH === "PUT"){
                        oObject = this._createObjectOpportunityPartyPATH(oItem);

                        if(oNumberGuarantor > 1){
                            oObject.Funcao = `ZF${oNumberProponent}`;
                        }
                    }else{
                        oObject = this._createObjectOpportunityParty(oItem);

                        if(oNumberGuarantor > 1){
                            oObject.RoleCode = `ZF${oNumberProponent}`;
                        }
                        //oObject.ParentObjectID = oModel.objectID;
                    }

                    oModelInvolvedUpdate.push(oObject);

                    if(oItem.biddersSpouseData.cpf != ""){
                        let oObjectSpouse;

                        if(sPATH === "PUT"){
                            oObjectSpouse = this._createObjectOpportunityPartyPATH(oItem.biddersSpouseData);

                            if(oNumberGuarantor > 1){
                                oObjectSpouse.Funcao = `ZFC${oNumberProponent}`;
                            }
                        }else{
                            oObjectSpouse = this._createObjectOpportunityParty(oItem.biddersSpouseData);

                            if(oNumberGuarantor > 1){
                                oObjectSpouse.RoleCode = `ZFC${oNumberProponent}`;
                            }
                            //oObjectSpouse.ParentObjectID = oModel.objectID;
                        }

                        oModelInvolvedUpdate.push(oObjectSpouse);
                    }

                    oNumberGuarantor++
                }else{
                    let oObject;

                    if(sPATH === "PUT"){
                        oObject = this._createObjectOpportunityPartyPATH(oItem);
                    }else{
                        oObject = this._createObjectOpportunityParty(oItem);
                        //oObject.ParentObjectID = oModel.objectID;
                    }

                    oModelInvolvedUpdate.push(oObject);
                }
            }

            //Adiciona o CCA, caso exista
            if(oModel.CCA.PartyID != ""){    
                let oModelParty = {
                    customerID: oModel.CCA.PartyID,
                    functionCode: oModel.CCA.RoleCode,
                    phone: "",
                    mobile: "",
                    email: ""
                }

                if(sPATH === "PUT"){    
                    oModelInvolvedUpdate.push(this._createObjectOpportunityPartyPATH(oModelParty));
                }else{
                    oModelInvolvedUpdate.push(this._createObjectOpportunityParty(oModelParty));
                }
                
                /*oModelInvolvedUpdate.push({
                    ParentObjectID: oModel.objectID,
                    PartyID: oModel.CCA.PartyID,
                    RoleCode: oModel.CCA.RoleCode,
                    MainIndicator: true,
                    Phone: "",
                    Mobile: "",
                    Email: ""
                });*/
            }

            //Adiciona o corretor a parte envolvidas
            let oModelBrokers = this.getModel("broker").getData().items;

            let oBroker = oModelBrokers.find(sItem => {
                if(sItem.brokerID === oModel.broker) return sItem;
            });

            if(oBroker != undefined){
                let oModelParty = {
                    customerID: oBroker.brokerID,
                    functionCode: "46",
                    phone: "",
                    mobile: "",
                    email: ""
                }

                if(sPATH === "PUT"){
                    oModelInvolvedUpdate.push(this._createObjectOpportunityPartyPATH(oModelParty));
                }else{
                    oModelInvolvedUpdate.push(this._createObjectOpportunityParty(oModelParty));
                }

                /*oModelInvolvedUpdate.push({
                    ParentObjectID: oModel.objectID,
                    PartyID: oBroker.brokerID,
                    RoleCode: "46",
                    MainIndicator: true,
                    Phone: "",
                    Mobile: "",
                    Email: ""
                });*/
            }

            //Adiciona a imobiliaria a parte envolvidas
            let oModelRealEstate = this.getModel("realEstate").getData().items;

            let oRealEstate = oModelRealEstate.find(sItem => {
                if(sItem.partnerID === oModel.realEstate) return sItem;
            });        

            if(oRealEstate != undefined){
                //Adiciona a imobiliaria a parte envolvidas
                let oModelParty = {
                    customerID: oRealEstate.partnerID,
                    functionCode: "ZIMOB",
                    phone: "",
                    mobile: "",
                    email: ""
                }

                if(sPATH === "PUT"){
                    oModelInvolvedUpdate.push(this._createObjectOpportunityPartyPATH(oModelParty));
                }else{
                    oModelInvolvedUpdate.push(this._createObjectOpportunityParty(oModelParty));
                }

                /*oModelInvolvedUpdate.push({
                    ParentObjectID: oModel.objectID,
                    PartyID: oRealEstate.partnerID,
                    RoleCode: "ZIMOB",
                    MainIndicator: true,
                    Phone: "",
                    Mobile: "",
                    Email: ""
                });*/
            }

            return { oModelFinishProposal, oModelInvolvedCreate, oModelInvolvedUpdate, oModelOpportunityParcSDK };
        },

        _createObjectOpportunity: function(sModelClient, sModelProposal, sIDBroker, sMethod){
            return {
                ProspectPartyID: sModelClient.customerID  != undefined ? sModelClient.customerID : sModelClient.IDCliente_KUT,
                Name: `${sModelClient.name} ${sModelClient.surname}`,
                Simulaoconcluidda_KUT: sModelProposal.validatedSimulate,
                ObservacaoOportunidade_KUT: sModelProposal.comments,
                EntradaContent_KUT: sModelProposal.signal != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.signal)) : Formatter.numberValue("000"),
                EntradacurrencyCode_KUT: "BRL",
                FGTSContent_KUT: sModelProposal.FGTS != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.FGTS)) : Formatter.numberValue("000"),
                FGTScurrencyCode_KUT: "BRL",
                FinanciamentoContent_KUT: sModelProposal.CEF != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.CEF)) : Formatter.numberValue("000"),
                FinanciamentocurrencyCode_KUT: "BRL",
                IntermediariaContent_KUT: sModelProposal.intermediate != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.intermediate)) : Formatter.numberValue("000"),
                IntermediariacurrencyCode_KUT: "BRL",
                SalesCycleCode: sModelProposal.saleForm,
                Modalidadefinanciamento_KUT: sModelProposal.purchaseMethod,
                Midia_KUT: sModelProposal.media,
                Qualoobjetivodacompra_KUT: sModelProposal.reasonPurchase,
                PresolutoContent_KUT: sModelProposal.valueMonthly != undefined ? Formatter.numberValue(sModelProposal.valueMonthly) : Formatter.numberValue("000"), // mensal reajustavel
                PresolutocurrencyCode_KUT: "BRL", //mensais
                /*PrestacaopreContent_KUT: sModelProposal.adjustableMonthlyInstallment != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.adjustableMonthlyInstallment)) : Formatter.numberValue("000"),
                PrestacaoprecurrencyCode_KUT: "BRL",*/
                ValorparcelasprosolutoContent_KUT: sModelProposal.proChaves != 0 ? Formatter.numberValue(String(sModelProposal.proChaves)) : Formatter.numberValue("000"),
                ValorparcelasprosolutocurrencyCode_KUT: "BRL",
                SubsidioContent_KUT: sModelProposal.subsidy != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.subsidy)) : Formatter.numberValue("000"),
                SubsidiocurrencyCode_KUT: "BRL",
                ValortotalContent_KUT: sModelProposal.unitValue != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.unitValue)) : Formatter.numberValue("000"),
                ValortotalcurrencyCode_KUT: "BRL",
                ExpectedRevenueAmount: sModelProposal.unitValue != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.unitValue)) : Formatter.numberValue("000"),
                ExpectedRevenueAmountCurrencyCode: "BRL",
                ValorliquidoContent_KUT: sModelProposal.netValue != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.netValue)) : Formatter.numberValue("000"),
                ValorliquidocurrencyCode_KUT: "BRL",
                MainEmployeeResponsiblePartyID: sIDBroker, // corretor
                SalesUnitPartyID: sModelProposal.organizationID,
                Dataprimeiraparcela_KUT: sModelProposal.monthlyDate != undefined ? Formatter.dateFormat(sModelProposal.monthlyDate, sMethod) : "",
                Numerodeparcelasmensais_KUT: sModelProposal.monthlyInstallments != undefined ? `${sModelProposal.monthlyInstallments}` : "",
                Dataentrega1_KUT: Formatter.dateFormat(sModelProposal.deliveryDate, sMethod),
                Numeroparcelasempreendimento_KUT: String(sModelProposal.maximumNumberInstallments)
            }
        },

        _createObjectOpportunityPATH: function(sModelClient, sModelProposal, sIDBroker, sMethod){
            return {
                ClienteID: sModelClient.customerID != undefined ? sModelClient.customerID : sModelClient.IDCliente_KUT,
                NomeOportunidade: `${sModelClient.name} ${sModelClient.surname}`,
                NegociacaoEncerrada: sModelProposal.validatedSimulate,
                ObservacaoOportunidade: sModelProposal.comments,
                EntradaContent: sModelProposal.signal != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.signal)) : Formatter.numberValue("000"),
                EntradacurrencyCode: "BRL",
                FGTSContent: sModelProposal.FGTS != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.FGTS)) : Formatter.numberValue("000"),
                FGTScurrencyCode: "BRL",
                FinanciamentoContent: sModelProposal.CEF != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.CEF)) : Formatter.numberValue("000"),
                FinanciamentocurrencyCode: "BRL",
                IntermediariaContent: sModelProposal.intermediate != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.intermediate)) : Formatter.numberValue("000"),
                IntermediariacurrencyCode: "BRL",
                CicloVenda: sModelProposal.saleForm,
                ModalidadeFinanciamento: sModelProposal.purchaseMethod,
                Midia: sModelProposal.media,
                ObjetivoCompra: sModelProposal.reasonPurchase,
                PresolutoContent: sModelProposal.valueMonthly != undefined ? Formatter.numberValue(sModelProposal.valueMonthly) : Formatter.numberValue("000"), // mensal reajustavel
                PresolutocurrencyCode: "BRL", //mensais
                ValorParcelasProsolutoContent: sModelProposal.proChaves != 0 ? Formatter.numberValue(String(sModelProposal.proChaves)) : Formatter.numberValue("000"),
                ValorParcelasProsolutocurrencyCode: "BRL",
                SubsidioContent: sModelProposal.subsidy != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.subsidy)) : Formatter.numberValue("000"),
                SubsidiocurrencyCode: "BRL",
                ValorTotalContent: sModelProposal.unitValue != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.unitValue)) : Formatter.numberValue("000"),
                ValorTotalcurrencyCode: "BRL",
                ValorUnidadeContent: sModelProposal.unitValue != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.unitValue)) : Formatter.numberValue("000"),
                ValorUnidadecurrencyCode: "BRL",
                ValorLiquidoContent: sModelProposal.netValue != undefined ? Formatter.numberValue(this._clearFormattingValue(sModelProposal.netValue)) : Formatter.numberValue("000"),
                ValorLiquidocurrencyCode: "BRL",
                ProprietarioID: sIDBroker, // corretor
                EmpreendimentoID: sModelProposal.organizationID,
                DataPrimeiraParcela: sModelProposal.monthlyDate != undefined ? Formatter.dateFormat(sModelProposal.monthlyDate, sMethod) : null,
                NumeroParcelasMensais: sModelProposal.monthlyInstallments != undefined ? Number(sModelProposal.monthlyInstallments) : 0,
                DataEntrega: Formatter.dateFormat(sModelProposal.deliveryDate, sMethod),
                NumeroParcelasEmpreendimento: Number(sModelProposal.maximumNumberInstallments)
            }
        },

        _createObjectOpportunityParty: function(sModel){
            return {
                PartyID: sModel.customerID,
                RoleCode: sModel.functionCode,
                MainIndicator: true,
                Phone: this._clearFormatting(sModel.phone),
                Mobile: this._clearFormatting(sModel.mobile),
                Email: sModel.email
            }
        },

        _createObjectOpportunityPartyPATH: function(sModel){
            return {
                ParteID: sModel.customerID,
                Funcao: sModel.functionCode,
                Principal: true,
                Telefone: this._clearFormatting(sModel.phone),
                Celular: this._clearFormatting(sModel.mobile),
                Email: sModel.email
            }
        },

        _mountOpportunityPortionSDK: function(sPortion, sSimulationDate, sObjectIDOpportunity, sCountGroup){
            let oDay     = String(new Date().getDate()).padStart(2, '0'),
                oMonth   = String(Number(new Date().getMonth() + 1)).padStart(2, '0'),
                oYear    = new Date().getFullYear(),
                aDayDate = `${oDay}/${oMonth}/${oYear}`;

            return{
                ObjectID: "",
                ParentObjectID: sObjectIDOpportunity,
                OpportunityExternalKey: "",
                codigoComponento_SDK: sPortion.codComponent,
                Z_COD_CEF_SDK: "",
                Z_COD_COMPN_SDK: sPortion.codComponent,
                Z_COD_GRUPO_SDK: String(sCountGroup),
                Z_DATA_EMISSAO_SDK: Formatter.dateHoursFormatedUTC(sSimulationDate), //data de registro da oportunidade
                Z_DAT_INI_CALC_SDK: Formatter.dateHoursFormatedUTC(`${sPortion.selectionDueDate}T00:00:00`), //data início conforme simulação
                Z_QTD_PARC_SDK: `${sPortion.selectionTheAmount}`,
                Z_VALOR_FINANCIAMENTOcontent_SDK: sPortion.selectionValueTotal != "" ? Formatter.numberValue(this._clearFormattingValue(sPortion.selectionValueTotal)) : Formatter.numberValue(this._clearFormattingValue(sPortion.selectionUnitaryValue)),
                Z_VALOR_FINANCIAMENTOcurrencyCode_SDK: "BRL",
                Z_VALOR_PARCELAcontent_SDK: Formatter.numberValue(this._clearFormattingValue(sPortion.selectionUnitaryValue)),
                Z_VALOR_PARCELAcurrencyCode_SDK: "BRL"
            }
        },

        _mountOpportunityPortionPATH: function(sPortion, sSimulationDate, sObjectIDOpportunity, sCountGroup){
            let oDay     = String(new Date().getDate()).padStart(2, '0'),
                oMonth   = String(Number(new Date().getMonth() + 1)).padStart(2, '0'),
                oYear    = new Date().getFullYear(),
                aDayDate = `${oDay}/${oMonth}/${oYear}`;

            return{
                codigoComponento: sPortion.codComponent,
                Z_COD_CEF: "",
                Z_COD_COMPN: sPortion.codComponent,
                Z_COD_GRUPO: String(sCountGroup),
                Z_DATA_EMISSAO: Formatter.dateHoursFormatedUTC(sSimulationDate), //data de registro da oportunidade
                Z_DAT_INI_CALC: Formatter.dateHoursFormatedUTC(`${sPortion.selectionDueDate}T00:00:00`), //data início conforme simulação
                Z_QTD_PARC: `${sPortion.selectionTheAmount}`,
                Z_VALOR_FINANCIAMENTOContent: sPortion.selectionValueTotal != "" ? Formatter.numberValue(this._clearFormattingValue(sPortion.selectionValueTotal)) : Formatter.numberValue(this._clearFormattingValue(sPortion.selectionUnitaryValue)),
                Z_VALOR_FINANCIAMENTOcurrencyCode: "BRL",
                Z_VALOR_PARCELAContent: Formatter.numberValue(this._clearFormattingValue(sPortion.selectionUnitaryValue)),
                Z_VALOR_PARCELAcurrencyCode: "BRL"
            }
        },

        _createObjectPhysicalPerson: function(sModel, sMethod){
            return {
                RoleCode: sModel.roleCode,
                LanguageCode: "PT",
                CountryCode: "BR",
                CPFCNPJ_KUT: this._clearFormatting(sModel.CPFAndCNPJ),
                FirstName: sModel.name,
                LastName: sModel.surname,
                Mobile: sModel.mobile != "" ? `${sModel.mobileDDI}${this._clearFormatting(sModel.mobile)}` : "",
                Email: sModel.email,
                Phone: sModel.phone != "" ? `${sModel.phoneDDI}${this._clearFormatting(sModel.phone)}` : "",
                GenderCode: sModel.sex,
                MaritalStatusCode: sModel.maritalStatus,
                BirthDate: Formatter.dateFormat(sModel.birth, sMethod),
                CIDENTIDADE_KUT: sModel.RGNumber,
                OrgaoExpedidor_KUT: sModel.RGIssuer,
                Estadoorgaoemissor_KUT: sModel.UF,
                NacionalidadeCode_SDK: sModel.naturalness,
                NationalityCountryCode: sModel.nationality,
                Nomedamae_KUT: sModel.motherName,
                Nomedopai_KUT: sModel.fatherName,
                ProfessionCode: sModel.profession,
                Moradiaatual_KUT: sModel.currentHousing,
                DataCasamento_KUT: Formatter.dateFormat(sModel.weddingDate, sMethod),
                Regimecasamento_KUT: sModel.marriageRegime,
                Tempomoradia_KUT: sModel.housingTime,
                OwnerID: sModel.OwnerID,
                
                //Endereço residencial
                StateCode: sModel.homeAddress.UF,
                HouseNumber: sMethod === "PATCH" ? `${sModel.homeAddress.number}` : sModel.homeAddress.number,
                Street: sModel.homeAddress.publicPlace,
                AddressLine4: sModel.homeAddress.complement,
                District: sModel.homeAddress.neighborhood,
                City: sModel.homeAddress.county,
                StreetPostalCode: sModel.homeAddress.CEP,
                
                //Empresa
                Dataadmissao_KUT: Formatter.dateFormat(sModel.biddersProfessionalData.admissionDate, sMethod),
                Empresa_KUT: sModel.biddersProfessionalData.companyName,
                Logradouroempresa_KUT: sModel.biddersProfessionalData.publicPlace,
                Bairroempresa_KUT: sModel.biddersProfessionalData.neighborhood,
                CEPEmpresa_KUT: sModel.biddersProfessionalData.CEP,
                Cargo_KUT: sModel.biddersProfessionalData.office,
                Complementoempresa_KUT: sModel.biddersProfessionalData.complement,
                Municipioempresa_KUT: sModel.biddersProfessionalData.county,
                ZEstadoEmpresa_KUT: sModel.biddersProfessionalData.UF,
                Numeroempresa_KUT: sModel.biddersProfessionalData.number,

                //Informações financeiras
                Amortizacao_KUT: sModel.financialInformation.amortization,
                CreditoFGTS_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.FGTSCredit)),
                Creditofinanciamento_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.creditFinancing)),
                Creditorecursosproprios_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.creditOwnResources)),
                Creditosubsidio_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.subsidyCredit)),
                Quantidademaximaparcelas_KUT: sModel.financialInformation.numberInstallments,
                Rendacomprometida_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.committedIncome)),
                Rendamensal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.monthlyIncome)),
                Rendainformal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.informalIncome)),
                Tiporenda_KUT: sModel.financialInformation.incomeType
            }
        },

        //Ajustar para pessoa juridica
        _createObjectLegalPerson: function(sModel, sMethod){
            return {
                RoleCode: sModel.roleCode,
                LanguageCode: "PT",
                CountryCode: "BR",
                Name: sModel.name.substring(0, 40),
                AdditionalName: sModel.name.substring(40, 80),
                AdditionalName2: sModel.name.substring(80, 120),
                AdditionalName3: sModel.name.substring(120, 160),
                Mobile: sModel.mobile != "" ? `${sModel.mobileDDI}${this._clearFormatting(sModel.mobile)}` : "",
                Email: sModel.email,
                Phone: sModel.phone != "" ? `${sModel.phoneDDI}${this._clearFormatting(sModel.phone)}` : "",
                Inscriomunicipal_KUT: sModel.municipalRegistration,
                Inscrioestadual_KUT: sModel.stateRegistration,
                OwnerID: sModel.OwnerID,

                //Empresa
                StateCode: sModel.companyAddress.UF,
                HouseNumber: sMethod === "PATCH" ? `${sModel.companyAddress.number}` : sModel.companyAddress.number,
                Street: sModel.companyAddress.publicPlace,
                AddressLine4: sModel.companyAddress.complement,
                District: sModel.companyAddress.neighborhood,
                City: sModel.companyAddress.county,
                StreetPostalCode: sModel.companyAddress.CEP,

                //Informações financeiras
                Amortizacao_KUT: sModel.financialInformation.amortization,
                CPFCNPJ_KUT: this._clearFormatting(sModel.CPFAndCNPJ),
                CreditoFGTS_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.FGTSCredit)),
                Creditofinanciamento_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.creditFinancing)),
                Creditorecursosproprios_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.creditOwnResources)),
                Creditosubsidio_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.subsidyCredit)),
                Quantidademaximaparcelas_KUT: sModel.financialInformation.numberInstallments,
                Rendacomprometida_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.committedIncome)),
                Rendamensal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.monthlyIncome)),
                Rendainformal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.financialInformation.informalIncome)),
                Tiporenda_KUT: sModel.financialInformation.incomeType
            }
        },

        _createObjectBidderSpouse: function(sModel, sModelProponent, sMethod){
            return {
                RoleCode: sModel.roleCode,
                LanguageCode: "PT",
                CountryCode: "BR",
                CPFCNPJ_KUT: this._clearFormatting(sModel.cpf),
                FirstName: sModel.name,
                LastName: sModel.surname,
                Mobile: sModel.mobile != "" ? `${sModel.mobileDDI}${this._clearFormatting(sModel.mobile)}` : "",
                Email: sModel.email,
                Phone: sModel.phone != "" ? `${sModel.phoneDDI}${this._clearFormatting(sModel.phone)}` : "",
                GenderCode: sModel.sex,
                BirthDate: Formatter.dateFormat(sModel.birth, sMethod),
                CIDENTIDADE_KUT: sModel.RGNumber ,
                OrgaoExpedidor_KUT: sModel.RGIssuer,
                Estadoorgaoemissor_KUT: sModel.UF,
                NacionalidadeCode_SDK: sModel.naturalness,
                NationalityCountryCode: sModel.nationality,
                Nomedamae_KUT: sModel.motherName,
                Nomedopai_KUT: sModel.fatherName,
                Rendamensal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.monthlyIncome)),
                ProfessionCode: sModel.profession,
                OwnerID: sModel.OwnerID,

                MaritalStatusCode: sModelProponent.maritalStatus,
                //DataCasamento_KUT: Formatter.dateFormat(sModelProponent.weddingDate, sMethod),
                //Regimecasamento_KUT: sModelProponent.marriageRegime,

                //empresa
                Empresa_KUT: sModel.professionalData.companyName,
                Cargo_KUT: sModel.professionalData.office,
                Dataadmissao_KUT: Formatter.dateFormat(sModel.professionalData.admissionDate, sMethod),
                CEPEmpresa_KUT: sModel.professionalData.CEP,
                Logradouroempresa_KUT: sModel.professionalData.publicPlace,
                Numeroempresa_KUT: sModel.professionalData.number,
                Complementoempresa_KUT: sModel.professionalData.complement,
                Bairroempresa_KUT: sModel.professionalData.neighborhood,
                Municipioempresa_KUT: sModel.professionalData.county,
                ZEstadoEmpresa_KUT: sModel.professionalData.UF  
            }
        },

        _createObjectAttorney: function(sModel, sMethod){
            return {
                RoleCode: sModel.roleCode,
                LanguageCode: "PT",
                CountryCode: "BR",
                CPFCNPJ_KUT: this._clearFormatting(sModel.CPFAndCNPJ),
                FirstName: sModel.name,
                LastName: sModel.surname,
                Mobile: sModel.mobile != "" ? `${sModel.mobileDDI}${this._clearFormatting(sModel.mobile)}` : "",
                Email: sModel.email,
                Phone: sModel.phone != "" ? `${sModel.phoneDDI}${this._clearFormatting(sModel.phone)}` : "",
                GenderCode: sModel.sex,
                MaritalStatusCode: sModel.maritalStatus,
                BirthDate: Formatter.dateFormat(sModel.birth, sMethod),
                CIDENTIDADE_KUT: sModel.RGNumber ,
                OrgaoExpedidor_KUT: sModel.RGIssuer,
                Estadoorgaoemissor_KUT: sModel.UF,
                NacionalidadeCode_SDK: sModel.naturalness,
                NationalityCountryCode: sModel.nationality,
                Nomedamae_KUT: sModel.motherName,
                Nomedopai_KUT: sModel.fatherName,
                Rendamensal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.monthlyIncome)),
                ProfessionCode: sModel.profession,
                OwnerID: sModel.OwnerID,

                //Endereço residencial
                StateCode: sModel.homeAddress.UF,
                HouseNumber: sMethod === "PATCH" ? `${sModel.homeAddress.number}` : sModel.homeAddress.number,
                Street: sModel.homeAddress.publicPlace,
                AddressLine4: sModel.homeAddress.complement,
                District: sModel.homeAddress.neighborhood,
                City: sModel.homeAddress.county,
                StreetPostalCode: sModel.homeAddress.CEP
            }
        },

        _createObject: function(sModel, sMethod){
            return {
                RoleCode: sModel.roleCode,
                LanguageCode: "PT",
                CountryCode: "BR",
                CPFCNPJ_KUT: this._clearFormatting(sModel.CPFAndCNPJ),
                FirstName: sModel.name,
                LastName: sModel.surname,
                Mobile: sModel.mobile != "" ? `${sModel.mobileDDI}${this._clearFormatting(sModel.mobile)}` : "",
                Email: sModel.email,
                Phone: sModel.phone != "" ? `${sModel.phoneDDI}${this._clearFormatting(sModel.phone)}` : "",
                GenderCode: sModel.sex,
                MaritalStatusCode: sModel.maritalStatus,
                BirthDate: Formatter.dateFormat(sModel.birth, sMethod),
                CIDENTIDADE_KUT: sModel.RGNumber ,
                OrgaoExpedidor_KUT: sModel.RGIssuer,
                Estadoorgaoemissor_KUT: sModel.UF,
                NacionalidadeCode_SDK: sModel.naturalness,
                NationalityCountryCode: sModel.nationality,
                Nomedamae_KUT: sModel.motherName,
                Nomedopai_KUT: sModel.fatherName,
                Rendamensal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.monthlyIncome)),
                ProfessionCode: sModel.profession,
                OwnerID: sModel.OwnerID,

                //endereço residencial
                StateCode: sModel.homeAddress.UF,
                HouseNumber: sMethod === "PATCH" ? `${sModel.homeAddress.number}` : sModel.homeAddress.number,
                Street: sModel.homeAddress.publicPlace,
                AddressLine4: sModel.homeAddress.complement,
                District: sModel.homeAddress.neighborhood,
                City: sModel.homeAddress.county,
                StreetPostalCode: sModel.homeAddress.CEP,

                //empresa
                Bairroempresa_KUT: sModel.company.neighborhood,
                CEPEmpresa_KUT: sModel.company.CEP,
                Cargo_KUT: sModel.company.office,
                Complementoempresa_KUT: sModel.company.complement,
                Dataadmissao_KUT: Formatter.dateFormat(sModel.company.admissionDate, sMethod),
                Empresa_KUT: sModel.company.companyName,
                Logradouroempresa_KUT: sModel.company.publicPlace,
                Municipioempresa_KUT: sModel.company.county,
                Numeroempresa_KUT: sModel.company.number,
                ZEstadoEmpresa_KUT: sModel.company.UF
            }
        },

        _createObjectGuarantor: function(sModel, sMethod){
            return {
                RoleCode: sModel.roleCode,
                LanguageCode: "PT",
                CountryCode: "BR",
                CPFCNPJ_KUT: this._clearFormatting(sModel.CPFAndCNPJ),
                FirstName: sModel.name,
                LastName: sModel.surname,
                Mobile: sModel.mobile != "" ? `${sModel.mobileDDI}${this._clearFormatting(sModel.mobile)}` : "",
                Email: sModel.email,
                Phone: sModel.phone != "" ? `${sModel.phoneDDI}${this._clearFormatting(sModel.phone)}` : "",
                GenderCode: sModel.sex,
                MaritalStatusCode: sModel.maritalStatus,
                BirthDate: Formatter.dateFormat(sModel.birth, sMethod),
                CIDENTIDADE_KUT: sModel.RGNumber ,
                OrgaoExpedidor_KUT: sModel.RGIssuer,
                Estadoorgaoemissor_KUT: sModel.UF,
                NacionalidadeCode_SDK: sModel.naturalness,
                NationalityCountryCode: sModel.nationality,
                Nomedamae_KUT: sModel.motherName,
                Nomedopai_KUT: sModel.fatherName,
                Rendamensal_KUT: Formatter.numberValue(this._clearFormattingValue(sModel.monthlyIncome)),
                ProfessionCode: sModel.profession,
                OwnerID: sModel.OwnerID,

                //endereço residencial
                StateCode: sModel.homeAddress.UF,
                HouseNumber: sMethod === "PATCH" ? `${sModel.homeAddress.number}` : sModel.homeAddress.number,
                Street: sModel.homeAddress.publicPlace,
                AddressLine4: sModel.homeAddress.complement,
                District: sModel.homeAddress.neighborhood,
                City: sModel.homeAddress.county,
                StreetPostalCode: sModel.homeAddress.CEP,

                //empresa
                Bairroempresa_KUT: sModel.company.neighborhood,
                CEPEmpresa_KUT: sModel.company.CEP,
                Cargo_KUT: sModel.company.office,
                Complementoempresa_KUT: sModel.company.complement,
                Dataadmissao_KUT: Formatter.dateFormat(sModel.company.admissionDate, sMethod),
                Empresa_KUT: sModel.company.companyName,
                Logradouroempresa_KUT: sModel.company.publicPlace,
                Municipioempresa_KUT: sModel.company.county,
                Numeroempresa_KUT: sModel.company.number,
                ZEstadoEmpresa_KUT: sModel.company.UF
            }
        },

        _fillLegalPerson: function(sModel, sCorporateAccount){
            sModel.objectID              = sCorporateAccount.ObjectID;
            sModel.customerID            = sCorporateAccount.IDCliente_KUT;
            sModel.CPFAndCNPJ            = this._formateCNPJ(sCorporateAccount.CPFCNPJ_KUT);
            sModel.name                  = sCorporateAccount.Name + sCorporateAccount.AdditionalName + sCorporateAccount.AdditionalName2 + sCorporateAccount.AdditionalName3;
            sModel.mobile                = this._formatePhone(sCorporateAccount.Mobile);
            sModel.email                 = sCorporateAccount.Email;
            sModel.phone                 = this._formatePhone(sCorporateAccount.Phone);
            sModel.municipalRegistration = sCorporateAccount.Inscriomunicipal_KUT;
            sModel.stateRegistration     = sCorporateAccount.Inscrioestadual_KUT;
            sModel.notaryRegistryOffice  = "";
            sModel.OwnerID               = sCorporateAccount.OwnerID;

            //Preenche os campos de Informação Financeiras
            sModel.financialInformation.monthlyIncome      = this._formateValue(sCorporateAccount.Rendamensal_KUT, undefined);
            sModel.financialInformation.incomeType         = sCorporateAccount.Tiporenda_KUT;
            sModel.financialInformation.committedIncome    = this._formateValue(sCorporateAccount.Rendacomprometida_KUT, undefined);
            sModel.financialInformation.informalIncome     = this._formateValue(sCorporateAccount.Rendainformal_KUT, undefined);
            sModel.financialInformation.creditFinancing    = this._formateValue(sCorporateAccount.Creditofinanciamento_KUT, undefined);
            sModel.financialInformation.subsidyCredit      = this._formateValue(sCorporateAccount.Creditosubsidio_KUT, undefined);
            sModel.financialInformation.FGTSCredit         = this._formateValue(sCorporateAccount.CreditoFGTS_KUT, undefined);
            sModel.financialInformation.creditOwnResources = this._formateValue(sCorporateAccount.Creditorecursosproprios_KUT, undefined);
            sModel.financialInformation.numberInstallments = sCorporateAccount.Quantidademaximaparcelas_KUT;
            sModel.financialInformation.amortization       = sCorporateAccount.Amortizacao_KUT;

            //Preenche os campos de endereço
            sModel.companyAddress.CEP          = sCorporateAccount.StreetPostalCode;
            sModel.companyAddress.publicPlace  = sCorporateAccount.Street;
            sModel.companyAddress.number       = Number(sCorporateAccount.HouseNumber);
            sModel.companyAddress.complement   = sCorporateAccount.AddressLine4;
            sModel.companyAddress.neighborhood = sCorporateAccount.District;
            sModel.companyAddress.county       = sCorporateAccount.City;
            sModel.companyAddress.UF           = sCorporateAccount.StateCode;

            let aProposed = this.getModel("finishProposal").getData();

            this.getModel("finishProposal").refresh(true);
        },

        _validateField: function(sInput){
			let sValueState      = sap.ui.core.ValueState.None,
                oMessage         = "",
			    bValidationError = false,
			    oBinding         = sInput.getBinding("value");

            if(sInput.getValue() != ""){
                try {
                    oBinding.getType().validateValue(sInput.getValue());
                } catch (oException) {
                    sValueState = sap.ui.core.ValueState.Error;
                    oMessage    = oException.message;

                    bValidationError = true;
                }

                sInput.setValueState(sValueState);
                sInput.setValueStateText(oMessage);
            }else{
                sInput.setValueState(sValueState);
                sInput.setValueStateText(oMessage);
            }

			return bValidationError;
		},

        _fillAttorney: function(sModel, sIndividualCustomer){
            sModel.objectID      = sIndividualCustomer.ObjectID;
            sModel.customerID    = sIndividualCustomer.CustomerID;
            sModel.CPFAndCNPJ    = this._formateCPF(sIndividualCustomer.CPFCNPJ_KUT);
            sModel.name          = sIndividualCustomer.FirstName;
            sModel.surname       = sIndividualCustomer.LastName;
            sModel.mobile        = this._formatePhone(sIndividualCustomer.Mobile);
            sModel.email         = sIndividualCustomer.Email;
            sModel.phone         = this._formatePhone(sIndividualCustomer.Phone);
            sModel.sex           = sIndividualCustomer.GenderCode;
            sModel.maritalStatus = sIndividualCustomer.MaritalStatusCode;
            sModel.birth         = this._formatedDate(sIndividualCustomer.BirthDate);
            sModel.RGNumber      = sIndividualCustomer.CIDENTIDADE_KUT;
            sModel.RGIssuer      = sIndividualCustomer.OrgaoExpedidor_KUT;
            sModel.UF            = sIndividualCustomer.Estadoorgaoemissor_KUT;
            sModel.naturalness   = sIndividualCustomer.NacionalidadeCode_SDK;
            sModel.nationality   = sIndividualCustomer.NationalityCountryCode;
            sModel.motherName    = sIndividualCustomer.Nomedamae_KUT;
            sModel.fatherName    = sIndividualCustomer.Nomedopai_KUT;
            sModel.monthlyIncome = this._formateValue(sIndividualCustomer.Rendamensal_KUT, undefined);
            sModel.profession    = sIndividualCustomer.ProfessionCode;
            sModel.OwnerID       = sIndividualCustomer.OwnerID;
            sModel.notaryPublic  = "";
            sModel.recordBook    = "";
            sModel.recordSheets  = "";

            //Endereço
            sModel.homeAddress.CEP          = sIndividualCustomer.StreetPostalCode;
            sModel.homeAddress.publicPlace  = sIndividualCustomer.Street;
            sModel.homeAddress.number       = Number(sIndividualCustomer.HouseNumber);
            sModel.homeAddress.complement   = sIndividualCustomer.AddressLine4;
            sModel.homeAddress.neighborhood = sIndividualCustomer.District;
            sModel.homeAddress.county       = sIndividualCustomer.City;
            sModel.homeAddress.UF           = sIndividualCustomer.StateCode;
        },

        _fillInFinancialOfficer: function(sModel, sIndividualCustomer){
            sModel.objectID       = sIndividualCustomer.ObjectID;
            sModel.customerID     = sIndividualCustomer.CustomerID;
            sModel.CPFAndCNPJ     = this._formateCPF(sIndividualCustomer.CPFCNPJ_KUT);
            sModel.name           = sIndividualCustomer.FirstName;
            sModel.surname        = sIndividualCustomer.LastName;
            sModel.mobile         = this._formatePhone(sIndividualCustomer.Mobile);
            sModel.email          = sIndividualCustomer.Email;
            sModel.phone          = this._formatePhone(sIndividualCustomer.Phone);
            sModel.sex            = sIndividualCustomer.GenderCode;
            sModel.maritalStatus  = sIndividualCustomer.MaritalStatusCode;
            sModel.birth          = this._formatedDate(sIndividualCustomer.BirthDate);
            sModel.RGNumber       = sIndividualCustomer.CIDENTIDADE_KUT;
            sModel.RGIssuer       = sIndividualCustomer.OrgaoExpedidor_KUT;
            sModel.UF             = sIndividualCustomer.Estadoorgaoemissor_KUT;
            sModel.naturalness    = sIndividualCustomer.NacionalidadeCode_SDK;
            sModel.nationality    = sIndividualCustomer.NationalityCountryCode;
            sModel.motherName     = sIndividualCustomer.Nomedamae_KUT;
            sModel.fatherName     = sIndividualCustomer.Nomedopai_KUT;
            sModel.monthlyIncome  = this._formateValue(sIndividualCustomer.Rendamensal_KUT, undefined);
            sModel.profession     = sIndividualCustomer.ProfessionCode;
            sModel.OwnerID        = sIndividualCustomer.OwnerID;
            sModel.registryOffice = "";

            //Dados profissionais
            sModel.company.companyName   = sIndividualCustomer.Empresa_KUT
            sModel.company.office        = sIndividualCustomer.Cargo_KUT
            sModel.company.admissionDate = this._formatedDate(sIndividualCustomer.Dataadmissao_KUT);
            sModel.company.telePhone     = "";
            sModel.company.CEP           = sIndividualCustomer.CEPEmpresa_KUT;
            sModel.company.publicPlace   = sIndividualCustomer.Logradouroempresa_KUT;
            sModel.company.number        = sIndividualCustomer.Numeroempresa_KUT;
            sModel.company.complement    = sIndividualCustomer.Complementoempresa_KUT;
            sModel.company.neighborhood  = sIndividualCustomer.Bairroempresa_KUT;
            sModel.company.county        = sIndividualCustomer.Municipioempresa_KUT;
            sModel.company.UF            = sIndividualCustomer.ZEstadoEmpresa_KUT;

            //Endereço
            sModel.homeAddress.CEP          = sIndividualCustomer.StreetPostalCode;
            sModel.homeAddress.publicPlace  = sIndividualCustomer.Street;
            sModel.homeAddress.number       = Number(sIndividualCustomer.HouseNumber);
            sModel.homeAddress.complement   = sIndividualCustomer.AddressLine4;
            sModel.homeAddress.neighborhood = sIndividualCustomer.District;
            sModel.homeAddress.county       = sIndividualCustomer.City;
            sModel.homeAddress.UF           = sIndividualCustomer.StateCode;
        },

        _findGuarantorAndSpouse: async function(sModel, sIndividualCustomer){
           
            let oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${sIndividualCustomer.CustomerID}'&$format=json`).method('GET'),
                oBusinessPartnerCustomerID;

            if(oBusinessPartner === undefined){
                oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${sIndividualCustomer.CustomerID}'&$format=json`).method('GET');
                
                if(oBusinessPartner != undefined){
                    oBusinessPartnerCustomerID = oBusinessPartner.FirstBusinessPartnerID;
                }
            }else{
                oBusinessPartnerCustomerID = oBusinessPartner.SecondBusinessPartnerID;
            }

            if(oBusinessPartner != undefined){
                let oIndividualCustomerSpouse = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${oBusinessPartnerCustomerID}'&$format=json`).method('GET')
                
                if(oIndividualCustomerSpouse != undefined){
                    this._fillInSpouseFields(sModel.biddersSpouseData, oIndividualCustomerSpouse);
                }
            }

            sModel.objectID       = sIndividualCustomer.ObjectID;
            sModel.customerID     = sIndividualCustomer.CustomerID;
            sModel.CPFAndCNPJ     = this._formateCPF(sIndividualCustomer.CPFCNPJ_KUT);
            sModel.name           = sIndividualCustomer.FirstName;
            sModel.surname        = sIndividualCustomer.LastName;
            sModel.mobile         = this._formatePhone(sIndividualCustomer.Mobile);
            sModel.email          = sIndividualCustomer.Email;
            sModel.phone          = this._formatePhone(sIndividualCustomer.Phone);
            sModel.sex            = sIndividualCustomer.GenderCode;
            sModel.maritalStatus  = sIndividualCustomer.MaritalStatusCode;

            sModel.birth          = this._formatedDate(sIndividualCustomer.BirthDate);
            sModel.RGNumber       = sIndividualCustomer.CIDENTIDADE_KUT;
            sModel.RGIssuer       = sIndividualCustomer.OrgaoExpedidor_KUT;
            sModel.UF             = sIndividualCustomer.Estadoorgaoemissor_KUT;
            sModel.naturalness    = sIndividualCustomer.NacionalidadeCode_SDK;
            sModel.nationality    = sIndividualCustomer.NationalityCountryCode;
            sModel.motherName     = sIndividualCustomer.Nomedamae_KUT;
            sModel.fatherName     = sIndividualCustomer.Nomedopai_KUT;
            sModel.monthlyIncome  = this._formateValue(sIndividualCustomer.Rendamensal_KUT, undefined);
            sModel.profession     = sIndividualCustomer.ProfessionCode;
            sModel.OwnerID        = sIndividualCustomer.OwnerID;
            sModel.registryOffice = "";

            //Dados profissionais
            sModel.company.companyName   = sIndividualCustomer.Empresa_KUT
            sModel.company.office        = sIndividualCustomer.Cargo_KUT
            sModel.company.admissionDate = this._formatedDate(sIndividualCustomer.Dataadmissao_KUT);
            sModel.company.telePhone     = "";
            sModel.company.CEP           = sIndividualCustomer.CEPEmpresa_KUT;
            sModel.company.publicPlace   = sIndividualCustomer.Logradouroempresa_KUT;
            sModel.company.number        = sIndividualCustomer.Numeroempresa_KUT;
            sModel.company.complement    = sIndividualCustomer.Complementoempresa_KUT;
            sModel.company.neighborhood  = sIndividualCustomer.Bairroempresa_KUT;
            sModel.company.county        = sIndividualCustomer.Municipioempresa_KUT;
            sModel.company.UF            = sIndividualCustomer.ZEstadoEmpresa_KUT;

            //Endereço
            sModel.homeAddress.CEP          = sIndividualCustomer.StreetPostalCode;
            sModel.homeAddress.publicPlace  = sIndividualCustomer.Street;
            sModel.homeAddress.number       = Number(sIndividualCustomer.HouseNumber);
            sModel.homeAddress.complement   = sIndividualCustomer.AddressLine4;
            sModel.homeAddress.neighborhood = sIndividualCustomer.District;
            sModel.homeAddress.county       = sIndividualCustomer.City;
            sModel.homeAddress.UF           = sIndividualCustomer.StateCode;
        },

        _searchAndFillProponent: async function(sModel, sIndividualCustomer){
            let oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=FirstBusinessPartnerID eq '${sIndividualCustomer.CustomerID}'&$format=json`).method('GET'),
                oBusinessPartnerCustomerID;

            if(oBusinessPartner === undefined){
                oBusinessPartner = await this.callServiceFormatedJSON(`BusinessPartnerRelationshipCollection?$filter=SecondBusinessPartnerID eq '${sIndividualCustomer.CustomerID}'&$format=json`).method('GET');
            
                if(oBusinessPartner != undefined){
                    oBusinessPartnerCustomerID = oBusinessPartner.FirstBusinessPartnerID;
                }
            }else{
                oBusinessPartnerCustomerID = oBusinessPartner.SecondBusinessPartnerID;
            }

            if(oBusinessPartner != undefined){
                let oIndividualCustomerSpouse = await this.callServiceFormatedJSON(`IndividualCustomerCollection?$filter=CustomerID eq '${oBusinessPartnerCustomerID}'&$format=json`).method('GET')
            
                if(oIndividualCustomerSpouse != undefined){
                    this._fillInSpouseFields(sModel.physicalPerson.biddersSpouseData, oIndividualCustomerSpouse);
                }
            }
            
            let aProposed = this.getModel("finishProposal").getData();

            //campos pessoa fisica
            this._fillsPhysicalProponentFields(sModel, sIndividualCustomer, false);
           
           this.getModel("finishProposal").refresh(true);
        },


        _clearModelFinancialInformation: function(sModelFinancialInformation){
            let oFieldClassFinancial = ["monthlyIncome", "incomeType", "committedIncome", "informalIncome", "creditFinancing",
                                        "subsidyCredit", "FGTSCredit", "creditOwnResources", "numberInstallments", "amortization"];
            
            oFieldClassFinancial.forEach(sField => {
                if(sField === "monthlyIncome"  || sField === "committedIncome" ||
                   sField === "informalIncome" || sField === "creditFinancing" ||
                   sField === "subsidyCredit"  || sField === "FGTSCredit"      ||
                   sField === "FGTSCredit"     || sField === "creditOwnResources")
                {
                    sModelFinancialInformation[sField] = "R$ 0,00"
                }else if(sField === "numberInstallments") sModelFinancialInformation[sField] = "0";
                else sModelFinancialInformation[sField] = "";
            });
        },

        _clearModelCompany: function(sModelCompany){
            let oFieldClassCompany = ["companyName", "office", "admissionDate", "telePhone", "CEP", "publicPlace",
                                      "number", "complement", "neighborhood", "county", "UF"];
            
            oFieldClassCompany.forEach(sField => {
                if(sField === "admissionDate") sModelCompany[sField] = null;
                else sModelCompany[sField] = "";
            });
        },

        _clearModelBidderSpouse: function(sModelSpouse, sObjectProfessionalSpouse){
            let oFieldClassBidderSpouse = ["name", "surname", "proportion", "mobile", "email", "telePhone", "sex", "birth", "RGNumber", "RGIssuer", "UF",
                                           "naturalness", "nationality", "motherName", "fatherName", "monthlyIncome", "profession", "registryOffice"
                                          ];

            oFieldClassBidderSpouse.forEach(sField => {
                if(sField === "birth") sModelSpouse[sField] = null;
                else sModelSpouse[sField] = "";
            });
                        
            this._clearModelCompany(sModelSpouse[sObjectProfessionalSpouse]);
        },

        _clearModelAddress: function(sModelAddress){
            let oFieldClassAddress = ["CEP", "publicPlace", "number", "complement",
                                      "neighborhood", "county", "UF"];

            oFieldClassAddress.forEach(sField =>{
                sModelAddress[sField] = "";
            });
        },

        _editInvolvedParties: function(sObject){
            let oItemsInvolvedParties    = this.getModel("involvedParties").getData().items,
                oNewItemsInvolvedParties = [],
                bValid                   = true;

            if(oItemsInvolvedParties.length != 0){
                let oInvolvedPart = oItemsInvolvedParties.find(sItem => {
                    if(sItem.CPFAndCNPJ === sObject.CPFAndCNPJ) return sItem;
                });
    
                if(!oInvolvedPart){
                    this.getModel("involvedParties").getData().items.push(sObject);
                    this.getModel("involvedParties").getData().buttonsPhysicalPerson = true
                }else{

                    MessageBox.warning(this.getResourceBundle().getText("messageWarningAddInvolvedParties"), {
                        actions: [MessageBox.Action.CLOSE],
                        onClose: function(sAction){
                            this._oNavContainer.back();
                        }.bind(this)
                    });

                    bValid = false;
                }
            }else{
                this.getModel("involvedParties").getData().items.push(sObject);
                this.getModel("involvedParties").getData().buttonsPhysicalPerson = true;
            }

            if(sObject.functionCode === "31"){
                let oItemsInvParties = this.getModel("involvedParties").getData().items;

                //Define o proponente principal de acordo com a renda
                this._setMainBidder(oItemsInvParties);
            }

            return bValid;
        },

        //Define o proponente principal de acordo com a renda
        _setMainBidder: function(oItemsInvParties){
            let oProponents = oItemsInvParties.filter(sItem => {
                if(sItem.functionCode === "31") return sItem
            });

            if(oProponents.length != 1){
                let oObject = {
                    key: undefined,
                    income: undefined
                };
    
                for(let oProponent of oProponents){
                    let oIncome = Number(this._clearFormattingValue(oProponent.financialInformation.monthlyIncome))
    
                    if(oProponent.biddersSpouseData.cpf != ""){
                        oIncome += Number(this._clearFormattingValue(oProponent.biddersSpouseData.monthlyIncome))
                    }
    
                    if(oObject.income === undefined){
                        oObject.key    = oProponent.key;
                        oObject.income = oIncome;
                    }else {
                        if(oIncome > oObject.income){
                            oObject.key    = oProponent.key;
                            oObject.income = oIncome;
                        }
                    }
                }

                oItemsInvParties.map(sItem => {
                    if(sItem.functionCode === "31"){
                        if(sItem.key === oObject.key){
                            sItem.checkBoxMainBuyer = true;
                        }else{
                            sItem.checkBoxMainBuyer = false;
                        }
                    }
                });

                this.getModel("involvedParties").refresh(true);
            }
        },

        //Busca Dados de campos para ajudar o usuário a preencher
        _searchRelatedRegistrationFields: async function(){
            let oDataReasonPurchase = await this.callService(`OpportunityQualoobjetivodacompra_KUTCollection?$orderby=Description asc&$format=json`).method('GET');
            
            this.getModel("reasonPurchase").setData({ items: oDataReasonPurchase });
            this.getModel("reasonPurchase").refresh(true);

            let oDataMedia = await this.callService(`IndividualCustomerMidia_KUTCollection?$orderby=Description asc&$format=json`).method('GET');

            this.getModel("media").setData({ items: oDataMedia });
            this.getModel("media").refresh(true);

            let oDataSex = await this.callService(`IndividualCustomerGenderCodeCollection?$orderby=Description asc&$format=json`).method('GET');

            this.getModel("sex").setData({ items: oDataSex });
            this.getModel("sex").refresh(true);

            let oDataMaritalStatus = await this.callService(`IndividualCustomerMaritalStatusCodeCollection?$orderby=Description asc&$format=json`).method('GET');

            this.getModel("maritalStatus").setData({ items: oDataMaritalStatus });
            this.getModel("maritalStatus").refresh(true);

            let oDataMarriageRegime = await this.callService(`IndividualCustomerRegimecasamento_KUTCollection?$orderby=Description asc&$format=json`).method('GET');

            this.getModel("marriageRegime").setData({ items: oDataMarriageRegime });
            this.getModel("marriageRegime").refresh(true);

            let oDataCurrentHousing = await this.callService(`IndividualCustomerMoradiaatual_KUTCollection?$orderby=Description asc&$format=json`).method('GET');

            this.getModel("currentHousing").setData({ items: oDataCurrentHousing });
            this.getModel("currentHousing").refresh(true);

            let oDataIncomeType = await this.callService(`IndividualCustomerTiporenda_KUTCollection?$orderby=Description asc&$format=json`).method('GET');

            this.getModel("incomeType").setData({ items: oDataIncomeType });
            this.getModel("incomeType").refresh(true);

            let oDataAmortization = await this.callService(`IndividualCustomerAmortizacao_KUTCollection?$orderby=Description asc&$format=json`).method('GET');

            this.getModel("amortization").setData({ items: oDataAmortization });
            this.getModel("amortization").refresh(true);

            let oDataNationality = await this.callService(`IndividualCustomerNationalityCountryCodeCollection?$orderby=Description asc&$format=json`).method('GET');
            
            this.getModel("nationality").setData({ items: oDataNationality });
            this.getModel("nationality").refresh(true);

            let oDataIssuer = await this.callService(`IndividualCustomerOrgaoExpedidor_KUTCollection?$orderby=Description asc&$format=json`).method('GET');
            
            this.getModel("issuer").setData({ items: oDataIssuer });
            this.getModel("issuer").refresh(true);

            let oDataNaturalness = await this.callServiceNaturalness(`NacionalidadeCollection?$format=json&$select=Code,Description&$orderby=Description%20asc&$top=6000`).method('GET');
            
            this.getModel("naturalness").setData({ items: oDataNaturalness });
            this.getModel("naturalness").refresh(true);

            //Busca todas as profissões
            let oDataProfessions   = await this.callService(`LeadIndividualCustomerOccupationCodeCollection?$orderby=Description asc&$format=json&page=100&page_size=100`).method('GET');
            let oUniqueProfessions = [];

            if(oDataProfessions != undefined){
                for(let oProfession of oDataProfessions){
                    if(oUniqueProfessions.length === 0){
                        oUniqueProfessions.push(oProfession);
                    }else{
                        let oIdentical = oUniqueProfessions.find(sUnique => {
                            if(sUnique.Description === oProfession.Description){
                                return sUnique;
                            };
                        });

                        if(oIdentical === undefined){
                            oUniqueProfessions.push(oProfession);
                        }
                    }
                }
                this.getModel("profession").setData({ items: oUniqueProfessions });
                this.getModel("profession").refresh(true);
            }
            
        },

        _pressItemProponent: function(sItem){
            let oModel;

            if(sItem.radioButtonCPF != undefined){
                sItem.radioButtonCPF  = true;

                if(sItem.maritalStatus === "2"){
                    sItem.State.marriageRegime.Enabled = true;
                    sItem.State.weddingDate.Enabled    = true;
                }

                if(sItem.biddersSpouseData.cpf != ""){
                    this._validationBidderSpouse(sItem, "biddersSpouseData", undefined);
                }

                //Valida Campos obrigatórios
                this._validationProponent(sItem);

                oModel = new JSONModel({ physicalPerson: sItem });
            }else{
                sItem.radioButtonCNPJ = true;
                oModel = new JSONModel({ legalPerson: sItem });
            }

            this._oProponentPage.removeAllContent();

            this._oNavContainer.to(this._oProponentPage);

            this._getFragment("ProponentInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");

                this._oProponentPage.insertContent(oFragment);

                this.byId("rbg1").setEnabled(false);

                if(sItem.maritalStatus === "2"){
                    sItem.State.marriageRegime.Enabled = true;
                    sItem.State.weddingDate.Enabled    = true;

                    this.byId("buttonShowHideSpouse").setVisible(true);
                }

                if(sItem.radioButtonCPF != undefined){
                    this._additionalDataPhysicalPerson(true);
                    this._additionalDataLegalPerson(false);

                    if(sItem.biddersSpouseData.cpf != ""){
                        let oTextReject = this.getResourceBundle().getText("proponentButtonHideSpouse");
                        
                        this.getModel("texts").setProperty("/buttonShowHideSpouse", oTextReject);
    
                        this.byId("buttonShowHideSpouse").removeStyleClass("buttonShowSpouseAccept");
                        this.byId("buttonShowHideSpouse").addStyleClass("buttonHideSpouseReject");
                        this.byId("buttonShowHideSpouse").setVisible(true);
                        this.byId("SpousePhysicalPerson").setVisible(true);
                    
                        this.getModel("texts").refresh(true);
                    }
                }else{
                    this._additionalDataLegalPerson(true);
                    this._additionalDataPhysicalPerson(false);
                }
            }.bind(this));
        },

        _pressItemAttorney: function(sItem){
            //Valida Campos obrigatórios
            this._validationFragment(sItem);

            let oModel = new JSONModel(sItem);

            this._oNavContainer.to(this._oAttorneyPage);

            this._getFragment("physicalPerson.attorney.AttorneyInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");
    
                this._oAttorneyPage.removeAllContent();
                this._oAttorneyPage.insertContent(oFragment);
            }.bind(this));
        },

        _pressItemGuarantor: function(sItem){
            if(sItem.biddersSpouseData.cpf != ""){
                this._validationBidderSpouse(sItem, "biddersSpouseData", undefined);
            }

            //Valida Campos obrigatórios
            this._validationFragment(sItem);

            let oModel = new JSONModel(sItem);

            this._oNavContainer.to(this._oGuarantorPage);

            this._getFragment("physicalPerson.guarantor.GuarantorInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");
    
                this._oGuarantorPage.removeAllContent();
                this._oGuarantorPage.insertContent(oFragment);

                if(sItem.maritalStatus === "2"){
                    this.byId("buttonShowHideSpouseGuarantor").setVisible(true);
                }

                if(sItem.biddersSpouseData.cpf != ""){
                    let oTextReject = this.getResourceBundle().getText("proponentButtonHideSpouse");
                    
                    this.getModel("texts").setProperty("/buttonShowHideSpouseGuarantor", oTextReject);

                    this.byId("buttonShowHideSpouseGuarantor").removeStyleClass("buttonShowSpouseAccept");
                    this.byId("buttonShowHideSpouseGuarantor").addStyleClass("buttonHideSpouseReject");
                    this.byId("buttonShowHideSpouseGuarantor").setVisible(true);
                    this.byId("SpousePhysicalPersonGuarantor").setVisible(true);
                
                    this.getModel("texts").refresh(true);
                }
            }.bind(this));
        },

        _pressItemFinancialOfficer: function(sItem){
            //Valida Campos obrigatórios
            this._validationFragment(sItem);

            let oModel = new JSONModel(sItem);

            this._oNavContainer.to(this._oFinancialOfficerPage);

            this._getFragment("physicalPerson.financialOfficer.FinancialOfficerInstance").then(function(oFragment){
                oFragment.setModel(oModel, "fragment");
    
                this._oFinancialOfficerPage.removeAllContent();
                this._oFinancialOfficerPage.insertContent(oFragment);
            }.bind(this));
        },

        _pressItemLegalRepresentative: function(sItem){
            //Valida Campos obrigatórios
            this._validationFragment(sItem);

            let oModel = new JSONModel(sItem);

            this._oNavContainer.to(this._oLegalRepresentativePage);

            this._getFragment("legalPerson.legalRepresentative.LegalRepresentativeInstance").then(function(oFragment){
                //Valida Campos obrigatórios
                this._validationFragment(sItem);

                oFragment.setModel(oModel, "fragment");
    
                this._oLegalRepresentativePage.removeAllContent();
                this._oLegalRepresentativePage.insertContent(oFragment);
            }.bind(this));
        },

        _checkMainBuyer: function(sModel){
            let oModel = this.getModel("involvedParties").getData();
        
            if(sModel.checkBoxMainBuyer){
                if(oModel.items.length != 0){
                    for(let oItem of oModel.items){
                        if(oItem.functionCode === "31"){
                            if(oItem.key === oModel.mainBuyerKey){
                                oItem.checkBoxMainBuyer = false;
                            }   
                        }
                    }

                    oModel.mainBuyerKey = sModel.key;

                    this.getModel("involvedParties").refresh(true);
                }
            }
        },

        //Validação de campos obrigatórios para Pessoa Física
        _validationProponent: function(sModel){
            let aFieldClass   = ["CPFAndCNPJ", "name", "mobile", "email"], //"phone"],
                aFieldAddress = ["CEP", "publicPlace", "number", "neighborhood", "county", "UF"],
                aFieldCompany = ["admissionDate"],
                aFieldFinancialInfo  = ["monthlyIncome", "incomeType"],
                bValid        = true;
    
            if(sModel.radioButtonCPF != undefined){
                aFieldClass.push("surname");
                aFieldClass.push("birth");
                aFieldClass.push("maritalStatus");
                aFieldClass.push("RGNumber");
                aFieldClass.push("RGIssuer");
                aFieldClass.push("UF");
                aFieldClass.push("motherName");
                aFieldClass.push("profession");
                aFieldClass.push("naturalness");
                aFieldClass.push("nationality");
            }

            aFieldClass.forEach(sField => {
                if(sModel[sField] === "" || sModel[sField] === null){
                    sModel.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                    sModel.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
					bValid = false;
                }else {
                    sModel.State[sField].ValueState     = sap.ui.core.ValueState.None;
					sModel.State[sField].ValueStateText = "";
                }
            });

            if(sModel.radioButtonCPF != undefined){
                /**
                Renda Mensal  	= financialInformation.monthlyIncome
                Tipo de Renda 	= financialInformation.incomeType
                */
                aFieldFinancialInfo.forEach(sField => {
                    if(sModel.financialInformation[sField] === ""   ||
                       sModel.financialInformation[sField] === null ||
                       sModel.financialInformation[sField] === "R$ 0,00")
                    {
                        sModel.financialInformation.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                        sModel.financialInformation.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                        bValid = false;
                    }else {
                        sModel.financialInformation.State[sField].ValueState     = sap.ui.core.ValueState.None;
                        sModel.financialInformation.State[sField].ValueStateText = "";
                    }
                });

                //Data Admissão 	= biddersProfessionalData.admissionDate
                aFieldCompany.forEach(sField => {
                    if(sModel.biddersProfessionalData[sField] === "" || sModel.biddersProfessionalData[sField] === null){
                        sModel.biddersProfessionalData.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                        sModel.biddersProfessionalData.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                        bValid = false;
                    }else {
                        sModel.biddersProfessionalData.State[sField].ValueState     = sap.ui.core.ValueState.None;
                        sModel.biddersProfessionalData.State[sField].ValueStateText = "";
                    }
                });

                //Valida campos de endereço
                aFieldAddress.forEach(sField => {
                    if(sModel.homeAddress[sField] === ""){
                        sModel.homeAddress.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                        sModel.homeAddress.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                        bValid = false;
                    }else {
                        sModel.homeAddress.State[sField].ValueState     = sap.ui.core.ValueState.None;
                        sModel.homeAddress.State[sField].ValueStateText = "";
                    }
                });
            }else{
                aFieldAddress.forEach(sField => {
                    if(sModel.companyAddress[sField] === ""){
                        sModel.companyAddress.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                        sModel.companyAddress.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                        bValid = false;
                    }else {
                        sModel.companyAddress.State[sField].ValueState     = sap.ui.core.ValueState.None;
                        sModel.companyAddress.State[sField].ValueStateText = "";
                    }
                });
            }

            if(!bValid){
                this.getModel("involvedParties").getData().bSave = false;
                this.getModel("involvedParties").getData().bEdit = false;
            }else{
                if(sModel.objectID != "") this.getModel("involvedParties").getData().bEdit = true;
                else this.getModel("involvedParties").getData().bSave = true;
            }

            this.getModel("involvedParties").refresh(true);
        },

        //Validação de campos obrigatórios para Procurador, Responsável Financeiro, Fiador e Representante Legal
        _validationFragment: function(sModel){
            let aFieldClass       = ["CPFAndCNPJ", "name","surname", "mobileDDI", "mobile", "email", "sex", "maritalStatus", "birth",
                                     "RGNumber", "RGIssuer", "UF", "naturalness", "nationality", "monthlyIncome", "profession"],

                aFieldHomeAddress = ["CEP", "publicPlace", "number", "neighborhood", "county", "UF"],
                bValid = true;

            //Valida Campos CPF e Name
            aFieldClass.forEach(sField => {
                if(sModel[sField] === "" || sModel[sField] === null){
                    sModel.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                    sModel.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                    bValid = false;
                }else {
                    sModel.State[sField].ValueState     = sap.ui.core.ValueState.None;
                    sModel.State[sField].ValueStateText = "";
                }
            });

            //Valida campos de endereço
            aFieldHomeAddress.forEach(sField => {
                if(sModel.homeAddress[sField] === ""){
                    sModel.homeAddress.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                    sModel.homeAddress.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                    bValid = false;
                }else {
                    sModel.homeAddress.State[sField].ValueState     = sap.ui.core.ValueState.None;
                    sModel.homeAddress.State[sField].ValueStateText = "";
                }
            });
    
            if(!bValid){
                this.getModel("involvedParties").getData().bSave = false;
                this.getModel("involvedParties").getData().bEdit = false;
            }else{
                if(sModel.objectID != "") this.getModel("involvedParties").getData().bEdit = true;
                else this.getModel("involvedParties").getData().bSave = true;
            }

            this.getModel("involvedParties").refresh(true);
        },

        _validationBidderSpouse: function(sModel, sObject, sInstance){
            let aFieldClass       = ["cpf", "name", "surname", "mobileDDI", "mobile", "email", "sex",
                                     "birth", "RGNumber", "RGIssuer", "UF", "naturalness", "nationality",
                                     "monthlyIncome", "profession"],
                aFieldHomeAddress = ["CEP", "publicPlace", "number", "neighborhood", "county", "UF"],
                bValid            = true,
                bValidHomeAddress = true;

            aFieldClass.forEach(sField => {
                if(sModel[sObject][sField] === "" || sModel[sObject][sField] === null || sModel[sObject][sField] === "R$ 0,00"){
                    sModel[sObject].State[sField].ValueState     = sap.ui.core.ValueState.Error;
                    sModel[sObject].State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                    bValid = false;
                }else {
                    sModel[sObject].State[sField].ValueState     = sap.ui.core.ValueState.None;
                    sModel[sObject].State[sField].ValueStateText = "";
                }
            });

            //biddersSpouseData
            //biddersSpouseData
            aFieldHomeAddress.forEach(sField => {
                if(sModel[sObject].professionalData[sField] === "" || sModel[sObject][sField] === null || sModel[sObject][sField] === "R$ 0,00"){
                    sModel[sObject].professionalData.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                    sModel[sObject].professionalData.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                    bValid = false;
                }else {
                    sModel[sObject].professionalData.State[sField].ValueState     = sap.ui.core.ValueState.None;
                    sModel[sObject].professionalData.State[sField].ValueStateText = "";
                }
            });

            if(!bValid){
                this.getModel("involvedParties").getData().bSave = false;
                this.getModel("involvedParties").getData().bEdit = false;
            }else{
                if(sModel.objectID != "") this.getModel("involvedParties").getData().bEdit = true;
                else this.getModel("involvedParties").getData().bSave = true;
            }

            if(sInstance != undefined){
                sInstance.getModel("fragment").refresh(true);
            }
            this.getModel("involvedParties").refresh(true);
        },

        _selectionSaleForm: function(sValue, sModel, sModelEnterprise){
            let oTableValue   = Number(this._clearFormattingValue(sModelEnterprise.items[0].tableValue)),
                oNetValueSBPE = Number(this._clearFormattingValue(sModelEnterprise.items[0].SBPEValue)),
                oNetValueCVA  = Number(this._clearFormattingValue(sModelEnterprise.items[0].CVAValue));

            switch (sValue) {
                case "Direta":
                    sModel.items = this._fillOutDirectSalesForm(oTableValue, oNetValueSBPE);

                    this.getModel("componentsValues").getData().items = [];
                    this.getModel("componentsValues").refresh(true);

                    this._addRemoveComponents(this.deliveryKeys, "add");
                    break;
                case this.FGTS:
                    sModel.items = this._fillInFGTSSalesForm(oTableValue, oNetValueSBPE);

                    this.getModel("componentsValues").getData().items = [];
                    this.getModel("componentsValues").refresh(true);

                    this._addRemoveComponents(this.deliveryKeys, "add");
                    break;
                case "À vista":
                    sModel.items = this._fillInCashSaleForm(oTableValue)

                    this.getModel("componentsValues").getData().items = [];
                    this.getModel("componentsValues").refresh(true);

                    this._addRemoveComponents(this.deliveryKeys, "remove");
                    break;
            }

            sModel.items.map(sItem => {
                if(sItem.selectionComponents === this.intermediate){
                    sModel.State.selectionValueIntermediate.Visible = true;
                }

                if(sItem.selectionComponents === this.adjustableMonthly ||
                   sItem.selectionComponents === this.fixedMonthly      ||
                   sItem.selectionComponents === this.descendingMonthly)
                {
                   sModel.State.selectionPaymentPlan.Visible = true;
                }
            });

            this.getModel("paymentConditions").refresh(true);
        },

        //busca imobiaria de acordo com o corretor selecionado
        _searchRealEstate: function(sModel){
            let bInvalid = false;

            if(sModel.realEstate === ""){
                let oItemsRealEstate = this.getModel("realEstate").getData().items,
                    oRealEstate      = [];

                for(let oItem of oItemsRealEstate){
                    oItem.brokers.map(sItem => {
                        if(sItem.brokerID === sModel.broker) oRealEstate.push(oItem);
                    });
                }

                if(oRealEstate.length === 1){
                    sModel.realEstate = oRealEstate[0].partnerID;

                    this.getModel("finishProposal").refresh(true);
                }else if(oRealEstate.length > 1){
                    this.getModel("realEstate").getData().items = oRealEstate;
                    this.getModel("realEstate").refresh(true);
                }else{
                    bInvalid = true;
                }
            }

            return bInvalid;
        },

        //Formata campos Obrigatórios
        _formateRequiredFields: function(oItem){
            let oId           = oItem.getParameter("id"),
                oValue        = oItem.getParameter("value"),
                positionPhone = oId.indexOf("Phone"),
                positionCPF   = oId.indexOf("CPF"),
                positionCNPJ  = oId.indexOf("CNPJ"),
                positionCEP   = oId.indexOf("CEP");
            
            if(positionCPF != -1){
                //this.byId(oId).setValue(this._formateCPF(oValue));
            }else if(positionPhone != -1){
                //this.byId(oId).setValue(this._formatePhone(oValue));
            }else if(positionCEP != -1){
                this.byId(oId).setValue(this._formateCEP(oValue));
            }else if(positionCNPJ != -1){
                this.byId(oId).setValue(this._formateCNPJ(oValue));
            }
        },

        _getFragment: function(sFragmentName) {
			if (!this._oFragment[sFragmentName]) {
				this._oFragment[sFragmentName] = Fragment.load({
					id: this.getView().getId(),
					type: "XML",
					name: `com.itsgroup.brz.enterprises.view.fragments.finishProposal.proponent.` + sFragmentName,
					controller: this
				});
			}

            return this._oFragment[sFragmentName];
		},

        _fillInSpouseFields: function(sModel, sIndividualCustomer){
            sModel.objectID            = sIndividualCustomer.ObjectID;
            sModel.customerID          = sIndividualCustomer.CustomerID;
            sModel.roleCode            = sIndividualCustomer.RoleCode;
            sModel.cpf                 = this._formateCPF(sIndividualCustomer.CPFCNPJ_KUT);
            sModel.name                = sIndividualCustomer.FirstName;
            sModel.surname             = sIndividualCustomer.LastName;
            //sModel.mobile              = this._formatePhone(sIndividualCustomer.Mobile);
            sModel.email               = sIndividualCustomer.Email;
            //sModel.phone               = this._formatePhone(sIndividualCustomer.Phone);
            sModel.sex                 = sIndividualCustomer.GenderCode;
            sModel.maritalStatus       = sIndividualCustomer.MaritalStatusCode;
            sModel.birth               = this._formatedDate(sIndividualCustomer.BirthDate);
            sModel.RGNumber            = sIndividualCustomer.CIDENTIDADE_KUT;
            sModel.RGIssuer            = sIndividualCustomer.OrgaoExpedidor_KUT;
            sModel.UF                  = sIndividualCustomer.Estadoorgaoemissor_KUT;
            sModel.naturalness         = sIndividualCustomer.NacionalidadeCode_SDK;
            sModel.nationality         = sIndividualCustomer.NationalityCountryCode;
            sModel.motherName          = sIndividualCustomer.Nomedamae_KUT;
            sModel.fatherName          = sIndividualCustomer.Nomedopai_KUT;
            sModel.monthlyIncome       = this._formateValue(sIndividualCustomer.Rendamensal_KUT, undefined);
            sModel.profession          = sIndividualCustomer.ProfessionCode;
            sModel.notaryRegistryFirm  = "";
            sModel.OwnerID             = sIndividualCustomer.OwnerID;

            //preenche telefone
            this._fillsPhoneFields(sModel, sIndividualCustomer);

            sModel.professionalData.companyName   = sIndividualCustomer.Empresa_KUT
            sModel.professionalData.office        = sIndividualCustomer.Cargo_KUT
            sModel.professionalData.admissionDate = this._formatedDate(sIndividualCustomer.Dataadmissao_KUT);
            sModel.professionalData.phone         = "";
            sModel.professionalData.CEP           = sIndividualCustomer.CEPEmpresa_KUT;
            sModel.professionalData.publicPlace   = sIndividualCustomer.Logradouroempresa_KUT;
            sModel.professionalData.number        = sIndividualCustomer.Numeroempresa_KUT;
            sModel.professionalData.complement    = sIndividualCustomer.Complementoempresa_KUT;
            sModel.professionalData.neighborhood  = sIndividualCustomer.Bairroempresa_KUT;
            sModel.professionalData.county        = sIndividualCustomer.Municipioempresa_KUT;
            sModel.professionalData.UF            = sIndividualCustomer.ZEstadoEmpresa_KUT;
        },

        _fillsPhoneFields: function(sModel, sCustomer){
            if(sCustomer.Mobile != ""){
                /*let oArrayMobile = sCustomer.Mobile.split(" ");

                if(oArrayMobile.length != 0){
                    if(oArrayMobile.length === 1){
                        sModel.mobile    = this._formatePhone(oArrayMobile[1]);
                    }else{
                        sModel.mobileDDI = oArrayMobile[0];
                        sModel.mobile    = this._formatePhone(oArrayMobile[1]);
                    }
                }*/

                let oValue  = sCustomer.Mobile.replace(" ", "");

                sModel.mobileDDI = oValue.substring(0, oValue.length - 11)
                sModel.mobile    = this._formatePhone(oValue.substring(oValue.length - 11, oValue.length));
            }

            if(sCustomer.Phone != ""){
                /*let oArrayPhone = sCustomer.Phone.split(" ");

                if(oArrayPhone.length != 0){
                    if(oArrayPhone.length === 1){
                        sModel.phone    = this._formatePhone(oArrayPhone[1]);
                    }else{
                        sModel.phoneDDI = oArrayPhone[0];
                        sModel.phone    = this._formatePhone(oArrayPhone[1]);
                    }
                }*/

                let oValue  = sCustomer.Phone.replace(" ", "");

                sModel.phoneDDI = oValue.substring(0, oValue.length - 11)
                sModel.phone    = this._formatePhone(oValue.substring(oValue.length - 11, oValue.length));
            }
        },

        _fillsPhysicalProponentFields: function(oProponent, oIndividualCustomer, sMethodManual){
            //Preenche os campos da pessoa física
            oProponent.physicalPerson.objectID      = oIndividualCustomer.ObjectID;
            oProponent.physicalPerson.customerID    = oIndividualCustomer.CustomerID;
            oProponent.physicalPerson.roleCode      = oIndividualCustomer.RoleCode;
            oProponent.physicalPerson.CPFAndCNPJ    = this._formateCPF(oIndividualCustomer.CPFCNPJ_KUT);
            oProponent.physicalPerson.name          = oIndividualCustomer.FirstName;
            oProponent.physicalPerson.surname       = oIndividualCustomer.LastName;
            oProponent.physicalPerson.email         = oIndividualCustomer.Email;
            oProponent.physicalPerson.sex           = oIndividualCustomer.GenderCode;
            oProponent.physicalPerson.birth         = this._formatedDate(oIndividualCustomer.BirthDate);
            oProponent.physicalPerson.maritalStatus = oIndividualCustomer.MaritalStatusCode;
            oProponent.physicalPerson.OwnerID       = oIndividualCustomer.OwnerID;

            //preenche telefone
            this._fillsPhoneFields(oProponent.physicalPerson, oIndividualCustomer);

            if(oIndividualCustomer.MaritalStatusCodeText === "Casado(a)"){
                oProponent.physicalPerson.marriageRegime = oIndividualCustomer.Regimecasamento_KUT;
                oProponent.physicalPerson.weddingDate    = this._formatedDate(oIndividualCustomer.DataCasamento_KUT);
                
                oProponent.physicalPerson.State.marriageRegime.Enabled = true;
                oProponent.physicalPerson.State.weddingDate.Enabled    = true;

                if(sMethodManual) this.byId("buttonShowHideSpouse").setVisible(true);
            }else{
                if(sMethodManual) this.byId("buttonShowHideSpouse").setVisible(false);
            }
            
            oProponent.physicalPerson.RGNumber           = oIndividualCustomer.CIDENTIDADE_KUT;
            oProponent.physicalPerson.RGIssuer           = oIndividualCustomer.OrgaoExpedidor_KUT;
            oProponent.physicalPerson.UF                 = oIndividualCustomer.Estadoorgaoemissor_KUT;
            oProponent.physicalPerson.naturalness        = oIndividualCustomer.NacionalidadeCode_SDK;
            oProponent.physicalPerson.nationality        = oIndividualCustomer.NationalityCountryCode;
            oProponent.physicalPerson.motherName         = oIndividualCustomer.Nomedamae_KUT;
            oProponent.physicalPerson.fatherName         = oIndividualCustomer.Nomedopai_KUT;
            oProponent.physicalPerson.profession         = oIndividualCustomer.ProfessionCode;
            oProponent.physicalPerson.notaryRegistryFirm = "";
            oProponent.physicalPerson.currentHousing     = oIndividualCustomer.Moradiaatual_KUT;
            oProponent.physicalPerson.housingTime        = oIndividualCustomer.Tempomoradia_KUT;

            //Preenche campos da empresa do proponente
            oProponent.physicalPerson.biddersProfessionalData.companyName   = oIndividualCustomer.Empresa_KUT
            oProponent.physicalPerson.biddersProfessionalData.office        = oIndividualCustomer.Cargo_KUT
            oProponent.physicalPerson.biddersProfessionalData.admissionDate = this._formatedDate(oIndividualCustomer.Dataadmissao_KUT);
            oProponent.physicalPerson.biddersProfessionalData.telePhone     = "";
            oProponent.physicalPerson.biddersProfessionalData.CEP           = oIndividualCustomer.CEPEmpresa_KUT;
            oProponent.physicalPerson.biddersProfessionalData.publicPlace   = oIndividualCustomer.Logradouroempresa_KUT;
            oProponent.physicalPerson.biddersProfessionalData.number        = oIndividualCustomer.Numeroempresa_KUT;
            oProponent.physicalPerson.biddersProfessionalData.complement    = oIndividualCustomer.Complementoempresa_KUT;
            oProponent.physicalPerson.biddersProfessionalData.neighborhood  = oIndividualCustomer.Bairroempresa_KUT;
            oProponent.physicalPerson.biddersProfessionalData.county        = oIndividualCustomer.Municipioempresa_KUT;
            oProponent.physicalPerson.biddersProfessionalData.UF            = oIndividualCustomer.ZEstadoEmpresa_KUT;            

            //Preenche os campos de Informação Financeiras
            oProponent.physicalPerson.financialInformation.monthlyIncome      = this._formateValue(oIndividualCustomer.Rendamensal_KUT, undefined);
            oProponent.physicalPerson.financialInformation.incomeType         = oIndividualCustomer.Tiporenda_KUT;
            oProponent.physicalPerson.financialInformation.committedIncome    = this._formateValue(oIndividualCustomer.Rendacomprometida_KUT, undefined);
            oProponent.physicalPerson.financialInformation.informalIncome     = this._formateValue(oIndividualCustomer.Rendainformal_KUT, undefined);
            oProponent.physicalPerson.financialInformation.creditFinancing    = this._formateValue(oIndividualCustomer.Creditofinanciamento_KUT, undefined);
            oProponent.physicalPerson.financialInformation.subsidyCredit      = this._formateValue(oIndividualCustomer.Creditosubsidio_KUT, undefined);
            oProponent.physicalPerson.financialInformation.FGTSCredit         = this._formateValue(oIndividualCustomer.CreditoFGTS_KUT, undefined);
            oProponent.physicalPerson.financialInformation.creditOwnResources = this._formateValue(oIndividualCustomer.Creditorecursosproprios_KUT, undefined);
            oProponent.physicalPerson.financialInformation.numberInstallments = oIndividualCustomer.Quantidademaximaparcelas_KUT;
            oProponent.physicalPerson.financialInformation.amortization       = oIndividualCustomer.Amortizacao_KUT;

            //Preenche os campos de endereço residencial
            oProponent.physicalPerson.homeAddress.CEP          = oIndividualCustomer.StreetPostalCode;
            oProponent.physicalPerson.homeAddress.publicPlace  = oIndividualCustomer.Street;
            oProponent.physicalPerson.homeAddress.number       = Number(oIndividualCustomer.HouseNumber);
            oProponent.physicalPerson.homeAddress.complement   = oIndividualCustomer.AddressLine4;
            oProponent.physicalPerson.homeAddress.neighborhood = oIndividualCustomer.District;
            oProponent.physicalPerson.homeAddress.county       = oIndividualCustomer.City;
            oProponent.physicalPerson.homeAddress.UF           = oIndividualCustomer.StateCode;
        },

        _calculationProposed: function(sModel, sID) {
            let oCalculationProposed  = this.getModel("proposedCalculation").getData(),
                oItemsEvaluation      = this.getModel("proposalEvaluation").getData().items,
                oItemEnterprise       = this.getModel("enterprises").getData().items[0],
                oModelFinishProposal  = this.getModel("paymentConditions").getData(),
                oModelInvolvedParties = this.getModel("involvedParties").getData(),
                oUnitValue            = Number(this._clearFormattingValue(oItemsEvaluation[0].unitValue)),
                oItemsPaymentCndts    = [],
                oPercentageFinal      = 0;

            let oTotalSimulate = 0; 

            for(let item of sModel){
                if(item.selectionUnitaryValue != "" && item.selectionUnitaryValue != undefined){
                    if(item.selectionValueTotal != ""){
                        oTotalSimulate += Number(this._clearFormattingValue(item.selectionValueTotal));
                    }
                }
            }

            for(let item of sModel){
                if(item.selectionUnitaryValue != "" && item.selectionUnitaryValue != undefined){
                    if(item.selectionValueTotal != ""){
                        let valueUnitary = parseInt(this._clearFormattingValue(item.selectionUnitaryValue));
                        let percentage;

                        if(item.selectionComponents === this.adjustableMonthly)
                        {   
                            let oPositionID = sID.indexOf("theAmount");

                            if(oPositionID != -1){
                                let oValueTotal   = Number(this._clearFormattingValue(item.selectionValueTotal)),
                                    oValueUnitary = `${oValueTotal / Number(item.selectionTheAmount)}`,
                                    oPositionUnitary = oValueUnitary.indexOf(".");

                                //Faz o total divido pela quantidade de parcelas
                                if(oPositionUnitary != -1) oValueUnitary = oValueUnitary.substring(0, oPositionUnitary);
                                else oValueUnitary = oValueUnitary;

                                percentage = `${(Number(oValueUnitary) / oTotalSimulate)* 100}`

                                item.selectionUnitaryValue = this._formateValue(oValueUnitary, undefined);
                                item.selectionValueTotal   = this._formateValue(`${Number(oValueUnitary) * Number(item.selectionTheAmount)}`, undefined);
                            }else{
                                let oValueTotal = `${valueUnitary * Number(item.selectionTheAmount)}`,
                                    oPositionTotal = oValueTotal.indexOf(".");

                                //faz o quantidade * o valor mensal e formata o valor em R$
                                if(oPositionTotal != -1) item.selectionValueTotal = this._formateValue(oValueTotal.substring(0, oPositionTotal), undefined);
                                else item.selectionValueTotal = this._formateValue(oValueTotal, undefined);

                                percentage = `${(Number(oValueTotal) / oTotalSimulate)* 100}`                            
                            }

                            let oMonthDueDate = item.selectionDueDate.substring(3, 5),
                                oDay          = item.selectionDueDate.substring(0, 2),
                                oYear         = item.selectionDueDate.substring(6, 10),
                                oMonth        = Number(oMonthDueDate) + Number(item.selectionTheAmount),
                                oObjectDate   = this._ajustDate(oMonth, Number(oYear), 12);

                            item.selectionDeadline = `${oDay}/${oObjectDate.numberA}/${oObjectDate.numberB}`;   
                        }else//Mensal  Fixa
                        if(item.selectionComponents === this.fixedMonthly){
                            let oPositionID = sID.indexOf("theAmount");

                            if(oPositionID != -1){
                                let oValueTotal   = Number(this._clearFormattingValue(item.selectionValueTotal)),
                                    oValueUnitary = `${oValueTotal / Number(item.selectionTheAmount)}`,
                                    oPositionUnitary = oValueUnitary.indexOf(".");

                                //Faz o total divido pela quantidade de parcelas
                                if(oPositionUnitary != -1) oValueUnitary = oValueUnitary.substring(0, oPositionUnitary);
                                else oValueUnitary = oValueUnitary;

                                percentage = `${(Number(oValueUnitary) / oTotalSimulate)* 100}`

                                item.selectionUnitaryValue = this._formateValue(oValueUnitary, undefined);
                                item.selectionValueTotal   = this._formateValue(`${Number(oValueUnitary) * Number(item.selectionTheAmount)}`, undefined);
                            }else{
                                let oValueTotal = `${valueUnitary * Number(item.selectionTheAmount)}`,
                                    oPositionTotal = oValueTotal.indexOf(".");

                                //faz o quantidade * o valor mensal e formata o valor em R$
                                if(oPositionTotal != -1) item.selectionValueTotal = this._formateValue(oValueTotal.substring(0, oPositionTotal), undefined);
                                else item.selectionValueTotal = this._formateValue(oValueTotal, undefined);

                                percentage = `${(Number(oValueTotal) / oTotalSimulate)* 100}`                            
                            }

                            let oMonthDueDate = item.selectionDueDate.substring(3, 5),
                                oDay          = item.selectionDueDate.substring(0, 2),
                                oYear         = item.selectionDueDate.substring(6, 10),
                                oMonth        = Number(oMonthDueDate) + Number(item.selectionTheAmount),
                                oObjectDate   = this._ajustDate(oMonth, Number(oYear), 12);

                            item.selectionDeadline = `${oDay}/${oObjectDate.numberA}/${oObjectDate.numberB}`;

                            //-------------------------------------------------------------------------------------------------//
                            //--------------- Verifica se a prestação base é menor que o número de parcelas -------------------//
                            //-------------------------------------------------------------------------------------------------//

                            let oTableValue, oValueSaleSBPECVA;

                            if(Number(item.selectionTheAmount) > oItemEnterprise.basicBenefits){
                                //((1 + Taxa anual de reajuste) potência (1/12)) Potência (Quantidade parcelas preenchida - Prestação base)
                                let bValidCVA = false;

                                if(oModelFinishProposal.selectionSaleForm === "Z01"){
                                    if(oModelFinishProposal.selectionPurchaseMethod === "1"){
                                        oTableValue       = Number(this._clearFormattingValue(oItemEnterprise.tableValue));
                                        oValueSaleSBPECVA = Number(this._clearFormattingValue(oItemEnterprise.SBPEValue));
                                    }else{
                                        oTableValue       = Number(this._clearFormattingValue(oItemEnterprise.tableValueTetoCVA));
                                        oValueSaleSBPECVA = Number(this._clearFormattingValue(oItemEnterprise.CVAValue));
                                        bValidCVA         = true;
                                    }
                                }
                                
                                let oValueSale = oValueSaleSBPECVA * Math.pow(Math.pow((1 + oItemEnterprise.annualRateReadjustment.percentageCalculo), (1/12)), (Number(item.selectionTheAmount) - oItemEnterprise.basicBenefits)),
                                    oPositionValueSale = `${oValueSale}`.indexOf(".");

                                if(oPositionValueSale != -1) oValueSale = Number(`${oValueSale}`.substring(0, oPositionValueSale));

                                let aIntermediate = oTableValue - oValueSale;

                                for(let oItem of sModel){
                                    if(oItem.selectionComponents === this.intermediate &&
                                       oItem.selectionValueTotal != "")
                                    {
                                        oItem.selectionValueTotal = this._formateValue(`${aIntermediate}`, undefined);
                                    }
                                }

                                //Atualiza o valor da intermediaria no componente
                                oModelFinishProposal.selectionValueIntermediate = this._formateValue(`${aIntermediate}`, undefined);
                                this.getModel("paymentConditions").refresh(true);

                                let oTetoCVA = oItemEnterprise.valueTetoCVA

                                //verifico se o valor da venda passou do teto se sim, mostra a mensagem de aviso
                                if(bValidCVA){
                                    if(oValueSale > oTetoCVA){
                                        MessageBox.warning(this.getResourceBundle().getText("messageWarningHigherSaleValue"))
                                    }
                                }
                            }else{
                                //SBPEValueNotModify
                                //CVAValueNotModify
                                /*let oValueSaleSBPECVA;

                                if(oModelFinishProposal.selectionSaleForm === "Z01"){
                                    if(oModelFinishProposal.selectionPurchaseMethod === "1"){
                                        //oItemEnterprise.SBPEValue = oItemEnterprise.SBPEValueNotModify;
                                        oValueSaleSBPECVA         = Number(this._clearFormattingValue(oItemEnterprise.SBPEValueNotModify));
                                    }else{
                                        //oItemEnterprise.CVAValue  = oItemEnterprise.CVAValueNotModify;
                                        oValueSaleSBPECVA         = Number(this._clearFormattingValue(oItemEnterprise.CVAValueNotModify));
                                    }
                                }

                                let aIntermediate = oTableValue - oValueSaleSBPECVA;

                                for(let oItem of sModel){
                                    if(oItem.selectionComponents === this.intermediate &&
                                       oItem.selectionValueTotal != "")
                                    {
                                        oItem.selectionValueTotal = this._formateValue(`${aIntermediate}`, undefined);
                                    }
                                }

                                //Atualiza o valor da intermediaria no componente
                                oModelFinishProposal.selectionValueIntermediate = this._formateValue(`${aIntermediate}`, undefined);
                                this.getModel("paymentConditions").refresh(true);*/
                            }
                        }else //Intermediária
                        if(item.selectionComponents === this.intermediate){ 
                            //verifico se existe outra intermediaria         
                            let aIntermediaria = sModel.find(sItem => {
                                if(sItem.selectionComponents === this.intermediate && 
                                   sItem.selectionValueTotal === "") return sItem;
                            });

                            let oDayIntermediate   = "",
                                oMonthIntermediate = "",
                                oYearIntermediate  = "";

                            //se existir eu só adiciono uma parcela a mais na intermedia principal
                            //para fazer o calculo novamente da intermedia corretamente
                            if(aIntermediaria != undefined){
                                let oDueDate = aIntermediaria.selectionDueDate.split("/");

                                oDayIntermediate   = String(oDueDate[0]).padStart(2, '0');
                                oMonthIntermediate = Number(oDueDate[1]);
                                oYearIntermediate  = Number(oDueDate[2]);
                            }else{
                                let oDueDate = item.selectionDueDate.split("/");

                                oDayIntermediate   = String(oDueDate[0]).padStart(2, '0');
                                oMonthIntermediate = Number(oDueDate[1]);
                                oYearIntermediate  = Number(oDueDate[2]);
                            }

                            let aMonthly = sModel.filter(sItem => {
                                if(sItem.selectionComponents === this.adjustableMonthly ||
                                   sItem.selectionComponents === this.fixedMonthly      ||
                                   sItem.selectionComponents === this.descendingMonthly  ) return sItem;
                            });

                            if(aMonthly.length != 0){
                                let oTotalTheAmount = 0,
                                    oMonthDelivery  = Number(oItemEnterprise.estimatedDeliveryDate.substring(3, 5)),
                                    oYearDelivery   = Number(oItemEnterprise.estimatedDeliveryDate.substring(6, 10)),
                                    aQntdMonth      = this._calculationTimeCourse(oMonthDelivery, oYearDelivery, 0);

                                for(let oItem of aMonthly){
                                    oTotalTheAmount += Number(oItem.selectionTheAmount);
                                }
                                    
                                let oTheAmount =   oTotalTheAmount >= oItemEnterprise.tableParms.intermediate ? (oTotalTheAmount / oItemEnterprise.tableParms.intermediate) : 1,
                                    aPosition  = `${oTheAmount}`.indexOf(".");

                                if(aPosition != -1) oTheAmount = Number(`${oTheAmount}`.substring(0, aPosition));
                                
                                let oValueTotal      = Number(this._clearFormattingValue(item.selectionValueTotal)),
                                    oValueUnit       = oTheAmount != 1 ? (oValueTotal / oTheAmount) : oValueTotal,
                                    oPosition        = `${oValueUnit}`.indexOf("."),
                                    oDayOne          = String(new Date().getDate()).padStart(2, '0'),
                                    oMonthOne        = Number(new Date().getMonth() + 1) + oItemEnterprise.tableParms.intermediate,
                                    oYearOne         = Number(new Date().getFullYear()),
                                    aDifferenceValue = 0;

                                if(oMonthIntermediate > 12){
                                    let oResult = oMonthIntermediate - 12;
        
                                    oMonthIntermediate = String(oResult).padStart(2, '0');
                                    oYearIntermediate += 1;
                                }else {
                                    oMonthIntermediate = String(oMonthIntermediate).padStart(2, '0');
                                }
                                    
                                if(oPosition === -1) aDifferenceValue = (oValueTotal - (oValueUnit * oTheAmount));
                                else{
                                    aDifferenceValue = (oValueTotal - (Number(`${oValueUnit}`.substring(0, oPosition)) * oTheAmount));
                                    oValueUnit       = Number(`${oValueUnit}`.substring(0, oPosition));
                                }
                                    
                                percentage = `${(oValueTotal / oTotalSimulate) * 100}`

                                if(aDifferenceValue != 0){
                                    let aFirstInstallment = oValueUnit + aDifferenceValue,
                                        oDaySeg           = String(oDayIntermediate).padStart(2, '0'),
                                        oMonthSeg         = Number(oMonthIntermediate) + oItemEnterprise.tableParms.intermediate,
                                        oYearSeg          = oYearIntermediate;

                                    if(oMonthSeg > 12){
                                        let oResult = oMonthSeg - 12;
                
                                        oMonthSeg = String(oResult).padStart(2, '0');
                                        oYearSeg += 1;
                                    }else {
                                        oMonthSeg = String(oMonthSeg).padStart(2, '0');
                                    }

                                    item.selectionTheAmount    = oTheAmount - 1;
                                    item.selectionUnitaryValue = this._formateValue(`${oValueUnit}`, undefined);
                                    item.selectionDueDate      = `${oDaySeg}/${oMonthSeg}/${oYearSeg}`;

                                    if(aIntermediaria === undefined){
                                        let sKey              = Math.random(),
                                            oObject           = {
                                                codComponent: "27",
                                                dueDate: `${oDayIntermediate}/${oMonthIntermediate}/${oYearIntermediate}`,
                                                deadline: item.selectionDeadline,
                                                unitaryValue: this._formateValue(`${aFirstInstallment}`, undefined),
                                                theAmount: 1,
                                                oValueTotal: "",
                                                State: {
                                                    buttonRemove: {
                                                        Visible: true
                                                    },
                                                    theAmount: {
                                                        Enabled: false,
                                                    },
                                                    valueTotal: {
                                                        Enabled: false,
                                                    },
                                                    dueDate: {
                                                        Enabled: false,
                                                    },
                                                    unitaryValue: {
                                                        Enabled: false,
                                                    }
                                                }
                                            },
                                            oObjectPercentage = this._formatedPercentage(`${((aFirstInstallment / oTotalSimulate) * 100)}`),
                                            oObjectItem       = this._createObjectItemPaymentConditions(sKey, this.intermediate, oObject, oObjectPercentage);
                                        
                                        oObjectItem.selectionValueTotal = "";
                                        sModel.push(oObjectItem);
                                    }else{
                                        let oObjectPercentage = this._formatedPercentage(`${((aFirstInstallment / oTotalSimulate) * 100)}`);

                                        aIntermediaria.selectionPercentage         = oObjectPercentage.percentage;
                                        aIntermediaria.selectionPercentageFormated = oObjectPercentage.percentageFormated;
                                        aIntermediaria.selectionUnitaryValue       = this._formateValue(`${aFirstInstallment}`, undefined);//aIntermediaria.selectionTheAmount          = `${oDayIntermediate}/${oMonthIntermediate}/${oYearIntermediate}`;
                                    }
                                }else{
                                    if(aIntermediaria != undefined){
                                        for(let oItem of sModel){
                                            if(oItem.selectionValueTotal != "") oItemsPaymentCndts.push(oItem);
                                        }
                                    }

                                    /*let oDay   = String(new Date().getDate()).padStart(2, '0'),
                                        oMonth = String(Number(new Date().getMonth() + 1) + Number(oItemEnterprise.tableParms.intermediate)).padStart(2, '0'),
                                        oYear  = new Date().getFullYear();*/

                                    item.selectionTheAmount    = oTheAmount
                                    item.selectionUnitaryValue = this._formateValue(`${oValueUnit}`, "");
                                    item.selectionDueDate      = `${oDayIntermediate}/${oMonthIntermediate}/${oYearIntermediate}`;
                                    percentage                 = `${(oValueTotal / oTotalSimulate) * 100}`;
                                }
                            }else{
                                let aIntermediate = sModel.find(sItem => {
                                    if(sItem.selectionComponents === this.intermediate){
                                        if(sItem.selectionValueTotal === "") return sItem;
                                    }
                                })

                                if(aIntermediate != undefined){
                                    item.selectionDueDate      = aIntermediate.selectionDueDate;
                                    item.selectionUnitaryValue = item.selectionValueTotal;
                                }else{
                                    item.selectionUnitaryValue = item.selectionValueTotal;
                                }

                                item.selectionTheAmount = 1;

                                let oValueTotal = Number(this._clearFormattingValue(item.selectionValueTotal));

                                percentage = `${(oValueTotal / oTotalSimulate) * 100}`
                                
                                //Tira fora a parcela intermediaria que tem o valor total igual a vazio
                                for(let oItem of sModel){
                                    if(oItem.selectionValueTotal != "") oItemsPaymentCndts.push(oItem);
                                }
                            }
                            
                        }else {
                            item.selectionValueTotal = item.selectionUnitaryValue;
                            percentage = `${(valueUnitary / oTotalSimulate)* 100}`
                        }

                        
                        let oObject = this._formatedPercentage(percentage);

                        oPercentageFinal += oObject.percentage;

                        item.selectionPercentage         = oObject.percentage;
                        item.selectionPercentageFormated = oObject.percentageFormated;
                    }
                }
            }

            if(oItemsPaymentCndts.length != 0){
                sModel = oItemsPaymentCndts;
            }

            /*//verifico se tem intermediaria
            let aIntermediate = sModel.find(sItem => {
                if(sItem.selectionComponents === this.intermediate && 
                   sItem.selectionValueTotal != "") return sItem;
            });

            if(aIntermediate != undefined){
                oModelFinishProposal.selectionValueIntermediate = aIntermediate.selectionValueTotal;
            }*/

            let { oTotal, oItemsPaymentPlan } = this._fillOutPaymentPlan(sModel, oItemEnterprise);

            let aSumTotal = oTotal - oUnitValue;

            //se o valor da simulação for diferente do valor da avaliação, 
            //é colocado false para o botão de calcular a diferença
            for(let oItem of sModel){
                if(aSumTotal != 0){
                    if(oItem.selectionComponents === this.intermediate){
                        oItem.State.selectionDifference.Visible = false;
                    }else
                    if(oItem.selectionComponents === this.descendingMonthly){
                        oItem.State.selectionDifference.Visible = false;
                    }else{
                        oItem.State.selectionDifference.Visible = true;
                    }
                }else {
                    oItem.State.selectionDifference.Visible = false;
                }
            };

            //Coloca invisivel os campo de pano de pagamento e valor da intermediaria
            oModelFinishProposal.State.selectionValueIntermediate.Visible = false;
            oModelFinishProposal.State.selectionPaymentPlan.Visible       = false;

            //Verifica se tem intermediaria ou mensais para deixar o campo visivel
            sModel.map(sItem => {
                if(sItem.selectionComponents === this.intermediate){
                    oModelFinishProposal.State.selectionValueIntermediate.Visible = true;
                }else
                if(sItem.selectionComponents === this.adjustableMonthly ||
                   sItem.selectionComponents === this.fixedMonthly      ||
                   sItem.selectionComponents === this.descendingMonthly )
                {
                    oModelFinishProposal.State.selectionPaymentPlan.Visible = true;
                }
            });

            let oGuarantor = oModelInvolvedParties.items.find(sItem => {
                if(sItem.functionCode === "Z1") return sItem;
            });

            //Verifica se tem parcelas pró-chaves
            let oPortionProKey = oItemsPaymentPlan.find(sItem => {
                if(sItem.proKey != "-" && sItem.proKey != "" && sItem.proKey != "R$ 0,00") return sItem;
            });

            if(oGuarantor === undefined && oPortionProKey != undefined){
                this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr");

                let oModelProposedCalc    = this.getModel("proposedCalculation").getData(),
                    aFieldProposedCalc    = ["validationTitle", "validationText", "validationTextTwo", "validationTextThree"];

                //Limpa campos de aviso/erro de mensagem para o usuário
                aFieldProposedCalc.forEach(sField => {
                    oModelProposedCalc[sField]                  = "";
                    oModelProposedCalc.State[sField].ValueState = sap.ui.core.ValueState.None;
                    oModelProposedCalc.State[sField].Icon       = "";
                    oModelProposedCalc.State[sField].Visible    = false;
                });

                oModelProposedCalc.validationTitle                  = this.getResourceBundle().getText("messageWarningWithoutGuarantor");
                oModelProposedCalc.State.validationTitle.ValueState = sap.ui.core.ValueState.Warning;
                oModelProposedCalc.State.validationTitle.Icon       = "sap-icon://message-warning";
                oModelProposedCalc.State.validationTitle.Visible    = true;
                this.getModel("proposedCalculation").refresh(true);
            }else{
                let oModelProposedCalc    = this.getModel("proposedCalculation").getData();

                oModelProposedCalc.validationTitle                  = "";
                oModelProposedCalc.State.validationTitle.ValueState = sap.ui.core.ValueState.None;
                oModelProposedCalc.State.validationTitle.Icon       = "";
                oModelProposedCalc.State.validationTitle.Visible    = false;
                this.getModel("proposedCalculation").refresh(true);
            }

            this.getModel("paymentConditions").refresh(true);

            if(oItemsPaymentCndts.length != 0){
                this.getModel("paymentConditions").getData().items = oItemsPaymentCndts;
                this.getModel("paymentConditions").refresh(true);
            }
            
            oCalculationProposed.valueTotal = this._formateValue(`${oTotal}`, undefined);

            this.getModel("proposalEvaluation").getData().items[0].proposalValue = this._formateValue(`${oTotal}`, undefined);

            if(aSumTotal === 0){
                this.getModel("proposalEvaluation").getData().discountAdditionText      = this.getResourceBundle().getText("paymentConditionsDiscount");
                this.getModel("proposalEvaluation").getData().items[0].discountAddition = `R$ 0,00 (0,0000%)`;
            }else {
                let percentage        = `${(aSumTotal / oUnitValue)* 100}`,
                    oObjectPercentage = this._formatedPercentage(percentage);
                
                //Verifica se a subtração dos valores da a mais ou menor que o valor da unidade
                if(aSumTotal > 0){
                    this.getModel("proposalEvaluation").getData().discountAdditionText         = this.getResourceBundle().getText("paymentConditionsAddition");
                    this.getModel("proposalEvaluation").getData().items[0].discountAddition    = `${this._formateValue(`${aSumTotal}`, undefined)} (${oObjectPercentage.percentageFormated})`;
                }else {
                    this.getModel("proposalEvaluation").getData().discountAdditionText         = this.getResourceBundle().getText("paymentConditionsDiscount");
                    this.getModel("proposalEvaluation").getData().items[0].discountAddition    = `-${this._formateValue(`${aSumTotal}`, undefined)} (${oObjectPercentage.percentageFormated})`;
                }
            }

            this.getModel("proposedCalculation").refresh(true);
            this.getModel("paymentConditions").refresh(true);
            this.getModel("proposalEvaluation").refresh(true);
        },

        _calculationTimeCourse: function(oMonth, oYear, sValuerMonth) {
            let oMonthDay = new Date().getMonth() + 1 + sValuerMonth,
                oYearDay  = new Date().getFullYear();

            if(oMonth === oMonthDay && oYear === oYearDay){
                return 0;
            }else if(oMonth != oMonthDay && oYear === oYearDay){
                return Math.abs(oMonth - oMonthDay);
            }else {
                let oYearTimeCourse  = Math.abs((oYear - oYearDay) * 12),
                    oDateTimeCourse  = Math.abs(oYearTimeCourse - oMonthDay) + oMonth;
    
                return oDateTimeCourse;
            }
            
        },

        _searchCEP: async function(sNumberCEP, sHomeAddress){
            let oHomeAddress = await this.callServiceSearchCEP(`/${sNumberCEP}/json/?callback=cep`, sNumberCEP);

            if(oHomeAddress.cep != undefined){
                if(typeof(oHomeAddress) === 'object'){
                    sHomeAddress.CEP          = oHomeAddress.cep;
                    sHomeAddress.publicPlace  = oHomeAddress.logradouro;
                    sHomeAddress.number       = "";
                    sHomeAddress.complement   = oHomeAddress.complemento;
                    sHomeAddress.neighborhood = oHomeAddress.bairro;
                    sHomeAddress.county       = oHomeAddress.localidade;
                    sHomeAddress.UF           = oHomeAddress.uf;
                }else{
                    sHomeAddress.publicPlace  = "";
                    sHomeAddress.number       = "";
                    sHomeAddress.complement   = "";
                    sHomeAddress.neighborhood = "";
                    sHomeAddress.county       = "";
                    sHomeAddress.UF           = "";

                    MessageBox.warning(this.getResourceBundle().getText("messageWarningInvalidCEP"));
                }
            }else{
                sHomeAddress.publicPlace  = "";
                sHomeAddress.number       = "";
                sHomeAddress.complement   = "";
                sHomeAddress.neighborhood = "";
                sHomeAddress.county       = "";
                sHomeAddress.UF           = "";

                MessageBox.warning(this.getResourceBundle().getText("messageWarningInvalidCEP"));
            }
        },

        _formateCEP: function(sCEP) {
            let oCEP          = sCEP.replace("-", ""),
                fiveDigitsCep = oCEP.substring(0, 5),
                twoDigitsCep  = oCEP.substring(5, 8);
            
            return `${fiveDigitsCep}-${twoDigitsCep}`;
        },

        _formatePhone: function(sValue){
            let oValue = sValue.replace("+55", "").replace("(", "").replace(")", "").replace("-", "").replaceAll(" ", "");
            
            return this._ValidatedPhone(oValue);
        },

        _ValidatedPhone: function(sValue) {
            let r = sValue.replace(/\D/g, "");
            
            r = r.replace(/^0/, "");

            if (r.length > 10) {
              r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
            } else if (r.length > 5) {
              r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
            } else if (r.length > 2) {
              r = r.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
            } else {
              r = r.replace(/^(\d*)/, "($1");
            }
            return r;
        },

        _formatedPercentage: function(oPercentage){
            let percentage = oPercentage.replaceAll(".", ","),
                posintion  = percentage.indexOf(",");

            if(posintion === -1){
                let valuePercentage = `${percentage},0000%`

                return {
                    percentage:  Number(valuePercentage.replace(",", ".").replace("%", "")),
                    percentageFormated: valuePercentage
                }
            }else {
                let oForDigits = percentage.substring(posintion+1, posintion+5);

                if(oForDigits.length === 4){
                    let valuePercentage = `${percentage.substring(0, posintion+5)}%`

                    return {
                        percentage: Number(valuePercentage.replace(",", ".").replace("%", "")),
                        percentageFormated: valuePercentage
                    }
                }else if(oForDigits.length === 3){
                    let valuePercentage = `${percentage.substring(0, posintion+4)}0%`

                    return {
                        percentage: Number(valuePercentage.replace(",", ".").replace("%", "")),
                        percentageFormated: valuePercentage
                    }
                }else if(oForDigits.length === 2){
                    let valuePercentage = `${percentage.substring(0, posintion+3)}00%`

                    return {
                        percentage: Number(valuePercentage.replace(",", ".").replace("%", "")),
                        percentageFormated: valuePercentage
                    }
                }else{
                    let valuePercentage = `${percentage.substring(0, posintion+2)}000%`

                    return {
                        percentage: Number(valuePercentage.replace(",", ".").replace("%", "")),
                        percentageFormated: valuePercentage
                    }
                }
            }
        },

        _initGraphicSituation: function(){
            let libraries       = sap.ui.getVersionInfo().libraries || [];
            let bSuiteAvailable = libraries.some(function(lib){
                return lib.name.indexOf("sap.suite.ui.commons") > -1;
            });

            if (bSuiteAvailable) {
                jQuery.sap.require("sap/suite/ui/commons/ChartContainer");
                let vizframe = this.getView().byId("idVizFrame");
                let oChartContainerContent = new sap.suite.ui.commons.ChartContainerContent({
                    icon : "sap-icon://pie-chart",
                    title : "Informação",
                    content : [ vizframe ]
                });
                let oChartContainer = new sap.suite.ui.commons.ChartContainer({
                    content : [ oChartContainerContent ]
                });
                oChartContainer.setShowFullScreen(true);
                oChartContainer.setAutoAdjustHeight(true);
                oChartContainer.setShowZoom(false);
                this.getView().byId('graphicPaymentPlan').setFlexContent(oChartContainer);
            }

            this.getView().byId("idVizFrame").setVizProperties({
                plotArea: {
                    dataLabel: {
                        visible: true
                    }
                },

                title: {
                    text: this.getResourceBundle().getText("graphicPaymentPlanTitle")
                }
            });
        },

        customEmailType: SimpleType.extend("Email", {
            formatValue: function (oValue) {
                return oValue;
            },

            parseValue: function (oValue) {
                return oValue;
            },

            validateValue: function (oValue) {
                var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
                if (!oValue.match(rexMail)) {
                    throw new sap.ui.model.ValidateException("'" + oValue + "' não é um e-mail válido");
                }
            }
        }),

        _formateCPF: function(sValue){
            if(sValue.length > 10){
                sValue = sValue.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
            }else if(sValue.length > 7){
                sValue = sValue.replace(/^(\d{3})(\d{3})(\d{0,4}).*/, "$1.$2.$3");
            }else if(sValue.length > 4){
                sValue = sValue.replace(/^(\d{3})(\d{0,5})/, "$1.$2");
            }

            return sValue;
        },

        _formateCNPJ: function(sValue){
            //00.000.000/0000-00
            if(sValue.length > 12){
                sValue = sValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*/, "$1.$2.$3/$4-$5");
            }else if(sValue.length > 8){
                sValue = sValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4}).*/, "$1.$2.$3/$4");
            }else if(sValue.length > 5){
                sValue = sValue.replace(/^(\d{2})(\d{3})(\d{0,3}).*/, "$1.$2.$3");
            }else if(sValue.length > 2){
                sValue = sValue.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
            }
            return sValue;
        },

        _additionalDataPhysicalPerson: function(oVisible) {
            this.byId("requiredDataPartFisica").setVisible(oVisible);
            this.byId("AdditionalDataPhysicalPerson01").setVisible(oVisible);
            this.byId("AdditionalDataPhysicalPerson02").setVisible(oVisible);
            this.byId("physicalPerson").setVisible(oVisible);
            this.byId("physicalPersonProportion").setVisible(oVisible);
            this.byId("physicalPersonMainBuyer").setVisible(oVisible);
        },

        _additionalDataLegalPerson: function(oVisible) {
            this.byId("additionalDataPartJuridica").setVisible(oVisible);
            this.byId("additionalDataLegalPerson").setVisible(oVisible);
            this.byId("additionalDataLegalPerson").setVisible(oVisible);
            this.byId("legalPerson").setVisible(oVisible);
            this.byId("legalPersonContact").setVisible(oVisible);
            this.byId("legalPersonProportion").setVisible(oVisible);
            this.byId("legalPersonMainBuyer").setVisible(oVisible);
        },

        _removeRowInTable: function(sKey){
            let oItems     = this.getModel("paymentConditions").getData().items,
                oComponent = "";

            this.getModel("paymentConditions").getData().items = [];
            this.getModel("paymentConditions").refresh(true);

            for(let oItem of oItems){ 
                if(oItem.key != sKey){
                    this.getModel("paymentConditions").getData().items.push(oItem);
                }else{
                    oComponent = oItem.selectionComponents
                }
            }

            this.getModel("paymentConditions").refresh(true);

            if(oComponent === this.intermediate){
                oItems = this.getModel("paymentConditions").getData().items;

                this.getModel("paymentConditions").getData().items = [];

                for(let oItem of oItems){
                    if(oItem.selectionComponents != oComponent){
                        this.getModel("paymentConditions").getData().items.push(oItem);
                    }
                }
            }

            this.getModel("paymentConditions").refresh(true);

            return oComponent;
        },

        _addRemoveComponents: function(sComponent, sAddRemove){
            let oItemsComponents = this.getModel("componentsValues").getData().items;

            if(sAddRemove === "remove"){
                this.getModel("componentsValues").getData().items = [];

                for(let oItem of oItemsComponents){
                    if(oItem.key != sComponent){
                        this.getModel("componentsValues").getData().items.push(oItem);
                    }
                }
            }else {
                this.getModel("componentsValues").getData().items.push(this._i18nComponents[sComponent]);
            }

            this.getModel("componentsValues").refresh(true);
        },

        _addComponentAccordingToSalesTable: function(sModelPaymentCndts, sComponent){
            let oModelEnterprises  = this.getModel("enterprises").getData(),
                oSBPEValue         = Number(this._clearFormattingValue(oModelEnterprises.items[0].SBPEValue)),
                oCVAValue          = Number(this._clearFormattingValue(oModelEnterprises.items[0].CVAValue)),
                oTableValue        = Number(this._clearFormattingValue(oModelEnterprises.items[0].tableValue));

             // -------------------- Financiada ------------------------
            if(sModelPaymentCndts.selectionSaleForm === "Z01"){
                if(sModelPaymentCndts.selectionPurchaseMethod === "1"){
                    this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValue}`, undefined);
                    this.getModel("proposalEvaluation").refresh(true);

                    oModelEnterprises.tableVisible = false;
                    oModelEnterprises.tetoVisible  = true;
                    this.getModel("enterprises").refresh(true);

                    this._addRowInTable(sComponent, sModelPaymentCndts.items, oSBPEValue, oTableValue, "SBPE");
                }else{
                    let oTableValueTeto = Number(this._clearFormattingValue(oModelEnterprises.items[0].tableValueTetoCVA));

                    this.getModel("proposalEvaluation").getData().items[0].unitValue = this._formateValue(`${oTableValueTeto}`, undefined);
                    this.getModel("proposalEvaluation").refresh(true);

                    oModelEnterprises.tableVisible = false;
                    oModelEnterprises.tetoVisible  = true;
                    this.getModel("enterprises").refresh(true);

                    this._addRowInTable(sComponent, sModelPaymentCndts.items, oCVAValue, oTableValueTeto, "CVA");
                }
            }else // ----------------- Direta --------------------------
            if(sModelPaymentCndts.selectionSaleForm === "Z02"){
                this._addRowInTable(sComponent, sModelPaymentCndts.items, oSBPEValue, oTableValue, "Direct");
                
            }else // ----------------- À vista -------------------------
            if(sModelPaymentCndts.selectionSaleForm === "Z03"){
                let oPercentageDiscount = oModelEnterprises.tableParms.discountInCash,
                    oValueDiscount      = oTableValue * oPercentageDiscount.percentageCalculo,
                    oNetValueInCash     = oTableValue - oValueDiscount;

                this._addRowInTable(sComponent, sModelPaymentCndts.items, oNetValueInCash, oTableValue, "InCash");
                
            }else // ------------------ FGTS ---------------------------
            if(sModelPaymentCndts.selectionSaleForm === "Z04"){ 
                this._addRowInTable(sComponent, sModelPaymentCndts.items, oSBPEValue, oTableValue, this.FGTS);
            }

            this.byId("components").setSelectedKey("");

            let oItemsCdtns = this.getModel("paymentConditions").getData().items;

            this._calculationProposed(oItemsCdtns, "");

            let oSelectedValidation = this.getModel("finishProposal").getData().viewTable.selectionAutomaticValidation;
                    
            if(oSelectedValidation){
                this._validationProposal();
            }
        },

        _addRowInTable: function(sComponent, sModel, sNetValue, sTableValue, sSaleForm) {
            let oItemsInvolvedParties  = this.getModel("involvedParties").getData().items,
                aKey                   = Math.random(),
                bValid                 = true,
                oObject;
            
            let oMaximumInstallmentPro = this._searchProponentIncomeMaximumInstallmentPro(sComponent, oItemsInvolvedParties);
            
            if(sModel.length != 0){
                let oItem = sModel.find(sItem => {
                    if(sItem === undefined){
                        return undefined;
                    }else {
                        if(sItem.selectionComponents === sComponent){
                            if(sItem.selectionComponents === this.adjustableMonthly ||
                               sItem.selectionComponents === this.fixedMonthly ||
                               sItem.selectionComponents === this.descendingMonthly) 
                            {
                                return undefined;
                            }
                            
                            return sItem;
                        }
                    }
                });

                if(oItem === undefined){
                   oObject = this._createObjectItem(sComponent, aKey, sNetValue, sTableValue, sSaleForm, oMaximumInstallmentPro);
                }else{
                    //Message de aviso, avisando que já existe esse component na tabela
                    bValid = false;
                    MessageToast.show(this.getResourceBundle().getText("paymentConditionsMessageWarning", [sComponent]));
                }
            }else {
                oObject = this._createObjectItem(sComponent, aKey, sNetValue, sTableValue, sSaleForm, oMaximumInstallmentPro);
            }

            if(bValid){
                this._orderComponentsInPaymentConditions(sComponent, sModel, oObject);
            }
            
            
            if(sComponent != this.adjustableMonthly && 
               sComponent != this.fixedMonthly          &&
               sComponent != this.descendingMonthly){
                //Remove o componente da lista para mostrar só os que não foram selecionado
                this._addRemoveComponents(sComponent, "remove");
            }
        },

        _orderComponentsInPaymentConditions: function(sComponent, sModel, sObject){
            switch (sComponent) {
                case this.signal:
                    sModel.splice(0, 0, sObject);
                    break;

                case this.discountSale:
                    let oIndexDV = this._findTheComponentIndex(this.signal, sModel);

                    if(oIndexDV === -1) sModel.splice(0, 0, sObject);
                    else sModel.splice(oIndexDV + 1, 0, sObject);
                    break;
                    
                case this.deliveryKeys:
                    let oIndexEC = this._findTheComponentIndex(this.signal, sModel);

                    if(oIndexEC === -1) {
                        let oIndexEC = this._findTheComponentIndex(this.discountSale, sModel);

                        if(oIndexEC != -1) sModel.splice(oIndexDV + 1, 0, sObject);
                        else sModel.splice(0, 0, sObject);
                    }
                    else sModel.splice(oIndexEC + 1, 0, sObject);
                    break;
                
                case this.adjustableMonthly:
                    let oIndexMR = this._findTheComponentIndex(this.adjustableMonthly, sModel);

                    if(oIndexMR === -1){
                        oIndexMR = this._findTheComponentIndex(this.deliveryKeys, sModel);

                        if(oIndexMR === -1){
                            oIndexMR = this._findTheComponentIndex(this.discountSale, sModel);

                            if(oIndexMR === -1){
                                oIndexMR = this._findTheComponentIndex(this.signal, sModel);

                                if(oIndexMR != -1) sModel.splice(oIndexMR + 1, 0, sObject);
                                else sModel.splice(0, 0, sObject); 
                            }
                            else sModel.splice(oIndexMR + 1, 0, sObject);
                        }
                        else sModel.splice(oIndexMR + 1, 0, sObject);
                    }
                    else sModel.splice(oIndexMR + 1, 0, sObject);
                    break;
                    
                case this.fixedMonthly:
                    let oIndexMF = this._findTheComponentIndex(this.fixedMonthly, sModel);

                    if(oIndexMF === -1){
                        oIndexMF = this._findTheComponentIndex(this.adjustableMonthly, sModel);

                        if(oIndexMF === -1){
                            oIndexMF = this._findTheComponentIndex(this.deliveryKeys, sModel);

                            if(oIndexMF === -1){
                                oIndexMF = this._findTheComponentIndex(this.discountSale, sModel);

                                if(oIndexMF === -1){
                                    oIndexMF = this._findTheComponentIndex(this.signal, sModel);

                                    if(oIndexMF != -1) sModel.splice(oIndexMF + 1, 0, sObject);
                                    else sModel.splice(0, 0, sObject); 
                                }
                                else sModel.splice(oIndexMF + 1, 0, sObject);
                            }
                            else sModel.splice(oIndexMF + 1, 0, sObject);
                        }
                        else sModel.splice(oIndexMF + 1, 0, sObject);
                    }
                    else sModel.splice(oIndexMF + 1, 0, sObject);
                    break;
                case this.descendingMonthly:
                    let oIndexMD = this._findTheComponentIndex(this.descendingMonthly, sModel);

                    if(oIndexMD === -1){
                        oIndexMD = this._findTheComponentIndex(this.fixedMonthly, sModel);

                        if(oIndexMD === -1){
                            oIndexMD = this._findTheComponentIndex(this.adjustableMonthly, sModel);

                            if(oIndexMD === -1){
                                oIndexMD = this._findTheComponentIndex(this.deliveryKeys, sModel);

                                if(oIndexMD === -1){
                                    oIndexMD = this._findTheComponentIndex(this.discountSale, sModel);

                                    if(oIndexMD === -1){
                                        oIndexMD = this._findTheComponentIndex(this.signal, sModel);

                                        if(oIndexMD != -1) sModel.splice(oIndexMD + 1, 0, sObject);
                                        else sModel.splice(0, 0, sObject); 
                                    }
                                    else sModel.splice(oIndexMD + 1, 0, sObject);
                                }
                                else sModel.splice(oIndexMD + 1, 0, sObject);
                            }
                            else sModel.splice(oIndexMD + 1, 0, sObject);
                        }
                        else sModel.splice(oIndexMD + 1, 0, sObject);
                    }
                    else sModel.splice(oIndexMD + 1, 0, sObject);
                    break;
                
                case this.FGTS:
                    let oIndexFGTS = this._findTheComponentIndex(this.descendingMonthly, sModel);
                    
                    if(oIndexFGTS === -1){
                        oIndexFGTS = this._findTheComponentIndex(this.fixedMonthly, sModel);
                    
                        if(oIndexFGTS === -1){
                            oIndexFGTS = this._findTheComponentIndex(this.adjustableMonthly, sModel);
                            
                            if(oIndexFGTS === -1){
                                oIndexFGTS = this._findTheComponentIndex(this.deliveryKeys, sModel);

                                if(oIndexFGTS === -1){
                                    oIndexFGTS = this._findTheComponentIndex(this.discountSale, sModel);
                                    
                                    if(oIndexFGTS === -1){
                                        oIndexFGTS = this._findTheComponentIndex(this.signal, sModel);

                                        if(oIndexFGTS != -1) sModel.splice(oIndexFGTS + 1, 0, sObject);
                                        else sModel.splice(0, 0, sObject);

                                    }
                                    else sModel.splice(oIndexFGTS + 1, 0, sObject);
                                }
                                else sModel.splice(oIndexFGTS + 1, 0, sObject);
                            }
                            else sModel.splice(oIndexFGTS + 1, 0, sObject);
                        }
                        else sModel.splice(oIndexFGTS + 1, 0, sObject);
                    }
                    else sModel.splice(oIndexFGTS + 1, 0, sObject);
                    break;

                case this.CEF:
                    let oIndexFCEF = this._findTheComponentIndex(this.FGTS, sModel);
                    
                    if(oIndexFCEF === -1){
                        oIndexFCEF = this._findTheComponentIndex(this.descendingMonthly, sModel);

                        if(oIndexFCEF === -1){
                            oIndexFCEF = this._findTheComponentIndex(this.fixedMonthly, sModel);

                            if(oIndexFCEF === -1){
                                oIndexFCEF = this._findTheComponentIndex(this.adjustableMonthly, sModel);

                                if(oIndexFCEF === -1){
                                    oIndexFCEF = this._findTheComponentIndex(this.deliveryKeys, sModel);
        
                                    if(oIndexFCEF === -1){
                                        oIndexFCEF = this._findTheComponentIndex(this.discountSale, sModel);

                                        if(oIndexFCEF === -1){
                                            oIndexFCEF = this._findTheComponentIndex(this.signal, sModel);

                                            if(oIndexFCEF != -1) sModel.splice(oIndexFCEF + 1, 0, sObject);
                                            else sModel.splice(0, 0, sObject);
                                        } 
                                        else sModel.splice(oIndexFCEF + 1, 0, sObject);
                                    } 
                                    else sModel.splice(oIndexFCEF + 1, 0, sObject);
                                } 
                                else sModel.splice(oIndexFCEF + 1, 0, sObject);
                            }
                            else sModel.splice(oIndexFCEF + 1, 0, sObject);
                        }
                        else sModel.splice(oIndexFCEF + 1, 0, sObject);
                    }
                    else sModel.splice(oIndexFCEF + 1, 0, sObject);
                    break;

                case this.subsidy:
                    let oIndexS = this._findTheComponentIndex(this.CEF, sModel);
                    
                    if(oIndexS === -1){
                        oIndexS = this._findTheComponentIndex(this.FGTS, sModel);
                        if(oIndexS === -1){
                            oIndexS = this._findTheComponentIndex(this.descendingMonthly, sModel);

                            if(oIndexS === -1){
                                oIndexS = this._findTheComponentIndex(this.fixedMonthly, sModel);

                                if(oIndexS === -1){
                                    oIndexS = this._findTheComponentIndex(this.adjustableMonthly, sModel);

                                    if(oIndexS === -1){
                                        oIndexS = this._findTheComponentIndex(this.deliveryKeys, sModel);
            
                                        if(oIndexS === -1){
                                            oIndexS = this._findTheComponentIndex(this.discountSale, sModel);

                                            if(oIndexS === -1){
                                                oIndexS = this._findTheComponentIndex(this.signal, sModel);

                                                if(oIndexS != -1) sModel.splice(oIndexS + 1, 0, sObject);
                                                else sModel.splice(0, 0, sObject); 
                                            }
                                            else sModel.splice(oIndexS + 1, 0, sObject);
                                        }
                                        else sModel.splice(oIndexS + 1, 0, sObject);
                                    }
                                    else sModel.splice(oIndexS + 1, 0, sObject);
                                }
                                else sModel.splice(oIndexS + 1, 0, sObject);
                            }
                            else sModel.splice(oIndexS + 1, 0, sObject);
                        }
                        else sModel.splice(oIndexS + 1, 0, sObject);
                    }
                    else sModel.splice(oIndexS + 1, 0, sObject);
                    break;

                case this.intermediate:
                    let oIndexI = this._findTheComponentIndex(this.subsidy, sModel);
                    
                    if(oIndexI === -1){
                        oIndexI = this._findTheComponentIndex(this.CEF, sModel);
                    
                        if(oIndexI === -1){
                            oIndexI = this._findTheComponentIndex(this.FGTS, sModel);

                            if(oIndexI === -1){
                                oIndexI = this._findTheComponentIndex(this.descendingMonthly, sModel);

                                if(oIndexI === -1){
                                    oIndexI = this._findTheComponentIndex(this.fixedMonthly, sModel);

                                    if(oIndexI === -1){
                                        oIndexI = this._findTheComponentIndex(this.adjustableMonthly, sModel);

                                        if(oIndexI === -1){
                                            oIndexI = this._findTheComponentIndex(this.deliveryKeys, sModel);
                
                                            if(oIndexI === -1){
                                                oIndexI = this._findTheComponentIndex(this.discountSale, sModel);
                                                
                                                if(oIndexI === -1){
                                                    oIndexI = this._findTheComponentIndex(this.signal, sModel);

                                                    if(oIndexI != -1) sModel.splice(oIndexI + 1, 0, sObject);
                                                    else sModel.splice(0, 0, sObject); 
                                                }
                                                else sModel.splice(oIndexI + 1, 0, sObject);
                                            }
                                            else sModel.splice(oIndexI + 1, 0, sObject);
                                        }
                                        else sModel.splice(oIndexI + 1, 0, sObject);
                                    }
                                    else sModel.splice(oIndexI + 1, 0, sObject);
                                }
                                else sModel.splice(oIndexI + 1, 0, sObject);
                            }
                            else sModel.splice(oIndexI + 1, 0, sObject);
                        }
                        else sModel.splice(oIndexI + 1, 0, sObject);
                    }
                    else sModel.splice(oIndexI + 1, 0, sObject);
                    
                    break;
                default:
                    sModel.push(sObject);
                    break;
            }               

            this.getModel("paymentConditions").refresh(true);
        },

        _findTheComponentIndex: function(sComponent, sModel){
            let oIndex = -1

            for(let i=0; i < sModel.length; i++){
                if(sModel[i].selectionComponents === sComponent) oIndex = i;
            }

            return oIndex;
        },

        _createObjectItem: function(sComponent, sKey, sNetValue, sTableValue, sSaleForm, sIncome){
            let oItemEnterprise = this.getModel("enterprises").getData().items[0],
                oUnitValue      = Number(sNetValue),
                oAmount         = Number(sTableValue),
                dayDate         = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "dd/MM/yyyy",
                    UTC: false
                }).format(new Date()),
                oObjectPercentage,
                oObject,
                dueDate,
                oMonth,
                oUnitaryValue,
                oMonthDeliveryDate,
                oYearDeliveryDate,
                aQntdMonth,
                oDay,
                numMonth,
                numYear,
                numDays,
                oPosition;

            if(sComponent === this.signal){
                oDay     = Number(dayDate.substring(0, 2)) + 2;
                numMonth = Number(dayDate.substring(3, 5));
                numYear  = Number(dayDate.substring(6, 10));
                numDays  = new Date(numYear, numMonth, 0).getDate();
                       
                if(oDay > numDays){
                    let oResultDay   = oDay - numDays,
                        oResultMonth = oDay / numDays,
                        position     = `${oResultMonth}`.indexOf(".");
                        
                    if(position != -1){
                        oMonth = numMonth + Number(`${oResultMonth}`.substring(0, position));
                    }else {
                        oMonth = oResultMonth;
                    }
                        
                    if(oMonth > 12){
                        let objDate = this._ajustDate(oMonth, Number(dayDate.substring(6, 10)), 12);

                        dueDate = `${String(oResultDay).padStart(2, '0')}/${objDate.numberA}/${objDate.numberB}`;
                    }else {
                        dueDate = `${String(oResultDay).padStart(2, '0')}/${String(oMonth).padStart(2, '0')}/${dayDate.substring(6, 10)}`;
                    }
                }else {
                    dueDate = `${String(oDay).padStart(2, '0')}/${dayDate.substring(3, 5)}/${dayDate.substring(6, 10)}`;
                }


                if(sSaleForm === "Direct"){
                    let oPercentageDirect = Number(`${(oItemEnterprise.tableParms.signal.percentageCalculo    +
                                                       oItemEnterprise.tableParms.FGTS.percentageCalculo      + 
                                                       oItemEnterprise.tableParms.financing.percentageCalculo +
                                                       oItemEnterprise.tableParms.subsidy.percentageCalculo)}`.substring(0, 4));
                                                 
                    oUnitaryValue = oUnitValue * oPercentageDirect;

                    oObjectPercentage = this._formatedPercentage(`${oPercentageDirect}`);
                }else if(sSaleForm === "InCash"){
                    let oPercentageDirect = Number(`${(oItemEnterprise.tableParms.signal.percentageCalculo    +
                                                       oItemEnterprise.tableParms.FGTS.percentageCalculo      + 
                                                       oItemEnterprise.tableParms.financing.percentageCalculo +
                                                       oItemEnterprise.tableParms.subsidy.percentageCalculo   +
                                                       oItemEnterprise.tableParms.readjustableTable.percentageCalculo)}`.substring(0, 4));
                                                 
                    oUnitaryValue = oUnitValue * oPercentageDirect;

                    oObjectPercentage = this._formatedPercentage(`${oPercentageDirect}`);
                }else if(sSaleForm === this.FGTS){
                    let oPercentageDirect = Number(`${(oItemEnterprise.tableParms.signal.percentageCalculo     + 
                                                       oItemEnterprise.tableParms.financing.percentageCalculo +
                                                       oItemEnterprise.tableParms.subsidy.percentageCalculo)}`.substring(0, 4));
                                                 
                    oUnitaryValue     = oUnitValue * oPercentageDirect;
                    oObjectPercentage = this._formatedPercentage(`${oPercentageDirect}`);
                }else{
                    oUnitaryValue     = oUnitValue * oItemEnterprise.tableParms.signal.percentageCalculo;
                    oObjectPercentage = this._formatedPercentage(`${oItemEnterprise.tableParms.signal.percentageCalculo}`);
                }
                    
                oObject = {
                    codComponent: "1",
                    dueDate: dueDate,
                    deadline: dueDate,
                    unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                    theAmount: 1,
                    State: {
                        buttonRemove: {
                            Visible: false
                        },
                        theAmount: {
                            Enabled: false,
                        },
                        valueTotal: {
                            Enabled: false,
                        },
                        dueDate: {
                            Enabled: true,
                        },
                        unitaryValue: {
                            Enabled: true,
                        }
                    }
                }
            }else if(sComponent === this.discountSale){
                oDay     = Number(dayDate.substring(0, 2)) + 2;
                numMonth = Number(dayDate.substring(3, 5));
                numYear  = Number(dayDate.substring(6, 10));
                numDays  = new Date(numYear, numMonth, 0).getDate();
                       
                if(oDay > numDays){
                    let oResultDay   = oDay - numDays,
                        oResultMonth = oDay / numDays,
                        position     = `${oResultMonth}`.indexOf(".");
                        
                    if(position != -1){
                        oMonth = numMonth + Number(`${oResultMonth}`.substring(0, position));
                    }else {
                        oMonth = oResultMonth;
                    }
                        
                    if(oMonth > 12){
                        let objDate = this._ajustDate(oMonth, Number(dayDate.substring(6, 10)), 12);

                        dueDate = `${String(oResultDay).padStart(2, '0')}/${objDate.numberA}/${objDate.numberB}`;
                    }else{
                        dueDate = `${String(oResultDay).padStart(2, '0')}/${String(oMonth).padStart(2, '0')}/${dayDate.substring(6, 10)}`;
                    }
                }else {
                    dueDate = `${String(oDay).padStart(2, '0')}/${dayDate.substring(3, 5)}/${dayDate.substring(6, 10)}`;
                }

                if(sSaleForm === "InCash"){
                    if(oAmount > oUnitValue){
                        let oResult   = oAmount - oUnitValue,
                            oPosition = `${oResult}`.indexOf(".");
                            
                        if(oPosition != -1){
                            oUnitaryValue = Number(`${oResult}`.substring(0, oPosition)); 
                        }else{
                            oUnitaryValue = oResult;
                        }
                    }else{
                        oUnitaryValue = ""
                    }

                    oObjectPercentage = this._formatedPercentage(`${oItemEnterprise.tableParms.discountInCash.percentageCalculo}`);
                }else {
                        oObjectPercentage = {
                        percentage: 0,
                        percentageFormated: ""
                    }
                }
                
                oObject = {
                    codComponent: "899",
                    dueDate: dueDate,
                    deadline: dueDate,
                    unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                    theAmount: 1,
                    State: {
                        buttonRemove: {
                            Visible: true
                        },
                        theAmount: {
                            Enabled: false,
                        },
                        valueTotal: {
                            Enabled: false,
                        },
                        dueDate: {
                            Enabled: true,
                        },
                        unitaryValue: {
                            Enabled: true,
                        }
                    }
                }
            }else if(sComponent === this.deliveryKeys){
                oObjectPercentage = {
                    percentage: 0,
                    percentageFormated: ""
                }

                oObject = {
                    codComponent: "61",
                    dueDate: oItemEnterprise.estimatedDeliveryDate,
                    deadline: oItemEnterprise.estimatedDeliveryDate,
                    unitaryValue: "",
                    theAmount: "1",
                    State: {
                        buttonRemove: {
                            Visible: true
                        },
                        theAmount: {
                            Enabled: true,
                        },
                        valueTotal: {
                            Enabled: false,
                        },
                        dueDate: {
                            Enabled: true,
                        },
                        unitaryValue: {
                            Enabled: true,
                        }
                    }
                }
            }else if(sComponent === this.FGTS){
                oUnitaryValue     = oUnitValue * oItemEnterprise.tableParms.FGTS.percentageCalculo;
                oObjectPercentage = this._formatedPercentage(`${oItemEnterprise.tableParms.FGTS.percentageCalculo}`);
                    
                oObject = {
                    codComponent: "62",
                    dueDate: oItemEnterprise.estimatedDeliveryDate,
                    deadline: oItemEnterprise.estimatedDeliveryDate,
                    unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                    theAmount: 1,
                    State: {
                        buttonRemove: {
                            Visible: true
                        },
                        theAmount: {
                            Enabled: false,
                        },
                        valueTotal: {
                            Enabled: false,
                        },
                        dueDate: {
                            Enabled: false,
                        },
                        unitaryValue: {
                            Enabled: true,
                        }
                    }  
                } 
            }else if(sComponent === this.CEF){
                if(sSaleForm === "SBPE"){
                    oUnitaryValue = (oUnitValue * (oItemEnterprise.tableParms.financing.percentageCalculo + oItemEnterprise.tableParms.subsidy.percentageCalculo));
                }else{
                    oUnitaryValue = oUnitValue * oItemEnterprise.tableParms.financing.percentageCalculo;
                }

                oPosition = `${oUnitaryValue}`.indexOf(".");

                if(oPosition != -1){
                    oUnitaryValue = `${oUnitaryValue}`.substring(0, oPosition);
                }

                oObjectPercentage = this._formatedPercentage(`${oItemEnterprise.tableParms.financing.percentageCalculo}`);

                oObject = {
                    codComponent: "500",
                    dueDate: oItemEnterprise.estimatedDeliveryDate,
                    deadline: oItemEnterprise.estimatedDeliveryDate,
                    unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                    theAmount: 1,
                    State: {
                        buttonRemove: {
                            Visible: true
                        },
                        theAmount: {
                            Enabled: false,
                        },
                        valueTotal: {
                            Enabled: false,
                        },
                        dueDate: {
                            Enabled: false,
                        },
                        unitaryValue: {
                            Enabled: true,
                        }
                    }
                }
            }else if(sComponent === this.subsidy){
                oUnitaryValue     = oUnitValue * oItemEnterprise.tableParms.subsidy.percentageCalculo;
                oObjectPercentage = this._formatedPercentage(`${oItemEnterprise.tableParms.subsidy.percentageCalculo}`);

                oObject = {
                    codComponent: "55",
                    dueDate: oItemEnterprise.estimatedDeliveryDate,
                    deadline: oItemEnterprise.estimatedDeliveryDate,
                    unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                    theAmount: 1,
                    State: {
                        buttonRemove: {
                            Visible: true
                        },
                        theAmount: {
                            Enabled: false,
                        },
                        valueTotal: {
                            Enabled: false,
                        },
                        dueDate: {
                            Enabled: false,
                        },
                        unitaryValue: {
                            Enabled: true,
                        }
                    }
                }
            }else 
            if(sComponent === this.adjustableMonthly ||
               sComponent === this.fixedMonthly      ||
               sComponent === this.descendingMonthly)
            {
                let oMontActual = Number(dayDate.substring(3, 5));

                oMonthDeliveryDate = Number(oItemEnterprise.estimatedDeliveryDate.substring(3, 5));
                oYearDeliveryDate  = Number(oItemEnterprise.estimatedDeliveryDate.substring(6, 10));

                if(oMontActual <= oMonthDeliveryDate){
                    aQntdMonth = this._calculationTimeCourse(oMonthDeliveryDate, oYearDeliveryDate, 1);
                }else aQntdMonth = 1;

               
                oMonth = Number(dayDate.substring(3, 5)) + 1;
                    
                let maximumNumberInstallments = oItemEnterprise.maximumNumberInstallments,
                    aQntdMonthFinish          = aQntdMonth > maximumNumberInstallments ? maximumNumberInstallments : aQntdMonth < 1 ? 1 : aQntdMonth;

                if(oMonth > 12){
                    let objDate = this._ajustDate(oMonth, Number(dayDate.substring(6, 10)), 12);

                    dueDate = `${dayDate.substring(0, 2)}/${objDate.numberA}/${objDate.numberB}`;
                }else{
                    dueDate = `${dayDate.substring(0, 2)}/${String(oMonth).padStart(2, '0')}/${dayDate.substring(6, 10)}`;
                }

                //Mensa - Reajustável
                if(sComponent === this.adjustableMonthly){
                    let oValueTotal   = oUnitValue * oItemEnterprise.tableParms.readjustableTable.percentageCalculo;

                    oObjectPercentage = this._formatedPercentage(`${oItemEnterprise.tableParms.readjustableTable.percentageCalculo}`);                    
                    oUnitaryValue     = oValueTotal / aQntdMonthFinish;
                    oPosition         = `${oUnitaryValue}`.indexOf(".");

                    if(oPosition != -1) oUnitaryValue = Number(`${oUnitaryValue}`.substring(0, 6));

                    oObject = {
                        codComponent: "34",
                        dueDate: dueDate,
                        deadline: oItemEnterprise.estimatedDeliveryDate,
                        unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                        theAmount: aQntdMonthFinish,
                        oValueTotal: this._formateValue(`${oValueTotal}`, undefined),
                        State: {
                            buttonRemove: {
                                Visible: true
                            },
                            theAmount: {
                                Enabled: true,
                            },
                            valueTotal: {
                                Enabled: false,
                            },
                            dueDate: {
                                Enabled: true,
                            },
                            unitaryValue: {
                                Enabled: true,
                            }
                        }
                    }
                }else //Mensal Fixa
                if(sComponent === this.fixedMonthly){
                    let oValueTotal   = oUnitValue * oItemEnterprise.tableParms.readjustableTable.percentageCalculo;

                    oObjectPercentage = this._formatedPercentage(`${oItemEnterprise.tableParms.readjustableTable.percentageCalculo}`);                    
                    oUnitaryValue     = oValueTotal / aQntdMonthFinish;
                    oPosition         = `${oUnitaryValue}`.indexOf(".");

                    if(oPosition != -1) oUnitaryValue = Number(`${oUnitaryValue}`.substring(0, 6));

                    oObject = {
                        codComponent: "2",
                        dueDate: dueDate,
                        deadline: oItemEnterprise.estimatedDeliveryDate,
                        unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                        theAmount: aQntdMonthFinish,
                        oValueTotal: this._formateValue(`${oValueTotal}`, undefined),
                        State: {
                            buttonRemove: {
                                Visible: true
                            },
                            theAmount: {
                                Enabled: true,
                            },
                            valueTotal: {
                                Enabled: false,
                            },
                            dueDate: {
                                Enabled: true,
                            },
                            unitaryValue: {
                                Enabled: true,
                            }
                        }
                    }
                }else //Mensal Decrescente - Reajustável
                if(sComponent === this.descendingMonthly){
                    oObjectPercentage = {
                        percentage: 0,
                        percentageFormated: ""
                    }

                    oObject = {
                        codComponent: "44",
                        dueDate: dueDate,
                        deadline: oItemEnterprise.estimatedDeliveryDate,
                        unitaryValue: this._formateValue(`${sIncome}`, undefined),
                        theAmount: aQntdMonthFinish,
                        oValueTotal: "",
                        State: {
                            buttonRemove: {
                                Visible: true
                            },
                            theAmount: {
                                Enabled: true,
                            },
                            valueTotal: {
                                Enabled: false,
                            },
                            dueDate: {
                                Enabled: true,
                            },
                            unitaryValue: {
                                Enabled: true,
                            }
                        }
                    }
                }
            }else{
                let oMontActual = Number(dayDate.substring(3, 5));

                oMonthDeliveryDate = Number(oItemEnterprise.estimatedDeliveryDate.substring(3, 5));
                oYearDeliveryDate  = Number(oItemEnterprise.estimatedDeliveryDate.substring(6, 10));

                if(oMontActual <= oMonthDeliveryDate){
                    aQntdMonth = this._calculationTimeCourse(oMonthDeliveryDate, oYearDeliveryDate, Number(oItemEnterprise.tableParms.intermediate));
                }else aQntdMonth = 1;

                let oMaximumNumberInstallments = oItemEnterprise.maximumNumberInstallments,
                    aQntdMonthFinishInter      = aQntdMonth > oMaximumNumberInstallments ? oMaximumNumberInstallments : aQntdMonth;

                oMonth = Number(dayDate.substring(3, 5)) + oItemEnterprise.tableParms.intermediate;

                if(oMonth > 12){
                    let objDate = this._ajustDate(oMonth, Number(dayDate.substring(6, 10)), 12);

                    /*
                    dayDate.substring(0, 2)
                    dayDate.substring(0, 2)
                    */

                    dueDate = `25/${objDate.numberA}/${objDate.numberB}`;
                }else{
                    dueDate = `25/${String(oMonth).padStart(2, '0')}/${dayDate.substring(6, 10)}`;
                }

                //calcula a quantidade de parcelas do dia atual até a entrega do empreendimento
                let aQntdResult = aQntdMonthFinishInter / oItemEnterprise.tableParms.intermediate,
                    oTheAmount;

                oPosition = `${aQntdResult}`.indexOf(".");

                //verifica se o resultado deu quebrado
                if(oPosition != -1){
                    oTheAmount = Number(`${aQntdResult}`.substring(0, oPosition));

                    if(oTheAmount === 0){
                        oTheAmount = 1;
                    }

                }else{
                    oTheAmount = aQntdResult;
                }

                //verifica se o valor da unidade é maior que o valor da tabela,
                //se for ele colocar a intermediaria

                let oResult;

                if(oAmount > oUnitValue){
                    oResult = oAmount - oUnitValue;

                    let oValueResult = oTheAmount != 1 ? (oResult / oTheAmount) : oResult,
                        oPositionV   = `${oValueResult}`.indexOf(".");
                        
                    if(oPositionV != -1){
                        oUnitaryValue = Number(`${oValueResult}`.substring(0, oPositionV)); 
                    }else{
                        oUnitaryValue = oValueResult;
                    }
                        
                    let percentage = `${(oUnitaryValue / oAmount)* 100}`;

                    oObjectPercentage = this._formatedPercentage(percentage);
                }else{
                    oUnitaryValue = "";

                    oObjectPercentage = {
                        percentage: 0,
                        percentageFormated: ""
                    }
                }

                oObject = {
                    codComponent: "27",
                    dueDate: dueDate,
                    deadline: oItemEnterprise.estimatedDeliveryDate,
                    unitaryValue: this._formateValue(`${oUnitaryValue}`, undefined),
                    oValueTotal: this._formateValue(`${oResult}`, undefined),
                    theAmount: oTheAmount,
                    State: {
                        buttonRemove: {
                            Visible: true
                        },
                        theAmount: {
                            Enabled: false,
                        },
                        valueTotal: {
                            Enabled: false,
                        },
                        dueDate: {
                            Enabled: false,
                        },
                        unitaryValue: {
                            Enabled: false,
                        }
                    }
                }    
            }

            return this._createObjectItemPaymentConditions(sKey, sComponent, oObject, oObjectPercentage);
        },

        _createObjectItemPaymentConditions: function(sKey, sComponent, sObject, sObjectPercentage){
            return {
                key: sKey,
                codComponent: sObject.codComponent,
                selectionComponents: sComponent,
                selectionTheAmount: sObject.theAmount,
                selectionDueDate: sObject.dueDate,
                selectionDeadline: sObject.deadline,
                selectionUnitaryValue: sObject.unitaryValue,
                selectionDeductCommission: "",
                selectionPercentage: sObjectPercentage.percentage,
                selectionPercentageFormated: sObjectPercentage.percentageFormated,
                selectionValueTotal: sObject.oValueTotal || sObject.unitaryValue,
                State: {
                    buttonRemove: {
                        Visible: sObject.State.buttonRemove.Visible
                    },
                    selectionComponents: {
                        Visible: true,
                        Enabled: false,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionTheAmount: {
                        Visible: true,
                        Enabled: sObject.State.theAmount.Enabled,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionDueDate: {
                        Visible: true,
                        Enabled: sObject.State.dueDate.Enabled,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionDifference: {
                        Visible: false,
                        Enabled: true,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionUnitaryValue: {
                        Visible: true,
                        Enabled: sObject.State.unitaryValue.Enabled,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    },
                    selectionValueTotal: {
                        Visible: true,
                        Enabled: sObject.State.valueTotal.Enabled,
                        ValueState: sap.ui.core.ValueState.None,
                        ValueStateText: ""
                    }
                }
            }
        },

        _ajustDate: function(sNumberA, sNumberB, sAritmetica){
            /**
             * aQntdB/sNumberB = ano
             * aQntdA/sNumberA = mês
             */
            let aQntdB = sNumberA / sAritmetica,
                aQntdA = sNumberA - sAritmetica,
                position    = `${aQntdB}`.indexOf("."),
                oMonthOrYear;

            while(aQntdA > 12){
                aQntdA = aQntdA - sAritmetica;
            }

            //formata com o 0 na frente caso for menor 10
            if(aQntdA < 10){
                aQntdA = `0${aQntdA}`;
            }

            if(position != -1){
                oMonthOrYear = sNumberB + Number(`${aQntdB}`.substring(0, position));
            }else {
                oMonthOrYear = sNumberB + aQntdA;
            }

            return { numberA: aQntdA, numberB: oMonthOrYear };
        },

        _createObjectPaymentPlan: function(oModel){
            return {
                key: Math.random(),
                selectionComponents: oModel.selectionComponents,
                selectionTheAmount: oModel.selectionTheAmount,
                selectionDueDate: oModel.selectionDueDate,
                selectionDeadline: oModel.selectionDeadline,
                selectionUnitaryValue: oModel.selectionUnitaryValue,
                selectionDeductCommission: "",
                selectionPercentage: oModel.selectionPercentage,
                selectionPercentageIncome: oModel.selectionPercentageIncome,
                selectionPercentageFormated: oModel.selectionPercentageFormated,
                selectionValueTotal: oModel.selectionValueTotal,
            }
        },

        //Pega os valore de entrada e recursos
        _getTheValuesToDecreaseMonthly: function(sModel){
            let oModel               = this.getModel("enterprises").getData().items[0],
                oModelFinishProposal = this.getModel("paymentConditions").getData(),
                oValueComponents     = 0,
                oValueSignal         = 0,
                oNetValue;
            
            if(oModelFinishProposal.selectionSaleForm === "Z01"){
                if(oModelFinishProposal.selectionPurchaseMethod === "1"){
                    oNetValue = Number(this._clearFormattingValue(oModel.SBPEValue));
                }else{
                    oNetValue = Number(this._clearFormattingValue(oModel.CVAValue));
                }
            }else if(oModelFinishProposal.selectionSaleForm === "Z02"){
                oNetValue = Number(this._clearFormattingValue(oModel.SBPEValue));
            }else if(oModelFinishProposal.selectionSaleForm === "Z04"){
                oNetValue = Number(this._clearFormattingValue(oModel.SBPEValue));
            }

            sModel.map(sItem => {
                switch(sItem.selectionComponents){
                    case this.signal:
                        oValueSignal = Number(this._clearFormattingValue(sItem.selectionValueTotal));
                        break;
                    case this.FGTS:
                        oValueComponents += Number(this._clearFormattingValue(sItem.selectionValueTotal));
                        break;
                    case this.subsidy:
                        oValueComponents += Number(this._clearFormattingValue(sItem.selectionValueTotal));
                        break;
                    case this.CEF:
                        oValueComponents += Number(this._clearFormattingValue(sItem.selectionValueTotal));
                        break;
                }
            });

            let oOwnResources = oNetValue - oValueComponents;

            return { oOwnResources , oValueSignal}
        },

        _splitMonthlyPaymentsIntoIndividualInstallments: function(sModel, sModelDelivery){
            let oItems               = [],
                oItemEnterprise      = this.getModel("enterprises").getData().items[0],
                oModelFinishProposal = this.getModel("paymentConditions").getData(),
                oModelProposed       = this.getModel("proposalEvaluation").getData().items[0],
                oTableValue          = Number(this._clearFormattingValue(oModelProposed.unitValue));

            for(let oItem of sModel){
                if(oItem.selectionComponents === this.intermediate      ||
                   oItem.selectionComponents === this.adjustableMonthly ||
                   oItem.selectionComponents === this.fixedMonthly      ||
                   oItem.selectionComponents === this.descendingMonthly)
                {   
                    let oDay              = Number(oItem.selectionDueDate.substring(0,2)),
                        oMonth            = Number(oItem.selectionDueDate.substring(3,5)),
                        oYear             = Number(oItem.selectionDueDate.substring(6,10)),
                        oItemsInvParties  = this.getModel("involvedParties").getData().items,
                        oItemsDescMonthly = [];

                    let oIncome = this._searchProponentsIncome(oItemsInvParties);

                    for(let i=0; i < Number(oItem.selectionTheAmount); i++){
                        let oNewItem = this._createObjectPaymentPlan(oItem);

                        oNewItem.selectionTheAmount  = 1;
                        oNewItem.selectionDueDate    = `${String(oDay).padStart(2, '0')}/${String(oMonth).padStart(2, '0')}/${oYear}`;

                        //Mensal - Reajustável
                        //Mensal Fixa
                        if(oItem.selectionComponents === this.adjustableMonthly ||
                           oItem.selectionComponents === this.fixedMonthly)
                        {
                            let oUnitaryValue = Number(this._clearFormattingValue(oNewItem.selectionUnitaryValue));

                            oNewItem.selectionValueTotal = oNewItem.selectionUnitaryValue;

                            if(oIncome != 0){
                                let oPercentagePortion = (oUnitaryValue / oIncome)* 100;

                                oNewItem.selectionPercentageIncome  = this._formatedPercentage(`${oPercentagePortion}`).percentageFormated;
                            }
                            else oNewItem.selectionPercentageIncome = this._formatedPercentage("0").percentageFormated;
    
                            oItems.push(oNewItem);
                        }
                        //Intermediária
                        else if( oItem.selectionComponents === this.intermediate){
                            oNewItem.selectionValueTotal = oNewItem.selectionUnitaryValue;
    
                            oItems.push(oNewItem);
                        }else{
                        //Mensa Decrescente - Reajustável
                            if(i === 0){
                                oNewItem.selectionValueTotal = oNewItem.selectionUnitaryValue;

                                if(oIncome != 0){
                                    let oPercentagePortion = (Number(this._clearFormattingValue(oNewItem.selectionUnitaryValue)) / oIncome)* 100;

                                    oNewItem.selectionPercentageIncome  = this._formatedPercentage(`${oPercentagePortion}`).percentageFormated;
                                }
                                else oNewItem.selectionPercentageIncome = this._formatedPercentage("0").percentageFormated;
                                
                                //console.log(oNewItem.selectionDueDate)
                            }else{
                                let oValuePreInstallment  = 0,
                                    oValueProInstallment  = 0,
                                    oNumberPreInstallment = 0,
                                    oNumberProInstallment = 0;

                                //Verifico se a quantidade de parcelas ultrapassa o número de paracelas até a data de entrega
                                //Se não passa, eu pego a quantidade de pacelas digitada pelo usuário
                                //coloco como número de parcelas Pré e coloco Zero para parcelas Pró
                                if(oItem.selectionTheAmount < oItemEnterprise.estimatedDeliveryMonth){
                                    oNumberPreInstallment = oItem.selectionTheAmount,
                                    oNumberProInstallment = 0;
                                }else{
                                //Caso passe, eu pego a quantidade de pacelas digitada pelo usuário
                                //subtraiu o valor pela quantidade de pacelas até a data da entrega,
                                //fazendo assim o números de parcelas pró e
                                //coloco a quantidade digitado pelo usuário como número de parcelas Pré
                                    let oNumberPro = Number(oItem.selectionTheAmount) - oItemEnterprise.estimatedDeliveryMonth;

                                    oNumberPreInstallment = oItemEnterprise.estimatedDeliveryMonth,
                                    oNumberProInstallment = oNumberPro;
                                }

                                //Verifico se o número de parcelas pro é maior que zero
                                //se for, faço esse calculo para parcelas decrescente
                                //if(oNumberProInstallment > 0){
                                /*if(i < oItemEnterprise.estimatedDeliveryMonth){
                                    oItems.map(sItem => {
                                        if(sItem.selectionComponents === this.descendingMonthly){
                                            let oValueUnitary = Number(this._clearFormattingValue(sItem.selectionUnitaryValue));
                                            oValuePreInstallment += oValueUnitary;
                                        }
                                    });
                                }*/

                                let { oOwnResources, oValueSignal } = this._getTheValuesToDecreaseMonthly(sModel);
                                let oValueUnitary = Number(this._clearFormattingValue(oNewItem.selectionUnitaryValue));

                                let oPreInstallment 	      = 0,// Number(oItem.selectionTheAmount) - oNumberProInstallment - 1,
                                    oProInstallment           = Number(oItem.selectionTheAmount), //- 1,//oNumberProInstallment - 1,
                                    oProCalculatedInstallment = (oOwnResources - oValueSignal /*- oValuePreInstallment*/) / oProInstallment,
                                    oInstallmentNumber        = i + 1,
                                    oPositionCalculation      = `${oProCalculatedInstallment}`.indexOf(".");

                                if(oPositionCalculation != -1) oProCalculatedInstallment = Number(`${oProCalculatedInstallment}`.substring(0, oPositionCalculation));
                                    
                                /**
                                 *  (
                                        (Simulador1!$C$18+Simulador1!$C$19-Simulador2!$A9)
                                        -
                                        (Simulador1!$C$19-1)/2
                                    )
                                    /
                                    ((Simulador1!$C$19-1)/2)
                                    *
                                    ('Parâmetros de cálculo'!$B$14-'Parâmetros de cálculo'!$B$13)
                                    +
                                    'Parâmetros de cálculo'!$B$13
                                 */


                                //((Prestação pre + prestação pró - prestação) - ( prestação pró - 1) / 2) / ((prestação pró - 1) / 2) * (parcela máxima pró - parcela pró calculada) + Parcela pró calculada
                                let oInstallmentValue = (
                                                            (oPreInstallment + oProInstallment - oInstallmentNumber) 
                                                            - 
                                                            (oProInstallment )//- 1)
                                                             / 2
                                                        ) 
                                                        / 
                                                        ((oProInstallment)// -1) 
                                                        / 2) 
                                                        * 
                                                        (oValueUnitary - oProCalculatedInstallment)
                                                        +
                                                        oProCalculatedInstallment;

                                /*let oPositionInstallmentValue = `${oInstallmentValue}`.indexOf(".");

                                if(oPositionInstallmentValue != -1) oInstallmentValue = `${oInstallmentValue}`.substring(0, oPositionInstallmentValue);
                                    */
                                
                                if(oIncome != 0){
                                    let oPercentagePortion = (oInstallmentValue / oIncome)* 100;

                                    oNewItem.selectionPercentageIncome  = this._formatedPercentage(`${oPercentagePortion}`).percentageFormated;
                                }
                                else oNewItem.selectionPercentageIncome = this._formatedPercentage("0").percentageFormated;

                                if(oInstallmentNumber === Number(oItem.selectionTheAmount)){
                                    let oValueInstallmentTotal = Math.round(oInstallmentValue);
                                    
                                    oItemsDescMonthly.map(sItem => {
                                        //if(sItem.selectionComponents === this.descendingMonthly){
                                            let oValueUnitary = Number(this._clearFormattingValue(sItem.selectionUnitaryValue));
                                            oValueInstallmentTotal += oValueUnitary;
                                        //}
                                    });


                                    let oValueTotalDescendingMonthly = oOwnResources - oValueSignal,
                                        aDifference                  = oValueTotalDescendingMonthly - oValueInstallmentTotal;

                                    if(aDifference != 0){
                                        let oValueInstallment = Math.round(aDifference / oInstallmentNumber),
                                            oTotalAjustado    = 0;

                                        for(let oItemDes of oItemsDescMonthly){
                                            if(oItemDes.selectionComponents === this.descendingMonthly){ 
                                                let oValueUnitary = Number(this._clearFormattingValue(oItemDes.selectionUnitaryValue));

                                                if(Number(this._clearFormattingValue(oItem.selectionUnitaryValue)) != oValueUnitary){
                                                    oValueUnitary += oValueInstallment;

                                                    oItemDes.selectionUnitaryValue = this._formateValue(`${oValueUnitary}`, undefined);
                                                    oItemDes.selectionValueTotal   = this._formateValue(`${oValueUnitary}`, undefined);

                                                    if(oIncome != 0){
                                                        let oPercentagePortion = (oValueUnitary / oIncome)* 100;
                    
                                                        oNewItem.selectionPercentageIncome  = this._formatedPercentage(`${oPercentagePortion}`).percentageFormated;
                                                    }
                                                    else oNewItem.selectionPercentageIncome = this._formatedPercentage("0").percentageFormated;
                    

                                                    oTotalAjustado += oValueUnitary;
                                                }else{
                                                    if(oIncome != 0){
                                                        let oPercentagePortion = (oInstallmentValue / oIncome)* 100;
                    
                                                        oNewItem.selectionPercentageIncome  = this._formatedPercentage(`${oPercentagePortion}`).percentageFormated;
                                                    }
                                                    else oNewItem.selectionPercentageIncome = this._formatedPercentage("0").percentageFormated;
                    
                                                    
                                                    oTotalAjustado += oValueUnitary;
                                                }
                                            }
                                        }

                                        oInstallmentValue = Math.round(oInstallmentValue) + oValueInstallment;

                                        oTotalAjustado += oInstallmentValue;

                                        if(oTotalAjustado != oValueTotalDescendingMonthly){
                                            let aNewDifference = oValueTotalDescendingMonthly - oTotalAjustado;

                                            if(aNewDifference != 0){
                                                oInstallmentValue += aNewDifference;
                                                oTotalAjustado    += aNewDifference;
                                            }
                                        }

                                        let oPercentagePortion = (oTotalAjustado / oTableValue)* 100;
                                        
                                        oItem.selectionPercentage         = this._formatedPercentage(`${oPercentagePortion}`).percentage;
                                        oItem.selectionPercentageFormated = this._formatedPercentage(`${oPercentagePortion}`).percentageFormated;
                                        oItem.selectionValueTotal         = this._formateValue(`${oTotalAjustado}`, undefined);
                                    }else {
                                        let oPercentagePortion = (oValueInstallmentTotal / oTableValue)* 100;
                    
                                        oItem.selectionPercentage         = this._formatedPercentage(`${oPercentagePortion}`).percentage;
                                        oItem.selectionPercentageFormated = this._formatedPercentage(`${oPercentagePortion}`).percentageFormated;
                                        oItem.selectionValueTotal         = this._formateValue(`${oValueInstallmentTotal}`, undefined);
                                    }
                                }

                                oNewItem.selectionUnitaryValue = this._formateValue(`${Math.round(oInstallmentValue)}`, undefined);
                                oNewItem.selectionValueTotal   = this._formateValue(`${Math.round(oInstallmentValue)}`, undefined);
                            }
    
                            oItemsDescMonthly.push(oNewItem);

                            //console.log(oNewItem.selectionDueDate)
                        }

                        if(oItem.selectionComponents === this.intermediate){
                            oMonth += sModelDelivery.tableParms.intermediate;
                        }else oMonth += 1;

                        if(oMonth > 12){
                            let oResult = oMonth - 12;

                            oMonth = oResult;
                            oYear += 1;
                        }
                    }

                    if(oItem.selectionComponents === this.descendingMonthly){
                        oItemsDescMonthly.map(sItem => {
                            oItems.push(sItem)
                        });
                    }
                }else{
                    oItem.selectionValueTotal = oItem.selectionUnitaryValue;

                    oItems.push(this._createObjectPaymentPlan(oItem));
                }
            }

            return oItems;
        },

        _searchProponentsIncome: function(sItemsInvolvedParties){
            let oIncome = 0;

            //Vejo se a um proponente adicionado as partes envolvidas e se é o principal da simulação
            let oProponents = sItemsInvolvedParties.filter(sProponent => {
                if(sProponent.functionCode === "31") return sProponent;
            });

            //se o proponente não existir, e o componnete for mensal decrescente, então é colocado uma mensagem de aviso
            //para que o corretor adicione um proponente antes de adicionanar esse componente
            if(oProponents.length === 0){
                return 0;
            }else{
                for(let oProponent of oProponents){
                    //verifico se é pessoa física ou jurídica,
                    //se for jurídica eu pego o valor da renda do proponente principal
                    if(oProponent.functionCodeText === "Pessoa Jurídica"){
                        oIncome += Number(this._clearFormattingValue(oProponent.financialInformation.monthlyIncome));
                    }else{
                        //caso o proponente for pessoa física,
                        //então verifico se ela tem um cônjuge,
                        //se tiver somo a renda dos dois, se não 
                        //pego só o valor da renda do proponente
                        if(oProponent.biddersSpouseData.cpf != ""){
                            let oValueMain   = Number(this._clearFormattingValue(oProponent.financialInformation.monthlyIncome)),
                                oValueSpouse = Number(this._clearFormattingValue(oProponent.biddersSpouseData.monthlyIncome));

                            oIncome += oValueMain + oValueSpouse;
                        }
                        else oIncome += Number(this._clearFormattingValue(oProponent.financialInformation.monthlyIncome));
                    }
                }
            }

            return oIncome;
        },

        _searchProponentIncomeMaximumInstallmentPro: function(sComponent, sItemsInvolvedParties){
            let oMaximumInstallmentPro = 0;

            //Vejo se a um proponente adicionado as partes envolvidas e se é o principal da simulação
            let oProponents = sItemsInvolvedParties.filter(sProponent => {
                if(sProponent.functionCode === "31") return sProponent;
            });

            //se o proponente não existir, e o componente for mensal decrescente, então é colocado uma mensagem de aviso
            //para que o corretor adicione um proponente antes de adicionanar esse componente
            if(oProponents.length === 0 && sComponent === this.descendingMonthly){
                MessageToast.show(this.getResourceBundle().getText("paymentConditionsDescendingMonthlyMessageWarning"));
                return;
            }else
            if(oProponents.length != 0 && sComponent === this.descendingMonthly){
                let oModel         = this.getModel("enterprises").getData().items[0],
                    oPercIncome    = oModel.percMaximumIncomeCommit.percentageCalculo,
                    oPercIncomeCEF = oModel.percIncomeCEF.percentageCalculo,
                    oIncome        = 0;

                    for(let oProponent of oProponents){
                        //verifico se é pessoa física ou jurídica,
                        //se for jurídica eu pego o valor da renda do proponente principal
                        if(oProponent.functionCodeText === "Pessoa Jurídica"){
                            oIncome += Number(this._clearFormattingValue(oProponent.financialInformation.monthlyIncome));
                        }else{
                            //caso o proponente for pessoa física,
                            //então verifico se ela tem um cônjuge,
                            //se tiver somo a renda dos dois, se não 
                            //pego só o valor da renda do proponente
                            if(oProponent.biddersSpouseData.cpf != ""){
                                let oValueMain   = Number(this._clearFormattingValue(oProponent.financialInformation.monthlyIncome)),
                                    oValueSpouse = Number(this._clearFormattingValue(oProponent.biddersSpouseData.monthlyIncome));

                                oIncome += oValueMain + oValueSpouse;
                            }
                            else oIncome += Number(this._clearFormattingValue(oProponent.financialInformation.monthlyIncome));
                        }
                    }

                    if(oIncome === 0){
                        MessageToast.show(this.getResourceBundle().getText("messageWarningpaymentConditionsIncome"));
                        return;
                    }
                    
                    //Parcela da Caixa
                    let oIncomeCEF = oPercIncomeCEF * oIncome;
                    //Parcela maxima assumida
                    let oMaximumInstallmentAssumed = oModel.maximumInstallmentAssumed;
                    //Parcela Máxima Pro cliente
                    oMaximumInstallmentPro = Math.min((oPercIncome * oIncome), oMaximumInstallmentAssumed) - oIncomeCEF;
                    let oPositionMaximumInstallmentPro = `${oMaximumInstallmentPro}`.indexOf(".");

                    if(oPositionMaximumInstallmentPro != -1) oMaximumInstallmentPro = Number(`${oMaximumInstallmentPro}`.subtring(0, oPositionMaximumInstallmentPro));
            }

            return oMaximumInstallmentPro;
        },

        _removeTheSameDates: function(sModel){
            this.getModel("paymentPlan").getData().items = [];
            this.getModel("paymentPlan").refresh(true);
            
            let oFieldClass = ["signal", "FGTS", "CEF", "subsidy", "discountSale", 
                               "deliveryKeys", "preKey", "proKey", "intermediate"],
                oFieldState = this.getModel("paymentPlan").getData().State;

            //coloca as colunas da tabela de plano de pagamento como invisível
            oFieldClass.forEach(function(oField) {
                oFieldState[oField].Visible = false
            });

            //Array com as mês/ano sem repetição
            let oDatesIdentical = [];

            for(let oItem of sModel){
                let oMonth      =  oItem.selectionDueDate.substring(3, 5),
                    oYear       =  oItem.selectionDueDate.substring(6, 10),
                    oDate       = `${oYear}/${oMonth}`, 
                    oTimeCourse = 0;
                
                oTimeCourse = this._calculationTimeCourse(Number(oMonth), Number(oYear), 0);

                if(oDatesIdentical.length === 0){
                    oDatesIdentical.push({
                        date: oDate,
                        timecourse: oTimeCourse
                    });
                }else {                        
                    let oItemIdentical = oDatesIdentical.find(function(item) {
                        if(item.date === oDate){
                            return item;
                        }
                    });

                    if(oItemIdentical === undefined){
                        oDatesIdentical.push({
                            date: oDate,
                            timecourse: oTimeCourse
                        });
                    }
                }
            }

            //Ordena as datas em ordem crescente
            oDatesIdentical.sort(function(sDateOne, sDateTwo){
                return sDateOne.date == sDateTwo.date ? 0 : sDateOne.date > sDateTwo.date ? 1 : -1
            });

            //Verifica quais periodos estão faltando e coloca-os com o valor zero para preencher plano de pagamento
            oDatesIdentical = this._checkWhichDateRangesMissing(oDatesIdentical);

            return oDatesIdentical;
        },

        _checkWhichDateRangesMissing: function(sModelDateIdentical){
            let oCounter        = sModelDateIdentical[0].timecourse,
                oCounterInitial = sModelDateIdentical[0].timecourse;

            //verifica quais periodos estão faltando e coloca-os com o valor zero para preencher plano de pagamento
            for(let i=0; i < sModelDateIdentical.length; i++){
                if(sModelDateIdentical[i].timecourse === oCounter){
                    oCounter++;
                }else{
                    let oMonth = Number(sModelDateIdentical[i - 1].date.substring(5, 7)),
                        oYear  = Number(sModelDateIdentical[i - 1].date.substring(0, 4));

                    while(oCounter <= sModelDateIdentical[i].timecourse){       
                        oMonth += 1;

                        if(oMonth > 12){
                            let oResult = oMonth - 12;
    
                            oMonth = oResult;
                            oYear += 1;
                        }

                        sModelDateIdentical.splice(oCounter - oCounterInitial, 0, {
                            date: `${oYear}/${String(oMonth).padStart(2, '0')}`,
                            timecourse: oCounter
                        });

                        oCounter++;
                    }
                }
            }
            
            return sModelDateIdentical;
        },

        _fillOutPaymentPlan: function(sItemCndts, sItemEnterprise){
            let oItems = this._splitMonthlyPaymentsIntoIndividualInstallments(sItemCndts, sItemEnterprise);
            
            let oDatesIdentical = this._removeTheSameDates(oItems);
            
            let oTotal             = 0,
                oItemsPaymentPlan  = [],
                oTotalSignal       = 0,
                oTotalFGTS         = 0,
                oTotalCEF          = 0,
                oTotalSubsidy      = 0,
                oTotalDiscountSale = 0,
                oTotalDeliveryKeys = 0,
                oTotalIntermediate = 0,
                oTotalPreKey       = 0,
                oTotalProKey       = 0;


            for(let oDate of oDatesIdentical){
                let oValueTotal  = 0,
                    oEmptyPeriod = true,
                    oObjectPlan  = {
                        dueDate: oDate.date,
                        timeCourse: oDate.timecourse,
                        signal: "-",
                        FGTS: "-",
                        CEF: "-",
                        subsidy: "-",
                        discountSale: "-",
                        deliveryKeys: "-",
                        preKey: "-",
                        proKey: "-",
                        percIncome: "-",
                        intermediate: "-",
                        ValueTotal: "-"
                    };

                for(let oItem of oItems){
                    let oMonthCdtns = oItem.selectionDueDate.substring(3, 5),
                        oYearCdtns  = oItem.selectionDueDate.substring(6, 10),
                        oDateCdtns  = `${oYearCdtns}/${oMonthCdtns}`,
                        oValueIntermediate;

                    if(oDate.date === oDateCdtns){
                        oEmptyPeriod = false;

                        switch (oItem.selectionComponents) {
                            case this.signal:
                                oObjectPlan.signal = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                this.getModel("paymentPlan").getData().State.signal.Visible = true;

                                oTotalSignal += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                                break;
                            case this.FGTS:
                                oObjectPlan.FGTS = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                this.getModel("paymentPlan").getData().State.FGTS.Visible = true;
                                
                                oTotalFGTS += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                                break;
                            case this.CEF:
                                oObjectPlan.CEF = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                this.getModel("paymentPlan").getData().State.CEF.Visible = true;

                                oTotalCEF += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                                break;
                            case this.subsidy:
                                oObjectPlan.subsidy = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                this.getModel("paymentPlan").getData().State.subsidy.Visible = true;

                                oTotalSubsidy += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                                break;
                            case this.discountSale:
                                oObjectPlan.discountSale = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                this.getModel("paymentPlan").getData().State.discountSale.Visible = true;

                                oTotalDiscountSale += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                                break;
                            case this.deliveryKeys:
                                oObjectPlan.deliveryKeys = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                this.getModel("paymentPlan").getData().State.deliveryKeys.Visible = true;

                                oTotalDeliveryKeys += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                                break;
                            case this.intermediate:
                                oObjectPlan.intermediate = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                this.getModel("paymentPlan").getData().State.intermediate.Visible = true;

                                oTotalIntermediate += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                                break;
                        }

                        if(oItem.selectionComponents === this.adjustableMonthly ||
                           oItem.selectionComponents === this.fixedMonthly      ||
                           oItem.selectionComponents === this.descendingMonthly)
                        {
                            let oMonth  = sItemEnterprise.estimatedDeliveryDate.substring(3, 5),
                                oYear   = sItemEnterprise.estimatedDeliveryDate.substring(6, 10),
                                oPeriod = `${oYear}/${oMonth}`

                            this.getModel("paymentPlan").getData().State.percIncome.Visible = true;
                            //percIncome: "-"

                            if(oDate.date <= oPeriod){
                                oObjectPlan.preKey     = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                oObjectPlan.percIncome = oItem.selectionPercentageIncome;

                                this.getModel("paymentPlan").getData().State.preKey.Visible = true;

                                oTotalPreKey += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                            }else{
                                oObjectPlan.proKey     = this._formateValue(`${oItem.selectionUnitaryValue}`, "");
                                oObjectPlan.percIncome = oItem.selectionPercentageIncome;

                                this.getModel("paymentPlan").getData().State.proKey.Visible = true;

                                oTotalProKey += Number(this._clearFormattingValue(oItem.selectionUnitaryValue));
                            }
                        }

                        oValueTotal += Number(this._clearFormattingValue(oItem.selectionValueTotal));
                    }
                    
                }

                if(oEmptyPeriod){
                    oObjectPlan.signal            = "-";
                    oObjectPlan.FGTS              = "-";
                    oObjectPlan.CEF               = "-";
                    oObjectPlan.subsidy           = "-";
                    oObjectPlan.discountSale      = "-";
                    oObjectPlan.deliveryKeys      = "-";
                    oObjectPlan.preKey            = "-";
                    oObjectPlan.proKey            = "-";
                    oObjectPlan.percIncome        = "-",
                    oObjectPlan.intermediate      = "-";

                    oValueTotal += 0;
                }

                oTotal += oValueTotal;

                oObjectPlan.ValueTotal = this._formateValue(`${oValueTotal}`, "");
                
                oItemsPaymentPlan.push(oObjectPlan);
                this.getModel("paymentPlan").refresh(true);
            };

            //this.getModel("paymentPlan").refresh(true);

            let oObject = {
                dueDate: "",
                timeCourse: "",
                signal: this._formateValue(`${oTotalSignal}`, undefined),
                FGTS: this._formateValue(`${oTotalFGTS}`, undefined),
                CEF: this._formateValue(`${oTotalCEF}`, undefined),
                subsidy: this._formateValue(`${oTotalSubsidy}`, undefined),
                discountSale: this._formateValue(`${oTotalDiscountSale}`, undefined),
                deliveryKeys: this._formateValue(`${oTotalDeliveryKeys}`, undefined),
                preKey: this._formateValue(`${oTotalPreKey}`, undefined),
                proKey: this._formateValue(`${oTotalProKey}`, undefined),
                percIncome: "",
                intermediate: this._formateValue(`${oTotalIntermediate}`, undefined),
                ValueTotal: this._formateValue(`${oTotal}`, undefined)
            };

            oItemsPaymentPlan.push(oObject);

            oItemsPaymentPlan.map(sItem => {
                if(sItem.dueDate != ""){
                    let oDate = sItem.dueDate.split("/");

                    sItem.dueDate = `${oDate[1]}/${oDate[0]}`
                }
            });

            this.getModel("paymentPlan").getData().items = oItemsPaymentPlan;
            this.getModel("paymentPlan").getData().rowCount = oDatesIdentical.length + 1;
            this.getModel("paymentPlan").refresh(true);

            return { oTotal, oItemsPaymentPlan };
        },

        _validationProposal: function() {
            let oItemsCdtns     = this.getModel("paymentConditions").getData().items,
                oItemEnterprise = this.getModel("enterprises").getData().items[0];

            let { oTotal, oItemsPaymentPlan } = this._fillOutPaymentPlan(oItemsCdtns, oItemEnterprise);

            let oItemsInvolvedParties = this.getModel("involvedParties").getData().items,
                oModelFinishProposal  = this.getModel("finishProposal").getData(),
                oItemsEvaluation      = this.getModel("proposalEvaluation").getData(),
                oModelProposedCalc    = this.getModel("proposedCalculation").getData(),
                aFieldProposedCalc    = ["validationTitle", "validationText", "validationTextTwo", "validationTextThree"],
                oClient               = false,
                oGuarantor            = false,
                oMessageWarning       = "",
                oMessageNegative      = "",
                bValidNegative        = false;

            //Limpa campos de aviso/erro de mensagem para o usuário
            aFieldProposedCalc.forEach(sField => {
                oModelProposedCalc[sField]                  = "";
                oModelProposedCalc.State[sField].ValueState = sap.ui.core.ValueState.None;
                oModelProposedCalc.State[sField].Icon       = "";
                oModelProposedCalc.State[sField].Visible    = false;
            });


            oItemsCdtns.map(sItem => {
                let oValueTotal = Number(this._clearFormattingValue(sItem.selectionValueTotal));

                if(oValueTotal < 0){
                    if(oMessageNegative != ""){
                        oMessageNegative += "\n"
                       
                        oMessageNegative += this.getResourceBundle().getText("messageWarningValueNegative", [sItem.selectionComponents]);
                    }else oMessageNegative += this.getResourceBundle().getText("messageWarningValueNegative", [sItem.selectionComponents]);
                }
            });

            //verifico se foi selecionado o corretor e imobiliaria
            ["broker", "realEstate"].forEach(sField => {
                if(oModelFinishProposal[sField] != ""){
                    oModelFinishProposal.State[sField].ValueState     = sap.ui.core.ValueState.None;
                    oModelFinishProposal.State[sField].ValueStateText = "";
                }else{
                    oModelFinishProposal.State[sField].ValueState     = sap.ui.core.ValueState.Error;
                    oModelFinishProposal.State[sField].ValueStateText = this.getResourceBundle().getText("proponentValidationRequiredField");
                        
                    if(sField === "broker") oMessageWarning += this.getResourceBundle().getText("brokerMessageWarningSelected")
                    else {
                        if(oMessageWarning != ""){
                            oMessageWarning += "\n"
                            oMessageWarning += this.getResourceBundle().getText("realEstateMessageWarningSelected");
                        }
                        else oMessageWarning += this.getResourceBundle().getText("realEstateMessageWarningSelected");
                    }
                }
            });

            //verifico se existe um cliente na proposta,
            //caso exista e a condição de pagamento for valida,
            //Mostro o botão para gravar
            for(let oItem of oItemsInvolvedParties){
                if(oItem.functionCode === "31") oClient    = true;
                if(oItem.functionCode === "Z1") oGuarantor = true;
            }

            if(!oClient){
                this.getModel("paymentPlan").getData().buttonPrintPaymentPlan = false;

                if(oMessageWarning != ""){
                    oMessageWarning += "\n"
                    oMessageWarning += this.getResourceBundle().getText("proponentMessageWarningAdd");
                }else oMessageWarning = this.getResourceBundle().getText("proponentMessageWarningAdd");
            }else{
                this.getModel("paymentPlan").getData().buttonPrintPaymentPlan = true;    
            }

            this.getModel("paymentPlan").refresh(true);

            if(oMessageWarning != ""){
                oItemsEvaluation.buttonUpdateProposal = false;
                oItemsEvaluation.buttonSaveProposal   = false;
                MessageBox.warning(oMessageWarning);
            }else if(oMessageNegative != ""){
                oItemsEvaluation.buttonUpdateProposal = false;
                oItemsEvaluation.buttonSaveProposal   = false;
            }else{
                if(oModelFinishProposal.objectID != "") oItemsEvaluation.buttonUpdateProposal = true;
                else oItemsEvaluation.buttonSaveProposal = this.objectRoles.VisibleSave;     
            }

            if(oModelFinishProposal.messageStatus != ""){
                if(oModelFinishProposal.messageStatus === "Realizar simulação BRZ"          ||
                   oModelFinishProposal.messageStatus === "Coletar documentação do cliente" ||
                   oModelFinishProposal.messageStatus === "Validar simulação BRZ"           ||
                   oModelFinishProposal.messageStatus === "Pasta em discussão")
                {
                    oItemsEvaluation.buttonUpdateProposal            = true;
                    oModelFinishProposal.State.messageStatus.Visible = false;
                }else 
                if(oModelFinishProposal.messageStatus                === "Gerar proposta de compra" &&
                   oModelFinishProposal.opportunityValidatedSimulate === false

                ){
                    oItemsEvaluation.buttonUpdateProposal            = true;
                    oModelFinishProposal.State.messageStatus.Visible = false;
                }else 
                if(oModelFinishProposal.messageStatus                === "Gerar proposta de compra" &&
                   oModelFinishProposal.opportunityValidatedSimulate === true                       && 
                   oModelFinishProposal.approvalStatusCode           === "6" )
                {
                    oItemsEvaluation.buttonUpdateProposal            = true;
                    oModelFinishProposal.State.messageStatus.Visible = false;
                }else{
                    oItemsEvaluation.buttonUpdateProposal = false;
                    oModelFinishProposal.State.messageStatus.Visible = true;

                    let oMessage = "Oportunidade bloqueada na fase " + oModelFinishProposal.messageStatus;

                    oModelFinishProposal.messageStatus = oMessage;
                }
            }else{
                oModelFinishProposal.State.messageStatus.Visible = false;
            }

            this.getModel("finishProposal").refresh(true);

            //Verifica se tem parcelas pró-chaves
            let oPortionProKey = oItemsPaymentPlan.find(sItem => {
                if(sItem.proKey != "-" && sItem.proKey != "" && sItem.proKey != "R$ 0,00") return sItem;
            });

            //Preenchedo a tabela que diz se a proposta está nas condições certas ou não
            let oUnitValue = Number(oItemsEvaluation.items[0].unitValue.replaceAll(".", "").replace(",", "").replace("R$", "").replace(" ", ""));

            let aSumTotal = oTotal - oUnitValue;

            if(aSumTotal === 0){
                //Mostra os valores da proposta na tabela Avaliação Final

                if(oMessageNegative === ""){
                    oItemsEvaluation.items[0].finalEvaluation                  = this.getResourceBundle().getText("proposalEvaluationFinalEvaluationSuccess");
                    oItemsEvaluation.items[0].State.finalEvaluation.ValueState = sap.ui.core.ValueState.Success;
                    oItemsEvaluation.items[0].State.finalEvaluation.Icon       = "sap-icon://accept"

                    //Mostra os valores da proposta na tabela Condição de pagamento
                    //Coloca o titulo do plano do pagamento como certo
                    oModelProposedCalc.validationTitle                  = this.getResourceBundle().getText("proposalEvaluationFinalEvaluationSuccess");;
                    oModelProposedCalc.State.validationTitle.ValueState = sap.ui.core.ValueState.Success;
                    oModelProposedCalc.State.validationTitle.Icon       = "sap-icon://accept";
                    oModelProposedCalc.State.validationTitle.Visible    = true;

                    //verifica se exite fiador e se tem parcelas pós entrega de chaves
                    if(!oGuarantor && oPortionProKey != undefined){
                        this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr 1fr");

                        oModelProposedCalc.validationText                  = this.getResourceBundle().getText("messageWarningWithoutGuarantor");
                        oModelProposedCalc.State.validationText.ValueState = sap.ui.core.ValueState.Warning;
                        oModelProposedCalc.State.validationText.Icon       = "sap-icon://message-warning";
                        oModelProposedCalc.State.validationText.Visible    = true;
                    }
                    else this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr");
                }else{
                    //se existir valores negativos
                    oItemsEvaluation.items[0].finalEvaluation                  = oMessageNegative;
                    oItemsEvaluation.items[0].State.finalEvaluation.ValueState = sap.ui.core.ValueState.Error;
                    oItemsEvaluation.items[0].State.finalEvaluation.Icon       = "sap-icon://decline"

                    //Mostra os valores da proposta na tabela Condição de pagamento
                    //Mostra os components que estão com valores negativos
                    oModelProposedCalc.validationText                  = oMessageNegative
                    oModelProposedCalc.State.validationText.ValueState = sap.ui.core.ValueState.Error;
                    oModelProposedCalc.State.validationText.Icon       = "sap-icon://message-error";
                    oModelProposedCalc.State.validationText.Visible    = true;

                    if(!oGuarantor && oPortionProKey != undefined){
                        this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr 1fr");

                        oModelProposedCalc.validationTextTwo                  = this.getResourceBundle().getText("messageWarningWithoutGuarantor");
                        oModelProposedCalc.State.validationTextTwo.ValueState = sap.ui.core.ValueState.Warning;
                        oModelProposedCalc.State.validationTextTwo.Icon       = "sap-icon://message-warning";
                        oModelProposedCalc.State.validationTextTwo.Visible    = true;
                    }
                    else this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr");
                }
            }else {
                //Deixa invisivel os botões de gravar e atualizar
                oItemsEvaluation.buttonUpdateProposal = false;
                oItemsEvaluation.buttonSaveProposal   = false;

                //Mostra os valores da proposta na tabela Avaliação Final
                oItemsEvaluation.items[0].finalEvaluation                  = this.getResourceBundle().getText("proposalEvaluationFinalEvaluationError");
                oItemsEvaluation.items[0].State.finalEvaluation.ValueState = sap.ui.core.ValueState.Error;
                oItemsEvaluation.items[0].State.finalEvaluation.Icon       = "sap-icon://decline";

                oModelProposedCalc.validationTitle                  = this.getResourceBundle().getText("proposalEvaluationValidationErrorDiscountTitle");
                oModelProposedCalc.State.validationTitle.ValueState = sap.ui.core.ValueState.Error;
                oModelProposedCalc.State.validationTitle.Icon       = "sap-icon://decline";
                oModelProposedCalc.State.validationTitle.Visible    = true;

                let percentage        = `${(aSumTotal / oUnitValue)* 100}`,
                    oObjectPercentage = this._formatedPercentage(percentage);
                
                //Verifica se a subtração dos valores da a mais ou menor que o valor da unidade
                if(aSumTotal > 0){
                    oModelProposedCalc.validationText                  = this.getResourceBundle().getText("proposalEvaluationValidationErrorAdditionText", [`${this._formateValue(`${aSumTotal}`, "")}`]);
                    oModelProposedCalc.State.validationText.ValueState = sap.ui.core.ValueState.Error;
                    oModelProposedCalc.State.validationText.Icon       = "sap-icon://message-error";
                    oModelProposedCalc.State.validationText.Visible    = true;

                    //Texto erro dois
                    if(!oGuarantor && oPortionProKey != undefined){
                        this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr 1fr 1fr");

                        oModelProposedCalc.validationTextTwo                  = this.getResourceBundle().getText("messageWarningWithoutGuarantor");
                        oModelProposedCalc.State.validationTextTwo.ValueState = sap.ui.core.ValueState.Warning;
                        oModelProposedCalc.State.validationTextTwo.Icon       = "sap-icon://message-warning";
                        oModelProposedCalc.State.validationTextTwo.Visible    = true;
                    }
                    else this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr 1fr");
                }else {
                    //Primeira mensagem de erro
                    oModelProposedCalc.validationText                  = this.getResourceBundle().getText("proposalEvaluationValidationErrorDiscountText", [`${this._formateValue(`${aSumTotal}`, "")} (${oObjectPercentage.percentageFormated})`]);
                    oModelProposedCalc.State.validationText.ValueState = sap.ui.core.ValueState.Error;
                    oModelProposedCalc.State.validationText.Icon       = "sap-icon://message-error";
                    oModelProposedCalc.State.validationText.Visible    = true;
                    
                    //Segunda mensagem de erro
                    oModelProposedCalc.validationTextTwo                  = this.getResourceBundle().getText("proposalEvaluationValidationErrorDiscountTextTwo");
                    oModelProposedCalc.State.validationTextTwo.ValueState = sap.ui.core.ValueState.Error;
                    oModelProposedCalc.State.validationTextTwo.Icon       = "sap-icon://message-error";
                    oModelProposedCalc.State.validationTextTwo.Visible    = true;
                
                    if(!oGuarantor && oPortionProKey != undefined){
                        this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr 1fr 1fr 1fr");

                        oModelProposedCalc.validationTextThree                  = this.getResourceBundle().getText("messageWarningWithoutGuarantor");
                        oModelProposedCalc.State.validationTextThree.ValueState = sap.ui.core.ValueState.Warning;
                        oModelProposedCalc.State.validationTextThree.Icon       = "sap-icon://message-warning";
                        oModelProposedCalc.State.validationTextThree.Visible    = true;
                    }
                    else this.byId("gridPaymentConditionsContainerResultStatus").setGridTemplateRows("1fr 1fr 1fr");
                }
            }

            this.getModel("proposalEvaluation").refresh(true);
            this.getModel("proposedCalculation").refresh(true);


            let oSignal                = 0,//% Captação a vista
                deliveryPickup         = 0,//% Captação até a entrega
                uptakeOneMonthDelivery = 0,//% Captação até 1 mês antes da entrega
                oTableMeterValue       = 0,//Valor m² (tabela)
                oProposedMeterValue    = 0,//Valor do m² PV (preço de venda)
                aDelivery              = 0,//Período até a entrega
                oMeterArea             = Number(oItemEnterprise.area.replace(" ", "").replace("m²", "").replace(".", "")),
                oMonth                 = oItemEnterprise.deliveryDate.substring(3, 5),
                oYear                  = oItemEnterprise.deliveryDate.substring(6, 10);

            aDelivery           = this._calculationTimeCourse(Number(oMonth), Number(oYear), 0);
            oTableMeterValue    = `${oUnitValue / oMeterArea}`;//valor area m² da unidade
            oProposedMeterValue = `${oTotal / oMeterArea}`;    //valor area m² da proposta

            let posintionTable           = oTableMeterValue.indexOf("."),
                posintionProposed        = oProposedMeterValue.indexOf("."),
                oForDigitsTable          = oTableMeterValue.substring(posintionTable+1, posintionTable+5),
                oForDigitsProposed       = oProposedMeterValue.substring(posintionProposed+1, posintionProposed+5),
                oTableMeterValueFinal    = `${oTableMeterValue.substring(0, posintionTable)}${oForDigitsTable}`,
                oProposedMeterValueFinal = `${oProposedMeterValue.substring(0, posintionProposed)}${oForDigitsProposed}`;

            for(let oItem of oItemsCdtns){
                if(oItem.selectionComponents === this.signal            ||
                   oItem.selectionComponents === this.adjustableMonthly ||
                   oItem.selectionComponents === this.fixedMonthly      ||
                   oItem.selectionComponents === this.deliveryKeys    
                ){
                    if(oItem.selectionComponents === this.signal){
                        oSignal = oItem.selectionPercentageFormated;
                    }

                    //% Captação até a entrega - Cálculo
                    deliveryPickup += oItem.selectionPercentage;
                }
                
                if(oItem.selectionComponents === this.signal            ||
                   oItem.selectionComponents === this.adjustableMonthly ||
                   oItem.selectionComponents === this.fixedMonthly
                    
                ){ 
                    if(oItem.selectionComponents === this.adjustableMonthly ||
                       oItem.selectionComponents === this.fixedMonthly ){
                        //verifico se a quantidade ultaprassa a data da entrega
                        if(oItem.selectionTheAmount >= aDelivery){
                            let oValueUnitary  = Number(this._clearFormattingValue(oItem.selectionUnitaryValue)),
                                oValueProposal = Number(this._clearFormattingValue(this.getModel("proposalEvaluation").getData().items[0].proposalValue)),
                                oValue         = ((oValueUnitary * (aDelivery - 1)) / oValueProposal) * 100,
                                oPercentage    = this._formatedPercentage(`${oValue}`);

                            uptakeOneMonthDelivery += oPercentage.percentage;
                        }/*else {
                            uptakeOneMonthDelivery += oItem.selectionPercentage;
                        }*/
                    }else{
                        //% Captação até 1 mês antes da entrega - Cálculo
                        //soma a porcentagem do sinal e da mensa reajistável
                        uptakeOneMonthDelivery += oItem.selectionPercentage;
                    }
                } 
            }

            //Calculo do Pro-soluto
            let oModelPaymentPlan      = this.getModel("paymentPlan").getData(),
                oEstimatedDeliveryDate = this.getModel("enterprises").getData().items[0].estimatedDeliveryDate,
                oYearMonth             = `${oEstimatedDeliveryDate.substring(6, 10)}/${oEstimatedDeliveryDate.substring(3, 5)}`,
                oProSolute             = 0;

            for(let oItem of oModelPaymentPlan.items){
                if(oItem.dueDate > oYearMonth){
                    if(oItem.proKey != "-"){//|| oItem.fixedMonthly != "-"
                        //console.log(oItem.dueDate + " - " + oItem.proKey)
                        oProSolute += Number(this._clearFormattingValue(oItem.proKey));
                    }
                }
            }

            let oValueProposal       = Number(this._clearFormattingValue(this.getModel("proposalEvaluation").getData().items[0].proposalValue)),
                oProSolutePercentage = (oProSolute / oValueProposal)* 100;
            //--------------------------------

            this.getModel("resultProposed").getData().items = [];
            this.getModel("resultProposed").refresh(true);

            let oItemsResultProposed = this.getModel("resultProposed").getData().items; 

            //% Captação a vista
            let oTableSignal = this._formatedPercentage(`${oItemEnterprise.tableParms.signal.percentage}`);
            //% Captação até a entrega
            let oTableDeliveryPickup = this._formatedPercentage(`${oItemEnterprise.tableParms.readjustableTable.percentage}`);
            //% Captação até 1 mês antes da entrega
            let oTableUptakeOneMonthDelivery = this._formatedPercentage(`${oItemEnterprise.tableParms.signal.percentage + oItemEnterprise.tableParms.readjustableTable.percentage}`);
            
            oItemsResultProposed.push({
                criterion: "Prazo de financiamento", 
                table: aDelivery, 
                proposal: aDelivery 
            });

            oItemsResultProposed.push({
                criterion: "% Captação a vista", 
                table: oTableSignal.percentageFormated, 
                proposal: oSignal 
            });

            oItemsResultProposed.push({
                criterion: "% Captação até a entrega", 
                table: oTableDeliveryPickup.percentageFormated, 
                proposal: this._formatedPercentage(`${deliveryPickup}`).percentageFormated
            });

            oItemsResultProposed.push({
                criterion: "% Captação até 1 mês antes da entrega", 
                table: oTableUptakeOneMonthDelivery.percentageFormated, 
                proposal: this._formatedPercentage(`${uptakeOneMonthDelivery}`).percentageFormated
            });

            oItemsResultProposed.push({
                criterion: "% Captação até metade da proposta em relação entrega unidade", 
                table: "",
                proposal: ""
            });

            oItemsResultProposed.push({
                criterion: "% Pró-soluto", 
                table: "",
                proposal: oProSolute != 0 ? this._formatedPercentage(`${oProSolutePercentage}`).percentageFormated : ""
            });

            oItemsResultProposed.push({
                criterion: "Valor pró-soluto", 
                table: "",
                proposal: oProSolute != 0 ? this._formateValue(`${oProSolute}`, undefined) : ""
            });

            oItemsResultProposed.push({
                criterion: "Valor m²", 
                table: this._formateValue(oTableMeterValueFinal, undefined),
                proposal: this._formateValue(oProposedMeterValueFinal, undefined)
            });

            oItemsResultProposed.push({
                criterion: "Valor do m² PV", 
                table: this._formateValue(oTableMeterValueFinal, undefined),
                proposal: this._formateValue(oProposedMeterValueFinal, undefined)
            });

            oItemsResultProposed.push({
                criterion: "Valor VPL", 
                table: oItemsEvaluation.items[0].unitValue,
                proposal: this._formateValue(`${oTotal}`, undefined)
            });

            oItemsResultProposed.push({
                criterion: "Diferença do VPL¹", 
                table: "",
                proposal: this._formateValue(`${aSumTotal}`, undefined)
            });


            this.getModel("resultProposed").getData().rowCount = oItemsResultProposed.length;
            this.getModel("resultProposed").refresh(true);
        }
	});
});