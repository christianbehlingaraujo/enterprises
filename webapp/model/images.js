sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		initSelectionModel: function() {
			return {
                items: [
                    {
                        src: "img/image.jpg"
                    },
                    {
                        src: "img/image1.jpg"
                    },
                    {
                        src: "img/image2.jpg"
                    },
                    {
                        src: "img/image3.jpg"
                    }
                ]
            };
		}
	};
});