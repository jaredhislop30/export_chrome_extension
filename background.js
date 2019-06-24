chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == 'beeswax_query') {
    chrome.runtime.sendMessage({ action: "test" });
  }
  if(request.action == "repeatAction"){
    if( localStorage["step"] == "main"){
      localStorage["lastAction"] = "{}";
    }
    if(localStorage["lastAction"]){
      chrome.runtime.sendMessage(JSON.parse(localStorage["lastAction"]));
    }
  }else{
    if(request.action == "saveFile"){
      if(!request.wb || !request.wb.SheetNames || !request.wb.Sheets) {
       return;
     }
      XLSX.writeFile(request.wb, request.fileName);
    }else{
      localStorage["lastAction"] = JSON.stringify(request);
    }
  }
});

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "knockknock");
  port.onMessage.addListener(function(msg) {
    if (msg.action == "get_line_items"){
      jQuery.ajax({url: "https://catalina.api.beeswax.com/rest/campaign/strict/"+msg.campaign_id+"?options%5B%5D=compact", type: 'GET', success: function(result){
        campaign = result.payload[0];

        // port.postMessage({action: "step",step:"campaign request",data:campaign});
        var line_items = [];
        // Get array of line items
        jQuery.ajax({url: "https://catalina.api.beeswax.com/rest/line_item?campaign_id="+msg.campaign_id+"&view_name=line_item_stats&rows=200&offset=0&sort_by=update_date&order=desc", type: 'GET', success: function(result){
          //Array of line items (currently 3 [0,1,2])
          data = result.payload;
          // data now equals an array of objects
          // port.postMessage({action: "step",step:"post line item request",data:campaign,line_item:data});
          // Loop through the array of line items (current 3 line items [0,1,2])
          for(ind=0;ind<data.length;ind++){
            for(v in campaign){
              if(!(data[ind].hasOwnProperty(v))){
                data[ind][v] = "";
              }
              if(v=="start_date" || v=="end_date"){
                data[ind]["campaign_"+v] = campaign[v]
              }else{
                data[ind][v] = campaign[v]
              }
            }
            // port.postMessage({action: "step",step:"pre creative request",number:ind,data:data[ind]});

            var url = "https://catalina.api.beeswax.com/rest/creative_line_item?line_item_id="+data[ind].line_item_id+"&view_name=creative_line_item_extended_view&rows=all&options%5B%5D=compact";
            jQuery.ajax({url: url, type: 'GET', success: function(result){
              port.postMessage({action: "step",step:"creative request",number:ind,data:result,line_item:data[ind]});
              for(var int=0;int<result.payload.length;int++){
                var obj_d = {};
                // port.postMessage({action: "step",step:"parsing creative",number:int,data:result.payload[int],line_item:data[ind]});
                for(x in result.payload[int]){
                  if(!(data[ind].hasOwnProperty(x))){
                    data[ind][x] = "";
                  }
                  if(x=="start_date" || x=="end_date"){
                    data[ind]["creative_"+x] = result.payload[int][x];
                  }else{
                    data[ind][x] = result.payload[int][x];
                    // port.postMessage({action: "step",step:"data variable",number:int,variable_to_set:x,variable_value:result.payload[int][x]});    
                  }
                }
                for(x in data[ind]){
                  obj_d[x] = data[ind][x]
                }
                line_items.push(obj_d);
                port.postMessage({action: "step",step:"push line items",number:int,data:data,line_items:line_items});
              }
            },async:false});
          }
          port.postMessage({action: "jQuery Callback",data:data,line_items:line_items});
        },async:false});
      }});

    }else if(msg.action == "export_mta"){
      var output = [];
      var cpn = {};
      
   //Make request to get campaign data
    // var url = "http://"+document.domain+":11110/omni/attrib/campaign/"+document.URL.split("campaignId=")[1];
    // port.postMessage({action: "step",step:"top of function"});    

    jQuery.ajax({url:msg.url,type:"GET",success:function(result){
       port.postMessage({action: "step",step:"getting campaign",data:result});

        // Temp object that will represent the result/response from campaign request above
        var d = result;

        cpn['campaign_start_date'] = d.startDate[1]+"/"+d.startDate[2]+"/"+d.startDate[0];
        cpn['campaign_end_date'] = d.endDate[1]+"/"+d.endDate[2]+"/"+d.endDate[0];
        cpn['UPCs'] = d.upcs.join(',');
        cpn['newBrandUPCs'] = d.newBrandUPCs.join(',');
        cpn['campaign_id'] = d.campaignId;
        cpn['campaign_name'] = d.name;
        var net = [];
        for(var ind=0;ind<d.networks.length;ind++){
          net.push(d.networks[ind].name+"("+d.networks[ind].id+")");
        }
        cpn['networks'] = net.join(',');

        for(var i=0;i<d.lineItems.length;i++){
            
            var line_item_output = {};

            var li = d.lineItems[i];

            //Make request to get MTA Tag for each line item
            line_item_output.line_item_id = li.sortOrder;
            line_item_output.line_item_mta_id = li.id;
            line_item_output.line_item_name = li.name;
            line_item_output.screen_type = li.channelScreenType;
            line_item_output.platform = li.platformName
            line_item_output.line_item_budget = li.budget;
            line_item_output.line_item_start_date = li.startDate[1]+"/"+li.startDate[2]+"/"+li.startDate[0];
            line_item_output.line_item_end_date = li.endDate[1]+"/"+li.endDate[2]+"/"+li.endDate[0];
            line_item_output.campaign_start_date = cpn.campaign_start_date;
            line_item_output.campaign_end_date = cpn.campaign_end_date;
            line_item_output.UPCs = cpn.UPCs;
            line_item_output.newBrandUPCs = cpn['newBrandUPCs'];
            line_item_output.networks = cpn.networks;
            line_item_output.campaign_id = cpn.campaign_id;
            line_item_output.campaign_name = cpn.campaign_name;

            port.postMessage({action: "step",step:"middle of function",data:line_item_output});    
            //http://10.176.45.68:11110/omni/attrib/tag/lineitem/76954c6e-7323-4eb0-a58e-7cb0750e4905
            var mta_url = "http://"+msg.domain+":"+msg.url_port+"/omni/attrib/tag/lineitem/"+line_item_output.line_item_mta_id;
            port.postMessage({action: "step",step:"URL Check",data:mta_url}); //Build URL to pull MTA Line Items Tags
            jQuery.ajax({url: mta_url, type: 'GET', success: function(result){
                
                ldt = result;
                port.postMessage({action: "step",step:"tag gotten",data:ldt});
                line_item_output.bw_tag = ldt.beeswaxTag;
                line_item_output.ttd_tag = ldt.tradeDeskTag;
            },async:false});
            if(li.creative.length>0){
              for(var index=0;index<li.creative.length;index++){
                var obj = {};
                line_item_output.creative_id = li.creative[index].id;
                line_item_output.creative_name = li.creative[index].name;

                for(x in line_item_output){
                  obj[x] = line_item_output[x]
                  if(x.indexOf('creative')>-1){
                  }
                }
                output.push(obj);
              }
            }else{
                var obj = {};
                line_item_output.creative_id = "";
                line_item_output.creative_name = "";

                for(x in line_item_output){
                  obj[x] = line_item_output[x]
                  if(x.indexOf('creative')>-1){
                  }
                }
                output.push(obj);
            }
            port.postMessage({action: "step",step:"end line item",data:output});
        }

      },async:false});
      port.postMessage({action: "step",step:"catalina_campaign",data:output});
    }
  });
});