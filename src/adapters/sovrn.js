adapterManagerRegisterAdapter((function() {

	var adapterID = 'sovrn',
		sovrnUrl = 'ap.lijit.com/rtb/bid',
		constConfigAdTagID = 'tagid',
		constConfigBidFloor = 'bidfloor',

		fetchBids = function(configObject, activeSlots){
			utilLog(adapterID+constCommonMessage01);

			var adapterConfig = utilLoadGlobalConfigForAdapter(configObject, adapterID);
			if(!utilCheckMandatoryParams(adapterConfig, [constConfigKeyGeneratigPattern, constConfigKeyLookupMap], adapterID)){
				utilLog(adapterID+constCommonMessage07);
				return;
			}

			var keyGenerationPattern = adapterConfig[constConfigKeyGeneratigPattern];
			var keyLookupMap = adapterConfig[constConfigKeyLookupMap];
			var sovrnImps = [];
			var sovrnImpsInternal = {};

			utilForEachGeneratedKey(
				activeSlots,
				keyGenerationPattern,
				keyLookupMap, 
				function(generatedKey, kgpConsistsWidthAndHeight, currentSlot, keyConfig, currentWidth, currentHeight){

					if(!keyConfig){
						utilLog(adapterID+': '+generatedKey+constCommonMessage08);
						return;
					}

					if(!utilCheckMandatoryParams(keyConfig, [constConfigAdTagID], adapterID)){
						utilLog(adapterID+': '+generatedKey+constCommonMessage09);
						return;
					}

					var adSlotSizes = kgpConsistsWidthAndHeight ? [[currentWidth, currentHeight]] : currentSlot[constAdSlotSizes];

					for(var n=0, l=adSlotSizes.length; n<l; n++){
						var bidWidth = adSlotSizes[n][0];
						var bidHeight = adSlotSizes[n][1];

						var imp = {
			                id: currentSlot[constCommonDivID] + '@' + bidWidth + 'x' + bidHeight,
			                banner: {
			                    w: bidWidth,
			                    h: bidHeight
			                },
			                tagid: keyConfig[constConfigAdTagID],
			                bidfloor: keyConfig[constConfigBidFloor]
			            };
			            sovrnImps.push(imp);

			            sovrnImpsInternal[imp.id] = {
			            	id: imp.id,
			            	divID: currentSlot[constCommonDivID],
			            	kgpv: generatedKey
			            };
					}
				}
			);

			// build bid request with impressions
			var randomID = utilGetUniqueIdentifierStr();
	        var sovrnBidReq = {
	            id: randomID,
	            imp: sovrnImps,
	            site: {
	                domain: window.location.host,
	                page: window.location.pathname + location.search + location.hash
	            }
	        };

	        win.PWT.SovrnAdapterCallbacks[randomID] = bidResponseHandler(sovrnImpsInternal);

	        //todo: what will be value of src parameter 
	        var scriptUrl = '//' + sovrnUrl + '?callback=window.PWT.SovrnAdapterCallbacks["'+randomID+'"]' + '&src=' + 'CONSTANTS.REPO_AND_VERSION' + '&br=' + encodeURIComponent(JSON.stringify(sovrnBidReq));
	        utilLoadScript(scriptUrl);			
		},

		bidResponseHandler = function(requestImpressions){
			return function(sovrnResponseObj){

				utilLog('requestImpressions');
				utilLog(requestImpressions);
				utilLog('sovrnResponseObj');
				utilLog(sovrnResponseObj);
				// to be decided

			}
		}		
	;

	win.PWT.SovrnAdapterCallbacks = {};

	return {
		fB: fetchBids,
		dC: utilDisplayCreative,
		ID: function(){
			return adapterID;
		}
	};
})());