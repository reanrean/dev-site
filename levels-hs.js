var taskOrder=['simple','cute','active','pure','cool'];

var tasksAdd=[
['联盟委托: 1-1','pure','cute'],
['联盟委托: 1-2','simple','active'],
['联盟委托: 1-3','cool','pure'],
['联盟委托: 1-4','pure','cute'],
['联盟委托: 1-5','simple','active'],
['联盟委托: 1-6','cute','simple'],
['联盟委托: 1-7','active','simple'],
['联盟委托: 2-1','pure','active'],
['联盟委托: 2-2','pure','cool'],
['联盟委托: 2-3','active','simple'],
['联盟委托: 2-4','simple','active'],
['联盟委托: 2-5','simple','cute'],
['联盟委托: 2-6','pure','cute'],
['联盟委托: 2-7','simple','active'],
['联盟委托: 3-1','cute','pure'],
['联盟委托: 3-2','cool','cute'],
['联盟委托: 3-3','cute','pure'],
['联盟委托: 3-4','pure','cute'],
['联盟委托: 3-5','simple','active'],
['联盟委托: 3-6','simple','active'],
['联盟委托: 3-7','active','simple'],
];

var tasksRaw_Add=tasksRaw;

function test(){
	for (var theme in tasksRaw_Add){
		for (var i in tasksAdd){
			if (theme==tasksAdd[i][0]){
				tasksRaw_Add(theme)=1;//*boost
			}
		}
	}
}
