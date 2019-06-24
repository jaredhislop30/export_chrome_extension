function backAction()
{
  localStorage["step"]="main";
  $("#step1").show();
  $("#tradedesk_warning").hide(); 
  $("[id^='step2']").hide();
  $("[id^='step3']").hide();
}
function cancelAction(id)
{
  if(id.indexOf('tradedesk')>-1){
    warning = "#tradedesk_warning"
    cancel = '#tradedesk_cancel'
  }else if(id.indexOf('4info')>-1){
    warning = "#4info_warning"
    cancel = '#4info_cancel'
  }else if(id.indexOf('bees')>-1){
    warning = "#beeswax_warning"
    cancel = '#beeswax_cancel'
  }else if(id.indexOf('catalina')>-1){
    warning = "#catalina_warning"
    cancel = '#catalina_cancel'
  }
  localStorage["step"] = "main";
  localStorage["lastAction"] = "{}";
  //
  $(cancel).html('Cancel');
  $('#status').text("Please Wait While The Export Finishes....");
  $("#status").css('color', 'black'); 
  $('#spin').show();
  //
  $("#step1").show();
  $(warning).hide(); 
  $("[id^='step2']").hide();
  $("[id^='step3']").hide();
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
  function(tabs){
    chrome.tabs.sendMessage(tabs[0].id,{action:"export_cancel"},function cb(){});
});
  
 }

function startTradeDesk()
{
  localStorage["step"]="tradedesk2";
  $("#step1").hide();
  $("#step2_trade").show();
}
function start4info()
{
  localStorage["step"]="4info2";
  $("#step1").hide();
  $("#step2_4info").show();
}
function startbeeswax()
{
  localStorage["step"]="beeswax2";
  $("#step1").hide();
  $("#step2_beeswax").show();
}
function startcatalina()
{
  localStorage["step"]="catalina2";
  $("#step1").hide();
  $("#step2_catalina").show();
}

// function exportTradeDesk()
// {

// chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
//   function(tabs){
//     if(tabs && tabs[0] && tabs[0].url && tabs[0].url.indexOf("https://") != -1 && tabs[0].url.indexOf("desk.thetradedesk.com/Campaigns/Detail/") != -1 && tabs[0].url.indexOf("advertiser=") != -1){
//           localStorage["step"]="tradedesk3";
//           $("#step2_trade").hide();
//           $("#step3_trade").show();
//           chrome.tabs.sendMessage(tabs[0].id,{action:"export_tradedesk"},function cb(){});
//     }
//     else
//     {
//          $("#tradedesk_warning").show(); 
//     }
// });

// }
function exportVendor(id)
{
  if(id.indexOf('tradedesk')>-1){
    var vendor="trade";
    var step = "tradedesk3";
    var exportId = "export_tradedesk";
    var urlCheck1 = "desk.thetradedesk.com/Campaigns/Detail/";
    var urlCheck2 = "advertiser=";
    var warning = "#tradedesk_warning";
  }else if(id.indexOf('4info')>-1){
    var vendor="4info";
    var step = "4info3";
    var exportId = "export_4info";
    var urlCheck1 = "campaigns.4info.com";
    var urlCheck2 = "campaignSummary/";
    var warning = "#4info_warning";
  }else if(id.indexOf('bees')>-1){
    var vendor="beeswax";
    var step = "beeswas3";
    var exportId = "export_beeswax";
    var urlCheck1 = "beeswax.com/advertisers/";
    var urlCheck2 = "/campaigns/";
    var warning = "#beeswax_warning";
  }else if(id.indexOf('catalina')>-1){
    var vendor="catalina";
    var step = "catalina3";
    var exportId = "export_catalina";
    var urlCheck1 = "/lineitems";
    var urlCheck2 = "?campaignId=";
    var warning = "#catalina_warning";
  }
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
    function(tabs){
      if(tabs && tabs[0] && tabs[0].url && tabs[0].url.indexOf(urlCheck1) != -1 && tabs[0].url.indexOf(urlCheck2) != -1){
            localStorage["step"]=step;
            $("#step2_"+vendor).hide();
            $("#step3_"+vendor).show();
            $('#status').text("Please Wait While The Export Finishes....");
            $('#spin').show();
            chrome.tabs.sendMessage(tabs[0].id,{action:exportId},function cb(){});
      }
      else
      {
           $(warning).show(); 
      }
  });

};

$(function() {
  $('#spin').show();

  $('[id$="_start"]').on('click',function(){
    var id = jQuery(this).attr('id');
    if(id.indexOf('tradedesk')>-1){
      startTradeDesk();  
    }else if(id.indexOf('4info')>-1){
      start4info();
    }else if(id.indexOf('beeswax')>-1){
      startbeeswax();
    }else if(id.indexOf('catalina')>-1){
      startcatalina();
    }
    
  });
  // $('#tradedesk_export').click(exportTradeDesk);
  $('[id$="_export"]').on('click',function(){
    exportVendor(jQuery(this).attr('id'));
  })
  $('[id$="_back"]').click(backAction);
  $('[id$="_cancel"]').on('click',function(){
    cancelAction(jQuery(this).attr('id'));
  })
  
  if(localStorage["step"] && localStorage["step"] != undefined){
    if(localStorage["step"] == "tradedesk2"){
      startTradeDesk();
    }else if(localStorage["step"]=="4info2"){
      start4info();
    }
   if(localStorage["step"] == "tradedesk3"){
      $("#step1").hide();
      $("#step2_trade").show();
      $("#step2_trade").hide();
      $("#step3_trade").show();
    }else if(localStorage["step"] == "4info3"){
      $("#step1").hide();
      $("#step2_4info").show();
      $("#step2_4info").hide();
      $("#step3_4info").show();
    }else if(localStorage["step"] == "beeswax3"){
      $("#step1").hide();
      $("#step2_beeswax").show();
      $("#step2_beeswax").hide();
      $("#step3_beeswax").show();
    }else if(localStorage["step"] == "catalina3"){
      $("#step1").hide();
      $("#step2_catalina").show();
      $("#step2_catalina").hide();
      $("#step3_catalina").show();
    }

  }
  chrome.runtime.sendMessage({ action: "repeatAction"});
}, true);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.success) {
        $(request.vendor+' [id$="_cancel"]').html('Done');;
        $(request.vendor+' #spin').hide();
        $(request.vendor+' #status').text("Export complete");
      }
      if(request.error)
      {
        $("#status").text(request.error); 
        $("#status").css('color', 'red'); 
      }
    }
  );
