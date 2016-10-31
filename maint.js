//var wname=[wardrobe,wardrobe_s,wardrobe_i];
//var wowner=['rean','seal100x','ivangift'];
var wname=[wardrobe,wardrobe_s];
var wowner=['rean','seal100x'];

var rows=0;
var field_desc=['名字','分类','编号','心级',
	'华丽','简约','优雅','活泼','成熟','可爱','性感','清纯','清凉','保暖',
	'tag','来源','套装','版本'];

function show(){
	var pass='6394210ce21ac27fb5de7645824dff9be9ba0690';
	var userInput=$.sha1($("#passcode").val());
	$("#passcode").val('');
	if (userInput==pass){
		go();
	}else{
		$("#menu").html('');
		$("#info").html('&#x1f64a&#x1f64a&#x1f64a&#x1f64a&#x1f64a');
		$("#extra").html('');
	}
}

function go(){
	var menu='<table width=100% style="table-layout: fixed; font-weight:bold;">';
	var line=td(ahref('Clothes','go_comp()'));
		line+=td(ahref('Pattern','go_comp_pattern()'));
		line+=td(ahref('Add','go_add()'));
		line+=td(ahref('Data','go_static()'));
		line+=td(ahref('Source','go_src()'));
		line+=td('<a href="hs-rean.html" target="_blank">HSLevel</a>');
	menu+=tr(line);
	$("#menu").html(menu);
	$("#info").html('');
	$("#extra").html('');
}

function go_comp(){
	var cnt=[];
	for (var j in wname){
		cnt[j]=0;
		for(var i in wname[j]){
			cnt[j]++;
		}
	}
	var max=0;
	var list='Count ';
	for (var j in wname){
		list+=wowner[j]+':'+cnt[j]+' ';
		if (cnt[j]>max) {max=cnt[j];}
	}
	
	var str=[];
	for (var i in wname){
		str[i]=[];
	}
	var skip_pos=jQuery.inArray('来源', field_desc);
	for(var i=0;i<max;i++){//assign values into str[] from wardrobe
		for (var j in wname){
			if(wname[j][i]){
				str[j][i]=wname[j][i][0];
				for (var p=1;p<field_desc.length;p++){
					if(p==skip_pos){continue;}
					if(p==1&&wname[j][i][p]=='上衣') {str[j][i]+='/上装';}
					else {str[j][i]+='/'+wname[j][i][p];}
				}
			}else{
				str[j][i]='';
			}
		}
	}
	var out='<table>';
	out+=tr(td(list));
	out+=tr(td('<hr>'));
	for(var j=0;j<wname.length;j++){
		for(var i=j+1;i<wname.length;i++){//compare [j] with [i]
			if(j==i){continue;}
			out+=tr(td("Extra records in "+wowner[j]+"'s wardrobe VS "+wowner[i]+"'s:"));
			out+=tr(td(compare(str[j],str[i],'<br/>')));
			out+=tr(td('<hr>'));
			out+=tr(td("Extra records in "+wowner[i]+"'s wardrobe VS "+wowner[j]+"'s:"));
			out+=tr(td(compare(str[i],str[j],'<br/>')));
			out+=tr(td('<hr>'));
		}
	}
	out+='</table>';
	
	$("#info").html(out);
	$("#extra").html('');
}

function go_comp_pattern(){
	var p1=[];
	var p2=[];
	for (var i in pattern){
		p1.push(pattern[i].join('/'));
	}
	for (var i in pattern_s){
		p2.push(pattern_s[i].join('/'));
	}
	var out='<table>';
	out+=tr(td("Extra records in rean's wardrobe VS seal100x's:"));
	out+=tr(td(compare(p1,p2,'<br/>')));
	out+=tr(td('<hr>'));
	out+=tr(td("Extra records in seal100x's wardrobe VS rean's:"));
	out+=tr(td(compare(p2,p1,'<br/>')));
	out+='</table>';
	
	$("#info").html(out);
	$("#extra").html('');
}

function go_add(){
	rows=0;
	var form='<table id="go_add"><tbody>';
	var line='';
	for (var i in field_desc){
		line+=td(field_desc[i]);
	}
	form+=tr(line);
	form+='</tbody></table>';
	
	form+='<table>';
	line=td(button('Add',"add()"));
	line+=td(button('Del',"del()"));
	line+=td(button('Validate',"validWardrobe()"));
	line+=td(button('Generate',"genWardrobe()"));
	form+=tr(line);
	form+='</table>';
	
	$("#info").html(form);
	
	add();
}

function go_src(){
	var pos=jQuery.inArray('来源', field_desc);
	var src=[];
	for (var c in wname[0]){
		var ss=wname[0][c][pos].split("/");
		for (var s in ss){
			if (ss[s].indexOf('公')>-1) {ss[s]='*公';}
			if (ss[s].indexOf('少')>-1) {ss[s]='*少';}
			if (ss[s].indexOf('定')>-1) {ss[s]='*定';}
			if (ss[s].indexOf('进')>-1) {ss[s]='*进';}
			if (ss[s].indexOf('梦境：')>-1) {ss[s]='*梦境';}
			if (ss[s].indexOf('套装成就：')>-1) {ss[s]='*套装成就';}
			if (jQuery.inArray(ss[s], src)<0) {src.push(ss[s]);}
		}
	}
	src.sort();
	for (var s in src){
		src[s]=(s<9? '0'+(s*1+1) : (s*1+1))+src[s];
	}
	$("#info").html(src.join('<br/>'));
	$("#extra").html('');
}

function add(){
	rows++;
	var line='';
	for (var i=1;i<=field_desc.length;i++){
		line+=td('<input id="in'+rows+'_'+i+'" size="'+((i==1||i==2||i==15)?5:2)+'">');
	}
	$('#go_add > tbody:last-child').append(tr(line));
	arrowKey();
}

function del(){
	if(rows>1){
		rows--;
		$('#go_add tbody tr:last').remove();
	}
}

function genWardrobe(){
	var out='';
	for(var j=1;j<=rows;j++){
		out+='  [';
		for (var i=1;i<=field_desc.length;i++){
			out+="'"+$('#in'+j+'_'+i).val()+"'"+(i==field_desc.length?'':',');
		}
		out+='],<br/>';
	}
	$("#extra").html(out);
}

function validWardrobe(){
	var out='';
	var extra='';
	var chk1=[1,2,3,4,16];
	var chk2=[6,8,10,12,14];
	var prop=['SSS','SS','S','A','B','C',''];
	var src_list=[];//source list
	for (var c in wardrobe){
		if(jQuery.inArray(wardrobe[c][15], src_list)<0) {src_list.push(wardrobe[c][15]);}
	}
	for(var j=1;j<=rows;j++){
		var head=(j==1? '':'<br/>')+'row'+j+'('+$('#in'+j+'_1').val()+'): '
		var check=[];
		var cont='';
		for (var i=1;i<=field_desc.length;i++){
			check[i]=$('#in'+j+'_'+i).val();
			if((jQuery.inArray(i, chk1)>-1)&&(!check[i])) {cont+=field_desc[i-1]+'null, ';}
			if(jQuery.inArray(i, chk2)>-1){
				if(check[i]&&check[i*1-1]){cont+=field_desc[i-2]+field_desc[i-1]+'both, ';}
				else if(!check[i]&&!check[i*1-1]){cont+=field_desc[i-2]+field_desc[i-1]+'null, ';}
				else if(jQuery.inArray(check[i], prop)<0){cont+=field_desc[i-1]+'inv, ';}
				else if(jQuery.inArray(check[i-1], prop)<0){cont+=field_desc[i-2]+'inv, ';}
			}
			if(i==2&&check[i]&&jQuery.inArray(check[i], category)<0) {cont+=field_desc[i-1]+'inv, ';}
			if(i==3&&check[i]&&isNaN(parseInt(check[i]))) {cont+=field_desc[i-1]+'inv, ';}
			if(i==16&&check[i]&&jQuery.inArray(check[i], src_list)<0) {cont+=field_desc[i-1]+'inv, ';}
		}
		if(cont){out+=head+cont;}
	}
	$("#extra").html(out);
}

function compare(a,b,split){//a contains but b not
	var out='';
	for(var i=0;a[i];i++){
		if (jQuery.inArray(a[i], b)<0) {out+=a[i]+split;}
	}
	return out;
}

function arrowKey() {
	$('input').keydown(function(e) {
		if (e.keyCode==37) {//left
			if(this.value.slice(0, this.selectionStart).length==0){
			//$(this).prev('input').focus();
			$(this).parent().prev().find('input').focus();
			}
		}
		if (e.keyCode==39) {//right
			if(this.value.length==this.value.slice(0, this.selectionStart).length){
			$(this).parent().next().find('input').focus();
			}
		}
		if (e.keyCode==38) {//up
			var thisid=$(this).attr('id');
			var tar_str=thisid.substr(2,thisid.indexOf('_')-2);
			var tar_id=thisid.replace(tar_str,parseInt(tar_str)-1);
			if($('#'+tar_id).length>0) {$('#'+tar_id).focus();}
		}
		if (e.keyCode==40) {//down
			var thisid=$(this).attr('id');
			var tar_str=thisid.substr(2,thisid.indexOf('_')-2);
			var tar_id=thisid.replace(tar_str,parseInt(tar_str)+1);
			if($('#'+tar_id).length>0) {$('#'+tar_id).focus();}
		}
	});
}

function go_static(){
	var radio=['construct','convert','merchant','pattern'];
	var info = '<form action="">';
	for (var i in radio){
		info += '<label><input type="radio" name="radio_static" id="static_'+radio[i]+'" value="'+radio[i]+'" '+(i==0?'checked':'')+'>'+radio[i]+'</label><label>';
	}
	info += '</form><br>';
	info += '<textarea id="static_input" rows="10" style="width:100%"></textarea><br>';
	info += button('↓↓↓↓↓','static_generate()')+'<br>';
	info += '<textarea id="static_output" rows="10" style="width:100%"></textarea><br>';
	
	$("#info").html(info);
	$("#extra").html('');
}

function static_generate(){
	var static_input = $("#static_input").val();
	if(static_input) {//$("#static_output").val(contentBy(contentOf(static_input)[0],'cloth'));
		var contents = contentOf(static_input);
		var out = '';
		for (var i in contents){
			var src = contentBy(contents[i],'id');
			var tar = contentBy(contents[i],'cloth');
			var num = contentBy(contents[i],'num');
			var src_c = convert_uid(src[0]);
			for (var j in tar){
				var tar_c = convert_uid(tar[j]);
				out += "  ['"+src_c.mainType+"','"+src_c.id+"','"+tar_c.mainType+"','"+tar_c.id+"','"+num[j]+"','设'],\n"
			}
		}
		$("#static_output").val(out);
	}
}

function convert_uid(uid){
	var mainId = uid.substr(0,1);
	var id = (uid.substr(1,1)==0 ? uid.substr(2,3) : uid.substr(1,4));
	return {
		uid: uid,
		mainType: convert_type(mainId),
		id: id,
	}
}

function convert_type(tid){
	switch(tid){
		case '1' : return '发型';
		case '2' : return '连衣裙';
		case '3' : return '外套';
		case '4' : return '上装';
		case '5' : return '下装';
		case '6' : return '袜子';
		case '7' : return '鞋子';
		case '8' : return '饰品';
		case '9' : return '妆容';
	}
}

function contentOf(txt){
	var ind=0; var ind2=0;
	var ret=[]; var ret_cont=''; //var ret_name='';
	for (var i=0; i<txt.length; i++){
		var c = txt.substr(i,1);
		if (c=='{') ind++;
		else if (c=='}') {
			ind--;
			if (ind==0) {ret.push(ret_cont.substr(1)); ret_cont='';} //ret.push([ret_name,ret_cont.substr(1)]);
		}
		if (ind>0) ret_cont += c;
		//else if (c.match(/^[0-9a-z]$/)) ret_name += c;
	}
	return ret;
}

function contentBy(txt,varname){
	txt=txt.replace(/[^0-9a-z\,{}=]/gi,'');
	varname = varname+'=';
	if (txt.indexOf(varname)<0) return false;
	var txt_sp = txt.split(varname);
	var ret = [];
	for (var i=1; i<txt_sp.length; i++) ret.push(txt_sp[i].split(',')[0]);
	return ret;
}

$(document).ready(function () {
	go();/*
	$('#passcode').keydown(function(e) {
		if (e.keyCode==13) {
			$(this).blur();
			show();
		}
	});
	*/
});

function td(text,attr){
	return '<td'+(attr? ' '+attr : '')+'>'+text+'</td>';
}

function tr(text,attr){
	return '<tr'+(attr? ' '+attr : '')+'>'+text+'</tr>';
}

function button(text,onclick){
	return '<button onclick="'+onclick+';return false;">'+text+'</button>'
}

function ahref(text,onclick,cls){
	return '<a href="" onclick="'+onclick+';return false;" '+(cls? 'class="'+cls+'" ' : '')+'>'+text+'</a>';
}
