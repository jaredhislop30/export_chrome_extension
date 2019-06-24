var campaign = {};
var line_items = [];

function export4info(){
    //Expand all child ad groups to get creative information
    jQuery('.childAdGroup .fa-chevron-right').click()

    channel_lookup = {
        "DE" : "Desktop",
        "MOW" : "MobileWeb",
        "MOA" : "MobileApp"
    }

    creative_format_lookup = {
        "Banner - Static Image - 160x600" : "Banner",
        "Banner - 3rd-Party Tag" : "Banner",
        "Rich Media" : "Rich Media Banner",
        "video" : "Video",
        "native" : "Native",
        "Intersitial" : "Intersitial"
    }

    
    campaign = {}
    campaign.advertiser = jQuery('.breadcrumb-detail')[0].textContent
    campaign.name = jQuery('.campaign .first-col.name-col a').text()
    campaign.id = jQuery('.campaign .first-col.name-col a').attr('title').replace(/[a-zA-Z:\s]/g,'')
    campaign.start_date = jQuery('.campaign td')[3].textContent
    campaign.end_date = jQuery('.campaign td')[4].textContent
    campaign.impressions_goal = jQuery('.campaign td')[6].textContent.replace(/,/g,'')

    

    setTimeout(getChildDetails, 3000);
}

function getChildDetails(){
    items = []
    jQuery('.childAdGroup').each(function(){
        child_ad_group = {}
        child_ad_group.name = jQuery(this).find('a').text()
        child_ad_group.id = jQuery(this).find('a').attr('title').replace(/[a-zA-Z:\s]/g,'')
        child_ad_group.start_date = jQuery(this).find('td:nth-child(4)').find('input').val()
        child_ad_group.end_date = jQuery(this).find('td:nth-child(5)').find('input').val()
        child_ad_group.cpm = jQuery(this).find('td:nth-child(6)').find('input').val()
        child_ad_group.impressions_goal = jQuery(this).find('td:nth-child(7)').find('input').val().replace(/,/g,'')
        child_ad_group.channel = channel_lookup[child_ad_group.name.split('_')[0]]
        child_ad_group.budget = ((child_ad_group.impressions_goal/1000)*child_ad_group.cpm).toFixed(2)
        
        jQuery(this).next().next().children().children().children().find('tr').each(function(){
            const child_ad_group_full = Object.assign({}, child_ad_group)
            child_ad_group_full.creative_id = jQuery(this).find('.adName div')[0].textContent.replace(/[a-zA-Z:\s]/g,'')
            child_ad_group_full.creative_name = jQuery(this).find('.adName div')[1].textContent
            child_ad_group_full.creative_format = jQuery(this).find('td:nth-child(4)').find('div')[1].textContent
            child_ad_group_full.creative_preview_url = "https://campaigns.4info.com/phoenix/" + jQuery(this).find('td:nth-child(6)').find('span a').attr('href')
            items.push(child_ad_group_full)
        })
        

        // line_items.push(child_ad_group)
    })
    console.log(items);
    // chrome.runtime.sendMessage({ success: true});
    generate4INFOCSV(campaign,items);
}

function generate4INFOCSV(campaign,line_items){
    if(exportCanceled){
        return;
    }
    //var csvItems = 'data:text/csv;charset=utf-8,"Platform","Advertiser Name","Campaign Name","Campaign ID","Campaign Budget","Campaign Start Date","Campaign End Date","Post Campaign End Date","Line Item / Ad Group Name","Line Item ID","Channel Screen Type (Desktop, Mobile Web, Mobile App)","Budget ($)","Bid Strategy","Start Date (mm/dd/yyy)","End Date (mm/dd/yyy)","Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)","Creative ID","Creative Name","Creative Preview URL","Creative Description (comma separated list)","Brand","UPCs","Networks (Name)","New To Brand Weeks Attribution","New to category Weeks attribution","Attribution Time Window (Days)"\r\n';
//1;2;3;4;5;6;7;8;9;10;ghq2227h;TTD_PSA_Test_Desktop;https://preview-desk.thetradedesk.com/Creatives/ClickTrackingPreview?CreativeId=ghq2227h&Token=3eadb5363ba7fb681e4c5e57ffcee927&IsShare=True;;
    var exportData = [];
    line_items.forEach(function(element) {
        if(!element.start_date){
            element.start = campaign.start_date;
        }
        if(!element.end_date){
            element.end = campaign.end_date;
        }
        if(element.description == null || element.description == ""){
            element.description = "";
        }
        exportData.push({"Platform": "4INFO",
            "Advertiser Name":campaign.advertiser,//2
            "Campaign Name":campaign.name,//3
            "Campaign ID":campaign.id,//4
            "Campaign Budget":campaign.impressions_goal.replace(",","").replace("$",""),//5
            "Campaign Start Date (mm/dd/yyy)":campaign.start_date,//6
            "Campaign End Date (mm/dd/yyy)":campaign.end_date,//7
            "Post Campaign End Date":'',//8
            "Line Item / Ad Group Name":element.name,//9
            "Line Item ID":element.id,//10
            "Channel Screen Type (Desktop, Mobile Web, Mobile App)":"",//11
            "Budget":element.impressions_goal.replace(",","").replace("$",""),//12
            "Bid Strategy":'CPM',//13
            "Line Item Start Date (mm/dd/yyy)":element.start_date,//14
            "Line Item End Date (mm/dd/yyy)":element.end_date,//15
            "Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)":element.creative_format,//16
            "Creative ID":element.creative_id, //17
            "Creative Name":element.creative_name,//18
            "Creative Preview URL":element.creative_preview_url,//19
            "Creative Description (comma separated list)":"",//20
            "Brand":'',"UPCs":'',"Networks (Name)":'',
            "New To Brand Weeks Attribution":'26',
            "New to category Weeks attribution":'26',
            "Attribution Time Window (Days)":'30'   
        });
    });

    var fileName = "4INFO-campaign_export-"+campaign.advertiser.toLowerCase().replace(" ","_")+"-"+get_date()+".xlsx";
    
    var ws = XLSX.utils.json_to_sheet(exportData, { header: [
            "Platform","Advertiser Name","Campaign Name","Campaign ID","Campaign Budget","Campaign Start Date (mm/dd/yyy)","Campaign End Date (mm/dd/yyy)","Post Campaign End Date","Line Item / Ad Group Name","Line Item ID","Channel Screen Type (Desktop, Mobile Web, Mobile App)","Budget","Bid Strategy","Line Item Start Date (mm/dd/yyy)","Line Item End Date (mm/dd/yyy)","Creative Format (Banner, Rich Media Banner, Video, Native, Intersitial)","Creative ID","Creative Name","Creative Preview URL","Creative Description (comma separated list)","Brand","UPCs","Networks (Name)","New To Brand Weeks Attribution","New to category Weeks attribution","Attribution Time Window (Days)"
        ] });
    var wb = XLSX.utils.book_new();
    console.log('writing file',wb);
    console.log(ws);
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    chrome.runtime.sendMessage({ action: "saveFile" , wb:wb ,fileName:fileName});
    chrome.runtime.sendMessage({ success: true,vendor:"#step3_4info"});
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.action == "export_4info"){
        export4info();
    }
    if(request.action == "export_cancel"){
        exportCanceled == true;
    }
  });
