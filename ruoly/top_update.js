$(document).ready(function () {
	init_top_update();
});

function init_top_update(){
	$('#textBox').html(lastVersion);
	$('#staffModeOn').hide();
	init_passcode();
	$('#showCnt').val(3);
	$('#showScore').val(500);
	$('#limitNote').html('<a href="" onclick="return false;" tooltip="联盟委托和主线关卡使用极限权重，具体请见顶配查询器的说明。">说明</a>');
}

function clear_textarea(){
	$('#ajglz_out').val('');
}

var theme_name;
var storeTop=[];
var storeTop_old=[];
var dp=10;

var lastVersion_id=function() {
	var ret = [];
	for (var i in clothes) {
		if(clothes[i].version==lastVersion) ret.push(i);
	}
	return ret;
}();

function calctopupd(){
	if (isNaN(parseInt($("#showCnt").val())) || $("#showCnt").val()<1) {$("#showCnt").val(1);}
	if (isNaN(parseInt($("#showScore").val())) || $("#showScore").val()<0) {$("#showScore").val(0);}
	if (!($('#showJJC').is(":checked")||$('#showAlly').is(":checked")||$('#showNormal').is(":checked"))){
		$('#alert_msg').html('至少选一种关卡_(:з」∠)_');
	}else{
		var date1=new Date();
		storeTopByCate();
		compByTheme();
		addStyles();
		var date2=new Date();
		$('#alert_msg').html('用时'+((date2-date1)/1000).toFixed(2)+'秒_(:з」∠)_');
	}
}

function addStyles(){
	var elts = document.getElementsByTagName('a');
	for (var i = elts.length - 1; i >= 0; --i) {
		if(!elts[i].href) {
			elts[i].href="";
			if(!elts[i].onclick) {elts[i].onclick = function() {return false;};}
		}
		if(elts[i].getAttribute('tooltip')){
			elts[i].setAttribute('tooltip',elts[i].getAttribute('tooltip').replace(/\\n/g,'\n'));
		}
	}
}

function storeTopByCate(){
	var showCnt=parseInt($("#showCnt").val());
	for (var cate in category){
		if ($('#showJJC').is(":checked")){
			for (var b in competitionsRaw){
				theme_name='竞技场: '+b;
				if (allThemes[theme_name]) {
					setFilters(allThemes[theme_name]);
					onChangeCriteria();
					if (cate==0){storeTop[theme_name]=[]; storeTop_old[theme_name]=[];}//initialize as array
					storeTop[theme_name].push([category[cate],getTopCloByCate(criteria,showCnt,category[cate],0)]);
					storeTop_old[theme_name].push([category[cate],getTopCloByCate(criteria,1,category[cate],1)]);
				}
			}
		}
		if ($('#showAlly').is(":checked")){
			for (var c in tasksRaw){
				theme_name=c;
				if (allThemes[theme_name]) {
					setFilters(allThemes[theme_name]);
					if (cate==0){storeTop[theme_name]=[]; storeTop_old[theme_name]=[];}//initialize as array
					onChangeCriteria(1);
					storeTop[theme_name].push([category[cate],getTopCloByCate(criteria,showCnt,category[cate],0)]);
					onChangeCriteria(2);
					storeTop_old[theme_name].push([category[cate],getTopCloByCate(criteria,1,category[cate],1)]);
				}
			}
		}
		if ($('#showNormal').is(":checked")){
			for (var d in levelsRaw){
				theme_name='关卡: '+d;
				if (allThemes[theme_name]) {
					setFilters(allThemes[theme_name]);
					if (cate==0){storeTop[theme_name]=[]; storeTop_old[theme_name]=[];}//initialize as array
					onChangeCriteria(1);
					storeTop[theme_name].push([category[cate],getTopCloByCate(criteria,showCnt,category[cate],0)]);
					onChangeCriteria(2);
					storeTop_old[theme_name].push([category[cate],getTopCloByCate(criteria,1,category[cate],1)]);
				}
			}
		}
	}
}

function getTopCloByCate(filters,rescnt,type,old){
	var result = [];
	if ($.inArray(type, skipCategory)>=0) return result;
	for (var i in clothes) {
		if (clothes[i].type.type!=type) continue;//skip other categories
		if (old>0&&$.inArray(i,lastVersion_id)>-1) continue;
		clothes[i].calc(filters);
		if (clothes[i].isF) continue;
		var sum_score= (clothes[i].type.mainType=='饰品') ? Math.round(accSumScore(clothes[i],accCateNum)*dp)/dp : clothes[i].sumScore;
		if (!result[0]) {
			result[0] = [clothes[i],sum_score];
		}else {
			if(result[rescnt-1] && sum_score < result[rescnt-1][1]){
				//do nothing
			}else if(result[rescnt-1] && sum_score == result[rescnt-1][1]){
				result.push([clothes[i],sum_score]);//push to end
			}else{
				for (j=0;j<rescnt;j++){//compare with [j]
					if(!result[j] || sum_score > result[j][1]){
						if (result[rescnt-1]&&result[rescnt-2]){
							if (result[rescnt-1][1] == result[rescnt-2][1]){//insert into list
								for (k=result.length;k>j;k--){//lower others ranking
									result[k] = result[k-1];
								}
								//put current clothes to [j]
								result[j] = [clothes[i],sum_score];
								break;
							}else{//create new list
								var result_orig=result;
								result=[];
								for(r=0;r<j;r++){
									result[r]=result_orig[r];
								}
								for (k=rescnt-1;k>j;k--){//lower others ranking
									result[k] = result_orig[k-1];
								}
								result[j]=[clothes[i],sum_score];
								break;
							}
						}else if(rescnt==1){//create new list with only 1 element
							result=[];
							result[j] = [clothes[i],sum_score];
						}else{
							for (k=rescnt-1;k>j;k--){//lower others ranking
								if(result[k-1]) {result[k] = result[k-1];}
							}
							//put current clothes to [j]
							result[j] = [clothes[i],sum_score];
							break;
						}
					}
				}
			}
		}
	}
	return result;
}

function compByTheme(){
	$('#topsearch_note').html('');
	var exclLevel=$('#exclLevel').val();
	var ajglz_out='';
	if ($('#showNormal').is(":checked")){
		var NM_output=[];
		for (var d in levelsRaw){
			theme_name='关卡: '+d;
			if (exclLevel.length>0 && theme_name.indexOf(exclLevel)>-1) continue;
			NM_output.push(compByThemeName(theme_name));
		}
		var tmp_c=outputByCate(NM_output);
		$('#topsearch_note').append('<p><b>主线关卡</b></p>');
		$('#topsearch_note').append(tmp_c+'<hr>');
		ajglz_out+='<a id="1"></a><p class="title2">主线关卡</p>\n'+tmp_c+'\n';
	}
	if ($('#showAlly').is(":checked")){
		var LM_output=[];
		for (var c in tasksRaw){
			theme_name=c;
			if (exclLevel.length>0 && theme_name.indexOf(exclLevel)>-1) continue;
			LM_output.push(compByThemeName(theme_name));
		}
		var tmp_b=outputByCate(LM_output);
		$('#topsearch_note').append('<p><b>联盟委托</b></p>');
		$('#topsearch_note').append(tmp_b+'<hr>');
		ajglz_out+='<a id="2"></a><p class="title2">联盟委托</p>\n'+tmp_b+'\n';
	}
	if ($('#showJJC').is(":checked")){
		var JJC_output=[];
		for (var b in competitionsRaw){
			theme_name='竞技场: '+b;
			if (exclLevel.length>0 && theme_name.indexOf(exclLevel)>-1) continue;
			JJC_output.push(compByThemeName(theme_name));
		}
		var tmp_a=outputByCate(JJC_output);
		$('#topsearch_note').append('<p><b>竞技场</b></p>');
		$('#topsearch_note').append(tmp_a+'<hr>');
		ajglz_out+='<a id="3"></a><p class="title2">竞技场</p>\n'+tmp_a+'\n';
	}
	$('#topsearch_note').css("margin-bottom",(parseInt($("#showCnt").val())+5)+"em");
	$('#ajglz_out').val(header()+ajglz_out+footer());
}

function compByThemeName(name){
	var sum_score=0;
	var sum_wholetheme=0;
	var sum_array=[]; //cate, diff, [new],[old]
	var rest=0;
	var new_tmp_array=[];
	var old_tmp_array=[];
	for (var c in storeTop[name]){
		//cate, [[clo,sumScore],[clo,sumScore]]
		
		var repelCatesList=[];
		for (var i in repelCates) for (var j in repelCates[i]) repelCatesList.push(repelCates[i][j]);
		if($.inArray(storeTop[name][c][0],repelCatesList)>=0){ //handle them at last
			new_tmp_array[storeTop[name][c][0]]=(storeTop[name][c][1].length==0? [0,[]] : [storeTop[name][c][1][0][1],storeTop[name][c][1]]); //score, [result]
			old_tmp_array[storeTop[name][c][0]]=(storeTop_old[name][c][1].length==0? [0,[]] : [storeTop_old[name][c][1][0][1],storeTop_old[name][c][1]]);
			continue;
		}
		
		if(storeTop[name][c][1].length==0) continue;
		sum_wholetheme+=storeTop[name][c][1][0][1];
		if(storeTop_old[name][c][1].length==0){//dun have old score
			var diff=storeTop[name][c][1][0][1];
			sum_score+=diff; 
			sum_array.push([storeTop[name][c][0],diff,storeTop[name][c][1],[]]);
		}
		else if(storeTop[name][c][1][0][0]!=storeTop_old[name][c][1][0][0]){//new clothes not old one
			var diff=(storeTop[name][c][1][0][1]-storeTop_old[name][c][1][0][1]);
			diff=Math.round(diff*dp)/dp;
			sum_score+=diff;
			sum_array.push([storeTop[name][c][0],diff,storeTop[name][c][1],storeTop_old[name][c][1]]);
		}
		else{
			var diff=(storeTop[name][c][1][0][1]-storeTop_old[name][c][1][0][1]);
			diff=Math.round(diff*dp)/dp;
			sum_score+=diff;
			rest+=diff;
		}
	}
	
	//handle repelCates
	for (var i in repelCates){
		var scoreFirst_new=0;
		var scoreOther_new=0;
		var scoreFirst_old=0;
		var scoreOther_old=0;
		var othCates='';
		var othCatesArrNew=[];
		var othCatesArrOld=[];
		var othChanged=false;
		for (var j in repelCates[i]){
			if (j>0) {
				scoreOther_new += new_tmp_array[repelCates[i][j]][0];
				scoreOther_old += old_tmp_array[repelCates[i][j]][0];
				othCates += (othCates.length>0 ? '+' : '') + shortForm(repelCates[i][j]);
				othCatesArrNew = othCatesArrNew.concat(new_tmp_array[repelCates[i][j]][1]);
				othCatesArrOld = othCatesArrOld.concat(old_tmp_array[repelCates[i][j]][1]);
				if (new_tmp_array[repelCates[i][j]][0] && 
					(old_tmp_array[repelCates[i][j]][0]==0 || new_tmp_array[repelCates[i][j]][1][0][0]!=old_tmp_array[repelCates[i][j]][1][0][0]))
					othChanged = true;
			}else{
				scoreFirst_new += new_tmp_array[repelCates[i][j]][0];
				scoreFirst_old += old_tmp_array[repelCates[i][j]][0];
			}
		}
		if (scoreFirst_new>=scoreOther_new){
			var new_dress_score=scoreFirst_new;
			var new_dress_array=new_tmp_array[repelCates[i][0]][1];
			var new_cate=repelCates[i][0];
		}else{
			var new_dress_score=scoreOther_new;
			var new_dress_array=othCatesArrNew;
			var new_cate=othCates;
		}
		if (scoreFirst_old>=scoreOther_old){
			var old_dress_score=scoreFirst_old;
			var old_dress_array=old_tmp_array[repelCates[i][0]][1];
			var old_cate=repelCates[i][0];
		}else{
			var old_dress_score=scoreOther_old;
			var old_dress_array=othCatesArrOld;
			var old_cate=othCates;
		}
		
		var diff=new_dress_score-old_dress_score;
		diff=Math.round(diff*dp)/dp;
		sum_score+=diff;
		sum_wholetheme+=new_dress_score;
		
		if (new_dress_score && 
			(old_dress_score==0 || new_dress_array[0][0]!=old_dress_array[0][0] || (new_cate==othCates && othChanged))) {
			if (i==0) sum_array.unshift([new_cate,diff,new_dress_array,old_dress_array]); //连衣裙上下装
			else sum_array.push([new_cate,diff,new_dress_array,old_dress_array]);
		}else{
			rest+=diff;
		}
	}
	
	sum_score=Math.round(sum_score*dp)/dp;
	rest=Math.round(rest*dp)/dp;
	sum_wholetheme=Math.round(sum_wholetheme);
	return [name,sum_score,sum_array,rest,sum_wholetheme];
}

function outputByCate(total){
	var showScore=parseInt($("#showScore").val());
	var output='<table border="1">';
	output+=tr(td('关卡')+td('理论分差/总分')+td('部位')+td('理论分差')+td('顶配'));
	total.sort(function(a,b){return b[1] - a[1]});
	for(var i in total){
		var name=total[i][0];
		var sum_score=total[i][1];
		var rowspan=total[i][2].length;
		var rest=total[i][3];
		var sum_wholetheme=total[i][4];
		if (rest!=0) {rowspan++;}
		if(rowspan){
			var outLine=td(name+'<br>'+tasksAddFt(name),'rowspan="'+rowspan+'"')+td(sum_score+'<br>/'+sum_wholetheme,'rowspan="'+rowspan+'"');
			for(var j in total[i][2]){
				var cate=total[i][2][j][0];
				var diff_score=total[i][2][j][1]; 
				var new_res=total[i][2][j][2][0][0].name;
				if(cate.indexOf('+')>0){
					for(var k in total[i][2][j][2]){
						if(k>0&&total[i][2][j][2][k][0].type.type!=total[i][2][j][2][k-1][0].type.type) {new_res+='<br>'+total[i][2][j][2][k][0].name;break;}
					}
				}
				var tooltip='';
				for (var k in total[i][2][j][2]){
					tooltip+=total[i][2][j][2][k][1]+total[i][2][j][2][k][0].name+'\\n';
				}
				if(total[i][2][j][3]){ 
					tooltip+='==上一版本==\\n'
					for (var k in total[i][2][j][3]){//old result
						tooltip+=total[i][2][j][3][k][1]+total[i][2][j][3][k][0].name+'\\n';
					}
				}
				outLine+=td(cate)+td(diff_score)+td(addTooltip(new_res,tooltip));
				output+=tr(outLine, sum_score>0&&sum_score>=showScore? '' : 'style="display:none;"');
				outLine='';
			}
			if (rest!=0) {output+=tr(td('[极限权重变化]')+td(rest)+td(''), sum_score>0&&sum_score>=showScore? '' : 'style="display:none;"');}
		}
	}
	output+='</table>';
	return output;
}

function tasksAddFt(theme){
	if(tasksAdd[theme]) {return '(笑:'+mapFt(tasksAdd[theme][0],theme)+'/吻:'+mapFt(tasksAdd[theme][1],theme)+')';}
	return '';
}

function mapFt(ft,theme){
	if(theme.indexOf('联盟委托')==0) {var ftList=tasksRaw[theme];}
	else if(theme.indexOf('关卡')==0) {var ftList=levelsRaw[theme.replace('关卡: ','')];}
	else {return '-';}
	
	switch(ft){
		case 'simple':
			if(ftList[0]>0){return '简';}
			else{return '华';}
		case 'cute':
			if(ftList[1]>0){return '可';}
			else{return '成';}
		case 'active':
			if(ftList[2]>0){return '活';}
			else{return '雅';}
		case 'pure':
			if(ftList[3]>0){return '纯';}
			else{return '性';}
		case 'cool':
			if(ftList[4]>0){return '凉';}
			else{return '暖';}
		default:
			return '-';
	}
}

function chgStaffMode(){
	$('#staffModeOn').toggle();
	$('#topsearch_note').toggle();
}

function verify(){
	var pass='6394210ce21ac27fb5de7645824dff9be9ba0690';
	var userInput=$.sha1($("#passcode").val());
	$("#passcode").val('');
	if (userInput==pass){
		$("#p_passcode").hide();
		$("#p_content").show();
	}
}

function init_passcode(){
	$('#passcode').keydown(function(e) {
		if (e.keyCode==13) {
			$(this).blur();
			verify();
		}
	});
}

function header(){
 var h='<!DOCTYPE html>\n';
	h+='<head>\n';
	h+='<meta name="viewport" content="width=device-width, initial-scale=1"/>\n';
	//h+='<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n';
	h+='<meta charset="UTF-8" />\n';
	h+='<link rel="stylesheet" type="text/css" href="../../css/style.css" />\n';
	h+='<link rel="stylesheet" type="text/css" href="dp-style.css" />\n';
	h+='<script type="text/javascript" src="dp.js"></script>\n';
	h+='<style> td{padding-left:0.5em;padding-right:0.5em;} table{width:100%} </style>\n';
	h+='</head>\n';
	h+='<body>\n';
	h+='<div class="myframe">\n';
	h+='<p class="title1">顶配分析-关卡极限分数更新</p>\n';
	h+='<hr class="mhr"/>\n';
	h+='<p class="normal">\n';
	h+='<span class="title3">更新时间：</span>';
	var d=new Date();
	h+=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
	h+='<br>\n';
	h+='<span class="title3">更新人员：</span>Rean翎<br>\n';
	h+='<span class="title3">包含版本：</span>'+$('#textBox').html()+'<br>\n';
	var showScore=parseInt($("#showScore").val());
	h+='<span class="title3">使用说明：</span>分差根据上一版本和此版本的极限顶配分数计算（饰品分数已按带满衰减），'+(showScore>0? '只显示分差'+showScore+'以上的关卡，' : '')+'方便查看哪些关卡的理论分数更新最多，仅作为参考用。<br>\n';
	h+='</p>\n';
	h+='<hr class="mhr"/>\n';
	h+='<p class="normal">本页内容：';
	if($('#showNormal').is(":checked")) {h+='&emsp;<a href="#1">主线关卡</a>'};
	if($('#showAlly').is(":checked")) {h+='&emsp;<a href="#2">联盟委托</a>'};
	if($('#showJJC').is(":checked")) {h+='&emsp;<a href="#3">竞技场</a>'};
	h+='</p>\n';
	return h;
}

function footer(){
	return '</div></body></html>';
}

//below from top.js

function td(text,attr){
	return '<td'+(attr? ' '+attr : '')+'>'+text+'</td>';
}

function tr(text,attr){
	return '<tr'+(attr? ' '+attr : '')+'>'+text+'</tr>';
}

function addTooltip(text,tooltip){
	return '<a class="cTip" tooltip="'+tooltip+'">'+text+'</a>';
}

function getDistinct(arr){
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

function shortForm(c){
	return c.indexOf('-')>0 ? c.split('-')[1] : c;
}

//below modified from nikki.js

function onChangeCriteria(limitMode) {
	criteria = {};
	for (var i in FEATURES) {
		var f = FEATURES[i];
		var weight = parseFloat($('#' + f + "Weight").val());
		if (!weight) {
			weight = 1;
		}
		//rean mod
		if(limitMode&&limitMode==1){
			if(tasksAdd[theme_name]){
				if (f==tasksAdd[theme_name][0]) {weight=accMul(weight,1.27); criteria.highscore1=f;}
				if (f==tasksAdd[theme_name][1]) {weight=accMul(weight,1.778); criteria.highscore2=f;}
			}
		}
		if(limitMode&&limitMode==2){
			if(tasksAdd_old[theme_name]){
				if (f==tasksAdd_old[theme_name][0]) {weight=accMul(weight,1.27); criteria.highscore1=f;}
				if (f==tasksAdd_old[theme_name][1]) {weight=accMul(weight,1.778); criteria.highscore2=f;}
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
	criteria.levelName = theme_name;
}

//below duplicated from nikki.js

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
