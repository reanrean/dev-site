
function debug1(){
	var out='';
	currentList=getDistinct(currentList);
	for (var c in category){//sort by category
		for (var i in currentList){
			if(clothes[currentList[i]].type.type!=category[c]) {continue;}
			out+=clothes[currentList[i]].name+'-';			
		}
	}
	return out;
}

function td1(text,attr){
	return '<td'+(attr? ' '+attr : '')+'>'+text+'</td>\n';
}

function tr1(text,attr){
	return '<tr'+(attr? ' '+attr : '')+'>'+text+'</tr>\n';
}

function addTooltip1(text,tooltip){
	return '<a tooltip="'+tooltip+'" class="aTooltip">'+text+'</a>';
}

function addTooltip2(text,tooltip){
	return '<a tooltip="'+tooltip+'" class="cTip">'+text+'</a>';
}

function retTopTd1(arr,crit,id, limitMode){
	var ret='';
	var cnt=0;
	
	if(arr==inTop){
		for (var s in inTop){
			if(inTop[s][0].indexOf(crit)==0) {
				if (crit=='竞技场') {ret+=(cnt>0?', ':'')+addTooltip1(nobr(inTop[s][0].substr(inTop[s][0].indexOf(': ')+2,2)),inTop[s][2]);}
				else {ret+=(cnt>0?', ':'')+addTooltip1(nobr(inTop[s][0].substr(inTop[s][0].indexOf(': ')+2)),inTop[s][2]);}
				cnt++;
			}
		}
		if(cnt>5){
			switch(crit){
				case '竞技场': var pos=1; break;
				case '联盟': var pos=2; break;
				case '关卡': var pos=3; break;
			}
			a='<span id="cell'+id+'_t'+(limitMode?"l":"n")+pos+'">'+ahref('共'+cnt+'关',"showTop('"+id+"_t"+(limitMode?"l":"n")+pos+"')")+'</span>\n';
			a+='<span id="cell'+id+'_t'+(limitMode?"l":"n")+pos+'_f" style="display:none">'+ret+'<br>'+nobr(ahref('收起',"hideTop('"+id+"_t"+(limitMode?"l":"n")+pos+"')"))+'</span>\n';
			return a;
		}
		return ret;
	}else{
		for (var s in inSec){
			if(inSec[s][0].indexOf(crit)==0) {
				if (crit=='竞技场') {ret+=(cnt>0?', ':'')+addTooltip1(nobr(inSec[s][0].substr(inSec[s][0].indexOf(': ')+2,2)+'(第'+inSec[s][1]+')'),inSec[s][2]);}
				else {ret+=(cnt>0?', ':'')+addTooltip1(nobr(inSec[s][0].substr(inSec[s][0].indexOf(': ')+2)+'(第'+inSec[s][1]+')'),inSec[s][2]);}
				cnt++;
			}
		}
		if(cnt>5){
			switch(crit){
				case '竞技场': var pos=1; break;
				case '联盟': var pos=2; break;
				case '关卡': var pos=3; break;
				default: var pos=0;
			}
			a='<span id="cell'+id+'_s'+(limitMode?"l":"n")+pos+'">'+ahref('共'+cnt+'关',"showTop('"+id+"_s"+(limitMode?"l":"n")+pos+"')")+'</span>\n';
			a+='<span id="cell'+id+'_s'+(limitMode?"l":"n")+pos+'_f" style="display:none">'+ret+'<br>'+nobr(ahref('收起',"hideTop('"+id+"_s"+(limitMode?"l":"n")+pos+"')"))+'</span>\n';
			return a;
		}
		return ret;
	}
}

function addCart_All1(bClear){
	if (bClear)
	{
		cartList=[];
	}
	for (var i in currentList){
		cartList.push(currentList[i]);
	}
}

function searchVersion1(setName, nStart){
	currentList=[];
	for (var i in clothes){
		if(clothes[i].version==setName && i >= nStart-4){
			currentList.push(i);
		}
	}
}

function searchSetById1(nStart, nEnd){
	currentList=[];
	for (var i in clothes){
		if(i >= nStart-4 && i <= nEnd-4){
			currentList.push(i);
		}
	}
}

function storeTopByCate1(cartCates, caltype, nCount){
	var showJJC=1;
	var showAlly=1;
	var showNormal=1;
	
	if (caltype == 0)
	{
		showJJC=1;
		showAlly=1;
	  showNormal=1;
	  limitMode=0;
	}
	else if (caltype == 1)
	{
		showJJC=0;
		showAlly=1;
	  showNormal=1;
	  limitMode=1;
	}
	else if (caltype == 2)
	{
		showJJC=1;
		showAlly=1;
		showNormal=0;
		limitMode=1;
	}
	else if (caltype == 3)
	{
		showJJC=0;
		showAlly=1;
		showNormal=0;
		limitMode=0;
	}
	else if (caltype == 4)
	{
		showJJC=0;
		showAlly=0;
		showNormal=1;
		limitMode=0;
	}
	else if (caltype == 5)
	{
		showJJC=0;
		showAlly=0;
		showNormal=1;
		limitMode=0;
	}
	else if (caltype == 6)
	{
		showJJC=1;
		showAlly=0;
		showNormal=0;
		limitMode=0;
	}
	
	for (var cate in cartCates){
			if (showJJC){
			for (var b in competitionsRaw){
				theme_name='竞技场: '+b;
				if (allThemes[theme_name]) {
					setFilters(allThemes[theme_name]);
					onChangeCriteria();
					if (cate==0){storeTop[theme_name]=[];}//initialize as array
					storeTop[theme_name].push([cartCates[cate],getTopCloByCate(criteria, nCount, cartCates[cate])]);
				}
			}
		}
		if (showAlly){
			for (var c in tasksRaw){
				theme_name=c;
				if (allThemes[theme_name]) {
					setFilters(allThemes[theme_name]);
					onChangeCriteria();
					if (cate==0){storeTop[theme_name]=[];}//initialize as array
					storeTop[theme_name].push([cartCates[cate],getTopCloByCate(criteria, nCount, cartCates[cate])]);
				}
			}
		}
		if (showNormal){
			for (var d in levelsRaw){
				theme_name='关卡: '+d;
				if (allThemes[theme_name]) {
					setFilters(allThemes[theme_name]);
					onChangeCriteria();
					if (cate==0){storeTop[theme_name]=[];}//initialize as array
				storeTop[theme_name].push([cartCates[cate],getTopCloByCate(criteria, nCount, cartCates[cate])]);
				}
			}
		}
	}
}
function calctop_byid1(id, caltype){
	
	var showJJC=1;
	var showAlly=1;
	var showNormal=1;
	
	if (caltype == 0)
	{
		showJJC=1;
		showAlly=1;
	  showNormal=1;
	}
	else if (caltype == 1)
	{
		showJJC=0;
		showAlly=1;
	  showNormal=1;
	}
	else if (caltype == 2)
	{
		showJJC=1;
		showAlly=1;
		showNormal=0;
	}
	else if (caltype == 3)
	{
		showJJC=0;
		showAlly=1;
		showNormal=0;
	}
	else if (caltype == 4)
	{
		showJJC=0;
		showAlly=0;
		showNormal=1;
	}
	else if (caltype == 5)
	{
		showJJC=0;
		showAlly=0;
		showNormal=1;
	}
	
	
	inTop=[];inSec=[];
	
	if (showJJC){
		for (var b in competitionsRaw){
			theme_name='竞技场: '+b;
			if (allThemes[theme_name]) {
				calctop_bytheme(id,theme_name);
			}
		}
	}
	if (showAlly){
		for (var c in tasksRaw){
			theme_name=c;
			if (allThemes[theme_name]) {
				calctop_bytheme(id,theme_name);
			}
		}
	}
	if (showNormal){
		for (var d in levelsRaw){
			theme_name='关卡: '+d;
			if (allThemes[theme_name]) {
				calctop_bytheme(id,theme_name);
			}
		}
	}
}
function calctop_byall1(caltype, strName){
	var showJJC=1;
	var showAlly=1;
	var showNormal=1;
	var showSource=1;
	
	if (caltype==0)
	{
		showJJC=1;
		showAlly=1;
	  showNormal=1;
	  limitMode=0;
	  showSource=1;
	}
	else
	{
		showJJC=0;
		showAlly=1;
	  showNormal=1;
	  limitMode=1;
	  showSource=1;
	}
	
	var out='<table border="1" class="calcByAll'+((showMerc||showSource)?' calcSrc':'')+'">\n';
	out+=tr1(td1('名称')+td1('部位')+td1('来源')+td1('顶配')+(showJJC?td1('竞技场'):'')+(showAlly?td1('联盟'+(limitMode?'(极限)':'')):'')+(showNormal?td1('关卡'+(limitMode?'(极限)':'')):''));
	for (var c in category){//sort by category
		for (var i in cartList){
			id=cartList[i];
			if(clothes[id].type.type!=category[c]){continue;}
			calctop_byid1(id, caltype);
			var rowspan=1;
			if(inTop.length>0 && inSec.length>0) {rowspan++;}
			
			var cell;
			if (rowspan > 1)
			{
				cell=td1(clothes[id].name,'rowspan="'+rowspan+'"');
				cell+=td1(clothes[id].type.type,'rowspan="'+rowspan+'"');
			}
			else
			{
				cell=td1(clothes[id].name);
				cell+=td1(clothes[id].type.type);
			}
			if(showSource||showMerc){
				var cell_3rd='';
				if(showSource){
					var srcs=conv_source(clothes[id].source,'进',clothes[id].type.mainType);
					srcs=conv_source(srcs,'定',clothes[id].type.mainType);
					cell_3rd+=srcs;
				}
				if(showSource&&showMerc) {cell_3rd+='<br>';}
				if(showMerc){
					var price=getMerc(id);
					cell_3rd+=(price?price:'');
				}
				
				if (rowspan > 1)
				{
					cell+=td1(cell_3rd,'rowspan="'+rowspan+'"');
				}
				else
				{
					cell+=td1(cell_3rd);
				}
			}
			if(inTop.length>0){
				cell+=td1('顶配');
				cell+=(showJJC?td1(retTopTd1(inTop,'竞技场',id, limitMode)):'');
				cell+=(showAlly?td1(retTopTd1(inTop,'联盟',id, limitMode)):'');
				cell+=(showNormal?td1(retTopTd1(inTop,'关卡',id, limitMode)):'');
				out+=tr1(cell, 'class="top"');
			}
			if(inSec.length>0){
				if(inTop.length>0){cell='';}
				cell+=td1('高配');
				cell+=(showJJC?td1(retTopTd1(inSec,'竞技场',id, limitMode)):'');
				cell+=(showAlly?td1(retTopTd1(inSec,'联盟',id, limitMode)):'');
				cell+=(showNormal?td1(retTopTd1(inSec,'关卡',id, limitMode)):'');
				out+=tr1(cell);
			}
		}
	}
	out+='</table>\n';	
	return out;
}

function calctop_bytheme2(id,them){
	var resultList = get_storeTop_Cate(them,clothes[id].type.type);
	var tmp='';
	var resultListClo=[];
	//sort resultList
	for (var r in resultList){
		if(clothes[id]==resultList[r][0]){
			for (r2=0;r2<r;r2++){
				if(resultList[r][1]==resultList[r2][1]){
					var tmp_res=resultList[r];
					for (k=r;k>r2;k--){//lower others ranking
						resultList[k] = resultList[k-1];					
					}
					resultList[r2]=tmp_res;
					break;
				}
			}
			break;
		}
	}
	
	for (var r in resultList){
		if (resultList[r]) {
			
			var srcs;			
			srcs=conv_source1(resultList[r][0].source,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);			
			srcs='['+srcs+']';
			
			if (r>0) 
			{
				tmp+=' > ';
				tmp+=resultList[r][0].name +resultList[r][1] + srcs;
			}
			else
			{
				tmp+='<font color="red">'+resultList[r][0].name  + resultList[r][1] + srcs + '</font>';
			}
			resultListClo.push(resultList[r][0]);
		}
	}
	
	if($.inArray(clothes[id], resultListClo)>-1){
		var moveTopToSec=0;
		//compare dress vs top+bottom
		if(clothes[id].type.type=='连衣裙'){
			var result_top=get_storeTop_Cate(them, '上装');
			var result_bot=get_storeTop_Cate(them, '下装');
			if(result_top[0]&&result_bot[0]){
				if(resultList[0][1]<result_top[0][1]+result_bot[0][1]){
					moveTopToSec=1;					
				}
			}
		}else if(clothes[id].type.type=='上装'){
			var result_dress=get_storeTop_Cate(them, '连衣裙');
			var result_bot=get_storeTop_Cate(them, '下装');
			if(result_dress[0]){
				if(resultList[0][1]+(result_bot[0]?result_bot[0][1]:0)<result_dress[0][1]){
					moveTopToSec=1;					
				}
			}
		}else if(clothes[id].type.type=='下装'){
			var result_dress=get_storeTop_Cate(them, '连衣裙');
			var result_top=get_storeTop_Cate(them, '上装');
			if(result_dress[0]){
				if(resultList[0][1]+(result_top[0]?result_top[0][1]:0)<result_dress[0][1]){
					moveTopToSec=1;					
				}
			}
		}
	
		if(clothes[id]==resultListClo[0] && !moveTopToSec) {
			inTop.push([id,tmp]);
		}
	}
}



function calctop_bytheme22(list, them, ctype){
	var resultList = get_storeTop_Cate(them, ctype);
	var tmp='';
	var resultListClo=[];	
	var isInTop = 0;
	var isInSec = 0;
	var inlist = 0;
	
	//sort resultList
	for (var r in resultList){
		inlist = 0;
		for (var l in list){
			if (clothes[list[l]] == resultList[r][0])
			{
				inlist = 1;
				break;
			}
		}
			
		if(inlist == 1){
			for (r2=0;r2<r;r2++){
				if(resultList[r][1]==resultList[r2][1]){
					var tmp_res=resultList[r];
					for (k=r;k>r2;k--){//lower others ranking
						resultList[k] = resultList[k-1];					
					}
					resultList[r2]=tmp_res;
					break;
				}
			}
			break;
		}
	}
	
	for (var r in resultList){	
		
		if (resultList[r]) {
			
			inlist = 0;
			for (var l in list){
				if (clothes[list[l]] == resultList[r][0])
				{
					inlist = 1;
					break;
				}
			}
			
			var srcs;			
			srcs=conv_source1(resultList[r][0].source,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);			
			srcs='['+srcs+']';
			
			if (r>0) 
			{
				if (resultList[r][1] == resultList[r-1][1])
				{
					tmp+=' = ';			
				}
				else
				{
					tmp+=' > ';				
				}
				if (inlist == 1)
				{
					tmp+='<font color="blue">'+resultList[r][0].name + resultList[r][1] + srcs + '</font>';
					isInSec = 1;
				}
				else
				{
					tmp+=resultList[r][0].name+resultList[r][1] + srcs;
				}
			}
			else
			{ 
				if (inlist == 1)
				{
					if(ctype=='连衣裙' || ctype=='上装' || ctype=='下装')
					{
						var moveTopToSec=0;
						//compare dress vs top+bottom
						if(ctype=='连衣裙'){
							var result_top=get_storeTop_Cate(them, '上装');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_top[0]&&result_bot[0]){
								if(resultList[0][1]<result_top[0][1]+result_bot[0][1]){
									moveTopToSec=1;
									var othScore=result_top[0][1]+result_bot[0][1];
									tmp='<font color=#8E4890>(' +result_top[0][0].name+'+'+result_bot[0][0].name+')'+ othScore+'</font> > '+tmp;
								}
							}
						}else if(ctype=='上装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_bot[0]?result_bot[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp='<font color=#8E4890>'+result_dress[0][0].name + result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}else if(ctype=='下装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_top=get_storeTop_Cate(them, '上装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_top[0]?result_top[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp='<font color=#8E4890>' +result_dress[0][0].name+ result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}
						
						if (moveTopToSec==0)
						{
							tmp+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInTop = 1;
						}
						else
						{
							tmp+='<font color="blue">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInSec = 1;
						}
					}
					else
					{
						tmp+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
						isInTop = 1;
					}
				}
				else
				{
					tmp+=resultList[r][0].name+resultList[r][1] + srcs;
				}
			}
			
			resultListClo.push(resultList[r][0]);
		}
	}
		
	if (isInTop)
	{
		inTop.push([tmp, ctype]);
	}
	else if (isInSec)
	{
		inSec.push([tmp, ctype]);
	}
}

function convstr(src, subs, news)
{
	if (src.indexOf(subs) >= 0) 
	{
		var pos1=src.indexOf(subs);

		var pos2=src.indexOf('/',pos1); 		 
		if(pos2<0) 
		{
			pos2=src.indexOf(')',pos1); 
			if (pos2 < 0)		pos2=src.length;
		}
		else
		{
			var pos22=src.indexOf(')',pos1);
			
			if (pos22 >= 0 && pos22 < pos2) pos2 = pos22;
		}
		 
		var str1=src.substr(0,pos1);
		var str2=news;
		var str3=src.substr(pos2);
		return str1+str2+str3;
	}
	else
	{
		return src;
	}
}
function conv_source1(src,mainType){
	
	var out;
	var bch = 0;
	if(src.indexOf('定(进(进')>-1)
	{
		var subs = '定(进(进';
		var pos1=src.indexOf(subs)+subs.length;
		var pos2=src.indexOf('/',pos1); 		 
		if(pos2<0) 
		{
			pos2=src.indexOf(')',pos1); 
			if (pos2 < 0)		pos2=src.length;
		}
		else
		{
			var pos22=src.indexOf(')',pos1);
			
			if (pos22 >= 0 && pos22 < pos2) pos2 = pos22;
		}
		var str1=src.substr(0,pos1);
		var str2=src.substr(pos1,pos2-pos1);
		var str3=src.substr(pos2);
		for (var p in clothes){
			if(clothes[p].type.mainType==mainType&&clothes[p].id==str2) 
			{
				str2='('+clothes[p].source + ')';
			}
		}		
		out = str1+str2+str3;
	}
	else if(src.indexOf('进(进')>-1)
	{
		var subs = '(进(进';
		var pos1=src.indexOf(subs)+subs.length;
		var pos2=src.indexOf('/',pos1); 		 
		if(pos2<0) 
		{
			pos2=src.indexOf(')',pos1); 
			if (pos2 < 0)		pos2=src.length;
		}
		else
		{
			var pos22=src.indexOf(')',pos1);
			
			if (pos22 >= 0 && pos22 < pos2) pos2 = pos22;
		}
		var str1=src.substr(0,pos1);
		var str2=src.substr(pos1,pos2-pos1);
		var str3=src.substr(pos2);
		for (var p in clothes){
			if(clothes[p].type.mainType==mainType&&clothes[p].id==str2) 
			{
				str2='('+clothes[p].source + ')';
			}
		}		
		out = str1+str2+str3;
	}
	else if(src.indexOf('定(进')>-1)
	{
		var subs = '定(进';
		var pos1=src.indexOf(subs)+subs.length;
		var pos2=src.indexOf('/',pos1); 		 
		if(pos2<0) 
		{
			pos2=src.indexOf(')',pos1); 
			if (pos2 < 0)		pos2=src.length;
		}
		else
		{
			var pos22=src.indexOf(')',pos1);
			
			if (pos22 >= 0 && pos22 < pos2) pos2 = pos22;
		}
		var str1=src.substr(0,pos1);
		var str2=src.substr(pos1,pos2-pos1);
		var str3=src.substr(pos2);
		for (var p in clothes){
			if(clothes[p].type.mainType==mainType&&clothes[p].id==str2) 
			{
				str2='('+clothes[p].source + ')';
			}
		}		
		out = str1+str2+str3;
	}
	else if(src.indexOf('进')>-1)
	{
		var subs = '进';
		var pos1=src.indexOf(subs)+subs.length;
		var pos2=src.indexOf('/',pos1); 		 
		if(pos2<0) 
		{
			pos2=src.indexOf(')',pos1); 
			if (pos2 < 0)		pos2=src.length;
		}
		else
		{
			var pos22=src.indexOf(')',pos1);
			
			if (pos22 >= 0 && pos22 < pos2) pos2 = pos22;
		}
		var str1=src.substr(0,pos1);
		var str2=src.substr(pos1,pos2-pos1);
		var str3=src.substr(pos2);
		for (var p in clothes){
			if(clothes[p].type.mainType==mainType&&clothes[p].id==str2) 
			{
				str2='('+clothes[p].source + ')';
			}
		}		
		out = str1+str2+str3;
	}
	else if(src.indexOf('定')>-1)
	{
		var subs = '定';
		var pos1=src.indexOf(subs)+subs.length;
		var pos2=src.indexOf('/',pos1); 		 
		if(pos2<0) 
		{
			pos2=src.indexOf(')',pos1); 
			if (pos2 < 0)		pos2=src.length;
		}
		else
		{
			var pos22=src.indexOf(')',pos1);
			
			if (pos22 >= 0 && pos22 < pos2) pos2 = pos22;
		}
		var str1=src.substr(0,pos1);
		var str2=src.substr(pos1,pos2-pos1);
		var str3=src.substr(pos2);
		for (var p in clothes){
			if(clothes[p].type.mainType==mainType&&clothes[p].id==str2) 
			{
				str2='('+clothes[p].source + ')';
			}
		}		
		out = str1+str2+str3;
	}
	else
	{
		out = src;
	}
	
	if (out.indexOf('设计图') >= 0) out = convstr(out, '设计图', '图');
	if (out.indexOf('赠送·签到') >= 0) out = convstr(out, '赠送·签到', '签到');
	if (out.indexOf('店·金币') >= 0) out = convstr(out, '店·金币', '金');
	if (out.indexOf('店·钻石') >= 0) out = convstr(out, '店·钻石', '钻');	
	if (out.indexOf('元素重构') >= 0) out = convstr(out, '元素重构', '重构');
	if (out.indexOf('充值·V礼包') >= 0) out = convstr(out, '充值·V礼包', 'V礼包');
	if (out.indexOf('充值·活动') >= 0) out = convstr(out, '充值·活动', '充值');
	else if (out.indexOf('充值·') >= 0) out = convstr(out, '充值·', '');

	return out;
}

function calctop_bytheme26(list, them, ctype){
	var resultList = get_storeTop_Cate(them, ctype);
	var tmp='';
	var tmp1='';
	var resultListClo=[];	
	var isJIN = 0;
	var is = 0;
	var inlist = 0;
	
	//sort resultList
	for (var r in resultList){
		inlist = 0;
		for (var l in list){
			if (clothes[list[l]] == resultList[r][0])
			{
				inlist = 1;
				break;
			}
		}
			
		{
			for (r2=0;r2<r;r2++){
				if(resultList[r][1]==resultList[r2][1]){
					var tmp_res=resultList[r];
					for (k=r;k>r2;k--){//lower others ranking
						resultList[k] = resultList[k-1];					
					}
					resultList[r2]=tmp_res;
					break;
				}
			}
			break;
		}
	}
	
	var ncount = 0;
	var isJin = 0;
	for (var r in resultList){	
		
		if (resultList[r]) {
			
			inlist = 0;
			for (var l in list){
				if (clothes[list[l]] == resultList[r][0])
				{
					inlist = 1;
					break;
				}
			}
			
			var srcs;			
			srcs=conv_source1(resultList[r][0].source,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);			
			srcs='['+srcs+']';
			
			if (r>0) 
			{
				if (resultList[r][1] == resultList[r-1][1])
				{
					tmp+=' = ';			
				}
				else
				{
					tmp+=' > ';				
				}
				
				if (inlist == 1)
				{
					tmp+='<font color="blue">'+resultList[r][0].name + resultList[r][1] + srcs + '</font>';
					isInSec = 1;
				}
				else
				{
					tmp+=resultList[r][0].name+resultList[r][1] + srcs;
				}				
			}
			else
			{ 
				if (inlist == 1)
				{
					if(ctype=='连衣裙' || ctype=='上装' || ctype=='下装')
					{
						var moveTopToSec=0;
						//compare dress vs top+bottom
						if(ctype=='连衣裙'){
							var result_top=get_storeTop_Cate(them, '上装');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_top[0]&&result_bot[0]){
								if(resultList[0][1]<result_top[0][1]+result_bot[0][1]){
									moveTopToSec=1;
									var othScore=result_top[0][1]+result_bot[0][1];
									tmp1='<font color=#8E4890>(' +result_top[0][0].name+'+'+result_bot[0][0].name+')'+ othScore+'</font> > '+tmp;
								}
							}
						}else if(ctype=='上装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_bot[0]?result_bot[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp1='<font color=#8E4890>'+result_dress[0][0].name + result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}else if(ctype=='下装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_top=get_storeTop_Cate(them, '上装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_top[0]?result_top[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp1='<font color=#8E4890>' +result_dress[0][0].name+ result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}
						
						if (moveTopToSec==0)
						{
							tmp1+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInTop = 1;
						}
						else
						{
							tmp1+='<font color="blue">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInSec = 1;
						}
					}
					else
					{
						tmp1+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
						isInTop = 1;
					}
				}
				else
				{
					tmp1+=resultList[r][0].name+resultList[r][1] + srcs;
				}
			}
			
			resultListClo.push(resultList[r][0]);
			
			if (srcs.indexOf('金') > -1
					|| (srcs.indexOf('梦境') == -1 && srcs.indexOf('1-') > -1 && srcs.indexOf('11-') == -1 && (srcs.indexOf('少') > -1 || srcs.indexOf('公') > -1))
					|| (srcs.indexOf('梦境') == -1 && srcs.indexOf('2-') > -1 && srcs.indexOf('12-') == -1 && (srcs.indexOf('少') > -1 || srcs.indexOf('公') > -1))
					|| (srcs.indexOf('梦境') == -1 && srcs.indexOf('3-') > -1 && srcs.indexOf('13-') == -1 && (srcs.indexOf('少') > -1 || srcs.indexOf('公') > -1))
					|| (srcs.indexOf('梦境') == -1 && srcs.indexOf('4-') > -1 && srcs.indexOf('14-') == -1 && (srcs.indexOf('少') > -1 || srcs.indexOf('公') > -1))
					|| (srcs.indexOf('梦境') == -1 && srcs.indexOf('5-') > -1 && srcs.indexOf('15-') == -1 && (srcs.indexOf('少') > -1 || srcs.indexOf('公') > -1))
					|| (srcs.indexOf('赠送') > -1 && srcs.indexOf('赠送·') == -1)
					)
			{
				isJin = 1;
			}
			
			ncount = ncount + 1;
			
			if (isJin == 1 && ncount > 4) break;
		}
	}
		
	inTop.push([tmp1, tmp, ctype]);
}

function calctop_bytheme44(list, them, ctype){
	var resultList = get_storeTop_Cate(them, ctype);
	var tmp='';
	var resultListClo=[];	
	var isInTop = 0;
	var isInSec = 0;
	var inlist = 0;
	
	//sort resultList
	for (var r in resultList){
		inlist = 0;
		for (var l in list){
			if (clothes[list[l]] == resultList[r][0])
			{
				inlist = 1;
				break;
			}
		}
			
		if(inlist == 1){
			for (r2=0;r2<r;r2++){
				if(resultList[r][1]==resultList[r2][1]){
					var tmp_res=resultList[r];
					for (k=r;k>r2;k--){//lower others ranking
						resultList[k] = resultList[k-1];					
					}
					resultList[r2]=tmp_res;
					break;
				}
			}
			break;
		}
	}
	
	for (var r in resultList){	
		
		if (resultList[r]) {
			
			inlist = 0;
			for (var l in list){
				if (clothes[list[l]] == resultList[r][0])
				{
					inlist = 1;
					break;
				}
			}
			
			var srcs;
			
			srcs=conv_source1(resultList[r][0].source,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			
			srcs='['+srcs+']';
					
			if (r>0) 
			{
				if (resultList[r][1] == resultList[r-1][1])
				{
					tmp+=' = ';			
				}
				else
				{
					tmp+=' > ';				
				}
				if (inlist == 1)
				{
					tmp+='<font color="blue">'+resultList[r][0].name + resultList[r][1] + srcs +'</font>';
					isInSec = 1;
				}
				else
				{
					tmp+=resultList[r][0].name+resultList[r][1] + srcs;
				}
			}
			else
			{ 
				if (inlist == 1)
				{
					if(ctype=='连衣裙' || ctype=='上装' || ctype=='下装')
					{
						var moveTopToSec=0;
						//compare dress vs top+bottom
						if(ctype=='连衣裙'){
							var result_top=get_storeTop_Cate(them, '上装');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_top[0]&&result_bot[0]){
								if(resultList[0][1]<result_top[0][1]+result_bot[0][1]){
									moveTopToSec=1;
									var othScore=result_top[0][1]+result_bot[0][1];
									tmp='<font color=#8E4890>(' +result_top[0][0].name+'+'+result_bot[0][0].name+')'+ othScore+'</font> > '+tmp;
								}
							}
						}else if(ctype=='上装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_bot[0]?result_bot[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp='<font color=#8E4890>'+result_dress[0][0].name + result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}else if(ctype=='下装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_top=get_storeTop_Cate(them, '上装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_top[0]?result_top[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp='<font color=#8E4890>' +result_dress[0][0].name+ result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}
						
						if (moveTopToSec==0)
						{
							tmp+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInTop = 1;
						}
						else
						{
							tmp+='<font color="blue">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInSec = 1;
						}
					}
					else
					{
						tmp+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
						isInTop = 1;
					}
				}
				else
				{
					tmp+=resultList[r][0].name+resultList[r][1] + srcs;
				}
			}
			
			resultListClo.push(resultList[r][0]);
		}
	}
		
	if (isInTop)
	{
		inTop.push([tmp, ctype]);
	}
	else if (isInSec)
	{
		inTop.push(['', ctype]);
	}
	
	
	if (isInSec)
	{
		inSec.push([tmp, ctype]);
	}
	else if (isInTop)
	{
		inSec.push(['', ctype]);
	}
}

function calctop_bytheme55(list, them, ctype){
	var resultList = get_storeTop_Cate(them, ctype);
	var tmp='';
	var resultListClo=[];	
	var isInTop = 0;
	var isInSec = 0;
	var inlist = 0;
	
	//sort resultList
	for (var r in resultList){
		inlist = 0;
		for (var l in list){
			if (clothes[list[l]] == resultList[r][0])
			{
				inlist = 1;
				break;
			}
		}
			
		if(inlist == 1){
			for (r2=0;r2<r;r2++){
				if(resultList[r][1]==resultList[r2][1]){
					var tmp_res=resultList[r];
					for (k=r;k>r2;k--){//lower others ranking
						resultList[k] = resultList[k-1];					
					}
					resultList[r2]=tmp_res;
					break;
				}
			}
			break;
		}
	}
	
	for (var r in resultList){	
		
		if (resultList[r]) {
			
			inlist = 0;
			for (var l in list){
				if (clothes[list[l]] == resultList[r][0])
				{
					inlist = 1;
					break;
				}
			}
			
			var srcs;
			
			srcs=conv_source1(resultList[r][0].source,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			srcs=conv_source1(srcs,resultList[r][0].type.mainType);
			
			srcs='['+srcs+']';
					
			if (r>0) 
			{
				if (resultList[r][1] == resultList[r-1][1])
				{
					tmp+=' = ';			
				}
				else
				{
					tmp+=' > ';				
				}
				if (inlist == 1)
				{
					tmp+='<font color="blue">'+resultList[r][0].name + resultList[r][1] + srcs +'</font>';
					isInSec = 1;
				}
				else
				{
					tmp+=resultList[r][0].name+resultList[r][1] + srcs;
				}
			}
			else
			{ 
				if (inlist == 1)
				{
					if(ctype=='连衣裙' || ctype=='上装' || ctype=='下装')
					{
						var moveTopToSec=0;
						//compare dress vs top+bottom
						if(ctype=='连衣裙'){
							var result_top=get_storeTop_Cate(them, '上装');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_top[0]&&result_bot[0]){
								if(resultList[0][1]<result_top[0][1]+result_bot[0][1]){
									moveTopToSec=1;
									var othScore=result_top[0][1]+result_bot[0][1];
									tmp='<font color=#8E4890>(' +result_top[0][0].name+'+'+result_bot[0][0].name+')'+ othScore+'</font> > '+tmp;
								}
							}
						}else if(ctype=='上装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_bot=get_storeTop_Cate(them, '下装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_bot[0]?result_bot[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp='<font color=#8E4890>'+result_dress[0][0].name + result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}else if(ctype=='下装'){
							var result_dress=get_storeTop_Cate(them, '连衣裙');
							var result_top=get_storeTop_Cate(them, '上装');
							if(result_dress[0]){
								if(resultList[0][1]+(result_top[0]?result_top[0][1]:0)<result_dress[0][1]){
									moveTopToSec=1;
									tmp='<font color=#8E4890>' +result_dress[0][0].name+ result_dress[0][1]+'</font> > '+tmp;
								}
							}
						}
						
						if (moveTopToSec==0)
						{
							tmp+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInTop = 1;
						}
						else
						{
							tmp+='<font color="blue">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
							isInSec = 1;
						}
					}
					else
					{
						tmp+='<font color="red">' +resultList[r][0].name+resultList[r][1] + srcs + '</font>';
						isInTop = 1;
					}
				}
				else
				{
					tmp+=resultList[r][0].name+resultList[r][1] + srcs;
				}
			}
			
			resultListClo.push(resultList[r][0]);
		}
	}
		
	if (isInTop)
	{
		inTop.push([tmp, ctype]);
	}	
}

function calctop_byall6(){
	var showJJC=1;
	var showAlly=0;
	var showNormal=0;
	limitMode=0;
	var showSource=1;	
	
	var out='';
	var ii = 0;
		
	for (var b in competitionsRaw){
		ii = ii + 1;
		out+='<a href="#'+ii+'">'+b + '</a> ';		
	}
	
	ii = 0;
	for (var b in competitionsRaw){
		theme_name='竞技场: '+b;
		ii = ii + 1;
		out+='<a id="'+ii+'"></a><p class="title2"> '+ theme_name +' </p>\n';
		out+='<span class="norm">\n';
		out+='<table border="1"  width="100%" class="jjctable">\n';
		out+=tr1(td1('部位')+td1('顶配')+td1('次配', 'width="70%"'));
	
		if (allThemes[theme_name]) {
			var rowspan=0;
			
			inTop=[]; 
			for (var c in category)
			{						
				calctop_bytheme26(cartList, theme_name, category[c]);		
			}	
				
			for (var r in inTop){rowspan++;}
			if (rowspan > 0)
			{
				var cell='';
				for (var r in inTop) {
			
					cell+=td1(inTop[r][2]);
					cell+=td1(inTop[r][0]);
					cell+=td1(inTop[r][1]);
					out+=tr1(cell);
					cell='';	
				}
			}
		}
		
		out+='</table>\n</span>\n';
		
		
	}	
	
	
	return out;
}

function calctop_byall2(){
	var showJJC=1;
	var showAlly=1;
	var showNormal=0;
	limitMode=1;
	var showSource=1;	
	
	var out='<a id="1"></a><p class="title2"> 竞技场 </p>\n';
	out+='<span class="norm">\n';
	out+='<table border="1"  width="100%">\n';
	out+=tr1(td1('关卡')+td1('部位')+td1('名称', 'width="70%"'));
	
	for (var b in competitionsRaw){
		theme_name='竞技场: '+b;
		
		if (allThemes[theme_name]) {
			var rowspan=0;
			
			inTop=[]; inSec=[];	
			for (var c in category)
			{						
				calctop_bytheme22(cartList, theme_name, category[c]);		
			}	
				
			for (var r in inTop){rowspan++;}
			for (var r in inSec){rowspan++;}
			if (rowspan > 0)
			{
				var cell=td1(b, 'rowspan="'+rowspan+'"'+'class="inSec"');
				for (var r in inTop) {
					var tidx = inTop[r][0];						
					cell+=td1(inTop[r][1]);
					cell+=td1(inTop[r][0]);
					out+=tr1(cell);
					cell='';	
				}
				
				for (var r in inSec) {
					var tidx = inSec[r][0];						
					cell+=td1(inSec[r][1]);
					cell+=td1(inSec[r][0]);
					out+=tr1(cell);
					cell='';	
				}
			}
		}
	}	
	out+='</table>\n</span>\n';
	out+='<a id="2"></a><p class="title2"> 联盟顶配(极限权重, 顶配有效，次配数据仅做参考) </p>\n<span class="norm">\n';	
	
	out+='<table border="1"  width="100%">\n';
	out+=tr1(td1('关卡')+td1('部位')+td1('名称', 'width="70%"'));

	for (var c in tasksRaw){
		theme_name=c;
		inTop=[];
		if (allThemes[theme_name]) {
			var rowspan=0;
			for (var i in cartList){
				id=cartList[i];
				calctop_bytheme2(id, theme_name);
			}
				
			for (var r in inTop){rowspan++;}
			if (rowspan > 0)
			{
				var cell=td1(c, 'rowspan="'+rowspan+'"'+'class="inSec"');
				for (var r in inTop) {
					var tidx = inTop[r][0];						
					cell+=td1(clothes[tidx].type.type);	
					cell+=td1(inTop[r][1]);
					out+=tr1(cell);
					cell='';	
				}
			}
		}
	}	
	
	out+='</table>\n</span>\n';
	
	return out;
}

function calctop_byall3(){
	var showJJC=0;
	var showAlly=1;
	var showNormal=0;
	var limitMode=0;
	var showSource=1;		
	
	var out='<a id="3"></a><p class="title2"> 联盟顶配(非极限权重) </p>\n<span class="norm">\n';	
	
	out+='<table border="1"  width="100%">\n';
	out+=tr1(td1('关卡')+td1('部位')+td1('名称', 'width="70%"'));
	limitMode=0;
	for (var d in tasksRaw){
		theme_name=d;
		if (allThemes[theme_name]) {
			var rowspan=0;
			
			inTop=[]; inSec=[];	
			for (var c in category)
			{						
				calctop_bytheme22(cartList, theme_name, category[c]);		
			}	
				
			for (var r in inTop){rowspan++;}
			for (var r in inSec){rowspan++;}
			if (rowspan > 0)
			{
				var cell=td1(d, 'rowspan="'+rowspan+'"'+'class="inSec"');
				for (var r in inTop) {
					var tidx = inTop[r][0];						
					cell+=td1(inTop[r][1]);
					cell+=td1(inTop[r][0]);
					out+=tr1(cell);
					cell='';	
				}
				
				for (var r in inSec) {
					var tidx = inSec[r][0];						
					cell+=td1(inSec[r][1]);
					cell+=td1(inSec[r][0]);
					out+=tr1(cell);
					cell='';	
				}
			}
		}
	}	
	out+='</table>\n</span>\n';
	return out;
}

function calctop_byall4(){
	var showJJC=0;
	var showAlly=0;
	var showNormal=1;
	var limitMode=0;
	var showSource=1;		
	
	var out='<a id="1"></a><p class="title2"> 关卡(非极限权重) </p>\n<span class="norm">\n';	
	
	out+='<table border="1"  width="100%">\n';
	out+=tr1(td1('关卡')+td1('部位')+td1('顶配', 'width="40%"')+td1('次配', 'width="40%"'));
	limitMode=0;
	for (var d in levelsRaw){
		theme_name='关卡: '+d;
		if (allThemes[theme_name]) {
			var rowspan=0;
			var cell, tidx;
			
			inTop=[]; inSec=[];	
			
			for (var c in category)
			{	
				calctop_bytheme44(cartList, theme_name, category[c]);		
			}
			
			for (var r in inTop){rowspan++;}
			if (rowspan > 0)
			{	
				cell=td1(d, 'rowspan="'+rowspan+'"'+'class="inSec"');		
				
				for (var r in inTop) 
				{	
					cell+=td1(inTop[r][1]);
					cell+=td1(inTop[r][0]);					
					cell+=td1(inSec[r][0]);		
					out+=tr1(cell);
					cell='';
				}
			}		
	
		}
	}	
	out+='</table>\n</span>\n';
	return out;
}

function calctop_byall5(){
	var showJJC=0;
	var showAlly=0;
	var showNormal=1;
	var limitMode=1;
	var showSource=1;		
	
	var out='<a id="1"></a><p class="title2"> 关卡(极限权重) </p>\n<span class="norm">\n';	
	
	out+='<table border="1"  width="100%">\n';
	out+=tr1(td1('关卡')+td1('部位')+td1('顶配', 'width="70%"'));
	limitMode=1;
	for (var d in levelsRaw){
		theme_name='关卡: '+d;
		if (allThemes[theme_name]) {
			var rowspan=0;
			var cell, tidx;
			
			inTop=[]; 
			
			for (var c in category)
			{	
				calctop_bytheme55(cartList, theme_name, category[c]);		
			}
			
			for (var r in inTop){rowspan++;}
			if (rowspan > 0)
			{	
				cell=td1(d, 'rowspan="'+rowspan+'"'+'class="inSec"');		
				
				for (var r in inTop) 
				{	
					cell+=td1(inTop[r][1]);
					cell+=td1(inTop[r][0]);					
					out+=tr1(cell);
					cell='';
				}
			}		
	
		}
	}	
	out+='</table>\n</span>\n';
	return out;
}

function calctop1(caltype, nCount, strName){
	var cartCates=[];
	for (var i in cartList){
		cartCates.push(clothes[cartList[i]].type.type);
		if($.inArray(clothes[cartList[i]].type.type, ['连衣裙','上装','下装'])>-1){
			cartCates.push('连衣裙');
			cartCates.push('上装');
			cartCates.push('下装');
		}
	}
	cartCates=getDistinct(cartCates);
	
	storeTopByCate1(cartCates, caltype, nCount);
	var out;
	
	if (caltype < 2)
	{
		out = calctop_byall1(caltype, strName);
	}
	else if (caltype == 2)
	{
		out = calctop_byall2();
	}
	else if (caltype == 3)
	{
		out = calctop_byall3();
	}
	else if (caltype == 4)
	{
		out = calctop_byall4();
	}
	else if (caltype == 5)
	{
		out = calctop_byall5();
	}
	return out;
}

function calctop2(nCount){

	storeTopByCate1(category, 6, nCount);
	var out;
	out = calctop_byall6();
	return out;
}

function searchSub(isSet,qString){
	var idList=currentList;
	currentList=[];
	var out1=(isSet?'套装：':'查找：')+qString+'　所有染色及进化';
	var out='<table border="1">';
	out+=tr(td('名称')+td('分类')+td('套装')+td('来源')+td(''));
	for (var i in idList){
		var orig=idList[i];
		do{
			currentList.push(orig);
			orig=searchOrig(orig);
		}while(orig!=-1);
	}
	do{
		currentList=searchDeriv(currentList);
	}while(currentList.length!=searchDeriv(currentList).length);
	out+=appendCurrent();
	out+='</table>';
	$('#topsearch_info').html(out);
	$("#topsearch_note").html(out1);
}

function searchSub1(){
	var idList=currentList;
	currentList=[];
	for (var i in idList){
		var orig=idList[i];
		do{
			currentList.push(orig);
			orig=searchOrig(orig);
		}while(orig!=-1);
	}
	do{
		currentList=searchDeriv(currentList);
	}while(currentList.length!=searchDeriv(currentList).length);	
}

function searchBySource(nNo, nType){
	var searchById;
	currentList=[];
	currentSetList=[];
	
	searchById = nNo + '-';

	for (var i in clothes)
	{		
		var tmp1 = clothes[i].source.split("/");
		for (var j in tmp1)
		{
			var idx1 = tmp1[j].indexOf(searchById);
			var idx2 = tmp1[j].indexOf(nType);
			if (idx1 == 0 && idx2 > 1)
			{
				currentList.push(i);
			}
		}
	}
}

function searchBySource1(nName){
	var searchById;
	currentList=[];
	currentSetList=[];
	
	searchById = nName;

	for (var i in clothes)
	{		
		var tmp1 = clothes[i].source.indexOf(searchById);
		if (tmp1 >= 0)
		{
			currentList.push(i);
		}
	}
}

function searchByType1(nName){
	var searchById;
	currentList=[];
	currentSetList=[];
	
	searchById = nName;

	for (var i in clothes)
	{		
		var tmp1 = clothes[i].type.type.indexOf(searchById);
		if (tmp1 >= 0)
		{
			currentList.push(i);
		}
	}
}

function searchSet1(setName){
	currentList=[];
	for (var i in clothes){
		if(clothes[i].set==setName){
			currentList.push(i);
		}
	}
}

function searchName1(setName){
	currentList=[];
	for (var i in clothes){
		if(clothes[i].name==setName){
			currentList.push(i);
		}
	}
}

function CreateHead(stitle, sname) {
	var out='<!DOCTYPE html>\n<head>\n';
	out+='<meta name="viewport" content="width=device-width, initial-scale=1"/>\n';
	out+='<meta http-equiv="Content-Type" content="text/html"; charset=utf-8" />\n';
	out+='<style>	\n';
	out+='body {font-family: "Microsoft YaHei", Sans-Serif;	line-height: 1.5em;	color: #111111;}\n';
	out+='a {text-decoration:none;	color:#3377ff;}\n';
	out+='a:hover {text-decoration:none;	color:#B576FF;}\n';
	out+='p.title1 {font-size: 120%;	font-weight : 700;	color: #1F3489;	text-align: center;}\n';
	out+='p.title2 {font-size: 100%;	font-weight : 700;	color: #1F3489;	text-align: center;}\n';
	out+='hr.mhr {border: 1px dashed #2E9FCC;}\n';
	out+='span.title3 {font-weight : 900;}\n';
	out+='table {border:solid #999;	border-width:1px 0px 0px 1px;	border-spacing:0;	text-align : center; font-size: 90%;}\n';
	out+='td {border:solid #999;	border-width:0px 1px 1px 0px;	border-spacing:0;}\n';
	out+='tr:nth-child(2n+1) {background: rgba(234, 242, 250, 0.5);}\n';
	out+='tr:nth-child(2n) {background: rgba(209, 229, 255, 0.5);}\n';
	out+='tr:nth-child(1) {font-weight : 700; background-color: rgba(191, 219, 255, 0.9);}\n';
	out+='</style>\n';
	out+='</head>\n<body>\n';
	out+='<div class="myframe" >\n';
  out+='<p class="title1">'+stitle+'</p>\n';
  out+='<hr class="mhr"/>\n';
  var d=new Date();
  out+='<p class="normal"><span class="title3">更新时间：</span>';
  out+=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  out+='<br>\n<span class="title3">更新人员：</span>'+sname+'<br>\n';
  out+='<span class="title3">使用说明：</span>表格列出的是排名前五的衣服。<font color="red">红色</font>表示新衣服为顶配， <font color="blue">蓝色</font>表示新衣服为次配， <font color=#8E4890>紫色</font>表示可能有<font color=#8E4890>连衣裙</font>>上下装或者<font color=#8E4890>上下装</font>>连衣裙的情况。</p>\n';
  return out;
}
function CreateHead2(stitle, sname) {
	var out='<!DOCTYPE html>\n<head>\n';
	out+='<meta name="viewport" content="width=device-width, initial-scale=1"/>\n';
	out+='<meta http-equiv="Content-Type" content="text/html"; charset=utf-8" />\n';
	out+='<style>	\n';
	out+='body {font-family: "Microsoft YaHei", Sans-Serif;	line-height: 1.5em;	color: #111111;}\n';
	out+='a {text-decoration:none;	color:#3377ff;}\n';
	out+='a:hover {text-decoration:none;	color:#B576FF;}\n';
	out+='p.title1 {font-size: 120%;	font-weight : 700;	color: #1F3489;	text-align: center;}\n';
	out+='p.title2 {font-size: 100%;	font-weight : 700;	color: #1F3489;	text-align: center;}\n';
	out+='hr.mhr {border: 1px dashed #2E9FCC;}\n';
	out+='span.title3 {font-weight : 900;}\n';
	out+='table {border:solid #999;	border-width:1px 0px 0px 1px;	border-spacing:0;	text-align : center; font-size: 90%;}\n';
	out+='td {border:solid #999;	border-width:0px 1px 1px 0px;	border-spacing:0;}\n';
	out+='tr:nth-child(2n+1) {background: rgba(234, 242, 250, 0.5);}\n';
	out+='tr:nth-child(2n) {background: rgba(209, 229, 255, 0.5);}\n';
	out+='tr:nth-child(1) {font-weight : 700; background-color: rgba(191, 219, 255, 0.9);}\n';
	out+='</style>\n';
	out+='</head>\n<body>\n';
	out+='<div class="myframe" >\n';
  out+='<p class="title1">'+stitle+'</p>\n';
  out+='<hr class="mhr"/>\n';
  var d=new Date();
  out+='<p class="normal"><span class="title3">更新时间：</span>';
  out+=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  out+='<br>\n<span class="title3">更新人员：</span>'+sname+'<br>\n';
  out+='<span class="title3">使用说明：</span><font color="red">红色</font>表示新衣服为顶配， <font color="blue">蓝色</font>表示新衣服为次配， <font color=#8E4890>紫色</font>表示可能有<font color=#8E4890>连衣裙</font>>上下装或者<font color=#8E4890>上下装</font>>连衣裙的情况。</p>\n';
  return out;
}

function OpenHtml()
{
	var record=$("#ajglz_out").val(); 
	var winRecord=window.open('','_blank',''); 
	winRecord.document.open("text/html","utf-8"); 
	winRecord.document.write(record); 
}

function CreateTableNew() {
	var strName;
	var out=CreateHead('竞技场联盟新衣服替换', '夏天');	
  out+='<p class="normal">本页内容：<a href="#1"> 竞技场 </a>';
  out+='&emsp;<a href="#2"> 联盟(极限权重) </a>';
  out+='&emsp;<a href="#3"> 联盟(标准权重) </a></p>\n';
	out+='<!--child content start-->\n';		
	
	if (0)
	{
		strName='萤光之灵';
		searchByType1(strName);
		addCart_All1(1);		
	}
	else
	{		
		//strName='V2.5.1';
		//searchVersion1(strName, 0);
		searchSetById1($('#s1').val(), 60000);
		addCart_All1(1);
		
		/*searchSet1('心月狐');
		searchSub1('亢金龙');
		addCart_All1(0);
		
		searchSet1(strName);
		searchSub1();
		addCart_All1(0);*/
	}
	
	out+=calctop1(2, 5, strName);	
	out+=calctop1(3, 5, strName);	

	out+='</div>\n</body>\n</html>\n';
	$('#ajglz_out').val(out);
	
	OpenHtml();
}

function CreateTableJJC() {
	var strName;
	var out=CreateHead2('竞技场简表(新衣服标注)', '夏天');	

	searchSetById1($('#s1').val(), 60000);
	addCart_All1(1);
	
	out+=calctop2(20);	

	out+='</div>\n</body>\n</html>\n';
	$('#ajglz_out').val(out);
	
	OpenHtml();
}

function CreateTableNew1() {
	var strName;
	var out=CreateHead('关卡(标准权重)V2.5.1新衣服替换', '夏天');	
  
	out+='<!--child content start-->\n';		
	
	//strName='V2.2.0';
	//searchVersion1(strName, 0);
	searchSetById1( $('#s1').val(), 60000);
	addCart_All1(1);
	
	out+=calctop1(4, 5, strName);	

	out+='</div>\n</body>\n</html>\n';
	$('#ajglz_out').val(out);
}

function CreateTableNew2() 
{
	
	var strName;
	var out=CreateHead('关卡(极限权重)新衣服替换', '夏天');	
  
	out+='<!--child content start-->\n';		
	
	//strName='V2.2.0';
	//searchVersion1(strName, 0);
	searchSetById1($('#s1').val(), 60000);
	addCart_All1(1);
	
	out+=calctop1(5, 5, strName);	

	out+='</div>\n</body>\n</html>\n';
	$('#ajglz_out').val(out);

}