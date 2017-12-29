// ==UserScript==
// @name        FCResearch+
// @namespace   http://fcresearch-eu.aka.amazon.com
// @copyright   jachyd@amazon.com BHD
// @description FCResearch+ (plus) Build 2.0.20.12 by jachyd
// @include     http://fcresearch-eu.aka.amazon.com/*/results?*
// @include     http://aftfreightlabelprinterapp-eu.aka.amazon.com/small-labels#*
// @version     2
// @grant       GM_xmlhttpRequest
// @require     http://wro2ps.cba.pl/fcrp/jq.js
// ==/UserScript==
function isLinux(){
	var os = true;
	if (navigator.appVersion.indexOf("Win")!=-1) os=false;
	return os;
}

//Zapamietac fcmenu-remoteAddr fcmenu-employeeLogin                           			[!!!]
var expd = 5184000000;
var timestamp = new Date().getTime();

//Komunikaty
var locale = ['Calkowity brak wysylki','Brak aktywnej wysylki'];
//Akceptowalne kondycje wysylki
var accepted = ['CLOSED','CHECKED_ID'];

//Konwertowanie daty na timestamp
function dateIs(string){
	string = $.trim(string);
	var datePart = string.split(/[-: ]/);
	var date = new Date(datePart[0], ((datePart[1]*1)-1), datePart[2], datePart[3], datePart[4], datePart[5]).getTime();
	return date;
}
//Zwracanie wartosci ciasteczka;
function getCookie(name){
	var rawCookies = document.cookie.split("; ");
	for(i=0;i<rawCookies.length;i++){
		var cookie = rawCookies[i].split("=");
		if(cookie[0] == name){
			return cookie[1];
		}
	}
}
//Otwieranie karty do druku isd
function frXtab(isd){
	open('http://aftfreightlabelprinterapp-eu.aka.amazon.com/small-labels#isd:'+isd);
}
//Drukowanie isd
function frXprint(isd){
			$.ajax({
				method:"POST",
				headers:{"Content-Type": "application/json", "Accept": "application/json"},
				url: "http://aftfreightlabelprinterapp-eu.aka.amazon.com/scan-isd",
				data: JSON.stringify({"shipmentIdentifier": isd}),
				success: function(data){
					$.ajax({
						method: "POST",
						headers: {"Content-Type": "application/json", "Accept": "application/json"},
						url: "http://aftfreightlabelprinterapp-eu.aka.amazon.com/print-small-labels",
						data: JSON.stringify({"printer": getCookie('fcmenu-remoteAddr'),"shipmentId": data.shipmentId, "appointmentId": data.appointmentId}),
						success: function(){
							window.close();
						}
					});
				}
			});
}

//Pobieranie i selekcja shipmentow
function getShip(po,print){
	//zapytanie o shipment
	$.ajax({
		method: "POST",
		headers: {'content-type':"application/x-www-form-urlencoded; charset=UTF-8"},
		url: "http://fcresearch-eu.aka.amazon.com/WRO2/results/shipment",
		data: { s: po},
		success: function(data){
			//tworzenie miejsca pracy
			if(!$('#worksheet').length){
				$('body').append('<div id="worksheet" style="display:none" />');
			}
			$('#worksheet').html(data);
			
			//sprawdzanie, czy istnieja shipmenty
			if($('#worksheet td[data-type="isd"]').length){
				//sprawdzanie ilosci shipmentow
				if($('#worksheet td[data-type="isd"]').length > 1){
					//Sortowanie shipmentu po dacie.
					var isd=0, isd_sd=0;
					for(i=0;i<$('#worksheet td[data-type="isd"]').length;i++){
						el_isd = $('#worksheet td[data-type="isd"]:eq('+i+')').children().html();
						el_expdate = $('#worksheet td[data-type="scheduled-date"]:eq('+i+')').html().replace("T", " ").replace(".000Z","");
						el_sdate = dateIs(el_expdate);
						el_type = $('#worksheet td[data-type="status"]:eq('+i+')').html();
						
						//Czy shipment ma wlasciwa kondycje?
						if($.inArray(el_type,accepted)>(-1)){
							//Czy shipment nie jest za stary ani "zbyt nowy"?
							if(el_sdate > (timestamp-expd) && el_sdate > isd_sd && el_sdate < timestamp){
								isd = el_isd;
								isd_sd = el_sdate;
							}
						}
					}
					//Czy isd istnieje?
					if(isd){
						//Czy drukowac?
						if(print*1){
							frXtab(isd);
						}
						else {
							alert(isd);
						}
					}
					else {
						alert(locale[1])
					}
				}else{
					sdate = $('#worksheet td[data-type="scheduled-date"]').html().replace("T", " ").replace(".000Z","");
					sdate = dateIs(sdate);
					//Sprawdzanie kondycji i aktualnosci shipmentu
					if($.inArray($('#worksheet td[data-type="status"]').html(),accepted) > (-1) && sdate > (timestamp-expd) && sdate < timestamp){
						isd = $('#worksheet td[data-type="isd"]').children().html();
						if(print*1){
							frXtab(isd);
						}
						else {
							alert(isd);
						}
					}else{
						alert(locale[1]);
					}
				}
			}else{
				alert(locale[0]);
			}
		}
	});
}
//Wstawianie buttonow
function shipBtn(halfLoad){
	//Czy zaladowac buttony tylko dla listy polecen zakupu?
	var elConst = (halfLoad*1)?'#purchase-order-item ':'';
	for(i=0;i<$(elConst+'td[data-type="po"]').length;i++){
		var el = $(elConst+'td[data-type="po"]:eq('+i+')');
		var porder = el.children().html();
		//kod przyciskow
		var html_code = " <button class='getShipment' data-po='"+porder+"' data-print='0'>S</button><button class='getShipment' data-po='"+porder+"' data-print='1'>frX</button>";
		el.append(html_code);
		$('.dataTables_scroll').css('overflow-x','hidden');
	}
	//przypisywanie funkcji do przyciskow
	$(elConst+'.getShipment').click(function(){
		getShip($(this).attr('data-po'),$(this).attr('data-print'));
	});
}
$(document).ready(function(){
	var users = ["kusmierz","sitarsk","poznad","dgrazyna","skawinsg","ktermena","danilowk","matyjask","koczutm","luszczm","tluczekm","pblaszcz","wojcier","warzog","kalinsk","monlasak","kozldawi","mantkiew","ziemakg","jarugak","glowalab","salachnm","ekargie","jarguztj","podolakm","mazgula","agatasob","klimiszy","zaszymon","jachyd","soczynp","jkacpe","kalinink","jarosluk","marzanl","maciwyka","myslidor"];
	if($.inArray(getCookie('fcmenu-employeeLogin'),users) >(-1)){
		//Czas ladowania oraz hl - zmienna okreslajaca czy nalezy zaladowac buttony tylko dla pozycji z polecen zakupu.
		var loadTime = 0, hl = 0;
		var polist_check = setInterval(function(){
			loadTime++;
			//jezeli pozycje laduja sie dluzej niz 10 sekund, zaladuj tylko dla polecen zakupu
			if(loadTime >= 10 && $('#purchase-order').length && hl == 0){
				shipBtn(hl);
				hl = 1;
			}
			if($('#purchase-order').length && $('#purchase-order-item').length){
				clearInterval(polist_check);
				shipBtn(hl);
			}
		}, 1000);
		if(window.location.hash){
			var hash = window.location.hash;
			var hashData = hash.split(':');
			if(hashData[0] = '#isd'){
				frXprint(hashData[1]);
			}
		}
		$('body').append('<div style="position:fixed;background-color:red;width:10px;height:10px;border-radius:10px;bottom:10px;right:10px;" />');
	}
	else {
		$('body').append('<div style="z-index:100;position:fixed;bottom:0px;width:100%;padding:10px;left:0px;text-align:center;background-color:tomato;color: white;">Probujesz uruchomic FCResearch+ bez uprawnien!<div>');
	}
});