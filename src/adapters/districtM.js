adapterManagerRegisterAdapter((function(){

	var adapterID = 'districtM',
		constPlacementID = 'placementId',
		strCallbackFunction = 'DistrictMAdapterCallback',
		strCallbackFunction2 = 'window.PWT.' + strCallbackFunction,
		internalMap = {},

		buildJPTCall = function(bid, callbackId, currentWidth, currentHeight) {

			//determine tag params
			var params = bid[constCommonParams];
			var placementId = params[constPlacementID] || '';
			var memberId = params['memberId'] || '';
			var member = params['member'] || ''; //newCode
			var inventoryCode = params['invCode'] || '';
			//var query = params['query'] || '';

			//build our base tag, based on if we are http or https

			var jptCall = 'http' + ('https:' === document.location.protocol ? 's://secure.adnxs.com/jpt?' : '://ib.adnxs.com/jpt?');
			var jptCallParams = {};		
			jptCallParams['callback'] = strCallbackFunction2;
			jptCallParams['callback_uid'] = callbackId;
			jptCallParams['psa'] = '0';
			jptCallParams['id'] = placementId; 
			jptCallParams['code'] = inventoryCode;

			jptCallParams['referrer'] = params['referrer'] || '';
			jptCallParams['alt_referrer'] = params['alt_referrer'] || '';

	        if (member) {
	            jptCallParams['member'] = member;
	        } else if (memberId) {
	            jptCallParams['member'] = memberId;
	        }

	        if(currentWidth == 0 && currentHeight == 0){
	        	var sizeArrayLength = bid[constCommonSizes].length;
				if( sizeArrayLength > 0){
					for(var i = 0; i < sizeArrayLength; i++){
						if(bid[constCommonSizes][i][0] && bid[constCommonSizes][i][1]){
							var widthXheight = bid[constCommonSizes][i][0] + 'x' + bid[constCommonSizes][i][1];
							if(i == 0){
								jptCallParams['size'] = widthXheight;
								jptCallParams['promo_sizes'] = [];
							}else{
								jptCallParams['promo_sizes'].push(widthXheight);
							}
						}
					}
					jptCallParams['promo_sizes'] = jptCallParams['promo_sizes'].join(',')
				}
	        }else{
	        	jptCallParams['size'] = currentWidth+'x'+currentHeight;
	        }			

			//todo: what about following commented code ?
			//	ignore now
			// In prebid it is said to be deprecated soon
			/*
			var targetingParams = utilParseQueryStringParameters(query);

			if (targetingParams) {
				//don't append a & here, we have already done it in parseQueryStringParameters
				jptCall += targetingParams;
			}
			*/

			jptCall += utilToUrlParams(jptCallParams);		

			return jptCall;
		},

		fetchBids = function(configObject, activeSlots){
			utilLog(adapterID+constCommonMessage01);

			var adapterConfig = utilLoadGlobalConfigForAdapter(configObject, adapterID);
			if(!utilCheckMandatoryParams(adapterConfig, [constConfigKeyGeneratigPattern, constConfigKeyLookupMap], adapterID)){
				utilLog(adapterID+constCommonMessage07);
				return;
			}

			var keyGenerationPattern = adapterConfig[constConfigKeyGeneratigPattern];
			var keyLookupMap = adapterConfig[constConfigKeyLookupMap];

			utilForEachGeneratedKey(
				activeSlots, 
				keyGenerationPattern, 
				keyLookupMap, 
				function(generatedKey, kgpConsistsWidthAndHeight, currentSlot, keyConfig, currentWidth, currentHeight){

					if(!keyConfig){
						utilLog(adapterID+': '+generatedKey+constCommonMessage08);
						return;
					}

					if(!utilCheckMandatoryParams(keyConfig, [constPlacementID], adapterID)){
						utilLog(adapterID+': '+generatedKey+constCommonMessage09);
						return;
					}
				
					var callbackId = utilGetUniqueIdentifierStr();
					internalMap[callbackId] = {};
					internalMap[callbackId][constCommonConfig] = {
						'params': keyConfig,
						'divID': currentSlot[constCommonDivID], 				
						'sizes': currentSlot[constAdSlotSizes],
						'status': ''
					};
					internalMap[callbackId][constCommonKeyGenerationPatternValue] = generatedKey;
					if(!kgpConsistsWidthAndHeight){
						currentWidth = 0;
						currentHeight = 0;
					}
					utilLoadScript(buildJPTCall(internalMap[callbackId][constCommonConfig], callbackId, currentWidth, currentHeight));				
				}
			);	
		}
	;

	win.PWT[strCallbackFunction] = function(jptResponseObj) {

		utilLog(adapterID+constCommonMessage05);

		try{

			if (jptResponseObj && jptResponseObj.callback_uid) {

				var responseCPM,
					bidObject,
					id = jptResponseObj.callback_uid,
					divID = '',
					bidObj = internalMap[id] && internalMap[id][constCommonConfig] ? internalMap[id][constCommonConfig] : false
				;

				if(!bidObj){
					utilLog(adapterID+': callback_uid: '+id+' not found in internalMap.');
					return;
				}

				divID = bidObj[constCommonDivID];

				if (jptResponseObj.result && jptResponseObj.result.cpm && jptResponseObj.result.cpm !== 0) {
					responseCPM = parseInt(jptResponseObj.result.cpm, 10);

					//CPM response from /jpt is dollar/cent multiplied by 10000
					//in order to avoid using floats
					//switch CPM to "dollar/cent"
					responseCPM = responseCPM / 10000;
					bidObject = bidManagerCreateBidObject(
						responseCPM,
						jptResponseObj.result.deal_id,
						jptResponseObj.result.creative_id,
						"",
						jptResponseObj.result.ad,
						jptResponseObj.result.width,
						jptResponseObj.result.height,
						internalMap[id][constCommonKeyGenerationPatternValue]
					);
				}else {
					bidObject = bidManagerCreateBidObject(
						0,
						"",
						"",
						"",
						"",
						0,
						0,
						internalMap[id][constCommonKeyGenerationPatternValue]
					);
				}
				bidManagerSetBidFromBidder(divID, adapterID, bidObject);
			}

		}catch(ex){
			utilLog(adapterID+constCommonMessage21);
			utilLog(ex);
		}
	};

	return {
		fB: fetchBids,
		dC: utilDisplayCreative,
		ID: function(){
			return adapterID;
		}
	};
})());