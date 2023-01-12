sap.ui.define([
	"./BaseController",
    "sap/ui/Device"
], function(
    BaseController,
	Device
) {
	"use strict";

	return BaseController.extend("com.itsgroup.brz.enterprises.controller.Information", {

        /**
         * @override
         */
        onInit: function() {        
            this.getRouter().getRoute("information").attachPatternMatched(this._onObjectMatched.bind(this), this);
        },

        _onObjectMatched: async function(oEvent) {
            let orgId    = oEvent.getParameter("arguments").orgId,
                orgPath  = oEvent.getParameter("arguments").orgPath;

            this.setAppBusy(true);       
            
            let oModel = await this._searchEnterprises(orgId);
            
            this.getModel("enterprises").setData(oModel);
            this.getModel("enterprises").refresh(true);

            this.setAppBusy(false);

            this.getView().bindElement({
                path: "/",
                model: "enterprises"
            });

            //inicializa as config do vizFrame(Gráfico)
            this._ajustLayoutVizFrame();

            //Inicia o Mapa com o ponto marcado nele
            this._initializeMap(oModel.address || "");
        },

        _initializeMap: function(sAddress) {
            


            let geoCoder = new google.maps.Geocoder();

            geoCoder.geocode({ address: sAddress })
            .then(result => {
                const { results } = result;
                let string        = JSON.stringify(result, null, 2);
                let resutlJSON    = JSON.parse(string);

                let aStringLat = `${resutlJSON.results[0].geometry.location.lat}`;
                let aStringLng = `${resutlJSON.results[0].geometry.location.lng}`;

                let sLat = Number(aStringLat.substring(0, 11)),
                    sLng = Number(aStringLng.substring(0, 11));


                const mapOptions = {
                    zoom: 15,
                    center: { lat: sLat, lng: sLng },
                };
    
                let oMap = new google.maps.Map(this.getView("information").byId("map").getDomRef(), mapOptions);
                new google.maps.Marker({
                    position: { lat: sLat, lng: sLng },
                    map: oMap,
                });
            });           
        },

        _ajustLayoutVizFrame: function() {
            if (Device.system.phone) {
                this.getView().byId("informationGraphic").setVertical(true);

                let libraries = sap.ui.getVersionInfo().libraries || [];
                let bSuiteAvailable = libraries.some(function(lib){
                    return lib.name.indexOf("sap.suite.ui.commons") > -1;
                });
                if (bSuiteAvailable) {
                    jQuery.sap.require("sap/suite/ui/commons/ChartContainer");
                    let vizframe = this.getView().byId("idVizFrame");
                    let oChartContainerContent = new sap.suite.ui.commons.ChartContainerContent({
                        icon : "sap-icon://pie-chart",
                        title : this.getResourceBundle().getText("informationVizFrameTitle"),
                        content : [ vizframe ]
                    });
                    let oChartContainer = new sap.suite.ui.commons.ChartContainer({
                        content : [ oChartContainerContent ]
                    });
                    oChartContainer.setShowFullScreen(true);
                    oChartContainer.setAutoAdjustHeight(true);
                    oChartContainer.setShowZoom(false);
                    this.getView().byId('informationGraphic').setFlexContent(oChartContainer);
                }

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
        },

        _searchEnterprises: async function(sOrgId){
            let oItemsPartner = await this.callServiceFormatedJSON(`PartnerCollection?$filter=IDEmpreendimento_KUT eq '${sOrgId}'&$format=json`).method('GET');

            let oDataProducts = await this.callService(`ProductCollection?$filter=startswith(ProductID, 'E${String(sOrgId).padStart(4, "0")}')&$orderby=Bloco_KUTText asc&$format=json`).method('GET');

            let aSituations = [],
                countEXC    =0,/*50, 700*/
                countA      =0,/*100*/ 
                countR      =0,/*200, 250*/
                countRC     =0,/*300, 400*/
                countSig    =0,/*441, 443*/ 
                countSC     =0,/*442*/ 
                countIN     =0,/*800, 801, 802*/
                countS      =0,/*900*/ 
                countAll    =0;
                
            if(oItemsPartner != undefined){
                if(oDataProducts.length != 0){
                    for(let oProduct of oDataProducts){
                        countAll++;

                        if(oProduct.ZSalesStat_KUT === "50" || //Negociado Como Permuta
                            oProduct.ZSalesStat_KUT === "700" ) //Permuta
                        {
                            countEXC++;
                        }else
                        if(oProduct.ZSalesStat_KUT === "100"|| //Disponível para Venda
                            oProduct.ZSalesStat_KUT === "444"|| //Proposta Cancelada
                            oProduct.ZSalesStat_KUT === "445" ) //Distratada
                        {
                            countA++;
                        }else
                        if(oProduct.ZSalesStat_KUT === "200"|| //Reservado para Venda
                            oProduct.ZSalesStat_KUT === "250" ) //Bloqueado
                        {
                            countR++;
                        }else
                        if(oProduct.ZSalesStat_KUT === "300"|| //Reserva Técnica/Caucionado
                            oProduct.ZSalesStat_KUT === "400" ) //Reservado pela Empresa
                        {
                            countRC++;
                        }else
                        if(oProduct.ZSalesStat_KUT === "441"|| //Em Assinatura
                            oProduct.ZSalesStat_KUT === "443" ) //Contrato em assinatura
                        {
                            countSig++;
                        }else
                        if(oProduct.ZSalesStat_KUT === "442") //Contrato Assinado
                        {
                            countSC++;
                        }else
                        if(oProduct.ZSalesStat_KUT === "800"|| //Em negociação
                            oProduct.ZSalesStat_KUT === "801"|| //Contrato em Correção
                            oProduct.ZSalesStat_KUT === "802" ) //Em Proposta
                        {
                            countIN++;
                        }else
                        if(oProduct.ZSalesStat_KUT === "900") //Vendido
                        {
                            countS++;
                        }
                    };

                    countEXC != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("mainExchange"),
                        theAmount: countEXC,
                    }) : "";

                    countA != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("priceListAvailable"),
                        theAmount: countA,
                    }) : "";

                    countR != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("priceListReserved"),
                        theAmount: countR,
                    }) : "";

                    countRC != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("mainReservedCompany"),
                        theAmount: countRC
                    }) : "";

                    countSig != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("mainSignature"),
                        theAmount: countSig
                    }) : "";

                    countSC != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("mainSignedContract"),
                        theAmount: countSC
                    }) : "";

                    countIN != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("mainInNegociation"),
                        theAmount: countIN
                    }) : "";

                    countS != 0 ? aSituations.push({
                        name: this.getResourceBundle().getText("mainSold"),
                        theAmount: countS
                    }) : "";

                    return{
                        id: oItemsPartner.IDEmpreendimento_KUT,
                        title: oItemsPartner.BusinessPartnerFormattedName,
                        address: oItemsPartner.FormattedPostalAddressDescription,
                        situation: aSituations
                    };          
                }
            }
        },

        onNavBack: function() {
            history.go(-1);
        },
            
	});
});