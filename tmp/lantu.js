var lantu = {
	wordArray: [],
	suitArray: [],
	tagArray: [],
	initSuit: function(){
		this.suitArray = [];
		var suitSet = {};
		for (var i in clothes) {
			var type = clothes[i].type.type;
			if (!matches(clothes[i])) continue;
			clothes[i].calc(criteria);
			if (clothes[i].isF) continue;
			if(clothes[i].set != ""){
				if(suitSet[clothes[i].set] == null){
					suitSet[clothes[i].set] = {};
					suitSet[clothes[i].set]['name'] = clothes[i].set;
					suitSet[clothes[i].set]['clothes'] = [];
					suitSet[clothes[i].set]['score'] = 0;
				}
				suitSet[clothes[i].set]['clothes'].push(clothes[i]);
				suitSet[clothes[i].set]['score'] += isAccSumScore(clothes[i]);
			}
		}
		for(var i in suitSet){
			this.suitArray.push(suitSet[i]);
		}
		this.suitArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},	
	initWord: function(){
		this.wordArray = [];
	//var wordStr = function(){
		var retWords = {};
		var result = {};
		for (var i in clothes){
			//get name string
			var name = clothes[i].name;
			for (j=0; j<name.length; j++){
				for (k=1; k<=2; k++){
					if (j > name.length-k) continue;
					var str = name.substr(j, k);
					if (!retWords[str]) retWords[str] = 0;
					retWords[str] += 1;
				}
			}
			
			//get score
			if (!matches(clothes[i])) continue;
			var type = clothes[i].type.type;
			if (!result[type]) result[type] = [];
			clothes[i].calc(criteria);
			if (clothes[i].isF) continue;
			result[type].push(clothes[i]);
		}
		
		for (var i in retWords){//remove keywords with too many returns
			if (i.indexOf("·")>=0 || retWords[i] > $('#opt_limitRet').val())
				delete retWords[i];
		}
		
		var resultWords = {};
		for(var i in result){//取每个分类前80的衣服, 提取关键字
			result[i].sort(byAccSumScore);
			result[i].splice(80,9999);
			for(var j in result[i]){//result[i][j] is clothes
				var name = result[i][j].name;
				var sumScore = isAccSumScore(result[i][j]);
				for (var k in retWords){
					if (name.indexOf(k)<0) continue;
					if (resultWords[k] == null){
						resultWords[k] = {};
						resultWords[k]['name'] = k;
						resultWords[k]['clothes'] = {};
						resultWords[k]['score'] = 0;
						resultWords[k]['count'] = retWords[k];
					}
					if(resultWords[k]['clothes'][i] == null){
						resultWords[k]['clothes'][i] = result[i][j];
						resultWords[k]['score'] += sumScore;
					}else if (sumScore > isAccSumScore(resultWords[k]['clothes'][i])){
						var scoreDiff = sumScore - isAccSumScore(resultWords[k]['clothes'][i]);
						resultWords[k]['clothes'][i] = result[i][j];
						resultWords[k]['score'] += scoreDiff;
					}
				}
			}
		}
		for(var i in resultWords){
			this.wordArray.push(resultWords[i]);
		}
		this.wordArray.sort(function(a,b){
			return  b["score"] - a["score"];
		});
	},
	/*getMostWord: function(result){
		var resultWords = {};
		for(var i in result){//取每个分类前80的衣服, 提取关键字
			result[i].sort(byScore);
			result[i].splice(80,9999);
			resultWords[i] = [];
			for(var j in result[i]){
				resultWords[i].push.apply( resultWords[i], result[i][j].name.split('') );
			}
			resultWords[i] = unique3(resultWords[i]);
		}
		var wordNums = {};
		for(var type in resultWords){//计算关键字数量
			for(var j in resultWords[type]){
				var quanzhong = type.indexOf("饰品") >= 0 ? $('#opt_accDeter').val() : 1;
				if(wordNums[resultWords[type][j]] == null)
					wordNums[resultWords[type][j]] = 0;
				wordNums[resultWords[type][j]] = wordNums[resultWords[type][j]] + quanzhong;
			}
		}
		
		//TODO 界面
		var str = "粉毛运动少年雅公子家雪美学长神奇幻者主银金红白发黑蓝小·棕灰之歌黄冰士枫蔷薇女墨绿人精灵马尾紫花蝶童心青月云舞娘轻音光曲幽语天兔乐珠华丽珍稀娃可时蕾鹿头古英糕满梦星莉蝴水兰千罗帽甜力宝温夜爱丝手果泡流的短生恋色姐茶影暖锦圣信海风莓园普通情落香清下意奶高娜暗耳桃带玫日夏典柔春竹巧调蜜草糖樱叶羽迹火皮空包迷球瑰克魔裙格结冬衣祥纹上凉牛仔领点巾纱服绒枝套礼外背衫披装条链环裤靴袜饰圈鞋跟冠项颈";
		var notArray = str.split("");
			
		var mostWord = [];
		for(var i in wordNums){
			if(wordNums[i] > 3 &&  $.inArray(i, notArray) < 0){
				mostWord.push({"name" : i , "num" : wordNums[i]});
			}
		}	
		mostWord.sort(function(a,b){
			return b["num"] - a["num"];
		});
		mostWord.splice(10,9999);//取前10多的关键字
		
		return mostWord;
	},*/
	initTag: function(){
		this.tagArray = [];
		var tagSet = {};
		for (var i in clothes){
			if (!matches(clothes[i])) continue;
			clothes[i].calc(criteria);
			if (clothes[i].isF) continue;
			var type = clothes[i].type.type;
			var tags = clothes[i].tags;
			for (var j in tags){
				if (tags[j]=="") continue;
				if (tags[j].indexOf('+')>=0) continue;
				tagCate = (type.indexOf('饰品')==0? type.split('·')[0] : type.split('-')[0])+' + '+tags[j];
				var sumScore = isAccSumScore(clothes[i]);
				if(tagSet[tagCate] == null){
					tagSet[tagCate] = {};
					tagSet[tagCate]['name'] = tagCate;
					tagSet[tagCate]['clothes'] = {};
					tagSet[tagCate]['score'] = 0;
					tagSet[tagCate]['count'] = 0;
				}
				if(tagSet[tagCate]['clothes'][type] == null){
					tagSet[tagCate]['clothes'][type] = clothes[i];
					tagSet[tagCate]['score'] += sumScore;
					tagSet[tagCate]['count'] += 1;
				}else if (sumScore > isAccSumScore(tagSet[tagCate]['clothes'][type])){
					var scoreDiff = sumScore - isAccSumScore(tagSet[tagCate]['clothes'][type]);
					tagSet[tagCate]['clothes'][type] = clothes[i];
					tagSet[tagCate]['score'] += scoreDiff;
					tagSet[tagCate]['count'] += 1;
				}
			}
		}
		for(var i in tagSet){
			this.tagArray.push(tagSet[i]);
		}
		this.tagArray.sort(function(a,b){
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
		for(var i  = 0; i < $('#opt_printAmt').val(); i++){
			$div = $("<div></div>");
			var $title = $("<div><b>"+clothes[i].name + "|" + clothes[i].score + (clothes[i].count?' ('+clothes[i].count+'件)':'') +"</b></div>");
			$title.addClass('out_title');
			$div.append(this.br);
			$div.append($title);
			$div.append(this.br);
			for(var j in clothes[i].clothes){
				var cl = clothes[i].clothes[j];
				var $clothes = $("<div>"+cl.name + "|" + cl.type.type + "|" + isAccSumScore(cl)+"</div>");
				$clothes.addClass('out_clothes');
				$div.append($clothes);
			}
			$(id).append($div);
		}
	}
}

/*function unique3(toUnique) {
	var res = [];
	var json = {};
	for (var i = 0; i < toUnique.length; i++) {
		if (!json[toUnique[i]]) {
			res.push(toUnique[i]);
			json[toUnique[i]] = 1;
		}
	}
	return res;
}*/

function showAllowCates(){
	filters = [];
	for (var c in category){
		var type = category[c];
		if (type.indexOf('饰品')==0) continue;
		$('#opt_allowCates').append('<label><input type="checkbox" checked />'+type+'</label>');
		filters.push(type);
	}
	$('#opt_allowCates').append('<label><input type="checkbox" checked />饰品</label>');
	filters.push('饰品');
}

function isAccSumScore(a){
	if (a.type.mainType == "饰品") return Math.round(accSumScore(a,$('#opt_accDeter').val()));
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
	var type = c.type.mainType=="饰品" ? c.type.mainType : c.type.type;
	if ($.inArray(type, filters) >= 0) return true;
	else return false;
}

function initEvent() {
	$(".filter-radio").change(function () {
		onChangeCriteria();
	});
	$("#showsuit").click(function(){
		lantu.initSuit();
		output.print('#suitlist', lantu.suitArray);
	});
	$("#showword").click(function(){
		lantu.initWord();
		output.print('#wordlist', lantu.wordArray);
	});
	$("#showtag").click(function(){
		lantu.initTag();
		output.print('#taglist', lantu.tagArray);
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
