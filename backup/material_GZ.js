//var chap=1;
var degree='公';

window.onload = function(){
	calcDependencies();
	
	var location_href=window.location.href;
	var location_href_index=location_href.indexOf('?');
	var chap_tmp=parseInt(location_href.substr(location_href_index+1));
	var chap=isNaN(chap_tmp)?0:chap_tmp;
	
	genMaterial('dropInfo',chap);
}

function genMaterial(output_id,chap){
	var output='<table border="1">';
	output+=tr(td('关卡')+td('名称')+td('总需求')+td('类别')+td('部位')+td('成品名称')+td('消耗'));
	for (l=1;l<30;l++){//sort by levels
		var l2=l>20?"支"+l%10:l;
		var level=chap+'-'+l2+degree;
		for (var i in clothes){
			var src_sp=clothes[i].source.split("/");
			for (k=0;k<src_sp.length;k++){
				if(src_sp[k].indexOf(level)==0){//if source matches chapter&level
					var deps = clothes[i].getDeps('   ', 1);
					if (deps) {
						var deps1=deps.split('\n'); 
						//var rowspan=Math.max(1,deps1.length-2);
						//var rowspan=Math.max(1,deps.match(/消耗/g).length);
						var rowspan=Math.max(1,deps.split('[消耗').length-1);
						
						var pos1=deps.indexOf('总计需'); 
						var pos2=deps.indexOf('件',pos1); 
						var total=deps.substr(pos1+3,pos2-pos1-3);
						
						var line=td(level,'rowspan="'+rowspan+'"');
						line+=td(clothes[i].name,'rowspan="'+rowspan+'"');
						line+=td(total,'rowspan="'+rowspan+'"');
						
						for (var j=1;j<=deps1.length-2;j++){
							var pos_end=(deps1[j].indexOf('[消耗')>-1 ? deps1[j].indexOf('[消耗') : deps1[j].length);
							var pos_start=deps1[j].substr(0,pos_end).lastIndexOf(']')+1;
							var pos_start_1=deps1[j].substr(0,pos_start).lastIndexOf('[')+1;
							var pos_start_2=deps1[j].indexOf('[')+1;
							var clo_name=deps1[j].substr(pos_start,pos_end-pos_start);
							var clo_type=deps1[j].substr(pos_start_1,pos_start-pos_start_1-1);
							var clo_pat=deps1[j].substr(pos_start_2,1);
							var clo_num=deps1[j].substr(pos_end).replace('[消耗','').replace(']','');
							
							if(clo_num){
								line+=td(clo_pat)+td(clo_name)+td(clo_type)+td(clo_num);
								output+=tr(line);
								line='';
							}
						}
					}else {
						output+=tr(td(level)+td(clothes[i].name)+td(1)+td('-')+td('-')+td('-')+td('-'));
					}
					
					
					output+=tr(line);
				}
			}
		}
	}
	output+='</table>';
	document.getElementById(output_id).innerHTML=output;
	var elts = document.getElementsByTagName('tr');
	if(elts.length<=1) {document.getElementById(output_id).innerHTML='<p>尚无资料</p>';}
}

function tr(text,attr){
	return '<tr'+(attr? ' '+attr : '')+'>'+text+'</tr>';
}

function td(text,attr){
	return '<td'+(attr? ' '+attr : '')+'>'+text+'</td>';
}
