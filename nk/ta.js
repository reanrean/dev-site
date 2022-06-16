$(document).ready(function () {
	$('#init').hide();
});

var tasksAdd={};
function genLimit(){
	var date1=new Date();
	for (var c in tasksRaw){
		theme_name=c;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			tasksAdd[theme_name] = genLimitExc([]);
		}
	}
	for (var d in levelsRaw){
		theme_name='关卡: '+d;
		if (allThemes[theme_name]) {
			setFilters(allThemes[theme_name]);
			tasksAdd[theme_name] = genLimitExc([]);
		}
	}
	var date2=new Date();
	$('#topsearch_note').html('Done! Time used: '+((date2-date1)/1000).toFixed(2)+' secs');
	$('#init').show();
}