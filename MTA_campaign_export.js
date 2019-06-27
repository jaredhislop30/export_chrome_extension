

function parseCampaigns(data){

    // jQuery.ajax({url:url,type:"GET",success:function(result){
    console.log("campaign gotten",data);
    if(exportCanceled){
        return;
    }
    var exportData = [];
    data.forEach(function(element) {
        exportData.push({
            "Platform": "MTA UI", //0
            "MTA Line Item ID":element.line_item_id,//1
            "MTA Line Item Name":element.line_item_name,//2
            "MTA Creative ID":element.creative_id, //3
            "MTA Creative Name":element.creative_name,//4
            "MTA Creative Preview URL":element.preview_url, //5
            "MTA Creative Description":element.description, //6
            "MTA UI Pixel": element.bw_tag,//7
            "MTA UI UPCs":element.UPCs,//8
            "MTA UI Network":element.networks,//9  
        });
    });

    var fileName = "MTA-UI_export-"+data[0]['campaign_name'].toLowerCase().replace(" ","_")+"-"+get_date()+".xlsx";
    
    var ws = XLSX.utils.json_to_sheet(exportData, { header: [
            "Platform","MTA Line Item ID","MTA Line Item Name","MTA Creative ID","MTA Creative Name","MTA Creative Preview URL","MTA Creative Description","MTA UI Pixel","MTA UI UPCs","MTA UI Network"
        ] });
    var wb = XLSX.utils.book_new();
    console.log('writing file',wb);
    console.log(ws);
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    chrome.runtime.sendMessage({ action: "saveFile" , wb:wb ,fileName:fileName});
    chrome.runtime.sendMessage({ success: true,vendor:'#step3_catalina'});
}
if(document.title.toLowerCase().indexOf('mta')>-1 || document.title.toLowerCase().indexOf("aurelia")>-1){
    var port = chrome.runtime.connect({name: "knockknock"});
    port.onMessage.addListener(function(request) {
        if(request.step=="catalina_campaign"){
          parseCampaigns(request.data)  
        }else{
            console.log(request);
        }
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if(request.action == "export_catalina"){
            var domain = document.domain;
            //31320
            //http://taggen.catalina.com:31320/
            // if(domain.indexOf("taggen")>-1){
            var url_port = "31310";
            var url_domain = "10.176.45.70";
            // }else{
            //     var url_port = "11110"
            // }
            var campaign_url = "http://"+domain+":"+url_port+"/omni/attrib/campaign/"+document.URL.split("campaignId=")[1];
            console.log(campaign_url);
            port.postMessage({action: "export_mta",url:campaign_url,domain:domain,url_port:url_port});
        }else if(request.action == "export_cancel"){
            exportCanceled == true;
        }
    });    
}
