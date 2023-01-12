sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"../model/images"
], function(
	BaseController,
	Formatter,
	Images
) {
	"use strict";

	return BaseController.extend("com.itsgroup.brz.enterprises.controller.ObjectPriceTable", {
		formatter: Formatter,
        /* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
        onInit: function() {
            this.getRouter().getRoute("objectPriceList").attachPatternMatched(this._onObjectMatched.bind(this), this);
        },
        /* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		onNavFinishProposal: function(oEvent){
			let oItems = this.getModel("priceTable").getData().items;

			if(oItems != undefined){
				let objectPath = oEvent.getSource().getBindingContext("priceTable").getPath(),
                	oPath      = objectPath.split("/").slice(-1).pop();

				this.getRouter().navTo("finishProposal",{
					orgID: oItems[oPath].orgID,
					productID: oItems[oPath].productID,
					opportunityID: "0"
				});
			}else {
				let oItem = this.getModel("priceTable").getData();
			
				this.getRouter().navTo("finishProposal",{
					orgID: oItem.orgID,
					productID: oItem.productID,
					opportunityID: "0"
				});
			}
		},

		
		onReservedUnit: async function(oEvent){
			this.setAppBusy(true);
	
			let	oModel	   = this.getModel("priceTable").getData();
				oObjectID  = oModel.objectID
				oProductID = oModel.productID;
	
			//Reserva a unidade para a empresa
			let bValid = await this._reservedUnit(oObjectID);

			if(bValid){
                /*for(let oItem of oModel){
                    for(let oUnit of oItem.units){
                        if(oUnit.productID == oProductID){
                            oUnit.type    = "Default";
                            oUnit.enabled = false;
                        }
                    }
                };

                this.getModel("priceList").refresh(true);*/

            }
            else MessageBox.error(this.getResourceBundle().getText("messageErrorUpdateProduct"));
	
			this.setAppBusy(false);
		},
        /* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
        _onObjectMatched: async function(oEvent) {
			this.setAppBusy(true);

			this.getModel("images").setData(Images.initSelectionModel());
			this.getModel("images").refresh(true);

            let orgID		= oEvent.getParameter("arguments").orgID,
				productID   = oEvent.getParameter("arguments").productID,
				objectPath  = oEvent.getParameter("arguments").objectPath,
				oPriceItems = this.getModel("priceTable").getData().items;

			let oItemPartner 	   = await this.callServiceFormatedJSON(`PartnerCollection?$filter=IDEmpreendimento_KUT eq '${orgID}' and ClassificacaoParceiro_KUT eq '6' and Empreendimentovisvel_KUT eq true&$format=json`).method('GET'),
				oPartnerImgs       = await this.callService(`PartnerCollection('${oItemPartner.ObjectID}')/PartnerAttachment?$filter=TypeCode eq 'Z55'&$format=json`).method('GET'),
				oPartnerAttachment = await this.callService(`PartnerCollection('${oItemPartner.ObjectID}')/PartnerAttachment?$filter=TypeCode eq 'Z51'&$format=json`).method('GET'),
				oImagesOne		   = this._filterTheData(oPartnerAttachment, "TypeCode", "Z51"),
				oImages		       = this._filterTheData(oPartnerImgs, "TypeCode", "Z55");

			if(oImages.length != 0){
				if(oImagesOne.length != 0) oImages.splice(0, 0, oImagesOne[0]);
			}else{
				if(oImagesOne.length != 0) oImages.push(oImagesOne[0]);
			} 

			let oUserInfo,
                oEmail;

            try {
                oUserInfo = sap.ushell.Container.getService("UserInfo");
            } catch (error) {}
            
            if (oUserInfo != undefined && oUserInfo != "") {
                oEmail = oUserInfo.getEmail();
            } else {
                oEmail = "alexandre.andrade@itsgroup.com.br";
            }

			this.objectRoles = await this._searchUserBusinessRoles(oEmail);

			if(oPriceItems === undefined){
				this.setAppBusy(true);          
				this.getModel("priceTable").setData(await this._searchProdutc(orgID, productID, oImages));
				this.getModel("priceTable").refresh(true);
	
				this.getView().bindElement({
					path: "/",
					model: "priceTable"
				});
				this.setAppBusy(false);
			}else {
				let oItem = oPriceItems[objectPath];

				oItem.images = oImages;

				oItem.reserved = this.objectRoles.VisibleReserved;

				this.getModel("priceTable").setData(oItem);
				this.getModel("priceTable").refresh(true);

				this.getView().bindElement({
					path: "/",
					model: "priceTable"
				});
			}

			this.setAppBusy(false);
        },

		_searchProdutc: async function(sOrgID, sProductID, sImages){
			let oPriceListItem,
                oPriceListItem01,
                oPriceListItem02;

			//busca as tabelas de preços
            let { oPriceList, oPriceList01, oPriceList02 } = await this._searchSalesPriceLists(sOrgID);

			//TABELA DE AVALIAÇÃO CEF
			if(oPriceList != undefined){
				oPriceListItem = oPriceList.InternalPriceDiscountListItems.find(sItem => {
					if(sItem.ProductID === sProductID) return sItem;
				});
			}

			//TABELA DE VENDA - SBPE
			if(oPriceList01 != undefined){
				oPriceListItem01 = oPriceList01.InternalPriceDiscountListItems.find(sItem => {
					if(sItem.ProductID === sProductID) return sItem;
				});
			}

			//TABELA DE VENDA - CVA
			if(oPriceList02 != undefined){
				oPriceListItem02 = oPriceList02.InternalPriceDiscountListItems.find(sItem => {
					if(sItem.ProductID === sProductID) return sItem;
				});
			}

			let oDataProduct = await this.callServiceFormatedJSON(`ProductCollection?$filter=ProductID eq '${sProductID}'&$format=json`).method('GET');

			if(oDataProduct){
				let oDataParms = await this.callServiceZFormatedJSON(`BusinessPartnerCollection?$filter=IDEmpreendimento_KUT eq '${sOrgID}'&$format=json`).method('GET');

				let oSignal            = this._formatedPercentageParms(oDataParms.Sinal_KUT),
					oReadjustableTable = this._formatedPercentageParms(oDataParms.Mensal_KUT),
					oFGTS              = this._formatedPercentageParms(oDataParms.FGTS2_KUT),
					oFinancing         = this._formatedPercentageParms(oDataParms.FinanciamentoCEF_KUT),
					oSubsidy           = this._formatedPercentageParms(oDataParms.Subsidio1_KUT),
					oDiscountInCash    = this._formatedPercentageParms(oDataParms.Percdescontovendavista_KUT),
					oIntermediate      = Number(oDataParms.Numeroparcelaintermediarias_KUT);


				let oSimulate,
					oReserved,
					oTableValue = Number(oPriceListItem.Amount.replace(".", "").substring(0, 8)),
					oSBPEValue  = Number(oPriceListItem01 != undefined ? oPriceListItem01.Amount.replace(".", "").substring(0, 8) : oPriceListItem.Amount.replace(".", "").substring(0, 8)),
					oCVAValue   = Number(oPriceListItem02 != undefined ? oPriceListItem02.Amount.replace(".", "").substring(0, 8) : oPriceListItem.Amount.replace(".", "").substring(0, 8)),
					oArea       = Number(oDataProduct.ZAream2_KUT.replace(".", "")),
					oPriceArea  = oTableValue / oArea;

				if(oDataProduct.ZSalesStat_KUT === "900" ||
				   oDataProduct.ZSalesStat_KUT === "700" ||
				   oDataProduct.ZSalesStat_KUT === "400" ||
				   oDataProduct.ZSalesStat_KUT === "300" ||
				   oDataProduct.ZSalesStat_KUT === "442" ||
				   oDataProduct.ZSalesStat_KUT === "250" ||
				   oDataProduct.ZSalesStat_KUT === "200" ||
				   oDataProduct.ZSalesStat_KUT === "50"  )
				{
					oSimulate = false;
					oReserved = false;
				}else 
				if(oDataProduct.ZSalesStat_KUT === "441" ||
				   oDataProduct.ZSalesStat_KUT === "443" ||
				   oDataProduct.ZSalesStat_KUT === "800" ||
				   oDataProduct.ZSalesStat_KUT === "801" ||
			       oDataProduct.ZSalesStat_KUT === "802" )
				{
					oReserved = false;
				}else {
					oSimulate = true;
					//oReserved = true;
					oReserved = this.objectRoles.VisibleReserved;
				}

				return{
					orgID: sOrgID,
					objectID: oDataProduct.ObjectID,
					productID: sProductID,
					nameEnterprise: oDataProduct.Empreendimento_KUT,
					status: oDataProduct.ZSalesStat_KUT,
					statusText: oDataProduct.ZSalesStat_KUTText,
					block: oDataProduct.Bloco_KUT,
					unit: oDataProduct.Unidade_KUT,
					area: oDataProduct.ZAream2_KUT,
					price: this._formateValue(oPriceArea.toString().substring(0, 7), ""),
					vacancies: oDataProduct.DescricaoVaga_KUT,
					SBPEValue: this._formateValue(`${oSBPEValue}`, undefined),
					CVAValue: this._formateValue(`${oCVAValue}`, undefined),
					tableValue: this._formateValue(`${oTableValue}`, undefined),
					simulate: oSimulate,
					reserved: oReserved,
					images: sImages,
					SBPEIntermediate: oTableValue > oSBPEValue ? this._formateValue(`${oTableValue -oSBPEValue}`, undefined) : 0,
                	CVAIntermediate: oTableValue > oCVAValue ? this._formateValue(`${oTableValue -oCVAValue}`, undefined) : 0,
                    SBPESignal: this._formateValue(`${oSBPEValue * oSignal.percentageCalculo}`, undefined),
                    SBPEReadjustableTable: this._formateValue(`${oSBPEValue * oReadjustableTable.percentageCalculo}`, undefined),
                    SBPEFGTS: this._formateValue(`${oSBPEValue * oFGTS.percentageCalculo}`, undefined),
                    SBPEFinancing: this._formateValue(`${oSBPEValue * (oFinancing.percentageCalculo + oSubsidy.percentageCalculo)}`, undefined),
                    CVASignal: this._formateValue(`${oCVAValue * oSignal.percentageCalculo}`, undefined),
                    CVAReadjustableTable: this._formateValue(`${oCVAValue * oReadjustableTable.percentageCalculo}`, undefined),
                    CVAFGTS: this._formateValue(`${oCVAValue * oFGTS.percentageCalculo}`, undefined),
                    CVAFinancing: this._formateValue(`${oCVAValue * oFinancing.percentageCalculo}`, undefined),
                    CVASubsidy: this._formateValue(`${oCVAValue * oSubsidy.percentageCalculo}`, undefined),                                    
				};
			}
		}
	});
});