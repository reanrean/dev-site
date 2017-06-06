var cartKeyword = [];
var subCartKeyword = [];
var allScores = {};
var gSuitSet = {};
var gWordSet = {};
var gTagSet = {};

var lantu = {
	wordArray: [],
	suitArray: [],
	tagArray: [],
	manualArray: [],
	initSuit: function(){
		this.suitArray = [];
		var suitSet = evalSets(gSuitSet);
		for (var i in suitSet) this.suitArray.push(suitSet[i]);
		this.suitArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},
	initWord: function(){
		this.wordArray = [];
		var existScore = getSelectedSet();
		var wordSet = evalSets(gWordSet,$('#opt_limitRet').val(),existScore);
		for (var i in wordSet) this.wordArray.push(wordSet[i]);
		this.wordArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},
	initTag: function(){
		this.tagArray = [];
		var existScore = getSelectedSet();
		var tagSet = evalSets(clone(gTagSet),$('#opt_limitRet').val(),existScore);
		for (var i in tagSet) this.tagArray.push(tagSet[i]);
		this.tagArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},
	initManual: function(keywordstr){
		this.manualArray = [];
		var manualSet = {};
		if (!keywordstr) return false;
		var keyword = keywordstr.split(',');
		var existScore = getSelectedSet();
		for (var w in keyword){
			if(gSuitSet[keyword[w]]) manualSet['套装-'+keyword[w]] = gSuitSet[keyword[w]];
			if(gWordSet[keyword[w]]) manualSet[keyword[w]] = gWordSet[keyword[w]];
			if(gTagSet[keyword[w]]) manualSet[keyword[w]] = gTagSet[keyword[w]];
		}
		var manualSet = evalSets(clone(manualSet),$('#opt_limitRet').val(),existScore);
		for (var i in manualSet) if (i.indexOf('套装-')>=0) delete manualSet[i]['count'];
		for (var i in manualSet) this.manualArray.push(manualSet[i]);
		this.manualArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	}
}

var output = {
	br: function(){
		return $("<br/>");
	},
	empty: function(id){
		$(id).empty();
	},
	print: function(id, clothes){
		this.empty(id);
		if ($('.suitlist_selected')[0]){
			$(id).append(this.br);
			$(id).append("打底套装："+$('.suitlist_selected')[0].id);
		}
		$(id).append(this.br);
		$(id).append($('#opt_accAmt').prev("span").html()+$('#opt_accAmt').val());
		$(id).append(this.br);
		$(id).append($('#opt_limitRet').prev("span").html()+$('#opt_limitRet').val());
		$(id).append(this.br);
		$(id).append($('#opt_allowCates_all').prev("span").html()+filters.join('|'));
		$(id).append(this.br);
		$(id).append(this.br);
		for (var i  = 0; i < $('#opt_printAmt').val() && i < Object.keys(clothes).length; i++){
			if (id=='#suitList') $div = $('<div id="'+clothes[i].name+'"></div>');
			else $div = $("<div></div>");
			var $title = $("<div><b>"+clothes[i].name + "|" + clothes[i].score + (clothes[i].count?' ('+clothes[i].count+'件)':'') +'</b>&nbsp;<a href="" onclick="addCart('+"'"+clothes[i].name+"'"+');return false;">[+]</a></div>');
			$title.addClass('out_title');
			$div.append($title);
			$div.append(this.br);
			//sort clothes keys
			var keys = [];
			for (var j in clothes[i].result) keys.push(j);
			keys.sort(function(a,b){
				if ($.inArray(a,category)>=0) return $.inArray(a,category) - $.inArray(b,category);
			});
			for (var j in keys){
				var cl = clothes[i].result[keys[j]];
				if (!matches(cl)) continue;
				var $clothes = $('<div><span data-toggle="tooltip" data-placement="bottom" title="'+cl.source+'　'+cl.version+'">'+cl.name+'|'+cl.type.type+'|'+isAccSumScore(cl)+'</span></div>');
				$clothes.addClass('out_clothes');
				$div.append($clothes);
			}
			$(id).append($div);
			$(id).append(this.br);
		}
		$('[data-toggle="tooltip"]').tooltip();
	}
}

function lantu_init(){
	allScores = {};
	for (var i in clothes) {//calc each clothes, put to allScores[type], and sort
		clothes[i].calc(criteria);
		if (clothes[i].isF) continue;
		if (!allScores[clothes[i].type.type]) allScores[clothes[i].type.type] = [];
		allScores[clothes[i].type.type].push(clothes[i]);
	}
	for (var i in allScores) allScores[i].sort(function(a,b){return isAccSumScore(b) - isAccSumScore(a);});
	
	//gen all suitSet
	gSuitSet = {};
	for (var i in clothes) {
		if (!clothes[i].set) continue;
		var setName = clothes[i].set;
		var type = clothes[i].type.type;
		
		if (gSuitSet[setName] == null){
			gSuitSet[setName] = {};
			gSuitSet[setName]['name'] = '套装-'+setName;
			gSuitSet[setName]['clothes'] = {};
			gSuitSet[setName]['acc'] = {};
		}
		if (isAcc(clothes[i])) {
			if (!gSuitSet[setName]['acc'][type]) gSuitSet[setName]['acc'][type] = {};
			gSuitSet[setName]['acc'][type]['0'] = clothes[i];
		}else gSuitSet[setName]['clothes'][type] = clothes[i];
	}
	
	//gen all wordSet
	gWordSet = {};
	for (var i in clothes){
		var name = clothes[i].name;
		var type = clothes[i].type.type;
		var matchStr = [];
		for (j=0; j<name.length; j++){ //get name string
			for (k=1; k<=2; k++){
				if (j > name.length-k) continue;
				var str = name.substr(j, k);
				if ($.inArray(str,matchStr)<0) matchStr.push(str);
				else continue;
				if (gWordSet[str] == null){
					gWordSet[str] = {};
					gWordSet[str]['name'] = str;
					gWordSet[str]['clothes'] = {};
					gWordSet[str]['acc'] = {};
					gWordSet[str]['rawScore'] = {};
					gWordSet[str]['rawSumScore'] = 0;
					gWordSet[str]['count'] = 0;
				}
				gWordSet[str]['count'] += 1;
				
				if (clothes[i].isF) continue;
				var sumScore = Math.round(clothes[i].sumScore);
				var tmpScore = Math.round(clothes[i].tmpScore);
				var bonus = Math.round(clothes[i].bonusScore).toString();
				if (isAcc_c(type)){
					if (gWordSet[str]['acc'][type] == null) 
						gWordSet[str]['acc'][type] = {};
					if (gWordSet[str]['acc'][type][bonus] == null) 
						gWordSet[str]['acc'][type][bonus] = clothes[i];
					else if (tmpScore > gWordSet[str]['acc'][type][bonus].tmpScore) 
						gWordSet[str]['acc'][type][bonus] = clothes[i];
				}else{
					if (gWordSet[str]['clothes'][type] == null) 
						gWordSet[str]['clothes'][type] = clothes[i];
					else if (sumScore > gWordSet[str]['clothes'][type].sumScore) 
						gWordSet[str]['clothes'][type] = clothes[i];
				}
				if (gWordSet[str]['rawScore'][type] == null) {
					gWordSet[str]['rawScore'][type] = sumScore;
					gWordSet[str]['rawSumScore'] += sumScore;
				}else if (sumScore > gWordSet[str]['rawScore'][type]) {
					gWordSet[str]['rawSumScore'] += (sumScore - gWordSet[str]['rawScore'][type]);
					gWordSet[str]['rawScore'][type] = sumScore;
				}
			}
		}
	}
	for (var i in gWordSet){//remove keywords with too many returns or no scores
		if (i.indexOf("·")>=0) 
			delete gWordSet[i];
	}
	
	//gen all tagCate
	gTagSet = {};
	for (var i in clothes){
		if (clothes[i].isF) continue;
		var mainType = clothes[i].type.mainType;
		if (mainType!='袜子'&&mainType!='饰品') continue; //skip unrelated
		var type = clothes[i].type.type;
		var tags = clothes[i].tags;
		for (var j in tags){
			if (!tags[j]) continue;
			//if (tags[j].indexOf('+')>=0) continue; //skip 萤光之灵
			var subtype = mainType=='袜子' ? mainType : type.split('·')[0];
			tagCate = [subtype,tags[j]].join(' + ');
			if (gTagSet[tagCate] == null){
				gTagSet[tagCate] = {};
				gTagSet[tagCate]['name'] = tagCate;
				gTagSet[tagCate]['clothes'] = {};
				gTagSet[tagCate]['acc'] = {};
				gTagSet[tagCate]['typeCount'] = {};
				gTagSet[tagCate]['count'] = 0;
			}
			var sumScore = Math.round(clothes[i].sumScore);
			var tmpScore = Math.round(clothes[i].tmpScore);
			var bonus = Math.round(clothes[i].bonusScore).toString();
			if (isAcc_c(type)){
				if (gTagSet[tagCate]['acc'][type] == null) 
					gTagSet[tagCate]['acc'][type] = {};
				if (gTagSet[tagCate]['acc'][type][bonus] == null) 
					gTagSet[tagCate]['acc'][type][bonus] = clothes[i];
				else if (tmpScore > gTagSet[tagCate]['acc'][type][bonus].tmpScore) 
					gTagSet[tagCate]['acc'][type][bonus] = clothes[i];
			}else{
				if (gTagSet[tagCate]['clothes'][type] == null) 
					gTagSet[tagCate]['clothes'][type] = clothes[i];
				else if (sumScore > gTagSet[tagCate]['clothes'][type].sumScore) 
					gTagSet[tagCate]['clothes'][type] = clothes[i];
			}
			
			if (gTagSet[tagCate]['typeCount'][type] == null) gTagSet[tagCate]['typeCount'][type] = 0;
			gTagSet[tagCate]['typeCount'][type] += 1;
			gTagSet[tagCate]['count'] += 1;
		}
	}
	for (var i in gTagSet){//remove keywords with too many returns
		for (var j in gTagSet[i]['typeCount']){
			if (j=='袜子-袜套') gTagSet[i]['typeCount'][j] += gTagSet[i]['typeCount']['袜子-袜子'];
			else if (j=='袜子-袜子') gTagSet[i]['typeCount'][j] += gTagSet[i]['typeCount']['袜子-袜套'];
		}
	}
}

function evalSets(resultObj,limitRet,existObj){
	var accCount = $('#opt_accAmt').val();
	if (!accCount) {alert('Invalid Accessories Count!'); return false;}
	
	for (var str in resultObj){
		resultObj[str]['score'] = 0;
		
		if (resultObj[str]['typeCount']){ //tagSet, can modify
			for (var j in resultObj[str]['typeCount']){
				if (resultObj[str]['typeCount'][j] > limitRet){
					resultObj[str]['count'] -= resultObj[str]['typeCount'][j];
					delete resultObj[str]['clothes'][j];
					delete resultObj[str]['acc'][j];
				}
			}
			
		}
		else if (resultObj[str]['count'] && resultObj[str]['count'] > limitRet) continue;
		
		resultObj[str]['typeScore'] = {}; //init typeScore base on obj types
		resultObj[str]['result'] = {}; //delete result remain in last run
		if (existObj) for (var i in existObj) {
			resultObj[str]['typeScore'][i] = 0;
		}
		
		//calc scores and put to 'result'
		for (var i in resultObj[str]['clothes']){
			if (resultObj[str]['typeScore'][i]==null) resultObj[str]['typeScore'][i] = 0;
			resultObj[str]['result'][i] = resultObj[str]['clothes'][i]; 
		}
		if(resultObj[str]['acc']) {
			for (var type in resultObj[str]['acc']){
				if (resultObj[str]['typeScore'][type]==null) resultObj[str]['typeScore'][type] = 0;
				var maxScore = 0;
				for (var bonus in resultObj[str]['acc'][type]){
					var cl = resultObj[str]['acc'][type][bonus];
					var score = isAccSumScore(cl,accCount);
					if (score > maxScore) resultObj[str]['result'][type] = cl;
					maxScore = score;
				}
			}
		}
		
		//compare with existObj and get typeScore
		for (var type in resultObj[str]['typeScore']){
			if (existObj&&existObj[type]) resultObj[str]['typeScore'][type] = isAccSumScore(existObj[type],accCount);
			if (!resultObj[str]['result'][type]) continue;
			var score = isAccSumScore(resultObj[str]['result'][type],accCount);
			if (score<=resultObj[str]['typeScore'][type]) delete resultObj[str]['result'][type];
			else resultObj[str]['typeScore'][type] = score;
		}
		
		//remove repelCates and calc score
		for (var j in repelCates){
			var sumFirst = [0,0]; //count, score
			var sumOthers = [0,0];
			for (var k in repelCates[j]){
				if (resultObj[str]['typeScore'][repelCates[j][k]]){
					var score = resultObj[str]['typeScore'][repelCates[j][k]];
					if (k==0) { sumFirst[0]++; sumFirst[1] += score;}
					else { sumOthers[0]++; sumOthers[1] += score; }
				}
			}
			if (sumFirst[0]==0 || sumOthers[0]==0) continue;
			if (sumFirst[1] < sumOthers[1]) {
				if (resultObj[str]['typeScore'][repelCates[j][0]]){
					delete resultObj[str]['result'][repelCates[j][0]];
					delete resultObj[str]['typeScore'][repelCates[j][0]];
				}
			}else for (k=1; k<repelCates[j].length; k++) {
				if (resultObj[str]['typeScore'][repelCates[j][k]]){
					delete resultObj[str]['result'][repelCates[j][k]];
					delete resultObj[str]['typeScore'][repelCates[j][k]];
				}
			}
		}
		for (var j in resultObj[str]['typeScore']){
			if ($.inArray(getSubType(j), filters) < 0) continue; //matches
			resultObj[str]['score'] += resultObj[str]['typeScore'][j];
		}
	}
	return resultObj;
}
/*
function removeRepelCates(resultobj){
	for (var str in resultobj){
		for (var j in repelCates){
			var sumFirst=0;
			var sumOthers=0;
			for (var k in repelCates[j]){
				if (resultobj[str]['typeScore'][repelCates[j][k]]){
					var score = resultobj[str]['typeScore'][repelCates[j][k]];
					if (k==0) sumFirst += score;
					else sumOthers += score;
				}
			}
			if (sumFirst==0 || sumOthers==0) continue;
			if (sumFirst < sumOthers) {
				if (resultobj[str]['typeScore'][repelCates[j][0]]){
					resultobj[str]['score'] -= resultobj[str]['typeScore'][repelCates[j][0]];
					delete resultobj[str]['clothes'][repelCates[j][0]];
					delete resultobj[str]['typeScore'][repelCates[j][0]];
				}
			}else for (k=1; k<repelCates[j].length; k++) {
				if (resultobj[str]['typeScore'][repelCates[j][k]]){
					resultobj[str]['score'] -= resultobj[str]['typeScore'][repelCates[j][k]];
					delete resultobj[str]['clothes'][repelCates[j][k]];
					delete resultobj[str]['typeScore'][repelCates[j][k]];
				}
			}
		}
	}
	return resultobj;
}*/

function getSelectedSet(){
	var existScore = {};
	if ($('.suitlist_selected')[0]){ //if any set selected
		var setName = $('.suitlist_selected')[0].id; 
		for (var i in lantu.suitArray){
			if (setName == lantu.suitArray[i]['name']) {
				for (var j in lantu.suitArray[i]['result']){
					var cl = lantu.suitArray[i]['result'][j];
					if (!matches(cl)) continue;
					cl.calc(criteria);
					if (cl.isF) continue;
					existScore[cl.type.type] = cl;
				}
				break;
			}
		}
	}
	return existScore;
}

function keywordToObj(arr){
	var sumSets = {};
	for (var i in arr){
		var str = arr[i];
		if (str.indexOf('套装-')==0) {//set
			if (gSuitSet[str.replace('套装-','')]) sumSets[str] = gSuitSet[str.replace('套装-','')];
		}
		else if (str.indexOf(' + ')>0) {//tag
			if (gTagSet[str]) sumSets[str] = gTagSet[str];
		}
		else {//word
			if (gWordSet[str]) sumSets[str] = gWordSet[str];
		}
	}
	return sumSets;
}

function listKeywords(arr){
	var accCount = $('#opt_accAmt').val();
	arr.sort(function(a,b){return b.indexOf('套装-')==0? 1 : 0;}); //push sets to first
	var sumSets = evalSets(keywordToObj(arr),$('#opt_limitRet').val());
	console.log (sumSets);
	var out = $('<table></table>');
	var header = $('<tr></tr>').append($('<td></td>'));
	for (var i in arr) 
		header.append($('<td>'+arr[i]+'<a href="" onclick="addSubCart('+"'"+arr[i]+"'"+');return false;">[+]</a><br>'+sumSets[arr[i]].score+'</td>'));
	out.append(header);
	
	var outCategory = function() {
		var ret = [];
		for (var c in category) if(category[c].indexOf('饰品-')!=0) ret.push(category[c]);
		for (var c in category) if(category[c].indexOf('饰品-')==0) ret.push(category[c]);
		return ret;
	}();
	/*clone(category);
	outCategory.sort(function(a,b){return b.indexOf('饰品-')!=0? 1 : 0;}); //push acc to last*/
	
	for (var c in outCategory){
		var type = outCategory[c];
		var blankLine = true;
		var line = $('<tr></tr>').append($('<td>'+(type.indexOf('-')>0?type.split('-')[1]:type)+'</td>'));
		for (var j in sumSets){
			if (sumSets[j]['result'][type]) {
				line.append($('<td>'+sumSets[j]['result'][type].name+'<br>'+sumSets[j]['typeScore'][type]+'</td>'));
				blankLine = false;
			}
			else line.append($('<td></td>'));
		}
		if(!blankLine) out.append(line);
	}
	out.addClass("solidTable");
	$('#finalList').html(out);
	$('#finalList').prepend($("<br/>"));
	$('#finalList').prepend($('#opt_limitRet').prev("span").html()+$('#opt_limitRet').val());
	$('#finalList').prepend($("<br/>"));
	$('#finalList').prepend($('#opt_accAmt').prev("span").html()+$('#opt_accAmt').val());
	$('#finalList').prepend($("<br/>"));
}

function sumKeywords(arr,accCount){
	//note: if accCount is not given, need to be calculated here
	var sumSets = keywordToObj(arr);
	arr.sort(function(a,b){return b.indexOf('套装-')==0? 1 : 0;}); //push sets to first
	if (!accCount){
		var accList = [];
		for (var str in sumSets) if (sumSets[str]['acc']) for (var type in sumSets[str]['acc']) checkPush(type, accList);
		accCount = accList.length;
	}
	var ret = {};
	for (var i in arr){
		var str = arr[i];
		ret = sumEvalSets(ret, clone(sumSets[str]), accCount, $('#opt_limitRet').val());
	}
	return ret;
}

function sumEvalSets(existObj, newObj, accCount, limitRet){
	if (newObj['typeCount']){ //tagSet
		for (var j in newObj['typeCount']){
			if (newObj['typeCount'][j] > limitRet){
				newObj['count'] -= newObj['typeCount'][j];
				delete newObj['clothes'][j];
				delete newObj['acc'][j];
			}
		}
	}
	else if (newObj['count'] && newObj['count'] > limitRet) return existObj;
	
	newObj['score'] = 0;
	newObj['typeScore'] = {}; //init typeScore base on obj types
	newObj['result'] = {}; //delete result remain in last run
	if(existObj['result']) for (var i in existObj['result']) newObj['typeScore'][i] = 0;
	//calc scores and put to 'result'
	for (var i in newObj['clothes']){
		if (newObj['typeScore'][i]==null) newObj['typeScore'][i] = 0;
		newObj['result'][i] = newObj['clothes'][i]; 
	}
	if(newObj['acc']) {
		for (var type in newObj['acc']){
			if (newObj['typeScore'][type]==null) newObj['typeScore'][type] = 0;
			var maxScore = 0;
			for (var bonus in newObj['acc'][type]){
				var cl = newObj['acc'][type][bonus];
				var score = isAccSumScore(cl,accCount);
				if (score > maxScore) newObj['result'][type] = cl;
				maxScore = score;
			}
		}
	}
	
	//compare with existObj and get typeScore
	for (var type in newObj['typeScore']){
		if (existObj['result']&&existObj['result'][type]) newObj['typeScore'][type] = isAccSumScore(existObj['result'][type],accCount);
		if (!newObj['result'][type]) {
			newObj['result'][type] = existObj['result'][type];
			continue;
		}
		var score = isAccSumScore(newObj['result'][type],accCount);
		if (score<newObj['typeScore'][type]) newObj['result'][type] = existObj['result'][type];
		else newObj['typeScore'][type] = score;
	}
	
	//remove repelCates and calc score
	for (var j in repelCates){
		var sumFirst = [0,0]; //count, score
		var sumOthers = [0,0];
		for (var k in repelCates[j]){
			if (newObj['typeScore'][repelCates[j][k]]){
				var score = newObj['typeScore'][repelCates[j][k]];
				if (k==0) { sumFirst[0]++; sumFirst[1] += score;}
				else { sumOthers[0]++; sumOthers[1] += score; }
			}
		}
		if (sumFirst[0]==0 || sumOthers[0]==0) continue;
		if (sumFirst[1] < sumOthers[1]) {
			if (newObj['typeScore'][repelCates[j][0]]){
				delete newObj['result'][repelCates[j][0]];
				delete newObj['typeScore'][repelCates[j][0]];
			}
		}else for (k=1; k<repelCates[j].length; k++) {
			if (newObj['typeScore'][repelCates[j][k]]){
				delete newObj['result'][repelCates[j][k]];
				delete newObj['typeScore'][repelCates[j][k]];
			}
		}
	}
	for (var j in newObj['typeScore']){
		newObj['score'] += newObj['typeScore'][j];
	}
	return newObj;
}

function showAllowCates(){
	filters = [];
	for (var c in category){
		var type = getSubType(category[c]);
		if ($.inArray(getSubType(type), filters) >= 0) continue;
		$('#opt_allowCates').append('<label><input type="checkbox" checked />'+type+'</label>');
		filters.push(type);
	}
}

function isAcc(c){
	return c.type.mainType == "饰品";
}

function isAcc_c(type){
	return type.indexOf("饰品")==0;
}

function isAccSumScore(c,num){
	return c.isF ? 0 : (isAcc(c) ? Math.round(accSumScore(c,num?num:accCateNum)) : c.sumScore);
}
/*
function isAccSumScore(a){
	if (a.type.mainType == "饰品") return Math.round(accSumScore(a,$('#opt_accAmt').val()));
	else return a.sumScore;
}*/

function byAccSumScore(a, b) {
	return isAccSumScore(a) - isAccSumScore(b) == 0 ? a.id - b.id : isAccSumScore(b) - isAccSumScore(a);
}

//nikki.js
function onChangeCriteria() {
	criteria = {};
	for (var i in FEATURES) {
		var f = FEATURES[i];
		var weight = parseFloat($('#' + f + "Weight").val());
		if (!weight) {
			weight = 1;
		}
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
	criteria.levelName = $("#theme").val();
	lantu_init();
}

function matches(c) {
	if ($.inArray(getSubType(c.type.type), filters) >= 0) return true;
	else return false;
}

function getSubType(type){
	var type1 = type.split('·')[0];
	return type1.indexOf('-')>=0 ? type1.split('-')[1] : type1;
}

function buttonCart(txt,xlink){
	return '<button class="btn btn-xs btn-default">'+txt+(xlink?'<a href="" onclick="delCart('+"'"+txt+"'"+');return false;">[×]</a>':'')+'</button>';
}

function addCart(txt){
	//check exist
	if($.inArray(txt,cartKeyword)>=0) return false;
	//check other sets
	if (txt.indexOf('套装-')==0) for (var i in cartKeyword) if (cartKeyword[i].indexOf('套装-')==0) delCart(cartKeyword[i]);
	//addCart
	cartKeyword.push(txt);
	refreshCart();
}

function addSubCart(txt){
	//check exist
	if($.inArray(txt,subCartKeyword)>=0) return false;
	//check other sets
	if (txt.indexOf('套装-')==0) for (var i in subCartKeyword) if (subCartKeyword[i].indexOf('套装-')==0) delCart(subCartKeyword[i]);
	//addCart
	subCartKeyword.push(txt);
	$("#subCart").html('');
	for (var i in subCartKeyword) $("#subCart").append(buttonCart(subCartKeyword[i]));
}

function delCart(txt){
	var index = $.inArray(txt,cartKeyword);
	if (index > -1) cartKeyword.splice(index, 1);
	refreshCart();
}

function refreshCart(){
	$("#cartKeyword").html('');
	for (var i in cartKeyword) $("#cartKeyword").append(buttonCart(cartKeyword[i],true));
}

function checkPush(item, arr){
	if ($.inArray(item, arr)<0) arr.push(item);
}

function initEvent() {
	$("form").submit(function(){
		return false;
	});
	$(".filter-radio").change(function () {
		onChangeCriteria();
	});
	$("#showSuit").click(function(){
		lantu.initSuit();
		if (lantu.suitArray.length>0) output.print('#suitList', lantu.suitArray);
		//http://stackoverflow.com/questions/32195962/differentiate-the-clicks-between-parent-and-child-using-javascript-jquery
		$("#suitList > div").click(function(){
			if ($(this).hasClass("suitlist_selected")) $(this).removeClass();
			else{
				$("#suitList > div").removeClass();
				$(this).addClass("suitlist_selected");
			}
		});
	});
	$("#showWord").click(function(){
		lantu.initWord();
		if (lantu.wordArray.length>0) output.print('#wordList', lantu.wordArray);
	});
	$("#showTag").click(function(){
		lantu.initTag();
		if (lantu.tagArray.length>0) output.print('#tagList', lantu.tagArray);
	});
	$("#showManual").click(function(){
		lantu.initManual($('#manualKeyWords').val());
		if (lantu.manualArray.length>0) output.print('#manualList', lantu.manualArray);
	});
	$('#manualKeyWords').keydown(function(e) {
		if (e.keyCode==13) {
			$(this).blur();
			$("#showManual").click();
		}
	});
	$("#opt_allowCates_all").click(function(){
		$("#opt_allowCates").html('');
		showAllowCates();
	});
	$("#opt_allowCates_none").click(function(){
		$("#opt_allowCates input").attr('checked', false);
		filters = [];
	});
	$("#opt_allowCates input").click(function(){
		var label = $(this)[0].nextSibling.nodeValue;
		if ($(this)[0].checked) filters.push(label);
		else {
			var index = $.inArray(label,filters);
			if (index > -1) filters.splice(index, 1);
		}
	});
	$("#cart_val").click(function(){
		var cates = ['饰品']; var missingCates = '';
		for (var i in cartKeyword){
			if (cartKeyword[i].indexOf('套装-')==0&&gSuitSet[cartKeyword[i].replace('套装-','')]) {
				for (var c in gSuitSet[cartKeyword[i].replace('套装-','')]['clothes']){
					var cl = gSuitSet[cartKeyword[i].replace('套装-','')]['clothes'][c];
					checkPush(cl.type.mainType, cates);
				}
			}
			if (gWordSet[cartKeyword[i]]) {
				for (var c in gWordSet[cartKeyword[i]]['clothes']){
					var cl = gWordSet[cartKeyword[i]]['clothes'][c];
					checkPush(cl.type.mainType, cates);
				}
			}
			if (gTagSet[cartKeyword[i]]) {
				for (var c in gTagSet[cartKeyword[i]]['clothes']){
					var cl = gTagSet[cartKeyword[i]]['clothes'][c];
					checkPush(cl.type.mainType, cates);
				}
			}
		}
		for (var i in repelCates){
			if ($.inArray(repelCates[i][0], cates)>=0){
				for (var j in repelCates[i]){
					if (j>0) checkPush(repelCates[i][j], cates);
				}
				
			}else{
				for (var j in repelCates[i]){
					if (j==0) continue;
					else if ($.inArray(repelCates[i][j], cates)<0) break;
					else if (j==repelCates[i].length-1) checkPush(repelCates[i][0], cates);
				}
			}
		}
		for (var i in CATEGORY_HIERARCHY){
			if ($.inArray(i, cates)<0) missingCates += ' '+i;
		}
		alert('尚缺大件:'+missingCates);
	});
	$("#cart_add").click(function(){
		var txt = $("#cartKeyword_add").val();
		addCart(txt);
		$("#cartKeyword_add").val('');
	});
	$("#cart_clear").click(function(){
		cartKeyword = [];
		$("#cartKeyword").html('');
	});
	$("#finalList_clear").click(function(){
		$("div[id*=List]").html('');
	});
	$("#cart_calc").click(function(){
		$("div[id*=List]").html('');
		listKeywords(cartKeyword);
	});
	$("#cart_reSearch").click(function(){
		if(!cartKeyword.length) {alert('No keywords in cart!'); return false;}
		var cartObj = sumKeywords(cartKeyword);
		var reSearch = [];
		var reSearch1 = evalSets(gWordSet,$('#opt_limitRet').val(),cartObj['result']);
		var reSearch2 = evalSets(clone(gTagSet),$('#opt_limitRet').val(),cartObj['result']);
		for (var i in reSearch1) reSearch.push(reSearch1[i]);
		for (var i in reSearch2) reSearch.push(reSearch2[i]);
		reSearch.sort(function(a,b){
			return  b["score"] - a["score"];
		});
		if (reSearch.length>0) {
			$('.suitlist_selected').removeClass();
			output.print('#manualList', reSearch);
		}
		$("#manualList").prepend('已选关键字：'+cartKeyword.join(' / '));
	});
	$("#subCart_calc").click(function(){
		$("#finalList_1").html('');
		var aaa = sumKeywords(subCartKeyword);
		$("#finalList_1").html(aaa.score);
	});
	$("#subCart_clear").click(function(){
		subCartKeyword = [];
		$("#subCart").html('');
	});
}

function init() {
	drawTheme();
	showAllowCates();
	lantu_init();
	initEvent();
}

function menuFixed(tmp){};
