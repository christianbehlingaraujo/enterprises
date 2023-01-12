sap.ui.define([
    "./BaseController",
    "../model/enterprises",
    "../model/city",
    "../model/entityMainView",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Carousel",
    "sap/m/Image",
    "sap/m/Button",
    "sap/ui/Device"
],
    function (
    BaseController,
	Enterprises,
	City,
	EntityMainView,
	Sorter,
	Filter,
	FilterOperator,
	JSONModel,
	Dialog,
    Carousel,
    Image,
    Button,
    Device
    ){
        "use strict";

        return BaseController.extend("com.itsgroup.brz.enterprises.controller.Main", {
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            onInit: function () {
                this.getRouter().getRoute("main").attachPatternMatched(this._onObjectMatched.bind(this), this);
            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */
            onNavToInformation: function (oEvent) {
                let orgPath = oEvent.getSource().oParent.oParent.oParent.getBindingContext("enterprises").getPath(),
                    oOrg    = orgPath.split("/").slice(-1).pop(),
                    oItems  = this.getModel("enterprises").getData().items;

                this.getRouter().navTo("information",{
                    orgId: oItems[oOrg].id,
                    orgPath: oOrg
                })
            },

            onSearchEnterprises: function(oEvent){
                let oTab     = this.byId("gridList"),
                    oBinding = oTab.getBinding("items");

                if (oEvent.getParameters().refreshButtonPressed) {
                    // Search field's 'refresh' button has been pressed.
                    // This is visible if you select any master list item.
                    // In this case no new search is triggered, we only
                    // refresh the list binding.
                    oBinding.refresh(true)
                } else {
                    let sQuery            = oEvent.getParameter("query"),
                        aTableSearchState = [];

                    if (sQuery && sQuery.length > 0) {
                        aTableSearchState = new Filter({
                            and: false,
                            filters: [
                                new Filter("title", FilterOperator.Contains, sQuery)
                            ]
                        })
                    }
                    
                    oBinding.filter(aTableSearchState, "Application");
                }
            },

            onFilterTab: function (oEvent) {
                let oModel = this.getModel("mainView").getData();

                this._filterEnterprises(oModel.selectionPropertyType, oModel.selectionWorkStage,
                                            oModel.selectionTypology    , oModel.selectionCity);
                
            },
            
            /*onSimulateProposal: function (oEvent) {
                this.getRouter().navTo("simulateProposal");
            },*/

            onAvailabilityMap: function (oEvent) {
                let orgPath = oEvent.getSource().oParent.oParent.oParent.getBindingContext("enterprises").getPath(),
                    oOrg    = orgPath.split("/").slice(-1).pop(),
                    oItems  = this.getModel("enterprises").getData().items;

                this.getRouter().navTo("availabilityMap",{
                    orgId: oItems[oOrg].id,
                });
            },
            
            onPriceList: function (oEvent) {
                let orgPath = oEvent.getSource().oParent.oParent.oParent.getBindingContext("enterprises").getPath(),
                    oOrg    = orgPath.split("/").slice(-1).pop(),
                    oItems  = this.getModel("enterprises").getData().items;

                this.getRouter().navTo("priceList",{
                    orgId: oItems[oOrg].id
                });
            },

            //Ordenar Empreendimentos por Nome, unidades disponiveis, 
            //data de entrega e data de lançamento
            onSortEnterprises: function (oEvent) {
                let oID      = oEvent.getParameter("id"),
                    oText    = oEvent.getSource().getProperty("text").replace("↑", "").replace("↓", "").replace(" ", ""),
                    oToolTip = oEvent.getSource().getTooltip(),
                    setSymbol,
                    setToolTip,
                    bSort;

                if(oToolTip === "↑") {
                    setSymbol  = `${oText} ↓`
                    setToolTip = "↓";
                    bSort      = true;
                }else if(oToolTip === "↓"){
                    setSymbol  = `${oText} ↑`
                    setToolTip = "↑";
                    bSort      = false;
                }else {
                    setSymbol  = `${oText} ↑`
                    setToolTip = "↑";
                    bSort      = false;
                }

                if(oID === "container-enterprises---main--buttonName" || 
                   oID === "application-Enterprises-Display-component---main--buttonName"){
                    this.byId("buttonName").setText(setSymbol);
                    this.byId("buttonName").setTooltip(setToolTip);
                    this.byId("buttonUnitAvailable").setText(this.getResourceBundle().getText("mainAvailableUnits"));
                    this.byId("buttonDeliveryDate").setText(this.getResourceBundle().getText("mainDeliveryDate"));
                    this.byId("buttonReleaseDate").setText(this.getResourceBundle().getText("mainReleaseDate"));

                    let oSorter = [new Sorter("title", bSort)];
                    this.byId("gridList").getBinding("items").sort(oSorter);

                }else if(oID === "container-enterprises---main--buttonUnitAvailable"|| 
                         oID === "application-Enterprises-Display-component---main--buttonUnitAvailable"){
                    this.byId("buttonName").setText(this.getResourceBundle().getText("mainName"));
                    this.byId("buttonUnitAvailable").setText(setSymbol);
                    this.byId("buttonUnitAvailable").setTooltip(setToolTip);
                    this.byId("buttonDeliveryDate").setText(this.getResourceBundle().getText("mainDeliveryDate"));
                    this.byId("buttonReleaseDate").setText(this.getResourceBundle().getText("mainReleaseDate"));

                    let oSorter = [new Sorter("available", bSort)];
                    this.byId("gridList").getBinding("items").sort(oSorter);

                }else if(oID === "container-enterprises---main--buttonDeliveryDate" || 
                         oID === "application-Enterprises-Display-component---main--buttonDeliveryDate"){
                    this.byId("buttonName").setText(this.getResourceBundle().getText("mainName"));
                    this.byId("buttonUnitAvailable").setText(this.getResourceBundle().getText("mainAvailableUnits"));
                    this.byId("buttonDeliveryDate").setText(setSymbol);
                    this.byId("buttonDeliveryDate").setTooltip(setToolTip);
                    this.byId("buttonReleaseDate").setText(this.getResourceBundle().getText("mainReleaseDate"));

                    let oSorter = [new Sorter("deliveryDate", bSort)];
                    this.byId("gridList").getBinding("items").sort(oSorter);

                }else {
                    this.byId("buttonName").setText(this.getResourceBundle().getText("mainName"));
                    this.byId("buttonUnitAvailable").setText(this.getResourceBundle().getText("mainAvailableUnits"));
                    this.byId("buttonDeliveryDate").setText(this.getResourceBundle().getText("mainDeliveryDate"));
                    this.byId("buttonReleaseDate").setText(setSymbol);
                    this.byId("buttonReleaseDate").setTooltip(setToolTip);

                    let oSorter = [new Sorter("deliveryDate", bSort)];
                    this.byId("gridList").getBinding("items").sort(oSorter);

                }
            },

            onPressImage: async function(oEvent){
                this.setAppBusy(true);

                let oKey             = Number(oEvent.getSource().getDependents()[0].getProperty("text")),
                    oItemsEnteprises = this.getModel("enterprises").getData().items;

                let oItem = oItemsEnteprises.find(sItem => {
                    if(sItem.key === oKey) return sItem;
                });

                if(oItem.images.length === 1){
                    let oPartnerAttachment = await this.callService(`PartnerCollection('${oItem.objectID}')/PartnerAttachment?$filter=TypeCode eq 'Z55'&$format=json`).method('GET');

                    let oImages = this._filterTheData(oPartnerAttachment, "TypeCode", "Z55");

                    if(oImages.length != 0){
                        oImages.map(sItem => {
                            oItem.images.push(sItem);
                        });
                    }
                }

                this.getModel("imagesEnterprise").setData({ images: oItem.images });
                this.getModel("imagesEnterprise").refresh(true);

                if(this._oDialogImage){
                    this._oDialogImage = undefined;

                    this.getView().destroyDependents();
                }

                if(!this._oDialogImage){
                    this._oDialogImage = new Dialog({
                        //title: this.getResourceBundle().getText("mainTitleDialogImage"),
                        content: new Carousel({
                            height: "100%",
                            width: "100%",
                            pages: { 
                                path: 'imagesEnterprise>/images',
                                template: new Image({
                                    alt: '{imagesEnterprise>name}',
                                    src: '{imagesEnterprise>src}',
                                    height: "{imagesEnterprise>height}",
                                    width: "{imagesEnterprise>width}"
                                })
                            }
                        }),
                        endButton: new Button({
                            text: this.getResourceBundle().getText("proponentButtonCancel"),
                            press: function () {
                                this._oDialogImage.close();
                            }.bind(this)
                        })
                    });

                    this.getView().addDependent(this._oDialogImage);
			    }

			    this._oDialogImage.open();

                this.setAppBusy(false);
            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */
            _onObjectMatched: async function(oEvent) { 
                let oUserInfo,
                    oEmail;

                try {
                    oUserInfo = sap.ushell.Container.getService("UserInfo");
                } catch (error) {}
                
                if (oUserInfo != undefined && oUserInfo != "") {
                    oEmail = oUserInfo.getEmail();
                } else {
                    //oEmail = "alexandre.andrade@itsgroup.com.br";
                    oEmail = "alexandre.s.andrade@hotmail.com";
                    //oEmail = "corretor.teste8@getnada.com";
                }

                this.getModel("enterprises").setData(Enterprises.initModel());
                this.getModel("enterprises").refresh(true);

                this.getModel("city").setData(City.initSelectionModel());
                this.getModel("city").refresh(true);

                this.getModel("mainView").setData(EntityMainView.initSelectionModel());
                this.getModel("mainView").refresh(true);

                this.setAppBusy(true);

                //let oDataCharacteristic = await this.callService("ProductCaracteristica_KUTCollection?$format=json").method('GET');
                let oCharacteristic = [{ Code: "Todas", Description: "Todas" }];
                /*for(let oItem of oDataCharacteristic){
                    oCharacteristic.push(oItem);
                }*/
                this.getModel("characteristic").setData({ items: oCharacteristic })
                this.getModel("characteristic").refresh(true);
                
                let oCitiesUnique = [{CityName: "Todas" , RegionCode: ""}];

                let oDataOrganisational = await this.callService("OrganisationalUnitNameAndAddressCollection?$format=json").method('GET');

                //let oDataOrgUnit        = await this.callServiceZ("BusinessPartnerCollection?$filter=IDEmpreendimento_KUT ne ' '&$format=json").method('GET');

                for(let oCity of oDataOrganisational){
                    if(oCitiesUnique.length === 0){
                        oCitiesUnique.push({CityName: oCity.CityName, RegionCode: ` (${oCity.RegionCode})`});
                    }else {
                        let indentical = oCitiesUnique.find(city => {
                            if(city.CityName === oCity.CityName){
                                return city;
                            }
                        });

                        if(indentical === undefined){
                            if(oCity.CityName != "" && oCity.RegionCode != ""){
                                oCitiesUnique.push({CityName: oCity.CityName, RegionCode: ` (${oCity.RegionCode})`});
                            }
                        }
                    }
                }

                this.getModel("city").getData().items = oCitiesUnique;
                this.getModel("city").refresh(true);
                
                this.objectRoles = await this._searchUserBusinessRoles(oEmail);

                await this._searchEnterprises();
                
                this.setAppBusy(false);
            },

            _searchPartnerAttachment: async function(){
                let oDataPartner;

                let oPromise = new Promise(
                    function(resolve, reject){
                        this.getModel().read("/PartnerCollection",{
                            urlParameters:{ 
                                "$expand": 'PartnerAttachment',
                            },
                            success: function(oData){
                                resolve(oData.results);
                            }.bind(this),
                            error: function(oError){
                                reject(oError);
                            }.bind(this)
                        });
                    }.bind(this)
                );

                await oPromise.then(
                    function(oData){ 
                        oDataPartner = oData 
                    }.bind(this)
                ).catch(
                    function(oError){ 
                        oDataPartner = oError 
                    }.bind(this)
                );

                return oDataPartner;
            },

            _searchEnterprises: async function(){
                let oOrgItems     = [],
                    oFilterOrgIDs = "";

                this.getModel("enterprises").getData().items = [];

                //Busca relação de corretor x imobiliaria
                let oBrokers = await this.callService(`BusinessPartnerRelationshipCollection?$filter=RelationshipType eq 'ZCRM08' and FirstBusinessPartnerID eq '${this.objectRoles.BusinessPartnerID}'&$format=json&$select=SecondBusinessPartnerID,FirstBusinessPartnerName_SDK,FirstBusinessPartnerID`).method('GET');

                if(oBrokers.length != 0){
                    for(let oBroker of oBrokers){
                        //Relação entre imobiliárias e empreendimento
                        let oPartnerOrgs = await this.callService(`PartnerSalesOrganisationCollection?$format=json&$expand=Partner&$select=SalesOrganisationID&$filter=PartnerID eq '${oBroker.SecondBusinessPartnerID}'`).method('GET');
                        
                        //incrementa o array e verifica se á duplicados
                        oPartnerOrgs.map(sItem => {
                            let oOrgID = oOrgItems.find(sOrg => {
                                if(sOrg.ID === sItem.SalesOrganisationID) return sOrg
                            });

                            if(oOrgID === undefined){
                                oOrgItems.push({ ID: sItem.SalesOrganisationID });
                            }
                        });
                    }
                }

                if(oOrgItems.length != 0){
                    oOrgItems.map(sOrg => {
                        if(oFilterOrgIDs === ""){
                            oFilterOrgIDs = `IDEmpreendimento_KUT eq '${sOrg.ID}'`;
                        }else{
                            oFilterOrgIDs += `or IDEmpreendimento_KUT eq '${sOrg.ID}'`;
                        }
                    });
                }

                //let oItemsPartners = await this.callService(`PartnerCollection?$filter=ClassificacaoParceiro_KUT eq '6' and Empreendimentovisvel_KUT eq true&$expand=PartnerAttachment&$format=json`).method('GET');
                let oItemsPartners = await this.callService(`PartnerCollection?$filter=ClassificacaoParceiro_KUT eq '6' and Empreendimentovisvel_KUT eq true and (${oFilterOrgIDs})&$format=json`).method('GET');
                
                if(oItemsPartners != undefined){
                    if(oItemsPartners.length != 0){
                        for(let oItemPartner of oItemsPartners){
                            let oImages = [],
                                oImagesEnterprisesVisible,
                                oImageStandardVisible;

                            let oPartnerAttachment = await this.callService(`PartnerCollection('${oItemPartner.ObjectID}')/PartnerAttachment?$filter=TypeCode eq 'Z51'&$format=json`).method('GET');

                            oImages = this._filterTheData(oPartnerAttachment, "TypeCode", "Z51");

                            if(oImages.length != 0){
                                oImagesEnterprisesVisible = true;
                                oImageStandardVisible     = false;
                            }else{
                                oImagesEnterprisesVisible = false;
                                oImageStandardVisible     = true;
                            }
                                
                            let deliveryDate = this._formatedDate(oItemPartner.Datadaentrega_KUT),
                                oValueUnit,
                                oPositionValueUnit = oItemPartner.ValordaUnidadeContent_KUT.indexOf(".");

                            if(oPositionValueUnit != -1) oValueUnit = oItemPartner.ValordaUnidadeContent_KUT.replace(".", "").substring(0, oPositionValueUnit + 2);
                            else oValueUnit = oItemPartner.ValordaUnidadeContent_KUT;

                            this.getModel("enterprises").getData().items.push({
                                key: Math.random(),
                                id: oItemPartner.IDEmpreendimento_KUT,
                                objectID: oItemPartner.ObjectID,
                                image: oImages.length != 0 ? oImages[0].src : "",
                                imagesEnterprises: oImagesEnterprisesVisible,
                                imageStandard: oImageStandardVisible,
                                title: oItemPartner.Name,
                                deliveryDate: deliveryDate,
                                internship: oItemPartner.EstagiodaObra_KUTText,
                                available: `${oItemPartner.Unidadesdisponiveis_KUT}/${oItemPartner.QuantidadeUnidades_KUT}`,
                                blocked: oItemPartner.Unidadesreservadas_KUT,
                                city: oItemPartner.City,
                                cityFormated: `${oItemPartner.City} (${oItemPartner.Regional_KUT})`,
                                price: this._formateValue(oValueUnit, undefined),
                                address: oItemPartner.FormattedPostalAddressDescription,
                                visible: oItemPartner.Empreendimentovisvel_KUT,
                                active: oItemPartner.EmpreendimentoAtivo_KUT,
                                images: oImages.length != 0 ? oImages : []
                            });
                        }
                        this.getModel("enterprises").refresh(true);
                    }else{
                        let oTitle = "Parâmetros de exibição",
                            oText  = "Usuário faltando relação com empreendimento!";
            
                        this.toPageNotFound(oTitle, oText);
                    }
                }else{
                    let oTitle = "Parâmetros de exibição",
                        oText  = "Usuário faltando relação com empreendimento!";
        
                    this.toPageNotFound(oTitle, oText);
                }
            },

            _filterEnterprises: async function(sPropertyType, sWorkStage, sTypology, sCity) {
                let oBinding = this.byId("gridList").getBinding("items");

                let oFilter = {
                    "propertyType" : [new Filter("city", FilterOperator.EQ, sPropertyType )],
                    "workStage"    : [new Filter("city", FilterOperator.EQ, sWorkStage )],
                    "typology"     : [new Filter("city", FilterOperator.EQ, sTypology )],
                    "city"         : [new Filter("city", FilterOperator.EQ, sCity )],
                    "all"          : [
                        new Filter({
                            path: "city", 
                            operator: FilterOperator.NE, 
                            value1: "" ,
                            and: true
                        }),
                        new Filter({
                            path: "city", 
                            operator: FilterOperator.NE, 
                            value1: "" ,
                            and: true
                        }),
                        new Filter({
                            path: "city", 
                            operator: FilterOperator.NE, 
                            value1: "" ,
                            and: true
                        }),
                        new Filter({
                            path: "city", 
                            operator: FilterOperator.NE, 
                            value1: "" ,
                            and: true
                        })
                    ]
                }

                if(sPropertyType === "Todas" &&
                   sWorkStage    === "Todas" &&
                   sTypology     === "Todas" &&
                   sCity         === "Todas" )
                {   
                    oBinding.filter(oFilter["all"]);
                }else 
                if(sPropertyType === "Todas" &&
                   sWorkStage    === "Todas" &&
                   sTypology     === "Todas" &&
                   sCity         !=  "Todas") 
                {
                    oBinding.filter(oFilter["city"]);
                }
                
            }
        });
    });
