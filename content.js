var result_items = [];
var item = {};
var activeThreads = 0;
var exportCanceled = false;

function generateTTDCSV()
{
   	if(exportCanceled){
   		return;
  	}
	//var csvItems = 'data:text/csv;charset=utf-8,"Platform","Advertiser Name","Campaign Name","Campaign ID","Campaign Budget","Campaign Start Date","Campaign End Date","Post Campaign End Date","Line Item / Ad Group Name","Line Item ID","Channel Screen Type (Desktop, Mobile Web, Mobile App)","Budget ($)","Bid Strategy","Start Date (mm/dd/yyy)","End Date (mm/dd/yyy)","Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)","Creative ID","Creative Name","Creative Preview URL","Creative Description (comma separated list)","Brand","UPCs","Networks (Name)","New To Brand Weeks Attribution","New to category Weeks attribution","Attribution Time Window (Days)"\r\n';
//1;2;3;4;5;6;7;8;9;10;ghq2227h;TTD_PSA_Test_Desktop;https://preview-desk.thetradedesk.com/Creatives/ClickTrackingPreview?CreativeId=ghq2227h&Token=3eadb5363ba7fb681e4c5e57ffcee927&IsShare=True;;
	var exportData = [];
	result_items.forEach(function(element) {
		if(!element.start){
  			element.start = item.start;
  		}
  		if(!element.end){
  			element.end = item.end;
  		}
  		if(element.description == null || element.description == ""){
  			element.description = "";
  		}
		exportData.push({"Platform": "TTD",
			"Advertiser Name":item.aName,//2
			"Campaign Name":element.cName,//3
			"Campaign ID":element.campaignId,//4
			"Campaign Budget":item.budget.replace(",","").replace("$",""),//5
			"Campaign Start Date (mm/dd/yyy)":item.start,//6
			"Campaign End Date (mm/dd/yyy)":item.end,//7
			"Post Campaign End Date":'',//8
			"Line Item / Ad Group Name":element.gName,//9
			"Line Item ID":element.gId,//10
			"Channel Screen Type (Desktop, Mobile Web, Mobile App)":element.dimension,//11
			"Line Item Budget":element.budget.replace(",","").replace("$",""),//12
			"Bid Strategy":'CPM',//13
			"Line Item Start Date (mm/dd/yyy)":element.start,//14
			"Line Item End Date (mm/dd/yyy)":element.end,//15
			"Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)":element.format,//16
			"Creative ID":element.crId, //17
			"Creative Name":element.crName,//18
			"Creative Preview URL":element.preview,//19
			"Creative Description (comma separated list)":element.description,//20
			"Brand":'',"UPCs":'',"Networks (Name)":'',
			"New To Brand Weeks Attribution":'26',
			"New to category Weeks attribution":'26',
			"Attribution Time Window (Days)":'30'	
		});
	});

    var fileName = "campaign_export-"+item.aName.toLowerCase().replace(" ","_")+"-"+get_date()+".xls";
	
	var ws = XLSX.utils.json_to_sheet(exportData, { header: [
			"Platform","Advertiser Name","Campaign Name","Campaign ID","Campaign Budget","Campaign Start Date (mm/dd/yyy)","Campaign End Date (mm/dd/yyy)","Post Campaign End Date","Line Item / Ad Group Name","Line Item ID","Channel Screen Type (Desktop, Mobile Web, Mobile App)","Budget","Bid Strategy","Line Item Start Date (mm/dd/yyy)","Line Item End Date (mm/dd/yyy)","Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)","Creative ID","Creative Name","Creative Preview URL","Creative Description (comma separated list)","Brand","UPCs","Networks (Name)","New To Brand Weeks Attribution","New to category Weeks attribution","Attribution Time Window (Days)"
		] });
	var wb = XLSX.utils.book_new();
    console.log('writing file',wb);
    console.log(ws);
	XLSX.utils.book_append_sheet(wb, ws, 'Export');
	chrome.runtime.sendMessage({ action: "saveFile" , wb:wb ,fileName:fileName});
	chrome.runtime.sendMessage({ success: true,vendor:'#step3_trade'});
}

function get_date() {
    var x = new Date();
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    (d.length == 1) && (d = '0' + d);
    (m.length == 1) && (m = '0' + m);
    var yyyymmdd = y + m + d;
    return yyyymmdd;
}

function exportGroup(data){
	var new_item = {};
	new_item.cName = item.cName;
	new_item.campaignId = item.campaignId;
	
	var name_template = "data-search-key=";
	var budget_template = "adgroup-budget";
	var id_template = "data-id="
	
	var idx = data.indexOf(id_template);
	if(idx == -1){
		return;
	}
	var idx2 = data.indexOf("\"",idx+id_template.length+1);
	if(idx2==-1){
		return;
	}
	new_item.gId = data.substring(idx+id_template.length+1,idx2);

	idx = data.indexOf(name_template);
	if(idx == -1){
		return;
	}
	var idx2 = data.indexOf("\"",idx+name_template.length+1);
	if(idx2==-1){
		return;
	}
	new_item.gName = data.substring(idx+name_template.length+1,idx2);
	idx = data.indexOf(budget_template);
	if(idx == -1){
		return;
	}
	idx = data.indexOf(">",idx);
	if(idx == -1){
		return;
	}
	idx2 = data.indexOf("<",idx);
	if(idx2 == -1){
		return;
	}
	new_item.budget = data.substring(idx+1,idx2);

	
	$.ajax({url: "https://desk.thetradedesk.com/gamma/AdGroup/getAdGroupHeaderDetails?adGroupId="+new_item.gId, type: 'GET', success: function(result){
    	if(exportCanceled){
    		return;
  	  	}
  
    	result = result.content;    		
    	var gr_item = new_item;
    	if(result && result.flight){

    		gr_item.start = result.flight.startDateInclusive.month + "/" + result.flight.startDateInclusive.day + "/" + result.flight.startDateInclusive.year;
    		gr_item.end = result.flight.endDateExclusive.month + "/" + result.flight.endDateExclusive.day + "/" + result.flight.endDateExclusive.year;
    	}
    		$.ajax({url: "https://desk.thetradedesk.com/gamma/AdGroup/getAdGroupCreatives?adGroupId="+gr_item.gId, type: 'GET', success: function(res){
			    if(exportCanceled){
    				return;
  	  			}
    			if(res.content && res.content.creatives){
    				res = res.content.creatives;
    				for(var i = 0; i<res.length; i++)
    				{
  						var element = {creativeId:res[i].creativeId,creativeName:res[i].creativeName,format:res[i].format};
  						if(exportCanceled){
  							return;
  						}

  						$.ajax({url: "https://desk.thetradedesk.com/creatives/GetCreative?id="+element.creativeId, async: false,type: 'GET', success: function(crRes){
  						if(exportCanceled){
    						return;
  	  					}
  						if(crRes && crRes.data)
  						{
  							var cr_element = {creativeId:element.creativeId,creativeName:element.creativeName,format:element.format};
  							cr_element.ShareUrl = crRes.data.ShareUrl;	

  							$.ajax({url: "https://desk.thetradedesk.com/gamma/BidDimension/getBidListsForDimension?dimensionId=512-0&owner=AdGroup&tileType=rail&ownerId=" +gr_item.gId, type: 'GET', success: function(bidRes){
  								if(exportCanceled){
  									return;
  								}
  								activeThreads++;
  								var dm_element = {ShareUrl:cr_element.ShareUrl,creativeId:cr_element.creativeId,creativeName:cr_element.creativeName,format:cr_element.format};;
  								dm_element.dimension = "";
  								if(bidRes && bidRes.content && bidRes.content.length)
  								{
  									dm_element.dimension = "";
  									dm_element.bidId = bidRes.content[0].bidListId;
  									$.ajax({url: "https://desk.thetradedesk.com/gamma/BidDimension/getBidList?query.ownerId=" + gr_item.gId + "&query.owner=AdGroup&query.bidListId=" + dm_element.bidId + "&query.advertiserId=" + item.advertiserId + "&query.dimensionId=512-0", type: 'GET', success: function(dimRes){
  										if(exportCanceled){
  											return;
  										}

  										var bid_element = {ShareUrl:dm_element.ShareUrl,creativeId:dm_element.creativeId,creativeName:dm_element.creativeName,format:dm_element.format};
  								
  										bid_element.dimension = "";
  										if(dimRes && dimRes.content.dimensionItems)
  										{
  											for(var j=0; j< dimRes.content.dimensionItems.length;j++)
  											{
  												bid_element.dimension += dimRes.content.dimensionItems[j].dimensionItemName+" ";
  											}
  										}
  										result_items.push({dimension:bid_element.dimension,preview:bid_element.ShareUrl, cName:gr_item.cName, campaignId:gr_item.campaignId, gName:gr_item.gName, gId:gr_item.gId,start:gr_item.start,end:gr_item.end, budget:gr_item.budget ,crId:bid_element.creativeId,crName:bid_element.creativeName,crDescription:bid_element.description,format:bid_element.format});
										activeThreads--;
    									if(activeThreads == 0){
    										generateTTDCSV();
										}
									}});
  								}
  								else{
  									$.ajax({url: "https://desk.thetradedesk.com/AdGroups/GetTechnologiesDetails?id=" + gr_item.gId + "&advertiser=" + item.advertiserId+ "&campaign=" +item.campaignId, type: 'GET', success: function(techRes){
  										if(exportCanceled){
  											return;
  										}

  										var bid_element = {ShareUrl:dm_element.ShareUrl,creativeId:dm_element.creativeId,creativeName:dm_element.creativeName,format:dm_element.format};
  								
  										bid_element.dimension = "";
  										
  										for(var k = 0; k< techRes.data.AvailableAdEnvironmentAdjustments.length; k++)
  										{
  											if(techRes.data.AvailableAdEnvironmentAdjustments[k].DisplayName == "PC")
  												bid_element.dimension = "Desktop";
  											if(techRes.data.AvailableAdEnvironmentAdjustments[k].DisplayName.indexOf('In-App')!=-1)
  												bid_element.dimension = "Mobile (In App)";
  											if(techRes.data.AvailableAdEnvironmentAdjustments[k].DisplayName.indexOf('Web')!=-1)
  												bid_element.dimension = "Mobile (Web)";
  										}

  										result_items.push({dimension:bid_element.dimension,preview:bid_element.ShareUrl, cName:gr_item.cName, campaignId:gr_item.campaignId, gName:gr_item.gName, gId:gr_item.gId,start:gr_item.start,end:gr_item.end, budget:gr_item.budget ,crId:bid_element.creativeId,crName:bid_element.creativeName,crDescription:bid_element.description,format:bid_element.format});
										activeThreads--;
    									if(activeThreads == 0){
    										generateTTDCSV();
										}
									}});
  									}
							}});
  						}
  						}});
					};
    			}
			}});
    	//}
	}});

}
function exportTradeDesk(){
	exportCanceled = false;
	result_items = [];
	item = {};
	activeThreads = 0;
	var url_template = "desk.thetradedesk.com/Campaigns/Detail/";
	var ad_template = "advertiser=";
	var url = document.location.href;
	var idx = url.indexOf(url_template);
	if(idx == -1){
		chrome.runtime.sendMessage({ error: "Error: can't detect Advertiser ID"});
		return;
	}
	var idx2 = url.indexOf("?",idx + url_template.length);
	if(idx2 == -1){
		chrome.runtime.sendMessage({ error: "Error: can't detect Advertiser ID"});
		return;
	}
	item.campaignId = url.substring(idx+url_template.length,idx2);
	console.log("found campaignId:" +item.campaignId);
	var idx3 = url.indexOf(ad_template);
	if(idx3 == -1){
		chrome.runtime.sendMessage({ error: "Error: can't detect Campaign ID"});
		return;
	}
	var idx4 = url.indexOf("#");
	if(idx4 == -1){
		idx4 = url.length;
	}
	item.advertiserId = url.substring(idx3+ad_template.length,idx4);
	console.log("found advertiserId:" +item.advertiserId);

	item.cName= $(".ttd-entity-name").text();
	item.start = $("#hero-metric-start-date").text();
	item.end = $("#hero-metric-end-date").text();
	item.budget = $("#hero-metric-budget").text();
	var aLink = "/Advertisers/Detail/" + item.advertiserId;
	item.aName = $("a[href$='"+aLink+"']").attr("title");
	console.log("campaign: ");
	console.log(item);
	var data ={
	"filterQuery":{"filterKeyGroups":{"type":["display","video","audio","mobile","native","publisher-direct-default","connectedTv"],"status":["enabled","disabled"],"spending":["all-spending"]},
	"labels":[],"campaignIds":[],
	"target":"rtb-adgroups"},
	"pageQuery":{"pageIndex":0,"pageSize":25},
	"sortQuery":{"sortBy":"name","isSortAscending":true},
	"viewSupportsCampaignFlightFilter":true};
	data.id = item.campaignId;
	data.advertiser = item.advertiserId;
	data.filterQuery.campaignIds.push(data.id);	
 	$.ajax({url: "https://desk.thetradedesk.com/Campaigns/GetRtbAdGroupsTable", data: $.postify(data), type: 'POST', success: function(result){
    	if(result.html){
    		result = result.html
    	}
    	var group_template ="<tr class=\"item\"";
		var idx =  result.indexOf(group_template);
		while(idx !=- 1){
			var idx2 = result.indexOf("</tr>",idx);
			if(idx2 == -1){
				break;
			}
			var group_data = result.substring(idx,idx2);
			exportGroup(group_data);
			idx =  result.indexOf(group_template,idx2);
		}

	}});
}
function export4info(){
    console.log('4info_export');
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.action == "export_tradedesk"){
    	exportTradeDesk();
    }
    if(request.action == "export_cancel"){
    	exportCanceled == true;
    }
  });
