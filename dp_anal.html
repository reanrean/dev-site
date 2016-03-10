$(document).ready(function () {
	$('.cartContent').hide();
	show_limitNote();
	enterKey();
	gen_setList();
	$("#showCnt").val(5);
	$("#maxHide").val(5);
});

var top_id='';
var theme_name;
var inTop=[];
var inSec=[];
var cartList=[];
var currentList=[];
var setList=[];

function searchById(){
	var searchById=clear_top_id();
	var searchById_match=0;
	currentList=[];
	if(searchById){
		var out='<p>查找：'+searchById+'</p>'
		out+='<table border="1">';
		out+=tr(td('名称')+td('分类')+td('编号')+td('来源'));
		for (var i in setList){
			if (setList[i].indexOf(searchById)>-1){
				out+=tr(td(ahref(setList[i],"searchSet('"+setList[i]+"')"))+td('套装')+td('-')+td('-'));
				searchById_match=1;
			}
		}
		for (var i in clothes){
			if(clothes[i].name.indexOf(searchById)>-1||parseInt(clothes[i].id)==parseInt(searchById)){
				currentList.push(i);
			}
		}
		out+=appendCurrent();
		out+='</table>';
		if(currentList.length>0||searchById_match) {$('#topsearch_info').html(out);}
		else {$("#topsearch_info").html('没有找到相关资料');}
	}
}

function searchSet(setName){
	currentList=[];
	var out='<p>套装：'+setName+'　'+ahref('查找所有染色及进化',"searchSetSub('"+setName+"')")+'</p>';
	out+='<table border="1">';
	out+=tr(td('名称')+td('分类')+td('编号')+td('来源'));
	for (var i in clothes){
		if(clothes[i].set==setName){
			currentList.push(i);
		}
	}
	out+=appendCurrent();
	out+='</table>';
	$('#topsearch_info').html(out);
}

function searchSetSub(setName){
	currentList=[];
	var out='<p>套装：'+setName+'　所有染色及进化</p>';
	out+='<table border="1">';
	out+=tr(td('名称')+td('分类')+td('编号')+td('来源'));
	var arrList=[];//find clothes in set
	for (var i in clothes){
		if(clothes[i].set==setName) {arrList.push(i);}
	}
	for (var i in arrList){
		var orig=arrList[i];
		do{
			currentList.push(orig);
			orig=searchOrig(orig);
		}while(orig!=-1);
	}
	do{
		currentList=searchDeriv(currentList);
	}while(currentList.length!=searchDeriv(currentList).length);
	out+=appendCurrent();
	out+='</table>';
	$('#topsearch_info').html(out);
}

function searchOrig(id){
	var srcs=clothes[id].source.split('/');
	for (var s in srcs){
		if (srcs[s].indexOf('定')==0||srcs[s].indexOf('进')==0){
			var orig_num=srcs[s].substr(1);
			for (var i in clothes){
				if(clothes[i].type.mainType==clothes[id].type.mainType&&clothes[i].id==orig_num){return i;}
			}
		}
	}
	return -1;
}

function searchDeriv(idList){
	var retList=[];
	for (var id in idList){
		retList.push(idList[id]);
		var orig_num=clothes[idList[id]].id;
		for (var i in clothes){
			if (clothes[i].source.indexOf(orig_num)>0&&clothes[i].type.mainType==clothes[idList[id]].type.mainType){
				var srcs=clothes[i].source.split('/');
				for (var s in srcs){
					if (srcs[s]=='定'+orig_num||srcs[s]=='进'+orig_num){
						retList.push(i);
						break;
					}
				}
			}
		}
	}
	retList=getDistinct(retList);
	return retList;
}

function appendCurrent(){
	var out='';
	currentList=getDistinct(currentList);
	for (var c in category){//sort by category
		for (var i in currentList){
			if(clothes[currentList[i]].type.type!=category[c]) {continue;}
			var line=td(ahref(clothes[currentList[i]].name,'choose_topid('+currentList[i]+')'));
				line+=td(clothes[currentList[i]].type.type);
				line+=td(clothes[currentList[i]].id);
				var srcs=conv_source(clothes[currentList[i]].source,'进',clothes[currentList[i]].type.mainType);
					srcs=conv_source(srcs,'定',clothes[currentList[i]].type.mainType);
				line+=td(srcs);
			out+=tr(line);
		}
	}
	return out;
}

function choose_topid(id){
	if ($('#cartMode').is(":checked")){
		addCart(id);
	}else{
		top_id=id;
		$('#textBox').css({'background':'#DDECFF'});
		$('#textBox').val(clothes[id].type.mainType+': '+clothes[id].name);
	}
}

function calctop(){
	if ($('#cartMode').is(":checked")){
		if (cartList.length==0){
			$('#alert_msg').html('选取列表为空_(:з」∠)_');
		}else{
			$('#alert_msg').html('');
			$('#topsearch_info').html('');
			calctop_byall();
		}
	}else{
		if (!top_id) {
			$('#alert_msg').html('请选择一件衣服_(:з」∠)_');
		}else{
			$('#alert_msg').html('');
			$('#topsearch_info').html('');
			calctop_byid(top_id);
			output_byid(top_id);
		}
	}
}

function calctop_byall(){
	if ($('#showNormal').is(":checked")){var showNormal=1;}
	else{var showNormal=0;}
	if($('#limitMode').is(":checked")){var limitMode=1;}
	else{var limitMode=0;}
	var out='<table border="1" class="calcByAll">';
	out+=tr(td('名称')+td('部位')+td('顶配')+td('竞技场')+td('联盟'+(limitMode?'(极限)':''))+(showNormal?td('关卡'+(limitMode?'(极限)':'')):''));
	for (var i in cartList){
		id=cartList[i];
		calctop_byid(id);
		var rowspan=1;
		if(inTop.length>0 && inSec.length>0) {rowspan++;}
		
		var cell=td(clothes[id].name,'rowspan="'+rowspan+'"')+td(clothes[id].type.type,'rowspan="'+rowspan+'"');
		if(inTop.length>0){
			cell+=td('顶配');
			cell+=td(retTopTd(inTop,'竞技场',id));
			cell+=td(retTopTd(inTop,'联盟',id));
			cell+=(showNormal?td(retTopTd(inTop,'关卡',id)):'');
			out+=tr(cell);
		}
		if(inSec.length>0){
			if(inTop.length>0){cell='';}
			cell+=td('高配','class="inSec"');
			cell+=td(retTopTd(inSec,'竞技场',id),'class="inSec"');
			cell+=td(retTopTd(inSec,'联盟',id),'class="inSec"');
			cell+=(showNormal?td(retTopTd(inSec,'关卡',id),'class="inSec"'):'');
			out+=tr(cell);
		}
		if(inTop.length==0 && inSec.length==0){
			out+=tr(cell+td('')+td('')+td('')+(showNormal?td(''):''));
		}
	}
	out+='</table>';
	$('#topsearch_info').html(out);
}

function retTopTd(arr,crit,id){
	var ret='';
	var cnt=0;
	if($('#limitMode').is(":checked")){var limitMode=1;}
	else{var limitMode=0;}
	
	if(arr==inTop){
		for (var s in inTop){
			if(inTop[s].indexOf(crit)==0) {
				if (crit=='竞技场') {ret+=(cnt>0?', ':'')+nobr(inTop[s].substr(inTop[s].indexOf(': ')+2,2));}
				else {ret+=(cnt>0?', ':'')+nobr(inTop[s].substr(inTop[s].indexOf(': ')+2));}
				cnt++;
			}
		}
		if(cnt>$("#maxHide").val()){
			switch(crit){
				case '竞技场': var pos=1; break;
				case '联盟': var pos=2; break;
				case '关卡': var pos=3; break;
			}
			a='<span id="cell'+id+'_t'+(limitMode?"l":"n")+pos+'">'+ahref('共'+cnt+'关',"showTop('"+id+"_t"+(limitMode?"l":"n")+pos+"')")+'</span>';
			a+='<span id="cell'+id+'_t'+(limitMode?"l":"n")+pos+'_f" style="display:none">'+ret+'<br>'+nobr(ahref('收起',"hideTop('"+id+"_t"+(limitMode?"l":"n")+pos+"')"))+'</span>';
			return a;
		}
		return ret;
	}else{
		for (var s in inSec){
			if(inSec[s][0].indexOf(crit)==0) {
				if (crit=='竞技场') {ret+=(cnt>0?', ':'')+nobr(inSec[s][0].substr(inSec[s][0].indexOf(': ')+2,2)+'(第'+inSec[s][1]+')');}
				else {ret+=(cnt>0?', ':'')+nobr(inSec[s][0].substr(inSec[s][0].indexOf(': ')+2)+'(第'+inSec[s][1]+')');}
				cnt++;
			}
		}
		if(cnt>$("#maxHide").val()){
			switch(crit){
				case '竞技场': var pos=1; break;
				case '联盟': var pos=2; break;
				case '关卡': var pos=3; break;
				default: var pos=0;
			}
			a='<span id="cell'+id+'_s'+(limitMode?"l":"n")+pos+'">'+ahref('共'+cnt+'关',"showTop('"+id+"_s"+(limitMode?"l":"n")+pos+"')")+'</span>';
			a+='<span id="cell'+id+'_s'+(limitMode?"l":"n")+pos+'_f" style="display:none">'+ret+'<br>'+nobr(ahref('收起',"hideTop('"+id+"_s"+(limitMode?"l":"n")+pos+"')"))+'</span>';
			return a;
		}
		return ret;
	}
}

function showTop(id){
	$('#cell'+id+'_f').show();
	$('#cell'+id).hide();
}

function hideTop(id){
	$('#cell'+id+'_f').hide();
	$('#cell'+id).show();
}

function calctop_byid(id){
	inTop=[];inSec=[];
	
	for (var b in competitionsRaw){
		theme_name='竞技场: '+b;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			calctop_bytheme(id,theme_name);
		}
	}
	
	for (var c in tasksRaw){
		theme_name=c;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			calctop_bytheme(id,theme_name);
		}
	}
	if ($('#showNormal').is(":checked")){
		for (var d in levelsRaw){
			theme_name='关卡: '+d;
			if (allThemes[theme_name]) {
				setFilters(allThemes[theme_name]);
				calctop_bytheme(id,theme_name);
			}
		}
	}
}

function output_byid(id){ //need inTop,inSec
	var output='<b>'+clothes[id].name+'</b>&ensp;'+clothes[id].type.type+'&ensp;'+clothes[id].id+'<br>';
	var cell='';
		if(clothes[id].simple[0]) cell+='简约'+clothes[id].simple[0];
		if(clothes[id].simple[1]) cell+='华丽'+clothes[id].simple[1];
		if(clothes[id].active[0]) cell+='&ensp;活泼'+clothes[id].active[0];
		if(clothes[id].active[1]) cell+='&ensp;优雅'+clothes[id].active[1];
		if(clothes[id].cute[0]) cell+='&ensp;可爱'+clothes[id].cute[0];
		if(clothes[id].cute[1]) cell+='&ensp;成熟'+clothes[id].cute[1];
		if(clothes[id].pure[0]) cell+='&ensp;清纯'+clothes[id].pure[0];
		if(clothes[id].pure[1]) cell+='&ensp;性感'+clothes[id].pure[1];
		if(clothes[id].cool[0]) cell+='&ensp;清凉'+clothes[id].cool[0];
		if(clothes[id].cool[1]) cell+='&ensp;保暖'+clothes[id].cool[1];
		if(clothes[id].tags[0]) cell+='&ensp;'+clothes[id].tags.join(',');
	output+=cell+'<br><br>';
	if(inTop.length>0){
		output+='顶配：<br>';
		for (var s in inTop){
			output+='&emsp;'+inTop[s]+'<br>';
		}
	}
	if(inSec.length>0){
		output+='高配：<br>';
		for (var u in inSec){
			output+='&emsp;'+inSec[u][0]+'(第'+inSec[u][1]+')<br>';
		}
	}
	if(inTop.length==0 && inSec.length==0){
		output+='沒有顶配/高配信息';
	}
	$('#topsearch_info').html(output);
}

function calctop_bytheme(id,them){
	onChangeCriteria();
	
	var resultList = getTopCloByCate(criteria, $("#showCnt").val(), clothes[id].type.type, id);
	if($.inArray(clothes[id], resultList)>-1){
		if(clothes[id]==resultList[0]) {
			inTop.push(them);
		}else{
			for (r=1;r<resultList.length;r++){
				if(clothes[id]==resultList[r]){
					inSec.push([them,r+1]);
					break;
				}
			}
		}
	}
}

function getTopCloByCate(filters,rescnt,type,id){
	var result = [];
	for (var i in clothes) {
		if (clothes[i].type.type!=type){continue;}//skip other categories
		clothes[i].calc(filters);
		if (!result[0]) {
			result[0] = clothes[i];
		} else {
			for (j=0;j<rescnt;j++){//compare with [j]
				if(!result[j] || clothes[i].sumScore > result[j].sumScore
					|| (clothes[i].sumScore >= result[j].sumScore && i==id)){
					//lower others ranking
					for (k=rescnt-1;k>j;k--){
						result[k] = result[k-1];
					}
					//put current clothes to [j]
					result[j] = clothes[i];
					break;
				}
			}
		}
	}
	return result;
}

function show_limitNote(){
	var tooltip='即微笑+飞吻以及飞吻分別打在最高分的两个属性时的极限搭配权重。此模式使用全衣柜下的极限权重，请注意收集度不同极限权重也可能会不同，并非一定适合所有玩家。';
	var output='<a href="" onclick="return false;" tooltip="'+tooltip+'">说明</a>';
	$('#limitNote').html(output);
}

function chgcartMode(){
	if ($('#cartMode').is(":checked")){
		$('.cartContent').show();
		refreshCart();
		clear_top_id();
	}else{
		$('.cartContent').hide();
	}
}

function clear_top_id(){
	top_id='';
	$('#textBox').css({'background':''});
	var searchById=$.trim($("#textBox").val());
	if(searchById.indexOf(': ')>-1) {
		searchById=searchById.substr(searchById.indexOf(': ')+2);
		$("#textBox").val(searchById);
	}
	return searchById;
}

function clearCart(){
	cartList=[];
	refreshCart();
}

function addCart_All(){
	for (var i in currentList){
		addCart(currentList[i]);
	}
}

function refreshCart(){
	$('#cart').html('');
	for (var i in cartList){
		$('#cart').append('<button class="btn btn-xs btn-default">'+clothes[cartList[i]].name+ahref('[×]','delCart('+cartList[i]+')')+'</button>&ensp;');
	}
}

function addCart(id){
	if($.inArray(id,cartList)<0){
		cartList.push(id);
		refreshCart();
	}
}

function delCart(id){
	var newArr=cartList;
	cartList=[];
	for (var i in newArr){
		if(newArr[i]!=id) {cartList.push(newArr[i]);}
	}
	refreshCart();
}

function gen_setList(){
	setList=[];
	for (var i in clothes){
		if(clothes[i].set&&$.inArray(clothes[i].set,setList)<0){
			setList.push(clothes[i].set);
		}
	}
}

function nobr(text){
	return '<span class="nobr">'+text+'</span>';
}

function getDistinct(arr){//don't know why the concise method doesn't work...
	var newArr=[];
	for (var i in arr){
		var ind=0;
		for (var j in newArr){
			if (arr[i]==newArr[j]) {ind=1;}
		}
		if(ind==0) {newArr.push(arr[i])};
	}
	return newArr;
}

//below is modified from material.js

function conv_source(src,subs,mainType){
	if(src.indexOf(subs)>-1){
		var pos1=src.indexOf(subs)+1;
		var pos2=src.indexOf('/',pos1); 
		if(pos2<0) {pos2=src.length;}
		var str1=src.substr(0,pos1);
		var str2=src.substr(pos1,pos2-pos1);
		var str3=src.substr(pos2);
		for (var p in clothes){
			if(clothes[p].type.mainType==mainType&&clothes[p].id==str2) 
			{str2='-'+clothes[p].name;}
		}
		return str1+str2+str3;
	}else{
		return src;
	}
}

function td(text,attr){
	return '<td'+(attr? ' '+attr : '')+'>'+text+'</td>';
}

function tr(text,attr){
	return '<tr'+(attr? ' '+attr : '')+'>'+text+'</tr>';
}

function ahref(text,onclick,cls){
	return '<a href="" onclick="'+onclick+';return false;" '+(cls? 'class="'+cls+'" ' : '')+'>'+text+'</a>';
}

function enterKey() {
	$('#textBox').keydown(function(e) {
		if (e.keyCode==13) {
			$(this).blur();
			searchById();
		}
	});
}

//below is modified from nikki.js

function onChangeCriteria() {
	criteria = {};
	for (var i in FEATURES) {
		var f = FEATURES[i];
		var weight = parseFloat($('#' + f + "Weight").val());
		if (!weight) {
			weight = 1;
		}
		//rean mod
		if($('#limitMode').is(":checked")){
			for (var level in tasksAdd){
				if (theme_name==tasksAdd[level][0]){
					if (f==tasksAdd[level][1]) {weight=weight*1.27;}
					if (f==tasksAdd[level][2]) {weight=weight*1.778;}
				}
			}
		}
		/*if (uiFilter["highscore"]) {
			var highscore1 = $('#' + f + "1d778.active").length ? 1.778 : 1;
			var highscore2 = $('#' + f + "1d27.active").length ? 1.27 : 1;
			weight = accMul(accMul(weight, highscore1), highscore2);
		}*/
		var checked = $('input[name=' + f + ']:radio:checked');
		if (checked.length) {
			criteria[f] = parseInt(checked.val()) * weight;
		}
	}
	tagToBonus(criteria, 'tag1');
	tagToBonus(criteria, 'tag2');
	if (global.additionalBonus && global.additionalBonus.length > 0) {
		criteria.bonus = global.additionalBonus;
	}
}

//below is duplicated from nikki.js

var criteria = {};

function accMul(arg1, arg2) {
	var m = 0,
	s1 = arg1.toString(),
	s2 = arg2.toString();
	try {
		m += s1.split(".")[1].length
	} catch (e) {}
	try {
		m += s2.split(".")[1].length
	} catch (e) {}
	return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
}

function tagToBonus(criteria, id) {
	var tag = $('#' + id).val();
	var bonus = null;
	if (tag.length > 0) {
		var base = $('#' + id + 'base :selected').text();
		var weight = parseFloat($('#' + id + 'weight').val());
		if ($('input[name=' + id + 'method]:radio:checked').val() == 'replace') {
			bonus = replaceScoreBonusFactory(base, weight, tag)(criteria);
		} else {
			bonus = addScoreBonusFactory(base, weight, tag)(criteria);
		}
		if (!criteria.bonus) {
			criteria.bonus = [];
		}
		criteria.bonus.push(bonus);
	}
}

function clearTag(id) {
	$('#' + id).val('');
	$('#' + id + 'base').val('SS');
	$('#' + id + 'weight').val('1');
	$($('input[name=' + id + 'method]:radio').get(0)).prop("checked", true);
	$($('input[name=' + id + 'method]:radio').get(0)).parent().addClass("active");
	$($('input[name=' + id + 'method]:radio').get(1)).parent().removeClass("active");
}

function bonusToTag(idx, info) {
	$('#tag' + idx).val(info.tag);
	if (info.replace) {
		$($('input[name=tag' + idx + 'method]:radio').get(1)).prop("checked", true);
		$($('input[name=tag' + idx + 'method]:radio').get(1)).parent().addClass("active");
		$($('input[name=tag' + idx + 'method]:radio').get(0)).parent().removeClass("active");
	} else {
		$($('input[name=tag' + idx + 'method]:radio').get(0)).prop("checked", true);
		$($('input[name=tag' + idx + 'method]:radio').get(0)).parent().addClass("active");
	}
	$('#tag' + idx + 'base').val(info.base);
	$('#tag' + idx + 'weight').val(info.weight);
}

var uiFilter = {};
function onChangeUiFilter() {
	uiFilter = {};
	$('.fliter:checked').each(function () {
		uiFilter[$(this).val()] = true;
	});

	if (currentCategory) {
		if (CATEGORY_HIERARCHY[currentCategory].length > 1) {
			$('input[name=category-' + currentCategory + ']:checked').each(function () {
				uiFilter[$(this).val()] = true;
			});
		} else {
			uiFilter[currentCategory] = true;
		}
	}
	refreshTable();
}

function setFilters(level) {
	currentLevel = level;
	global.additionalBonus = currentLevel.additionalBonus;
	var weights = level.weight;
	for (var i in FEATURES) {
		var f = FEATURES[i];
		var weight = weights[f];
		/*if (uiFilter["balance"]) {
			if (weight > 0) {
				weight = 1;
			} else if (weight < 0) {
				weight = -1;
			}
		}*/
		$('#' + f + 'Weight').val(Math.abs(weight));
		var radios = $('input[name=' + f + ']:radio');
		for (var j = 0; j < radios.length; j++) {
			var element = $(radios[j]);
			if (parseInt(element.attr("value")) * weight > 0) {
				element.prop("checked", true);
				element.parent().addClass("active");
			} else if (element.parent()) {
				element.parent().removeClass("active");
			}
		}
	}
	clearTag('tag1');
	clearTag('tag2');
	if (level.bonus) {
		for (var i in level.bonus) {
			bonusToTag(parseInt(i) + 1, level.bonus[i]);
		}
	}
}
