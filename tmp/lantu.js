var lantu = {
	wordArray: [],
	suitArray: [],
	tagArray: [],
	manualArray: [],
	initSuit: function(){
		this.suitArray = [];
		var suitSet = {};
		for (var i in clothes) {
			var type = clothes[i].type.type;
			if (!matches(clothes[i])) continue;
			clothes[i].calc(criteria);
			if (clothes[i].isF) continue;
			if (clothes[i].set != ""){
				if (suitSet[clothes[i].set] == null){
					suitSet[clothes[i].set] = {};
					suitSet[clothes[i].set]['name'] = clothes[i].set;
					suitSet[clothes[i].set]['clothes'] = {};
					suitSet[clothes[i].set]['score'] = 0;
				}
				suitSet[clothes[i].set]['clothes'][type] = clothes[i];
				suitSet[clothes[i].set]['score'] += isAccSumScore(clothes[i]);
			}
		}
		for (var i in suitSet){
			this.suitArray.push(suitSet[i]);
		}
		this.suitArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},
	initWord: function(){
		this.wordArray = [];
		var wordSet = {};
		var existScore = getSelectedSet();
		for (var i in clothes){
			var name = clothes[i].name;
			var type = clothes[i].type.type;
			if (matches(clothes[i])) clothes[i].calc(criteria);
			for (j=0; j<name.length; j++){ //get name string
				for (k=1; k<=2; k++){
					if (j > name.length-k) continue;
					var str = name.substr(j, k);
					if (wordSet[str] == null){
						wordSet[str] = {};
						wordSet[str]['name'] = str;
						wordSet[str]['clothes'] = {};
						wordSet[str]['typeScore'] = {};
						wordSet[str]['score'] = 0;
						wordSet[str]['count'] = 0;
						if (Object.keys(existScore).length) { //if any set selected, initialise typeScore
							for (var t in existScore){
								wordSet[str]['typeScore'][t] = existScore[t];
							}
						}
					}
					wordSet[str]['count'] += 1;
					
					if (!matches(clothes[i])) continue;
					if (clothes[i].isF) continue;
					var sumScore = isAccSumScore(clothes[i]);
					
					if (wordSet[str]['typeScore'][type] == null){
						wordSet[str]['clothes'][type] = clothes[i];
						wordSet[str]['typeScore'][type] = sumScore;
						wordSet[str]['score'] += sumScore;
					}else if (sumScore > wordSet[str]['typeScore'][type]){
						var scoreDiff = sumScore - wordSet[str]['typeScore'][type];
						wordSet[str]['clothes'][type] = clothes[i];
						wordSet[str]['typeScore'][type] = sumScore;
						wordSet[str]['score'] += scoreDiff;
					}
				}
			}
		}
		for (var i in wordSet){//remove keywords with too many returns
			if (i.indexOf("·")>=0 || wordSet[i]['count'] > $('#opt_limitRet').val())
				delete wordSet[i];
		}
		
		wordSet = removeRepelCates(wordSet);
		for (var i in wordSet){
			this.wordArray.push(wordSet[i]);
		}
		this.wordArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},
	initTag: function(){
		this.tagArray = [];
		var tagSet = {};
		var existScore = getSelectedSet();
		for (var i in clothes){
			if (!matches(clothes[i])) continue;
			clothes[i].calc(criteria);
			if (clothes[i].isF) continue;
			var type = clothes[i].type.type;
			var tags = clothes[i].tags;
			for (var j in tags){
				if (!tags[j]) continue;
				if (tags[j].indexOf('+')>=0) continue;
				var type1 = type.split('·')[0]; 
				var type2 = type1.indexOf('-')>=0 ? type1.split('-')[1] : type1;
				if (type2 == '袜套') type2 = '袜子';
				tagCate = type2+' + '+tags[j];
				var sumScore = isAccSumScore(clothes[i]);
				if (tagSet[tagCate] == null){
					tagSet[tagCate] = {};
					tagSet[tagCate]['name'] = tagCate;
					tagSet[tagCate]['clothes'] = {};
					tagSet[tagCate]['typeScore'] = {};
					tagSet[tagCate]['score'] = 0;
					tagSet[tagCate]['count'] = 0;
					if (Object.keys(existScore).length) { //if any set selected, initialise typeScore
						for (var t in existScore){
							tagSet[tagCate]['typeScore'][t] = existScore[t];
						}
					}
				}
				if (tagSet[tagCate]['typeScore'][type] == null){
					tagSet[tagCate]['clothes'][type] = clothes[i];
					tagSet[tagCate]['typeScore'][type] = sumScore;
					tagSet[tagCate]['score'] += sumScore;
					tagSet[tagCate]['count'] += 1;
				}else if (sumScore > tagSet[tagCate]['typeScore'][type]){
					var scoreDiff = sumScore - tagSet[tagCate]['typeScore'][type];
					tagSet[tagCate]['clothes'][type] = clothes[i];
					tagSet[tagCate]['typeScore'][type] = sumScore;
					tagSet[tagCate]['score'] += scoreDiff;
					tagSet[tagCate]['count'] += 1;
				}
			}
		}
		tagSet = removeRepelCates(tagSet);
		for (var i in tagSet){
			this.tagArray.push(tagSet[i]);
		}
		this.tagArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},
	initManual: function(keywordstr){
		this.manualArray = [];
		var manualSet = {};
		if (!keywordstr) return;
		var keyword = keywordstr.split(',');
		var existScore = getSelectedSet();
		
		for (var i in clothes){
			var name = clothes[i].name;
			var type = clothes[i].type.type;
			var matchStr = [];
			for (var w in keyword){
				if (!keyword[w]) continue;
				var strSet = '套装·'+keyword[w];
				if (clothes[i].set == keyword[w]) matchStr.push(strSet);
				if (name.indexOf(keyword[w])>=0) matchStr.push(keyword[w]);
			}
			if (matchStr.length ==0) continue;
				
			for (var j in matchStr){
				if (manualSet[matchStr[j]] == null){
					manualSet[matchStr[j]] = {};
					manualSet[matchStr[j]]['name'] = matchStr[j];
					manualSet[matchStr[j]]['clothes'] = {};
					manualSet[matchStr[j]]['typeScore'] = {};
					manualSet[matchStr[j]]['score'] = 0;
					manualSet[matchStr[j]]['count'] = 0;
					if (Object.keys(existScore).length) { //if any set selected, initialise typeScore
						for (var t in existScore){
							manualSet[matchStr[j]]['typeScore'][t] = existScore[t];
						}
					}
				}
				manualSet[matchStr[j]]['count'] += 1;
				if (!matches(clothes[i])) continue;
				clothes[i].calc(criteria);
				if (clothes[i].isF) continue;
				var sumScore = isAccSumScore(clothes[i]);
			
				if (manualSet[matchStr[j]]['typeScore'][type] == null){
					manualSet[matchStr[j]]['clothes'][type] = clothes[i];
					manualSet[matchStr[j]]['typeScore'][type] = sumScore;
					manualSet[matchStr[j]]['score'] += sumScore;
				}else if (sumScore > manualSet[matchStr[j]]['typeScore'][type]){
					var scoreDiff = sumScore - manualSet[matchStr[j]]['typeScore'][type];
					manualSet[matchStr[j]]['clothes'][type] = clothes[i];
					manualSet[matchStr[j]]['typeScore'][type] = sumScore;
					manualSet[matchStr[j]]['score'] += scoreDiff;
				}
			}
		}
		for (var i in manualSet) if (i.indexOf('套装·')>=0) delete manualSet[i]['count'];
		manualSet = removeRepelCates(manualSet);
		for (var i in manualSet){
			this.manualArray.push(manualSet[i]);
		}
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
			var $title = $("<div><b>"+clothes[i].name + "|" + clothes[i].score + (clothes[i].count?' ('+clothes[i].count+'件)':'') +"</b></div>");
			$title.addClass('out_title');
			$div.append($title);
			$div.append(this.br);
			//sort clothes keys
			var keys = [];
			for (var j in clothes[i].clothes) keys.push(j);
			keys.sort(function(a,b){
				if ($.inArray(a,category)>=0) return $.inArray(a,category) - $.inArray(b,category);
			});
			for (var j in keys){
				var cl = clothes[i].clothes[keys[j]];
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
}

function getSelectedSet(){
	var existScore = {};
	if ($('.suitlist_selected')[0]){ //if any set selected
		var setName = $('.suitlist_selected')[0].id; 
		for (var i in lantu.suitArray){
			if (setName == lantu.suitArray[i]['name']) {
				for (var j in lantu.suitArray[i]['clothes']){
					var cl = lantu.suitArray[i]['clothes'][j];
					if (!matches(cl)) continue;
					cl.calc(criteria);
					if (cl.isF) continue;
					existScore[cl.type.type] = isAccSumScore(cl);
				}
				break;
			}
		}
	}
	return existScore;
}

function showAllowCates(){
	filters = [];
	for (var c in category){
		var type1 = category[c].split('·')[0];
		var type = type1.indexOf('-')>=0 ? type1.split('-')[1] : type1;
		if ($.inArray(type, filters) >= 0) continue;
		$('#opt_allowCates').append('<label><input type="checkbox" checked />'+type+'</label>');
		filters.push(type);
	}
}

function isAccSumScore(a){
	if (a.type.mainType == "饰品") return Math.round(accSumScore(a,$('#opt_accAmt').val()));
	else return a.sumScore;
}

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
}

function matches(c) {
	var type1 = c.type.type.split('·')[0];
	var type = type1.indexOf('-')>=0 ? type1.split('-')[1] : type1;
	if ($.inArray(type, filters) >= 0) return true;
	else return false;
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
}

function init() {
	drawTheme();
	showAllowCates();
	initEvent();
}

function menuFixed(tmp){};
