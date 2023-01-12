sap.ui.define([
	"./BaseController",
    "../model/graphic",
    "../model/units",
    "sap/ui/Device"
], function(
	BaseController,
    Graphic,
    Units,
    Device
) {
	"use strict";

	return BaseController.extend("com.itsgroup.brz.enterprises.controller.SimulateProposal", {
        /* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
        onInit: function() {
            this.getRouter().getRoute("simulateProposal").attachPatternMatched(this._onObjectMatched.bind(this), this);  
        },

        /* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
        onNavBack: function() {
            history.go(-1);
        },

        onOrderFilter: function(oEvent) {
            let oId = oEvent.getParameters().id;
            let oIcon = oEvent.getSource().getProperty("icon");
            let setIcon;

            if(oIcon === "sap-icon://sort-ascending") {
                setIcon = "sap-icon://sort-descending";
            }else if(oIcon === "sap-icon://sort-descending"){
                setIcon = "sap-icon://sort-ascending";
            }else {
                setIcon = "sap-icon://sort-ascending";
            }
            


            if(oId === "container-enterprises---simulateProposal--buttonFloor"){
                this.byId("buttonFloor").addStyleClass("buttonsOrdersColor");
                this.byId("buttonFloor").setIcon(setIcon);
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonArea").setIcon("");
                this.byId("buttonPrice").setIcon("");
            }else if(oId === "container-enterprises---simulateProposal--buttonColumn"){
                this.byId("buttonColumn").setIcon(setIcon);
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonArea").setIcon("");
                this.byId("buttonPrice").setIcon("");
            }else if(oId === "container-enterprises---simulateProposal--buttonSituation"){
                this.byId("buttonSituation").setIcon(setIcon);
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonArea").setIcon("");
                this.byId("buttonPrice").setIcon("");
            }else if(oId === "container-enterprises---simulateProposal--buttonArea"){
                this.byId("buttonArea").setIcon(setIcon);
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonPrice").setIcon("");
            }else {
                this.byId("buttonPrice").setIcon(setIcon);
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonArea").setIcon("");
            }
        },

        /* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
        _onObjectMatched: function() { 
            /*this.getModel("graphic").setData(Graphic.initSelectionModel());
            this.getModel("graphic").refresh(true);
            this.getModel("units").setData(Units.initSelectionModel());
            this.getModel("units").refresh(true);*/

            let libraries = sap.ui.getVersionInfo().libraries || [];
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
                this.getView().byId('simulateProposalGraphic').setFlexContent(oChartContainer);
            }
            
            this.getView().byId("idVizFrame").setVizProperties({
                plotArea: {
                    dataLabel: {
                        visible: true
                    }
                },
                title: {
                    text: this.getResourceBundle().getText("informationVizFrameTitle")
                }
            });
        }

	});
});