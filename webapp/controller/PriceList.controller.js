sap.ui.define([
	"./BaseController",
    "../model/formatter",
    "../model/PriceTable",
    "../model/columnsExcel",
    'sap/ui/export/library',
    "sap/ui/export/Spreadsheet",
    "sap/ui/model/Sorter",
    "sap/ui/table/library",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
    "sap/ui/model/json/JSONModel"
], function(
	BaseController,
    Formatter,
    PriceTable,
    ColumnsExcel,
    exportLibrary,
    Spreadsheet,
    Sorter,
    Library,
    Filter,
    FilterOperator,
    FilterType,
    JSONModel
) {
	"use strict";

	return BaseController.extend("com.itsgroup.brz.enterprises.controller.PriceList", {
        formatter: Formatter,
        
        /* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
        onInit: function() {
            this.getRouter().getRoute("priceList").attachPatternMatched(this._onObjectMatched.bind(this), this);
        },

        /* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
        onQuickFilter: function(oEvent){
            let oBinding = this._oTable.getBinding("items"),
				sKey     = oEvent.getParameter("selectedKey");

			oBinding.filter(this._mFilters[sKey], "Application");
        },

        onUpdateFinished: function(oEvent) {
            let sTitle,
                oTable      = oEvent.getSource(),
                oViewModel  = this.getModel("priceTableProperty"),
                priceTable  = this.getModel("priceTable").getData(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("priceListTableTextCout", [iTotalItems]);
                    
                let countEXC =0,/*50, 700*/
                    countA   =0,/*100*/ 
                    countR   =0,/*200, 250*/
                    countRC  =0,/*300, 400*/
                    countSig =0,/*441, 443*/ 
                    countSC  =0,/*442*/ 
                    countIN  =0,/*800, 801, 802*/
                    countS   =0;/*900*/

                for(let line of priceTable.items){
                    if(line.status === "50" || //Negociado Como Permuta
                       line.status === "700" ) //Permuta
                    {
                        countEXC++;
                    }else
                    if(line.status === "100"|| //Disponível para Venda
                       line.status === "444"|| //Proposta Cancelada
                       line.status === "445" ) //Distratada
                    {
                        countA++;
                    }else
                    if(line.status === "200"|| //Reservado para Venda
                       line.status === "250" ) //Bloqueado
                    {
                        countR++;
                    }else
                    if(line.status === "300"|| //Reserva Técnica/Caucionado
                       line.status === "400" ) //Reservado pela Empresa
                    {
                        countRC++;
                    }else
                    if(line.status === "441"|| //Em Assinatura
                       line.status === "443" ) //Contrato em assinatura
                    {
                        countSig++;
                    }else
                    if(line.status === "442") //Contrato Assinado
                    {
                        countSC++;
                    }else
                    if(line.status === "800"|| //Em negociação
                       line.status === "801"|| //Contrato em Correção
                       line.status === "802" ) //Em Proposta
                    {
                        countIN++;
                    }else
                    if(line.status === "900") //Vendido
                    {
                        countS++;
                    }
                }

                oViewModel.setProperty("/countAll", iTotalItems);
                oViewModel.setProperty("/exchange", countEXC);
                oViewModel.setProperty("/available", countA);
                oViewModel.setProperty("/reserved", countR);
                oViewModel.setProperty("/reservedCompany", countRC);
                oViewModel.setProperty("/signature", countSig);
                oViewModel.setProperty("/signedContract", countSC);
                oViewModel.setProperty("/inNegociation", countIN);
                oViewModel.setProperty("/sold", countS);            
                
            } else {
				sTitle = this.getResourceBundle().getText("priceListTableText");
			}
			this.getModel("priceTableProperty").setProperty("/priceListTableTitle", sTitle);
        },
        
        onPress : function (oEvent) {
			this._showObject(oEvent);
		},

        onSearch: function(oEvent) {
            let oTable   = this.byId("priceTable"),
			    oBinding = oTable.getBinding("items");

            if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
                oBinding.refresh(true);
			} else {
				let aTableSearchState = [];
				let sQuery 			  = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
                    aTableSearchState = new Filter({
                        and: false,
                        filters: [
                            new Filter("block",     FilterOperator.Contains, sQuery),
                            new Filter("unit",      FilterOperator.Contains, sQuery),
                            new Filter("area",      FilterOperator.Contains, sQuery),
                            new Filter("price",     FilterOperator.Contains, sQuery),
                            new Filter("vacancies", FilterOperator.Contains, sQuery),
                            new Filter("unitValue", FilterOperator.Contains, sQuery),
                            //new Filter()
                        ]
                    })
       
				}
				
                oBinding.filter(aTableSearchState, "Application");
			}
        },

        onOrderFilter: function(oEvent) {
            let oId       = oEvent.getParameters().id,
                oIcon     = oEvent.getSource().getProperty("icon"),
                setIcon,
                bSort;

            if(oIcon === "sap-icon://sort-ascending") {
                setIcon = "sap-icon://sort-descending";
                bSort   = true;
            }else if(oIcon === "sap-icon://sort-descending"){
                setIcon = "sap-icon://sort-ascending";
                bSort   = false;
            }else {
                setIcon = "sap-icon://sort-ascending";
                bSort   = false;
            }

            if(oId === "container-enterprises---priceList--buttonFloor" ||
               oId === "application-Enterprises-Display-component---priceList--buttonFloor")
            {
                this.byId("buttonFloor").addStyleClass("buttonsOrdersColor");
                this.byId("buttonFloor").setIcon(setIcon);
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonColumn").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonSituation").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonArea").setIcon("");
                this.byId("buttonArea").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonPrice").setIcon("");
                this.byId("buttonPrice").removeStyleClass("buttonsOrdersColor");

                let oSorter = [new Sorter("block", bSort)];
                this._oTable.getBinding("items").sort(oSorter);
            }else 
             if(oId === "container-enterprises---priceList--buttonColumn" ||
                oId === "application-Enterprises-Display-component---priceList--buttonColumn")
            {
                this.byId("buttonColumn").addStyleClass("buttonsOrdersColor");
                this.byId("buttonColumn").setIcon(setIcon);
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonFloor").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonSituation").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonArea").setIcon("");
                this.byId("buttonArea").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonPrice").setIcon("");
                this.byId("buttonPrice").removeStyleClass("buttonsOrdersColor");

                let oSorter = [new Sorter("unit", bSort)];
                this._oTable.getBinding("items").sort(oSorter);

            }else 
             if(oId === "container-enterprises---priceList--buttonSituation" ||
                oId === "application-Enterprises-Display-component---priceList--buttonSituation")
            {
                this.byId("buttonSituation").addStyleClass("buttonsOrdersColor");
                this.byId("buttonSituation").setIcon(setIcon);
                this.byId("buttonFloor").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonColumn").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonArea").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonArea").setIcon("");
                this.byId("buttonPrice").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonPrice").setIcon("");

                let oSorter = [new Sorter("status", bSort)];
                this._oTable.getBinding("items").sort(oSorter);

            }else 
             if(oId === "container-enterprises---priceList--buttonArea" ||
                oId === "application-Enterprises-Display-component---priceList--buttonArea")
            {
                this.byId("buttonArea").addStyleClass("buttonsOrdersColor");
                this.byId("buttonArea").setIcon(setIcon);
                this.byId("buttonFloor").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonColumn").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonSituation").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonPrice").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonPrice").setIcon("");

                let oSorter = [new Sorter("area", bSort)];
                this._oTable.getBinding("items").sort(oSorter);
            }else {
                this.byId("buttonPrice").addStyleClass("buttonsOrdersColor");
                this.byId("buttonPrice").setIcon(setIcon);
                this.byId("buttonFloor").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonFloor").setIcon("");
                this.byId("buttonColumn").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonColumn").setIcon("");
                this.byId("buttonSituation").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonSituation").setIcon("");
                this.byId("buttonArea").removeStyleClass("buttonsOrdersColor");
                this.byId("buttonArea").setIcon("");

                let oSorter = [new Sorter("unitValue", bSort)];
                this._oTable.getBinding("items").sort(oSorter);
            }
        },

        onExportPDF: async function() {
            let oTable    = this.byId("priceTable"),
                //oItems    = oTable.getBinding("items"),
                oModel        = this.getModel("priceTable").getData(),
                oKeysSelected = Formatter.keyStatus(this.byId("iconTabBar").getSelectedKey()),
                oItems        = [],
                oMod          = "",
                oNewDate      = new Date(),
                oDayDate      = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "dd/MM/yyyy HH:mm:ss",
                    UTC: false
                }).format(oNewDate);

            if(oKeysSelected != ""){
                oItems = oModel.items.filter(sItem => {
                    let oStatus = oKeysSelected.find(status =>{
                        if(sItem.status === status) return status;
                    });
    
                    if(oStatus != undefined) return sItem;
                });
            }
            else oItems = oModel.items;

            //Ordena tabela pelo bloco e unidade
            oItems.sort(function(sItemOne, sItemTwo){
                return sItemOne.blockUnit == sItemTwo.blockUnit ? 0 : sItemOne.blockUnit > sItemTwo.blockUnit ? 1 : -1
            });

            if(oModel.radioButtonCVAValue) oMod = "CVA";
            else oMod = "SBPE";
            
            let divMain = `<div id='table' style='width: 100%; height: auto; border: 1px solid black; position: relative; margin: 0px'>`;
            //primeira linha do header
            let header  = `<div style='width: 100%; height: 50px; top: -1px; left: -1px; border: 1px solid black; position: absolute; display: flex; '> 
                                <div style='width: 33%;'>              
                                    <div style="width: 34px; height: 34px; margin-top: 8px; margin-left: 8px; content: url(../img/icon/BRZ_LOGO.png);"></div>
                                </div>
                                <div style='width: 33%;'>              
                                    <p style='text-align: center; font-weight: bold; '>${this.getResourceBundle().getText("priceListHeaderTitleUPERCASE")}</p>
                                </div>
                                <div style='width: 33%; text-align: center; justify-content: center;'>              
                                    <p style='text-align: right;'>${oDayDate}</p>
                                </div>
                           </div>`

                //segunda linha do header
                header += `<div style='width: 100%; height: 30px; margin-top: 50px; left: -1px; border: 1px solid black; position: absolute; background-color: rgba(229, 229, 229, 1); '>
                            <p style='text-align: left; margin-block-start: 5px; font-weight: bold;  margin-left: 5px'>
                            ${this.getResourceBundle().getText("priceListPDFHeaderTitle")}
                            </p>
                          </div>`

                //terceira, quarta e quinta linha, primeira e segunda coluna do header
                header += `<div style='width: 100%;'>
                                <div style='display: flex; justify-content: space-between; width: 100%; height: 30px; margin-top: 81px; left: -1px; border: 0.5px solid black; position: absolute; '>
                                    <div style='width: 100%; border: 1px solid black;'>              
                                        <p style='text-align: left; margin-block-start: 5px;  margin-left: 5px'>${this.getResourceBundle().getText("finishProposalEnterprises")}: ${oModel.nameEnterprise}</p>
                                    </div>
                                
                                    <div style='width: 100%; border: 1px solid black;'>              
                                        <p style='text-align: left; margin-block-start: 5px; margin-left: 5px; '>${this.getResourceBundle().getText("priceListHeaderTitle")}: ${oModel.namePriceList}</p>
                                    </div>
                                </div>`
                            
                header += `<div style='display: flex; justify-content: space-between; width: 100%; height: 30px; margin-top: 112px; left: -1px; border: 0.5px solid black; position: absolute; '>`
                                   
                if(oModel.radioButtonSBPEValue){
                    header += `<div style='width: 100%; border: 1px solid black;'>              
                                    <p style='text-align: left; margin-block-start: 5px; margin-left: 5px; '>${this.getResourceBundle().getText("priceListPDFValidated")} ${oModel.priceListSBPEValidityStartDate} até ${oModel.priceListSBPEValidityEndDate}</p>
                                </div> `;
                }else {
                    header += `<div style='width: 100%; border: 1px solid black;'>              
                                    <p style='text-align: left; margin-block-start: 5px; margin-left: 5px; '>${this.getResourceBundle().getText("priceListPDFValidated")} ${oModel.priceListCVAValidityStartDate} até ${oModel.priceListCVAValidityEndDate}</p>
                                </div> `;
                }

                header += `<div style='width: 100%; border: 1px solid black;'>              
                                        <p style='text-align: left; margin-block-start: 5px; margin-left: 5px; '>${this.getResourceBundle().getText("priceListPDFModality")}: ${oMod}</p>
                                    </div>
                                </div>
                            </div>
                        
                            <div style='width: 100%; height: 30px; margin-top: 142px; left: -1px; border: 1px solid black; position: absolute; background-color: rgba(229, 229, 229, 1); '> 
                                <p style='text-align: center; margin-block-start: 7px; font-weight: bold; font-size: 13px;'>${this.getResourceBundle().getText("priceListHeaderTitleUPERCASE")}</p>
                            </div>`

                //Sexta linha do header e header da tabela
                header += `<div style='width: 100%; height: 55px; margin-top: 172px; display: flex;'>       
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px; '> 
                                    <p style='text-align: center; font-size: 10px; font-weight: bold;'>
                                        ${this.getResourceBundle().getText("priceListTableUnit")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 10px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableFeature")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 10px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableArea")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTablePrice")}
                                    </p>
                                </div>`
                               /* <div style='width: 50%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                        Vagas
                                    </p>
                                </div>*/
                    header +=   `<div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableSignal")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableReadjustableTable")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableFGTS")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableFinancing")}
                                    </p>
                                </div>`
                                
                    if(oModel.radioButtonCVAValue){
                        header += `<div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                        <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                        ${this.getResourceBundle().getText("priceListTableSubsidy")}
                                        </p>
                                   </div>`
                    }

                    header += `<div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableIntermediate")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableNetValue")}
                                    </p>
                                </div>
                                <div style='width: 100%; border: 1px solid black; margin-left: -1px;'> 
                                    <p style='text-align: center; font-size: 11px; font-weight: bold;'>
                                    ${this.getResourceBundle().getText("priceListTableTableValue")}
                                    </p>
                                </div>
                           </div>`

            divMain += header;

            //Preenche tabela body
            let table     = ``,
                line      = ``,
                countLine = 1;

            for(let i=0; i < oItems.length; i++){
                let oItem = oItems[i];

                if(countLine < 18){
                    line += this._fillLineToPDF(oItem, oModel);

                    countLine++;
                }else{
                    line += this._fillLineToPDF(oItem, oModel);

                    countLine = 1;

                    table += divMain;
                    table += line;
                    table += `</div><br></br>`;

                    line = ``;
               }
            }

            if(oItems.length < 18){
                table += divMain;
                table += line;
                table += `</div><br></br>`
            }

            let countPage = oItems.length / 17,
                position  = `${countPage}`.indexOf(".");
            
            if(position != -1){
                countPage = Number(`${countPage}`.substring(0, position)) + 1;

                table += divMain;
                table += line;
                table += `</div><br></br>`
            }

            table += `<div style="width: 100%; height: auto; display: flex;">
                        <textarea name="text" id="text" cols="60" rows="40" style="width: 100%; height: auto; border: 0px; margin: 0.5rem;">${oModel.priceListSaleText}</textarea>
                    </div>`;

            let janela = window.open("","","width=100%,heigth=auto");
            janela.document.write("<html><head></head>")
            janela.document.write("<body style='margin-left: 8px; margin-rigth: 8px;'>")
            janela.document.write(table);
            janela.document.write("</body></html>");
            janela.document.close();

            setTimeout(function(){ janela.print() }, 1000);
            
        },

        onExportExcel: function() {
            let oTable        = this.byId("priceTable"),
                oModel        = this.getModel("priceTable").getData(),
                oKeysSelected = Formatter.keyStatus(this.byId("iconTabBar").getSelectedKey()),
                oItems        = [];

            if(oKeysSelected != ""){
                oItems = oModel.items.filter(sItem => {
                    let oStatus = oKeysSelected.find(status =>{
                        if(sItem.status === status) return status;
                    });
    
                    if(oStatus != undefined) return sItem;
                });
            }
            else oItems = oModel.items;

            //Ordena tabela pelo bloco e unidade
            oItems.sort(function(sItemOne, sItemTwo){
                return sItemOne.blockUnit == sItemTwo.blockUnit ? 0 : sItemOne.blockUnit > sItemTwo.blockUnit ? 1 : -1
            });

            //if(oTable){
            let oName       = this.getResourceBundle().getText("priceListTitle"),
                oEnterprise = this.getModel("priceTable").getData().nameEnterprise;

            let oColumns = this._columnsTable(oModel);

            if(oModel.radioButtonCVAValue){
                oColumns.splice(7, 0, {
                    label: this.getResourceBundle().getText("priceListTableSubsidy"),
				    property: "CVASubsidy",
				    type: sap.ui.export.EdmType.String,
                    width: "8rem"
                });
            }

            new sap.ui.export.Spreadsheet({
                workbook: { 
                    columns: oColumns
                },
                sheetName: `${oName}-${oEnterprise}`,
                metaSheetName: `${oName}-${oEnterprise}`,
                dataSource: oItems,//oTable.getBinding("items"),
                fileName: `${oName}-${oEnterprise}.xlsx`,
                worker: false
            }).build();
            //}
        },

        onSelectedRadioButton: function(oEvent){
            let oModel = this.getModel("priceTable").getData();

            if(oModel.radioButtonSBPEValue){
                oModel.SBPEVisible = true;
                oModel.CVAVisible  = false;
            }else if(oModel.radioButtonCVAValue){
                oModel.SBPEVisible = false;
                oModel.CVAVisible  = true;
            }

            this.getModel("priceTable").refresh(true);
        },

        /* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
        _onObjectMatched: async function(oEvent) {
            let oTable             = this.byId("priceTable"),
                iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

            this._oTable = oTable;

            this._mFilters = this._creatingFilters();

            let tableProperties = new JSONModel({
                priceListTableTitle : this.getResourceBundle().getText("priceListTableText"),
                exchange: 0,
                available: 0,
                reserved: 0,
                reservedCompany: 0,
                signature: 0,
                signedContract: 0,
                inNegociation: 0,
                sold: 0,
                countAll: 0
            });

            this.setModel(tableProperties ,"priceTableProperty");

            this.getModel("priceTable").setData(PriceTable.initSelectionModel());
            this.getModel("priceTable").refresh(true);

            oTable.attachEventOnce("updateFinished", function(){
				// Restore original busy indicator delay for priceList table
				tableProperties.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

            let orgId = oEvent.getParameter("arguments").orgId;

            this._searchPriceTable(orgId);
        },

        _columnsTable: function(sModel){
            let oModelProperty = {},
                oNameNetValue  = "";

            if(sModel.radioButtonSBPEValue){
                oNameNetValue = this.getResourceBundle().getText("finishProposalSBPEValue");
                oModelProperty.signal            = "SBPESignal";
                oModelProperty.FGTS              = "SBPEFGTS";
                oModelProperty.financing         = "SBPEFinancing";
                oModelProperty.readjustableTable = "SBPEReadjustableTable";
                oModelProperty.netValue          = "SBPEValue";
                oModelProperty.intermediateValue = "SBPEIntermediate";
            }else if(sModel.radioButtonCVAValue){
                oNameNetValue = this.getResourceBundle().getText("finishProposalCVAValue");
                oModelProperty.signal            = "CVASignal";
                oModelProperty.FGTS              = "CVAFGTS";
                oModelProperty.financing         = "CVAFinancing";
                oModelProperty.readjustableTable = "CVAReadjustableTable";
                oModelProperty.subsidy           = "CVASubsidy";
                oModelProperty.netValue          = "CVAValue";
                oModelProperty.intermediateValue = "CVAIntermediate";
            }


            let i18nText = {
                unit: this.getResourceBundle().getText("priceListTableUnit"),
                status: this.getResourceBundle().getText("objectPriceListStatusTitle"),
                feature: this.getResourceBundle().getText("priceListTableFeature"),
                area: this.getResourceBundle().getText("priceListTableArea"),
                price: this.getResourceBundle().getText("priceListTablePrice"),
                vacancies: this.getResourceBundle().getText("priceListTableVacancies"),
                signal: this.getResourceBundle().getText("priceListTableSignal"),
                FGTS: this.getResourceBundle().getText("priceListTableFGTS"),
                financing: this.getResourceBundle().getText("priceListTableFinancing"),
                subsidy: this.getResourceBundle().getText("priceListTableSubsidy"),
                readjustableTable: this.getResourceBundle().getText("priceListTableReadjustableTable"),
                intermediateValue: this.getResourceBundle().getText("priceListTableIntermediate"),

                netValue: oNameNetValue,
                unitValue: this.getResourceBundle().getText("finishProposalTableValue")
            }

            return ColumnsExcel.initModel(i18nText, oModelProperty);
            /*this.getModel("columnsPriceTable").setData(ColumnsExcel.initModel(i18nText, oModelProperty));
            this.getModel("columnsPriceTable").refresh(true);*/
        },

        _fillLineToPDF: function(oItem, oModel){
            let line = `
                    <div style='width: 100%; height: 50px; display: flex;'>       
                        <div style='align-items: center; justify-content: center; width: 100%; border: 1px solid black; margin-left: -1px; display: block;'> 
                            <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${Formatter.brzSalesStatusColor(oItem.status)}; margin-left: 1rem; margin-top: 0.5rem;"></div>
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%; margin-left: 0rem;'>
                            ${oItem.block} - ${oItem.unit}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%; font-align: center;'>
                            ${oItem.feature}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 14px; margin-block-start: 7%;'>
                            ${oItem.area}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.price}
                            </p>
                        </div>`
                        /*<div style='align-items: center; width: 50%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px;'>
                            ${oItem.vacancies}
                            </p>
                        </div>*/
                    
            if(oModel.radioButtonCVAValue){
                line += `<div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px;  margin-block-start: 7%;'>
                            ${oItem.CVASignal}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px;  margin-block-start: 7%;'>
                            ${oItem.CVAReadjustableTable}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.CVAFGTS}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.CVAFinancing} 
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.CVASubsidy} 
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.CVAIntermediate} 
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.CVAValue} 
                            </p>
                        </div>`
            }else{
                line += `<div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px;  margin-block-start: 7%;'>
                            ${oItem.SBPESignal}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px;  margin-block-start: 7%;'>
                            ${oItem.SBPEReadjustableTable}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.SBPEFGTS}
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.SBPEFinancing} 
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.SBPEIntermediate} 
                            </p>
                        </div>
                        <div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                            <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                            ${oItem.SBPEValue} 
                            </p>
                        </div>`
            }

            
            line += `<div style='align-items: center; width: 100%; border: 1px solid black; margin-left: -1px;'> 
                        <p style='text-align: center; font-size: 11px; margin-block-start: 7%;'>
                        ${oItem.tableValue} 
                        </p>
                    </div>
                </div>`


            return line;
        },

        _showObject: function(oItem) {
            let productPath = oItem.getSource().getBindingContext("priceTable").getPath(),
                product     = productPath.split("/").slice(-1).pop(),
                oItems      = this.getModel("priceTable").getData().items;

            this.getRouter().navTo("objectPriceList", {
                orgID: oItems[product].orgID,
                productID: oItems[product].productID,
				objectPath: product
			});
        },

        _searchPriceTable: async function(sOrgID){
            this.setAppBusy(true);
            let oModelPriceTable = this.getModel("priceTable").getData(),
                oPriceListItem,
                oPriceListItem01,
                oPriceListItem02;

            //busca as tabelas de preços
            let { oPriceList, oPriceList01, oPriceList02 } = await this._searchSalesPriceLists(sOrgID);

            if(oPriceList01 != undefined) oModelPriceTable.SBPEVisible = true;
            //if(oPriceList02 != undefined) oModelPriceTable.CVAVisible  = true;

            oModelPriceTable.nameEnterprise = oPriceList.Description;

            let oPriceListText = await this.callServiceZSaleTextFormatedJSON(`SalesPriceListCollection?$expand=SalesPriceListText&$filter=ID eq '${oPriceList.PriceDiscountListID}'&$format=json`).method("GET");
            
            if(oPriceListText != undefined){
                if(oPriceListText.SalesPriceListText.length != 0){
                    oModelPriceTable.priceListSaleText = oPriceListText.SalesPriceListText[0].Text;
                }
            }

            oModelPriceTable.namePriceList = oPriceList.Description;

            if(oPriceList01 != undefined){
                oModelPriceTable.priceListSBPEValidityStartDate = this._formatedDate(oPriceList01.ValidityStartDate);
                oModelPriceTable.priceListSBPEValidityEndDate   = this._formatedDate(oPriceList01.ValidityEndDate);
            }

            if(oPriceList02 != undefined){
                oModelPriceTable.priceListCVAValidityStartDate = this._formatedDate(oPriceList02.ValidityStartDate);
                oModelPriceTable.priceListCVAValidityEndDate   = this._formatedDate(oPriceList02.ValidityEndDate);
            }

            let oDataParms = await this.callServiceZFormatedJSON(`BusinessPartnerCollection?$filter=IDEmpreendimento_KUT eq '${sOrgID}'&$format=json`).method('GET');

            let oSignal            = this._formatedPercentageParms(oDataParms.Sinal_KUT),
                oReadjustableTable = this._formatedPercentageParms(oDataParms.Mensal_KUT),
                oFGTS              = this._formatedPercentageParms(oDataParms.FGTS2_KUT),
                oFinancing         = this._formatedPercentageParms(oDataParms.FinanciamentoCEF_KUT),
                oSubsidy           = this._formatedPercentageParms(oDataParms.Subsidio1_KUT),
                oDiscountInCash    = this._formatedPercentageParms(oDataParms.Percdescontovendavista_KUT),
                oIntermediate      = Number(oDataParms.Numeroparcelaintermediarias_KUT);

            let oDataProducts  = await this.callService(`ProductCollection?$filter=startswith(ProductID, 'E${String(sOrgID).padStart(4, "0")}')&$orderby=Bloco_KUTText asc&$format=json`).method('GET');

            if(oDataProducts.length != 0){

                for(let oProduct of oDataProducts){
                    
                    if(oProduct != undefined){
                        if(oProduct.Bloco_KUT != ""){
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
                            }

                            //TABELA DE VENDA - CVA
                            if(oPriceList02 != undefined){
                                oPriceListItem02 = oPriceList02.InternalPriceDiscountListItems.find(sItem => {
                                    if(sItem.ProductID === oProduct.ProductID) return sItem;
                                });
                            }

                            if(oPriceListItem != undefined){
                                let oSimulate,
                                    oReserved,
                                    oTableValue         = this._formatTheValueInRealWithoutDot(oPriceListItem.Amount, 2),
                                    oSBPEValue          = oPriceListItem01 != undefined ? this._formatTheValueInRealWithoutDot(oPriceListItem01.Amount, 2) : 0,
                                    oCVAValue           = oPriceListItem02 != undefined ? this._formatTheValueInRealWithoutDot(oPriceListItem02.Amount, 2) : 0,
                                    oArea               = Number(oProduct.ZPrivArea_KUT.replace(".", "")),
                                    oPriceArea          = oTableValue / oArea;

                                if(oProduct.ZSalesStat_KUT === "900" ||
                                   oProduct.ZSalesStat_KUT === "700" ||
                                   oProduct.ZSalesStat_KUT === "400" ||
                                   oProduct.ZSalesStat_KUT === "300" ||
                                   oProduct.ZSalesStat_KUT === "442" ||
                                   oProduct.ZSalesStat_KUT === "250" ||
                                   oProduct.ZSalesStat_KUT === "200" ||
                                   oProduct.ZSalesStat_KUT === "50"  )
                                {
                                    oSimulate = false;
                                    oReserved = false;
                                }else 
                                if(oProduct.ZSalesStat_KUT === "441" ||
                                   oProduct.ZSalesStat_KUT === "443" ||
                                   oProduct.ZSalesStat_KUT === "800" ||
                                   oProduct.ZSalesStat_KUT === "801" ||
                                   oProduct.ZSalesStat_KUT === "802" )
                                {
                                    oReserved = false;  
                                }else {
                                    oSimulate = true;
                                    oReserved = true;
                                }

                                oModelPriceTable.items.push({
                                    orgID: sOrgID,
                                    objectID: oPriceListItem.ObjectID,
                                    productID: oPriceListItem.ProductID,
                                    nameEnterprise: oProduct.Empreendimento_KUT,
                                    status: oProduct.ZSalesStat_KUT,
                                    statusText: oProduct.ZSalesStat_KUTText,
                                    blockUnit: `${oProduct.Bloco_KUT} - ${oProduct.Unidade_KUT}`,
                                    block: oProduct.Bloco_KUT,
                                    unit: oProduct.Unidade_KUT,
                                    feature: oProduct.Caracteristica_KUTText,
                                    area: oProduct.ZPrivArea_KUT,
                                    price: this._formateValue(oPriceArea.toString().substring(0, 7), ""),
                                    vacancies: oProduct.Descritivoregistro_KUT,
                                    SBPEValue: this._formateValue(`${oSBPEValue}`, undefined),
                                    CVAValue: this._formateValue(`${oCVAValue}`, undefined),
                                    tableValue: this._formateValue(`${oTableValue}`, ""),
                                    simulate: oSimulate,
                                    reserved: oReserved,
                                    images: [],
                                    SBPEIntermediate: oTableValue > oSBPEValue ? this._formateValue(`${oTableValue - oSBPEValue}`, undefined) : 0,
                                    CVAIntermediate: oTableValue > oCVAValue ? this._formateValue(`${oTableValue - oCVAValue}`, undefined) : 0,
                                    SBPESignal: this._formateValue(`${oSBPEValue * oSignal.percentageCalculo}`, undefined),
                                    SBPEReadjustableTable: this._formateValue(`${oSBPEValue * oReadjustableTable.percentageCalculo}`, undefined),
                                    SBPEFGTS: this._formateValue(`${oSBPEValue * oFGTS.percentageCalculo}`, undefined),
                                    SBPEFinancing: this._formateValue(`${oSBPEValue * (oFinancing.percentageCalculo + oSubsidy.percentageCalculo)}`, undefined),
                                    CVASignal: this._formateValue(`${oCVAValue * oSignal.percentageCalculo}`, undefined),
                                    CVAReadjustableTable: this._formateValue(`${oCVAValue * oReadjustableTable.percentageCalculo}`, undefined),
                                    CVAFGTS: this._formateValue(`${oCVAValue * oFGTS.percentageCalculo}`, undefined),
                                    CVAFinancing: this._formateValue(`${oCVAValue * oFinancing.percentageCalculo}`, undefined),
                                    CVASubsidy: this._formateValue(`${oCVAValue * oSubsidy.percentageCalculo}`, undefined),
                                    intermediate: oIntermediate,
                                    discountInCash: oDiscountInCash
                                });
                            }
                        }
                    }
                }
            }

            this.getModel("priceTable").refresh(true);

            this.setAppBusy(false);
        }
	});
});