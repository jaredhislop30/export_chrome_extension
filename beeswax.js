var result_items = [];
var item = {};
var line_items = [];
var activeThreads = 0;
var exportCanceled = false;
function generateBeesCSV(data)
{
    if(exportCanceled){
        return;
    }
    var exportData = [];
    data.forEach(function(element) {
        var creative_format = "Banner";
        if(!element.start){
            element.start = item.start;
        }
        if(!element.end){
            element.end = item.end;
        }
        if(element.description == null || element.description == ""){
            element.description = "";
        }
        if(element.line_item_type=="video"){
            creative_format = "Pre-Roll Video";
        }else if(element.line_item_type=="native"){
            creative_format = "Native";
        }
        var creative_preview_url = "https://media.bidr.io" + element.creative_thumbnail_url;
        var creative_preview_url_php = "https://catalina.api.beeswax.com/buzz/public/CreativePreview.php?token="+element.creative_preview_token;


        campaign_start_date = get_date(element.campaign_start_date,"mm/dd/yyy")
        campaign_end_date = get_date(element.campaign_end_date,"mm/dd/yyy")
        line_item_start_datea = get_date(element.start_date,"mm/dd/yyy")
        line_item_end_date = get_date(element.end_date,"mm/dd/yyy")
        exportData.push({"Platform": "Beeswax",
            "Advertiser Name":element.advertiser_name,//2
            "Campaign Name":element.campaign_name,//3
            "Campaign ID":element.campaign_id.toString(),//4
            "Campaign Budget":element.campaign_budget.toString().replace(",","").replace("$",""),//5
            "Campaign Start Date (mm/dd/yyy)":campaign_start_date,//6
            "Campaign End Date (mm/dd/yyy)":campaign_end_date,//7
            "Post Campaign End Date":'',//8
            "Line Item / Ad Group Name":element.line_item_name,//9
            "Line Item ID":element.line_item_id,//10
            "Channel Screen Type (Desktop, Mobile Web, Mobile App)":"",//11
            "Line Item Budget":element.line_item_budget.toString().replace(",","").replace("$",""),//12
            "Bid Strategy":'CPM',//13
            "Line Item Start Date (mm/dd/yyy)":line_item_start_datea,//14
            "Line Item End Date (mm/dd/yyy)":line_item_end_date,//15
            "Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)":element.format,//16
            "Creative ID":element.creative_id, //17
            "Creative Name":element.creative_name,//18
            "Creative Preview URL":creative_preview_url_php,//19
            "Creative Description":"",//20
            "Brand":'',"UPCs":'',"Networks (Name)":'',
            "New To Brand Weeks Attribution":'26',
            "New to category Weeks attribution":'26',
            "Attribution Time Window (Days)":'30',
            "Pixels": element.pixels.join(',')
        });
    });

    var fileName = "campaign_export-"+item.adver_name.toLowerCase().replace(" ","_")+"-"+get_date()+".xlsx";
    
    var ws = XLSX.utils.json_to_sheet(exportData, { header: [
            "Platform","Advertiser Name","Campaign Name","Campaign ID","Campaign Budget","Campaign Start Date (mm/dd/yyy)","Campaign End Date (mm/dd/yyy)","Post Campaign End Date","Line Item / Ad Group Name","Line Item ID","Channel Screen Type (Desktop, Mobile Web, Mobile App)","Line Item Budget","Bid Strategy","Line Item Start Date (mm/dd/yyy)","Line Item End Date (mm/dd/yyy)","Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)","Creative ID","Creative Name","Creative Preview URL","Creative Description","Brand","UPCs","Networks (Name)","New To Brand Weeks Attribution","New to category Weeks attribution","Attribution Time Window (Days)","Pixels"
        ] });
    var wb = XLSX.utils.book_new();
    console.log('writing file',wb);
    console.log(ws);
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    chrome.runtime.sendMessage({ action: "saveFile" , wb:wb ,fileName:fileName});
    chrome.runtime.sendMessage({ success: true,vendor:'#step3_beeswax'});
}

function get_date(date,format) {
    if(!date){
        var x = new Date();    
    }else{
        var x = new Date(date); 
    }
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    (d.length == 1) && (d = '0' + d);
    (m.length == 1) && (m = '0' + m);
    if(!format){
        var formatted_date = y + m + d;
              
    }else{
        var formatted_date = m+"/"+d+"/"+y
    }
    return formatted_date; 
}

function exportBeeswax(){
    exportCanceled = false;
    result_items = [];
    item = {};
    activeThreads = 0;
    var url_template = "beeswax.com/advertisers";
    var ad_template = "/advertisers/";
    var camp_template = "/campaigns/";
    var url = document.location.href;
    var idx = url.indexOf(url_template);
    if(idx == -1){
        chrome.runtime.sendMessage({ error: "Error: can't detect Proper URL"});
        return;
    }else{
        console.log('correct page');
    }
    var idx2 = url.indexOf(ad_template);
    if(idx2 == -1){
        chrome.runtime.sendMessage({ error: "Error: can't detect Advertiser ID"});
        return;
    }else{
        item.advertiserId = url.substring(idx2+ad_template.length,url.indexOf("/campaigns"));
        console.log("found AdvertiserID:" +item.advertiserId); 
    }
    var idx3 = url.indexOf(camp_template);
    if(idx3 == -1){
        chrome.runtime.sendMessage({ error: "Error: can't detect Campaign ID"});
        return;
    }else{
        item.campaignId = url.substring(idx3+camp_template.length,url.indexOf("/line_items"));
        console.log("found campaignId:" +item.campaignId);        
    }


    // var idx4 = url.indexOf("#");
    // if(idx4 == -1){
    //     idx4 = url.length;
    // }
    // item.advertiserId = url.substring(idx3+ad_template.length,idx4);
    // console.log("found advertiserId:" +item.advertiserId);

    item.cName= jQuery('.bw-breadcrumb li:nth-child(3) a').text().replace(' ('+item.campaignId+')',"");
    item.adver_name = jQuery('.bw-breadcrumb li:nth-child(2) a').text().replace(' ('+item.advertiserId+')',"");;
    console.log(item);
    // https://catalina.api.beeswax.com/rest/campaign?advertiser_id=11&view_name=campaign_stats&rows=200&offset=0&sort_by=update_date&order=desc
    // https://catalina.api.beeswax.com/rest/line_item?campaign_id=156&view_name=line_item_stats&rows=200&offset=0&sort_by=update_date&order=desc
    var aLink = "https://catalina.api.beeswax.com/rest/campaign?advertiser_id=" + item.advertiserId+"&view_name=campaign_stats&rows=200&offset=0&sort_by=update_date&order=desc";
    var cLink = "https://catalina.api.beeswax.com/rest/line_item?campaign_id=156&view_name=line_item_stats&rows=200&offset=0&sort_by=update_date&order=desc"
    port.postMessage({action: "get_line_items",campaign_id:item.campaignId,advertiser_id:item.advertiserId});
}

function parse_line_items(data){
    for(i=0;i<data.length;i++){
        data[i]["advertiser_name"] = item.adver_name;
        data[i]["campaign_name"] = item.cName;
    }
    console.log("special delivery!");
    console.log(data);
    generateBeesCSV(data);
}
if(document.domain.indexOf('beeswax.com')>-1){
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if(request.action == "export_beeswax"){
            exportBeeswax();
        }else if(request.action == "export_cancel"){
            exportCanceled == true;
        }
    });
    var port = chrome.runtime.connect({name: "knockknock"});
    port.onMessage.addListener(function(request) {
        if(request.action=="jQuery Callback"){
          parse_line_items(request.line_items)  
        }else if(request.action=="step"){
            if(request.step=="creative request"){
                console.log(request);
            }else if(request.step=="line item request"){
                console.log(request);
            }else{
                console.log(request);    
            }
        }
    });
}




















