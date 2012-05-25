﻿// @include "../lib/psd.jsx"

var psd = new PSD();
psd.parseLayers();
var textLayers = psd.getTextLayers();
// 数组去重
function unique(arr){
	var o = {}, a = [], it;
	for (var i = 0, l = arr.length; i < l; i++) {
		it = arr[i];
		if(!o[it]) a.push(it);
		o[it] = true;
	}
	return a;
}

function getCellData(){
	var xset = [0, psd.getWidth()], yset = [0, psd.getHeight()];

	for(var i = 0, l = textLayers.length; i < l; i++){
		var layer = textLayers[i];
		xset.push(layer.left);
		yset.push(layer.top);
	}

	xset = unique(xset).sort(function(a,b){ return a - b;});
	yset = unique(yset).sort(function(a,b){ return a - b;});
	
	var arr = {rows:yset.length - 1, cols:xset.length - 1, cells:[]};

	for(i = 0, l = yset.length; i < l; i++){
		var y1 = yset[i], y2 = yset[i+1];
		if(!y2) break;

		for(var j = 0, l2 = xset.length; j < l2; j++){
			var x1 = xset[j], x2 = xset[j+1];
			if(!x2) break;

			var data = {x:x1, y:y1, width:x2 - x1, height:y2 - y1};
			arr.cells.push(data);
		}
	}
	return arr; 
}
// 创建表格，根据文本图层信息合并单元格
function createTable(){
	var o = getCellData();
	var bg = psd.exportPng().fullName.replace(/^\/([a-z]?)/,'$1:');
	var table = new XML('<table background="'+bg+'"></table>');

	for(var i = 0, cells = o.cells, l = cells.length; i < l; i++){
		if(i % o.cols === 0){
			var tr = new XML('<tr></tr>');
			table.appendChild(tr);
		}
		var cell = cells[i];
		if(cell.hasMerge) continue;
		
		var td = new XML('<td width="'+cell.width+'" height="'+cell.height+'">wanxianjia</td>');

		for(var j = 0, l2 = textLayers.length; j < l2; j++){
			var layer = textLayers[j];
			if(layer.left === cell.x && layer.top === cell.y){
				
				layer.width = layer.right - layer.left;
				layer.height = layer.bottom - layer.top;
				
				var style = 'width:' + layer.width+ 'px;';
				style += 'height:' + layer.height+ 'px;';
				style += 'color:#'+layer.textInfo.color+'; font-size:'+layer.textInfo.size+';';
				var divs = new XML('<divs style="'+style+'">'+layer.textInfo.contents+'</divs>');

				var m = 1;
				(function(t){
					// 横向合并
					if(layer.width > t.width && cells[i+1]){
						m++;
						t.width = t.width + cells[i+1].width;
						td = new XML('<td width="'+t.width+'" height="'+t.height+'" colspan="'+m+'">wanxianjia</td>');
						cells[i+1].hasMerge = true;
						arguments.callee(t);
					}
					// 纵向合并
					if(layer.height > t.height && cells[i+o.cols]){
						m++;
						t.height = t.height + cells[i+o.cols].height;
						td = new XML('<td width="'+t.width+'" height="'+t.height+'" rowspan="'+m+'">wanxianjia</td>');
						cells[i+o.cols].hasMerge = true;
						arguments.callee(t);
					}
				})(cell);
				
				td.appendChild(divs);
			}
		}
		
		tr.appendChild(td);
		
	}
	$.writeln(table.toXMLString().replace(/divs/g,'div'));
	var f = new File(File($.fileName).parent + '/test.html');
	f.open('w', 'TEXT');
	f.write('<style>table,td{vertical-align:top;border-spacing:0; border-collapse:collapse;}</style>'+table.toXMLString().replace(/divs/g,'div').replace(/wanxianjia/g, ''));
	f.close();
}
createTable();