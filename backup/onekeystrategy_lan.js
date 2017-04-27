var limitRet = 15; //maximum return when search by keywords
var lanSteps = 5;
var lackClothes = []; //array of longid

function showStrategy_lan(){
	//to handle as full wardrobe when no clothes owned
	var ownCnt=loadFromStorage().size>0 ? 1 : 0;
	
	var themeName = $("#theme").val();
	var filters = clone(criteria);
	
	var result = {};
	for (var i in clothes) {//calc each clothes, put to result[type], and sort
		if (chkOwn_lan(clothes[i], ownCnt)) {
			clothes[i].calc(filters);
			if (clothes[i].isF) continue;
			if (!result[clothes[i].type.type]) result[clothes[i].type.type] = [];
			result[clothes[i].type.type].push(clothes[i]);
		}
	}
	for (var i in result) result[i].sort(function(a,b){return  isAccSumScore(b) - isAccSumScore(a);});
	
	var lazySet = {}; var lazySetScore = []; var lazyKeywords = {};
	var step = 0; //if have a set to build, step+=1;
	
	//get a set list that user have
	//note: if apply to seal100x, need to exclude those with "染","套"
	var allSets = []; var missingSets = []; 
	var suitSet = {}; var suitArray = [];
	for (var i in clothes) {
		if (!clothes[i].set) continue;
		var setName = clothes[i].set;
		if ($.inArray(setName,allSets)<0) allSets.push(setName);
		if ((!chkOwn_lan(clothes[i],ownCnt) || $.inArray(setName,lackClothes)>=0) && $.inArray(setName,missingSets)<0) missingSets.push(setName);
		
		var type = clothes[i].type.type;
		var sumScore = (!chkOwn_lan(clothes[i],ownCnt)) && clothes[i].isF ? 0 : isAccSumScore(clothes[i]);
		
		if (suitSet[setName] == null){
			suitSet[setName] = {};
			suitSet[setName]['name'] = '套装·'+setName;
			suitSet[setName]['clothes'] = {};
			suitSet[setName]['typeScore'] = {};
		}
		suitSet[setName]['clothes'][type] = clothes[i];
		suitSet[setName]['typeScore'][type] = sumScore;
	}
	suitSet = rmRepelsAndCalcScore(suitSet); 
	for (var i in suitSet) if ($.inArray(i,missingSets)<0) suitArray.push(suitSet[i]);
	suitArray.sort(function(a,b){return  b["score"] - a["score"];});
	
	//put suitArray[0] to lazySet
	if (suitArray.length){
		lazyKeywords[suitArray[0]['name']] = {};
		for (var i in suitArray[0]['clothes']){
			var cl = suitArray[0]['clothes'][i];
			lazySet[cl.type.type] = cl;
		}
		lazySetScore.push(getLazySetScore(lazySet));
		step += 1;
	}
	
	for (var step=step; step<lanSteps; step++){
		//loop to search keywords with value add, put into lazySet
		var wordArray = [];
		var existScore = {};
		for (var i in lazySet) existScore[i] = isAccSumScore(lazySet[i]);
		
		//keywords
		var wordSet = {};
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
					if (wordSet[str] == null){
						wordSet[str] = {};
						wordSet[str]['name'] = str;
						wordSet[str]['clothes'] = {};
						wordSet[str]['typeScore'] = {};
						wordSet[str]['count'] = 0;
						if (Object.keys(existScore).length) { //if any set selected, initialise typeScore
							for (var t in existScore){
								wordSet[str]['typeScore'][t] = existScore[t];
							}
						}
					}
					wordSet[str]['count'] += 1;
					
					if (!chkOwn_lan(clothes[i], ownCnt)) continue;
					if (clothes[i].isF) continue;
					var sumScore = isAccSumScore(clothes[i]);
					
					if (wordSet[str]['typeScore'][type] == null){
						wordSet[str]['clothes'][type] = clothes[i];
						wordSet[str]['typeScore'][type] = sumScore;
					}else if (sumScore > wordSet[str]['typeScore'][type]){
						wordSet[str]['clothes'][type] = clothes[i];
						wordSet[str]['typeScore'][type] = sumScore;
					}
					
				}
			}
		}
		for (var i in wordSet){//remove keywords with too many returns
			if (i.indexOf("·")>=0 || wordSet[i]['count'] > limitRet) 
				delete wordSet[i];
		}
		wordSet = rmRepelsAndCalcScore(wordSet);
		for (var i in wordSet) wordArray.push(wordSet[i]);
		
		//tagCate
		var tagSet = {};
		for (var i in clothes){
			if (!chkOwn_lan(clothes[i], ownCnt)) continue;
			if (clothes[i].isF) continue;
			var mainType = clothes[i].type.mainType;
			var type = clothes[i].type.type;
			var tags = clothes[i].tags;
			for (var j in tags){
				if (!tags[j]) continue;
				if (tags[j].indexOf('+')>=0) continue;
				var subtype = mainType=='袜子' ? mainType : type.split('·')[0];
				tagCate = [subtype,tags[j]].join(' + ');
				var sumScore = isAccSumScore(clothes[i]);
				if (tagSet[tagCate] == null){
					tagSet[tagCate] = {};
					tagSet[tagCate]['name'] = tagCate;
					tagSet[tagCate]['clothes'] = {};
					tagSet[tagCate]['typeScore'] = {};
					tagSet[tagCate]['typeCount'] = {};
					if (Object.keys(existScore).length) { //if any set selected, initialise typeScore
						for (var t in existScore){
							tagSet[tagCate]['typeScore'][t] = existScore[t];
						}
					}
				}
				if (tagSet[tagCate]['typeScore'][type] == null){
					tagSet[tagCate]['clothes'][type] = clothes[i];
					tagSet[tagCate]['typeScore'][type] = sumScore;
				}else if (sumScore > tagSet[tagCate]['typeScore'][type]){
					tagSet[tagCate]['clothes'][type] = clothes[i];
					tagSet[tagCate]['typeScore'][type] = sumScore;
				}
				if (tagSet[tagCate]['typeCount'][type] == null) tagSet[tagCate]['typeCount'][type] = 0;
				tagSet[tagCate]['typeCount'][type] += 1;
			}
		}
		for (var i in tagSet){//remove keywords with too many returns
			tagSet[i]['count'] = 0;
			for (var j in tagSet[i]['typeCount']){
				if (tagSet[i]['typeCount'][j] > limitRet){
					delete tagSet[i]['clothes'][j];
					delete tagSet[i]['typeScore'][j];
				}else tagSet[i]['count'] += tagSet[i]['typeCount'][j];
			}
		}
		tagSet = rmRepelsAndCalcScore(tagSet);
		for (var i in tagSet) wordArray.push(tagSet[i]);
		
		wordArray.sort(function(a,b){return  b["score"]==a["score"] ? a["count"]-b["count"] : b["score"]-a["score"];});
		
		//put wordArray[0] to lazySet
		if (wordArray.length){
			lazyKeywords[wordArray[0]['name']] = {};
			for (var i in wordArray[0]['clothes']){
				var cl = wordArray[0]['clothes'][i];
				var type = cl.type.type;
				lazyKeywords[wordArray[0]['name']][type] = cl;
				lazySet[type] = cl;
			}
			
			//remove repelCates in lazySet
			for (var j in repelCates){
				var sumFirst = [0,0]; //count, score
				var sumOthers = [0,0];
				for (var k in repelCates[j]){
					if (lazySet[repelCates[j][k]]){
						var score = isAccSumScore(lazySet[repelCates[j][k]]);
						if (k==0) { sumFirst[0]++; sumFirst[1] += score;}
						else { sumOthers[0]++; sumOthers[1] += score; }
					}
				}
				if (sumFirst[0]==0 || sumOthers[0]==0) continue;
				if (sumFirst[1] < sumOthers[1]) {
					if (lazySet[repelCates[j][0]]) delete lazySet[repelCates[j][0]];
					if (lazyKeywords[wordArray[0]['name']][repelCates[j][0]]) delete lazyKeywords[wordArray[0]['name']][repelCates[j][0]];
				}else for (k=1; k<repelCates[j].length; k++) {
					if (lazySet[repelCates[j][k]]) delete lazySet[repelCates[j][k]];
					if (lazyKeywords[wordArray[0]['name']][repelCates[j][k]]) delete lazyKeywords[wordArray[0]['name']][repelCates[j][k]];
				}
			}
			
			lazySetScore.push(getLazySetScore(lazySet));
		}
	}
	
	//check whether missing whitelist category at last
	var whiteType = []; var whiteExtra = {}; var whiteTodo = [];
	if (Flist&&Flist[themeName]&&Flist[themeName]["type"]){
		whiteType = Flist[themeName]["type"];
		for (var i in whiteType){
			if (lazySet[whiteType[i]]&&!lazySet[whiteType[i]].isF) continue; //lazySet already contains
			else if (result[whiteType[i]]) whiteExtra[result[whiteType[i]][0].type.type] = result[whiteType[i]][0]; //own, alert name
			else whiteTodo.push(whiteType[i]); //not own, alert to create
		}
	}
	
	//remove whiteTodo elements if corresponding repelCates already have (not in whiteType)
	for (var i in repelCates){
		if ($.inArray(repelCates[i][0],whiteTodo)>=0) {//check others, if no others, remove [0]
			var rm = true;
			for (var k in repelCates[i]){
				if (k==0) continue;
				if ($.inArray(repelCates[i][k],whiteTodo)>=0) rm = false;
			}
			if (rm) removeFromArray(repelCates[i][0],whiteTodo);
		}
		for (var j in repelCates[i]) {//check [0], if no [0] can remove it
			if (j==0) continue;
			if ($.inArray(repelCates[i][0],whiteTodo)<0) removeFromArray(repelCates[i][j],whiteTodo);
		}
		var whiteTodoTmp = [];//group repelCates tgt
		for (var l in repelCates[i]){
			if ($.inArray(repelCates[i][l],whiteTodo)>=0) {
				whiteTodoTmp.push(repelCates[i][l]);
				removeFromArray(repelCates[i][l],whiteTodo);
			}
		}
		if (whiteTodoTmp.length) whiteTodo.push(whiteTodoTmp.join('/'));
	}
	
	//if other parts in lazySet isF, alert to take down
	var takeDown = [];
	for (var i in lazySet){
		if ($.inArray(i,whiteType)>=0) continue;
		else if (lazySet[i].isF) takeDown.push(listCateName(lazySet[i]));
	}
	
	//write result
	var $strategy = $("<div/>").addClass("strategy_info_div");
	
	var $title = p($("#theme").val() == "custom" ? "....." : $("#theme").val(),"title");
	$strategy.append($title);
	
	var $author = p("偷懒攻略·"+(ownCnt||lackClothes.length?'个人':'全')+"衣柜版@Rean测试版", "author");
	$strategy.append($author);
	
	var $criteria_title = p("属性-权重: ", "criteria_title");
	$strategy.append($criteria_title);
	var $criteria = p(getStrCriteria(filters),"criteria");
	$strategy.append($criteria);
	var $tag = p(getstrTag(filters), "tag");
	$strategy.append($tag);
	
	var $option = p("选项: ", "criteria_title");
	$strategy.append($option);
	
	var $optionContent1 = p("展示"+lanSteps+"个步骤", "nm");
	$optionContent1.append('<button class="btn btn-xs btn-default" onclick="add_lan('+"'lanSteps'"+')">＋</button>');
	$optionContent1.append('<button class="btn btn-xs btn-default" onclick="min_lan('+"'lanSteps'"+')">－</button>');
	$strategy.append($optionContent1);
	var $optionContent2 = p("每步≤"+limitRet+"件衣服", "nm");
	$optionContent2.append('<button class="btn btn-xs btn-default" onclick="add_lan('+"'limitRet'"+')">＋</button>');
	$optionContent2.append('<button class="btn btn-xs btn-default" onclick="min_lan('+"'limitRet'"+')">－</button>');
	$strategy.append($optionContent2);
	
	var clotheslist_title = $("<p/>");
	clotheslist_title.append(pspan("偷懒步骤: ", "clotheslist_title"));
	if (!ownCnt) clotheslist_title.append('<span id="stgy_save_lackClothes"><a id="stgy_add_lackClothes" data-tmp="点击尚缺衣服以删除" href="#" onclick="return false;">没有这些衣服?</a> <a id="stgy_reset_lackClothes" href="#" onclick="return false;" style="display:none;">还原</a></span>');
	$strategy.append(clotheslist_title);
	
	var ii = 0; 
	for (var i in lazyKeywords){
		var categoryContent = $("<p/>");
		
		if (i.indexOf('套装·')>=0) categoryContent.append(pspan_id((ii+1)+'. '+i+" ", "clothes_category stgy_clothes",i.replace('套装·','')));
		else if (i.indexOf('+')>0) categoryContent.append(pspan((ii+1)+'. tag搜索【' + i + '】'+" ", "clothes_category"));
		else categoryContent.append(pspan((ii+1)+'. 【' + i + '】'+" ", "clothes_category"));
		 
		if (i.indexOf('套装·')!=0) {
			for (var c in category){ //sort by category
				if (lazyKeywords[i][category[c]]) {
					if (i.indexOf('+')>0) {
						var type = category[c].substr(Math.max(category[c].indexOf('-'),category[c].indexOf('·'))+1);
						categoryContent.append(pspan_id('('+type+')'+lazyKeywords[i][category[c]].name,"clothes",lazyKeywords[i][category[c]].longid));
					}else categoryContent.append(pspan_id(lazyKeywords[i][category[c]].name,"clothes",lazyKeywords[i][category[c]].longid));
					categoryContent.append(pspan(' | ',"nm"));
				}
			}
		}
		categoryContent.append(pspan('（'+lazySetScore[ii]+'分）',"nm"));
		$strategy.append(categoryContent);
		ii++;
	}
	
	if (!($.isEmptyObject(whiteExtra))){
		var categoryContentExtra = $("<p/>");
		categoryContentExtra.append(pspan('加【过关必做】', "clothes_category"));
		for (var i in whiteExtra){
			lazySet[i] = whiteExtra[i];
			categoryContentExtra.append(pspan(listCateName(whiteExtra[i])+' | ',"nm"));
			
		}
		categoryContentExtra.append(pspan('（'+getLazySetScore(lazySet)+'分）',"nm"));
		$strategy.append(categoryContentExtra);
	}
	
	if (whiteTodo.length)
		$strategy.append(p(whiteTodo.join(' | '),"clothes_category",'需制作【过关必做】: ','hint_tiele'));
	if (takeDown.length)
		$strategy.append(p(takeDown.join(' | '),"nm",'取消F品: ','hint_tiele'));
	
	$author_sign = $("<div/>").addClass("stgy_author_sign_div");
	var d = new Date();
	$author_sign.append(p("Generated at " + (d.getFullYear()) + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes(), "author_sign_name"));
	$strategy.append($author_sign);
	
	$("#StrategyInfo").empty().append($strategy);
	if (!ownCnt) initOnekey_lan();
}

function getLazySetScore(obj){
	var lazySetAccNum = 0; //see how much accesories it has
	for (var i in obj){
		if (i.indexOf('饰品')==0) lazySetAccNum ++;
	}
	var sumScore = 0; //calc
	for (var i in obj){
		sumScore += i.indexOf('饰品')==0 ? accSumScore(obj[i],lazySetAccNum) : obj[i].sumScore;
	}
	return Math.round(sumScore);
}

function rmRepelsAndCalcScore(resultobj){
	for (var str in resultobj){
		resultobj[str]['score'] = 0;
		for (var j in repelCates){
			var sumFirst = [0,0]; //count, score
			var sumOthers = [0,0];
			for (var k in repelCates[j]){
				if (resultobj[str]['typeScore'][repelCates[j][k]]){
					var score = resultobj[str]['typeScore'][repelCates[j][k]];
					if (k==0) { sumFirst[0]++; sumFirst[1] += score;}
					else { sumOthers[0]++; sumOthers[1] += score; }
				}
			}
			if (sumFirst[0]==0 || sumOthers[0]==0) continue;
			if (sumFirst[1] < sumOthers[1]) {
				if (resultobj[str]['typeScore'][repelCates[j][0]]){
					delete resultobj[str]['clothes'][repelCates[j][0]];
					delete resultobj[str]['typeScore'][repelCates[j][0]];
				}
			}else for (k=1; k<repelCates[j].length; k++) {
				if (resultobj[str]['typeScore'][repelCates[j][k]]){
					delete resultobj[str]['clothes'][repelCates[j][k]];
					delete resultobj[str]['typeScore'][repelCates[j][k]];
				}
			}
		}
		for (var j in resultobj[str]['typeScore'])
			resultobj[str]['score'] += resultobj[str]['typeScore'][j];
	}
	return resultobj;
}

function listCateName(c){
	return '[' + c.type.type + ']' + c.name;
}

function removeFromArray(e,arr){
	var index = $.inArray(e,arr);
	if (index > -1) arr.splice(index, 1);
	return arr;
}

function isAccSumScore(c){ //use the most conservative scoring
	return c.type.mainType == "饰品" ? Math.round(accSumScore(c,accCateNum)) : c.sumScore;
}

function chkOwn_lan(c, ownCnt) {
	if (ownCnt) return c.own;
	else if ($.inArray(c.longid, lackClothes)>=0) return false;
	else return true;
}

function add_lan(str){
	eval(str + '+=1');
	showStrategy_lan();
}

function min_lan(str){
	eval(str+'=Math.max(1,'+str+'-1)');
	showStrategy_lan();
}

function pspan_id(text, cls, id){
	var $p = $("<span/>").text(text).addClass("stgy_" + cls).attr('id',id);
	return $p;
}

function initOnekey_lan(){
	$("#stgy_add_lackClothes").click(function() {
		var tmp = $("#stgy_add_lackClothes").attr('data-tmp');
		$("#stgy_add_lackClothes").attr('data-tmp',$("#stgy_add_lackClothes").text());
		$("#stgy_add_lackClothes").text(tmp);
		$("#stgy_add_lackClothes").toggleClass("stgy_greyBackGround");
		$("#stgy_reset_lackClothes").toggle();
		$(".stgy_clothes").toggleClass("stgy_clothes_hover");
	});
	$("#stgy_reset_lackClothes").click(function() {
		lackClothes = [];
		showStrategy_lan();
	});
	$(".stgy_clothes").click(function() {
		if (!$(".stgy_clothes").hasClass("stgy_clothes_hover")) return;
		lackClothes.push($(this).attr('id'));
		var stgy_save_lackClothes = $("#stgy_save_lackClothes").html();
		showStrategy_lan();
		$("#stgy_save_lackClothes").html(stgy_save_lackClothes);
		$(".stgy_clothes").addClass("stgy_clothes_hover");
		initOnekey_lan();
	});
}
