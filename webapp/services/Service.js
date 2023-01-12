sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(
	Controller
) {
	"use strict";

  var oBasicAuth = 'Basic X1NDUEk6QlJaQCFhMjAyMWU=';

	return Controller.extend("com.itsgroup.brz.enterprises.services.Service", {

    callService: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel().sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results } catch (error) { return response }
        },
      };
    },

    callServicePOST: async function(entityName, sBody){
      let sServiceURL = this.getOwnerComponent().getModel().sServiceUrl;

      let response = await fetch(
        `${sServiceURL}/${entityName}`,{
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          'Authorization': oBasicAuth
        },
        body: JSON.stringify(sBody)
      }).then((response) => {
        if(response.status == 200 || response.status == 201) return response.json();
          return new response.text();
      }).catch((err) => {err});
      
      try { return response.d.results } catch (error) { return response }
    },

    callServiceToken: async function(entityName){
      let sServiceURL = this.getOwnerComponent().getModel().sServiceUrl;

      let response = await fetch(
        `${sServiceURL}/${entityName}`,{
        method: "GET",
        headers: {
          'Authorization': oBasicAuth,
          'X-CSRF-Token': "fetch",
          'Content-Type': "application/json"
        }
      }).then((oResponse) => {
        if(oResponse.status == 200 || oResponse.status == 201) return oResponse.headers;
          return oResponse;
      }).catch((err) => {err});

      try { return response } catch (error) { return response }
    },

    callServiceFormatedJSON: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel().sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results[0] } catch (error) { return response }
        },
      };
    },

    callServiceZ: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel("C4C_Z").sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results } catch (error) { return response }
        },
      };
    },

    callServiceZFormatedJSON: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel("C4C_Z").sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results[0] } catch (error) { return response }
        },
      };
    },

    callServiceZSaleText: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel("C4C_ZSaleText").sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results } catch (error) { return response }
        },
      };
    },

    callServiceZSaleTextFormatedJSON: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel("C4C_ZSaleText").sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results[0] } catch (error) { return response }
        },
      };
    },

    callServiceZMapFormatedJSON: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel("C4C_AvailabilityMap").sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results[0] } catch (error) { return response }
        },
      };
    },

    callServiceNaturalness: function (entityName) {
      return {
        method: async (method) => {
          let sServiceURL = this.getOwnerComponent().getModel("C4C_Naturalness").sServiceUrl;

          let response = await fetch(
            `${sServiceURL}/${entityName}`,{
            method: method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
              'Authorization': oBasicAuth
            }
          }).then((response) => {
            if(response.status == 200 || response.status == 201) return response.json();
              return new response.text()
          }).catch((err) => {err});
      
          try { return response.d.results } catch (error) { return response }
        },
      };
    },


    callServiceSCPIPATCH: async function(entityName, sBody, sToken) {      
      let sServiceURL = this.getOwnerComponent().getModel("portal").sServiceUrl;

      let sRootPath = this.getOwnerComponent().getModel("rootPath").getProperty("/path");

      if(sRootPath === '.') {
        sToken = "";
      }


      let oResponse = await fetch(
        `${sServiceURL}${entityName}`,
        {
          method: 'POST',
          /*headers: {
            'x-csrf-token': sToken
          },*/
          body: JSON.stringify(sBody)
        }
      ).then((response) => { return response })
      .catch((err) => { return err });

      try { return oResponse }
      catch (error) { return oResponse }
    },

    callServiceSearchCEP: async function(entityName, sNumberCEP){
      let sServiceURL = this.getOwnerComponent().getModel("viaCEP").sServiceUrl;
      //`https://viacep.com.br/ws/${sNumberCEP}/json/`

      let oResponse = await fetch(`https://viacep.com.br/ws/${sNumberCEP}/json/`)
      .then(async response => {
        if(response.status === 200){
          return await response.json()
          .then(data => {
            return data;
          });
        }
      })
      .catch((err) => { return err });

      try { return oResponse } 
      catch (error) { return oResponse }
    },

    _getToken: function (sKey) {
      let sUrlService = "/http/portal/customer/update";
      
      let oHeader = {
        "SCPI": sKey,
        "Content-Type": "application/atom+xml",
        "x-csrf-token": "fetch"
      }

      var sRootPath = this.getOwnerComponent().getModel("rootPath").getProperty("/path");

      if (sRootPath === '..') {
        sRootPath = sUrlService
      } else {
        sRootPath = `${sRootPath}`;
      }

      return {
        method: async (sMethod) => {

          let oResponse = await fetch(
            `${sRootPath}`,
            {
              method: sMethod.toUpperCase(),
              headers: oHeader
            }
          ).then(function (response) { return response.headers.get("x-csrf-token"); })
            .catch((err) => err);

          return oResponse;
        }

      }
    },
	});
});