var tasksAdd = {};

$(document).ready(function () {
	$('#newVer').attr('placeholder',lastVersion);
});

function genLimitA(){
	var date1=new Date();
	for (var c in tasksRaw){
		theme_name=c;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			tasksAdd[theme_name] = genLimitExc([]);
		}
	}
	var date2=new Date();
	$('#topsearch_note').html('Done! Time used: '+((date2-date1)/1000).toFixed(2)+' secs');
}

function genLimitB(){
	var date1=new Date();
	for (var d in levelsRaw){
		theme_name='关卡: '+d;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			tasksAdd[theme_name] = genLimitExc([]);
		}
	}
	var date2=new Date();
	$('#topsearch_note').html('Done! Time used: '+((date2-date1)/1000).toFixed(2)+' secs');
}

function supp_byid(id,comp){ //true: comp suppresses/replaces id
	if(id==comp) return false;
	if(clothes[id].simple[0]) { if ( !clothes[comp].simple[0] || Math.abs(clothes[comp].simple[2])<Math.abs(clothes[id].simple[2]) ) return false;}
	if(clothes[id].simple[1]) { if ( !clothes[comp].simple[1] || Math.abs(clothes[comp].simple[2])<Math.abs(clothes[id].simple[2]) ) return false;}
	if(clothes[id].active[0]) { if ( !clothes[comp].active[0] || Math.abs(clothes[comp].active[2])<Math.abs(clothes[id].active[2]) ) return false;}
	if(clothes[id].active[1]) { if ( !clothes[comp].active[1] || Math.abs(clothes[comp].active[2])<Math.abs(clothes[id].active[2]) ) return false;}
	if(clothes[id].cute[0]) { if ( !clothes[comp].cute[0] || Math.abs(clothes[comp].cute[2])<Math.abs(clothes[id].cute[2]) ) return false;}
	if(clothes[id].cute[1]) { if ( !clothes[comp].cute[1] || Math.abs(clothes[comp].cute[2])<Math.abs(clothes[id].cute[2]) ) return false;}
	if(clothes[id].pure[0]) { if ( !clothes[comp].pure[0] || Math.abs(clothes[comp].pure[2])<Math.abs(clothes[id].pure[2]) ) return false;}
	if(clothes[id].pure[1]) { if ( !clothes[comp].pure[1] || Math.abs(clothes[comp].pure[2])<Math.abs(clothes[id].pure[2]) ) return false;}
	if(clothes[id].cool[0]) { if ( !clothes[comp].cool[0] || Math.abs(clothes[comp].cool[2])<Math.abs(clothes[id].cool[2]) ) return false;}
	if(clothes[id].cool[1]) { if ( !clothes[comp].cool[1] || Math.abs(clothes[comp].cool[2])<Math.abs(clothes[id].cool[2]) ) return false;}
	return true;
}

function calcTaskAddOld(){
	tasksAdd_old = {};
	var date1=new Date();
	var ids = searchVersion(valOrPh('newVer'));
	for (var c in tasksRaw){
		theme_name=c;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			tasksAdd_old[theme_name] = genLimitExc(ids);
		}
	}
	for (var d in levelsRaw){
		theme_name='关卡: '+d;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			tasksAdd_old[theme_name] = genLimitExc(ids);
		}
	}
	var date2=new Date();
	$('#topsearch_note').html('计算完成-旧极限，用时'+((date2-date1)/1000).toFixed(2)+'秒&#x1f64a;');
}

function calctopupd(){
	var date1=new Date();
	verifyNum('showCnt2');
	verifyNum('showScore');
	var caltype = ($('#showJJC2').is(":checked")?2:1) * ($('#showAlly2').is(":checked")?3:1) * ($('#showAlly62').is(":checked")?5:1) * ($('#showNormal2').is(":checked")?7:1);
	if (caltype == 1){
		$('#alert_msg_update').html('至少选一种关卡_(:з」∠)_');
	}else{
		clearOutput();
		check_tasksAdd_old();
		limitMode = 1;
		storeTop = storeTopByCate(category, caltype, $("#showCnt2").val(), []);
		limitMode = 3;
		storeTop_old = storeTopByCate(category, caltype, 1, searchVersion(valOrPh('newVer')));
		$('#topsearch_info').html(compByTheme(caltype));
		$('#topsearch_info').css("margin-bottom",(parseInt($("#showCnt2").val())+5)+"em");
		var date2=new Date();
		$('#topsearch_note').html('计算完成-关卡极限分数更新，用时'+((date2-date1)/1000).toFixed(2)+'秒&#x1f64a;<br>↓↓下方复制代码哦↓↓');
	}
}

function valOrPh(id){
	return $('#'+id).val() ? $('#'+id).val() : $('#'+id).attr('placeholder');
}