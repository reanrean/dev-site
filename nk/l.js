//活动，不计入顶配
var levels_2 = {
}

//联盟
var tasksRaw_2 = {
}

//主线
var levelsRaw_2 = {
}

//tag(共用)
var levelBonus_2 = {
}

var tasksRaw = function() {
	var ret = tasksRaw;
	for (var theme in tasksRaw_2) {
		ret[theme] = tasksRaw_2[theme];
	}
	return ret;
}();

var levelsRaw = function() {
	var ret = levelsRaw;
	for (var theme in levelsRaw_2) {
		ret[theme] = levelsRaw_2[theme];
	}
	return ret;
}();

var levelBonus = function() {
	var ret = levelBonus;
	for (var theme in levelBonus_2) {
		ret[theme] = levelBonus_2[theme];
	}
	return ret;
}();

allThemes = function() {
	var ret = {};
	for (var theme in levels_2) {
		var criteria = levels_2[theme];
		ret[theme] = level(theme, parseCriteriaList(criteria));
	}
	for (var theme in tasksRaw_2) {
		var criteria = tasksRaw_2[theme];
		ret['' + theme] = level(theme, parseCriteriaList(criteria));
	}
	for (var theme in levelsRaw_2) {
		var criteria = levelsRaw_2[theme];
		ret['关卡: ' + theme] = level(theme, parseCriteriaList(criteria));
	}
	for (var theme in allThemes) {
		ret[theme] = allThemes[theme];
	}
	return ret;
}();